/**
 * Discovery Flow Enhancement - Phase 4
 * Implements 4-level entropy classification and adaptive question generation
 * Aligned with Subsystem 3: Adaptive Discovery Protocol from enhanced prompt
 */

/**
 * 4-Level Entropy Classification System
 * Determines question count based on input quality
 */
export enum InputEntropyLevel {
    COLD = 'COLD',                  // Level 1: Single topic, no context (6 questions)
    UNSTRUCTURED = 'UNSTRUCTURED',  // Level 2: Multiple elements, no structure (5 questions)
    INTUITIVE = 'INTUITIVE',        // Level 3: Natural story arc (3 questions)
    ARCHITECTED = 'ARCHITECTED'     // Level 4: Explicit 5-part structure (2 questions)
}

/**
 * Input diagnosis result with detected details
 */
export interface InputDiagnosis {
    level: InputEntropyLevel;
    hasDetails: {
        topic: boolean;
        audience: boolean;
        goal: boolean;
        context: boolean;
        structure: boolean;
    };
    recommendedQuestions: number; // 2-6+
    reasoning: string;
    confidence: number; // 0.0-1.0
}

/**
 * Diagnose input quality using 4-level entropy system
 * 
 * @param userInput - The user's initial or current input
 * @param currentInputs - Already gathered inputs from discovery
 * @returns InputDiagnosis with classification and recommendations
 */
export function diagnoseInput(
    userInput: string,
    currentInputs: Record<string, unknown> = {}
): InputDiagnosis {
    const lower = userInput.toLowerCase();
    const wordCount = userInput.split(/\s+/).filter(w => w.length > 0).length;
    const sentenceCount = userInput.split(/[.!?]+/).filter(s => s.trim().length > 0).length;

    // Detection markers
    const hasTopic = !!currentInputs.topic || wordCount >= 3;
    const hasAudience =
        !!currentInputs.targetAudience ||
        lower.includes('audience') ||
        lower.includes('people') ||
        lower.includes('students') ||
        lower.includes('entrepreneurs') ||
        lower.includes('developers') ||
        /\b(for|to|helping|teaching)\s+\w+/.test(lower);

    const hasGoal =
        !!currentInputs.goal ||
        lower.includes('want') ||
        lower.includes('goal') ||
        lower.includes('help') ||
        lower.includes('teach') ||
        lower.includes('show') ||
        /\b(so that|in order to|because)\b/.test(lower);

    const hasContext = wordCount > 20 || sentenceCount >= 3;

    const hasStructure =
        lower.includes('first') ||
        lower.includes('then') ||
        lower.includes('finally') ||
        lower.includes('step 1') ||
        lower.includes('part 1') ||
        /\b(intro|hook|body|conclusion)\b/.test(lower);

    // Count how many elements are present
    const elementCount = [hasTopic, hasAudience, hasGoal, hasContext, hasStructure].filter(Boolean).length;

    // Level 4: Architected (optimal - minimal questions needed)
    if (hasStructure && hasContext && hasTopic && hasAudience && wordCount > 40) {
        return {
            level: InputEntropyLevel.ARCHITECTED,
            hasDetails: {
                topic: true,
                audience: true,
                goal: hasGoal,
                context: true,
                structure: true
            },
            recommendedQuestions: 2,
            reasoning: 'Input demonstrates clear narrative structure with explicit sections. Minimal clarification needed.',
            confidence: 0.95
        };
    }

    // Level 3: Intuitive (good - natural flow present)
    if (hasContext && hasTopic && (hasAudience || hasGoal) && wordCount > 15) {
        return {
            level: InputEntropyLevel.INTUITIVE,
            hasDetails: {
                topic: true,
                audience: hasAudience,
                goal: hasGoal,
                context: true,
                structure: false
            },
            recommendedQuestions: 3,
            reasoning: 'Input has natural flow with multiple elements but lacks precision. Some clarification needed.',
            confidence: 0.80
        };
    }

    // Level 2: Unstructured (needs work - elements present but scattered)
    if (wordCount > 8 && hasTopic && elementCount >= 2) {
        return {
            level: InputEntropyLevel.UNSTRUCTURED,
            hasDetails: {
                topic: true,
                audience: hasAudience,
                goal: hasGoal,
                context: false,
                structure: false
            },
            recommendedQuestions: 5,
            reasoning: 'Input contains relevant elements but lacks clear structure. Comprehensive discovery needed.',
            confidence: 0.70
        };
    }

    // Level 1: Cold (high load - minimal input)
    return {
        level: InputEntropyLevel.COLD,
        hasDetails: {
            topic: hasTopic,
            audience: false,
            goal: false,
            context: false,
            structure: false
        },
        recommendedQuestions: 6,
        reasoning: 'Input lacks context and detail. Full discovery protocol required to extract viable content.',
        confidence: 0.90 // High confidence this is cold
    };
}

/**
 * Generate adaptive questions based on diagnosis and current inputs
 * Questions are targeted to fill gaps in user's input
 * 
 * @param diagnosis - The input diagnosis result
 * @param currentInputs - Already gathered inputs
 * @returns Array of adaptive questions (length matches recommendedQuestions)
 */
export function generateAdaptiveQuestions(
    diagnosis: InputDiagnosis,
    currentInputs: Record<string, unknown> = {}
): string[] {
    const questions: string[] = [];
    const count = diagnosis.recommendedQuestions;

    // Essential questions (always ask if missing - high priority)
    if (!diagnosis.hasDetails.audience && !currentInputs.targetAudience) {
        questions.push("Who exactly is your target audience? Be specific about their role, situation, or pain point.");
    }

    if (!diagnosis.hasDetails.goal && !currentInputs.goal) {
        questions.push("After watching this video, what specific action or realization should the viewer have?");
    }

    // UAV/SPCL extraction questions (medium priority)
    if (!currentInputs.uavDescription) {
        questions.push("What makes YOUR perspective on this topic different or valuable compared to others?");
    }

    if (!currentInputs.credentials && !currentInputs.proofPoints) {
        questions.push("What proof, credentials, or results do you have that will make viewers trust you on this topic?");
    }

    // Level-specific questions (fill remaining slots)
    if (diagnosis.level === InputEntropyLevel.COLD) {
        if (questions.length < count) {
            questions.push("Which platforms will this content live on (TikTok, Instagram, YouTube), and how long should it be?");
        }
        if (questions.length < count) {
            questions.push("What's the most surprising or counterintuitive fact about this topic that would grab attention?");
        }
        if (questions.length < count) {
            questions.push("What common mistake do people make when trying to achieve this goal?");
        }
    } else if (diagnosis.level === InputEntropyLevel.UNSTRUCTURED) {
        if (questions.length < count) {
            questions.push("What's the key insight or 'aha moment' that changes everything for your audience?");
        }
        if (questions.length < count) {
            questions.push("What specific struggle or obstacle do people hit when they try the current approach?");
        }
        if (questions.length < count) {
            questions.push("Any filming constraints I should know about (location, equipment, time)?");
        }
    } else if (diagnosis.level === InputEntropyLevel.INTUITIVE) {
        if (questions.length < count) {
            questions.push("For tone, should the delivery be authoritative, conversational, intense, or inspiring?");
        }
        if (questions.length < count) {
            questions.push("Any visual style preferences for the storyboard (minimal, dynamic, text-heavy)?");
        }
    } else if (diagnosis.level === InputEntropyLevel.ARCHITECTED) {
        // Architected inputs only need minor clarifications
        if (questions.length < count) {
            questions.push("Anything else you want to emphasize or modify in the structure you outlined?");
        }
        if (questions.length < count) {
            questions.push("Preferred video duration?");
        }
    }

    // Ensure we return exactly the recommended count
    return questions.slice(0, count);
}

/**
 * Calculate overall discovery progress
 * Used for UI progress indicators
 * 
 * @param answeredQuestions - Number of questions answered
 * @param totalQuestions - Total questions in discovery flow
 * @returns Progress percentage (0-100)
 */
export function calculateDiscoveryProgress(
    answeredQuestions: number,
    totalQuestions: number
): number {
    if (totalQuestions === 0) return 0;
    return Math.min(100, Math.round((answeredQuestions / totalQuestions) * 100));
}

/**
 * Determine if progression gate should be shown
 * Gate appears after minimum questions (3) but before completion
 * 
 * @param answeredQuestions - Number of questions answered
 * @param totalQuestions - Total questions in flow
 * @returns Whether to show the progression gate
 */
export function shouldShowProgressionGate(
    answeredQuestions: number,
    totalQuestions: number
): boolean {
    return answeredQuestions >= 3 && answeredQuestions < totalQuestions;
}
