export interface ValidationResult {
    score: number;
    passed: boolean;
    issues: string[];
    suggestions: string[];
    metrics: {
        wordCount: number;
        expectedWordCount: number;
        topicMentioned: boolean;
        uavIncorporated: boolean;
        genericPhraseCount: number;
    };
}

export function validateContentOutput(
    output: any,
    inputs: any
): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Get script text
    const scriptText = output.script?.map((l: any) => l.text).join(' ') || '';
    const wordCount = scriptText.split(/\s+/).filter(Boolean).length;

    // Expected word count
    const wordCountMap: { [key: string]: number } = {
        '15s': 45,
        '30s': 90,
        '60s': 170,
        '90s': 240,
    };
    const expectedWords = wordCountMap[inputs.duration] || 240;

    // CHECK 1: Word count (30 points)
    if (wordCount < expectedWords * 0.7) {
        score -= 30;
        issues.push(`Script too short: ${wordCount} words vs ${expectedWords} expected`);
        suggestions.push('Increase maxOutputTokens to 8000');
    } else if (wordCount < expectedWords * 0.9) {
        score -= 10;
    }

    // CHECK 2: Topic mentioned (20 points)
    const topicMentioned = scriptText
        .toLowerCase()
        .includes(inputs.topic.toLowerCase());

    if (!topicMentioned) {
        score -= 20;
        issues.push(`Topic "${inputs.topic}" not mentioned`);
        suggestions.push('Add to context: "You MUST mention [topic] explicitly"');
    }

    // CHECK 3: UAV incorporated (20 points)
    let uavIncorporated = false;
    if (inputs.uavMarkers) {
        const firstMarker = inputs.uavMarkers.split(',')[0].trim();
        uavIncorporated = scriptText.includes(firstMarker);

        if (!uavIncorporated) {
            score -= 20;
            issues.push(`UAV "${firstMarker}" not incorporated`);
            suggestions.push('Emphasize UAV in context');
        }
    }

    // CHECK 4: Generic phrases (15 points)
    const genericPhrases = [
        'in today\'s world',
        'have you ever wondered',
        'it\'s no secret',
        'the key to success',
        'as we all know',
    ];

    const foundGeneric = genericPhrases.filter((phrase) =>
        scriptText.toLowerCase().includes(phrase)
    );

    if (foundGeneric.length > 0) {
        score -= foundGeneric.length * 5;
        issues.push(`Generic phrases: ${foundGeneric.join(', ')}`);
        suggestions.push('Add rejection rules to prompt');
    }

    // CHECK 5: Has specific data (15 points)
    const hasNumbers = /\d+/.test(scriptText);
    const hasPercentages = /%/.test(scriptText);

    if (!hasNumbers && !hasPercentages) {
        score -= 15;
        issues.push('No specific numbers or data');
        suggestions.push('Request concrete examples in prompt');
    }

    score = Math.max(0, Math.min(100, score));

    return {
        score,
        passed: score >= 70,
        issues,
        suggestions,
        metrics: {
            wordCount,
            expectedWordCount: expectedWords,
            topicMentioned,
            uavIncorporated,
            genericPhraseCount: foundGeneric.length,
        },
    };
}
