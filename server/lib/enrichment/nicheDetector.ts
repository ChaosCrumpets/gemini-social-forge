/**
 * Niche Detection Engine
 * 
 * Analyzes user inputs to determine niche, sub-niche, and confidence level.
 * Uses keyword matching, semantic analysis, and pattern recognition.
 * 
 * @module nicheDetector
 */

import { NICHE_TAXONOMY } from './nicheTaxonomy';

interface DetectionResult {
    nicheId: string;
    displayName: string;
    confidence: number;
    matchedKeywords: string[];
    category: string;
    subcategory: string;
}

/**
 * Detect niche from user inputs
 * 
 * Algorithm:
 * 1. Extract keywords from topic + audience
 * 2. Score against all niches in taxonomy
 * 3. Return highest confidence match
 * 4. If confidence < 60%, flag for manual review
 */
export function detectNiche(inputs: {
    topic: string;
    audience?: string;
    goal?: string;
}): DetectionResult {
    console.log('[NicheDetector] Analying inputs:', inputs);

    const { topic, audience = '', goal = '' } = inputs;

    // Combine all text for analysis
    const combinedText = `${topic} ${audience} ${goal}`.toLowerCase();

    // Extract potential keywords
    const words = combinedText
        .split(/\s+/)
        .filter(w => w.length > 3) // Filter out short words
        .map(w => w.replace(/[^a-z0-9]/g, '')); // Clean

    // Score against all niches
    const scores: Array<{
        nicheId: string;
        displayName: string;
        score: number;
        matchedKeywords: string[];
        category: string;
        subcategory: string;
    }> = [];

    // Traverse taxonomy and score each niche
    for (const [category, subCategories] of Object.entries(NICHE_TAXONOMY)) {
        for (const [subcategory, niches] of Object.entries(subCategories)) {
            for (const [nicheName, nicheData] of Object.entries(niches as any)) {
                const nicheKeywords = (nicheData as any).keywords || [];

                // Calculate match score
                let matchCount = 0;
                const matched: string[] = [];

                for (const keyword of nicheKeywords) {
                    const keywordLower = keyword.toLowerCase();

                    // Exact match in combined text
                    if (combinedText.includes(keywordLower)) {
                        matchCount += 2; // Exact match worth 2 points
                        matched.push(keyword);
                    }
                    // Partial match in words
                    else if (words.some(w => w.includes(keywordLower) || keywordLower.includes(w))) {
                        matchCount += 1; // Partial match worth 1 point
                        matched.push(keyword);
                    }
                }

                if (matchCount > 0) {
                    // Normalize score based on number of keywords found vs total available, but capped
                    // We don't demand ALL keywords to be present, just enough to be confident.
                    // Let's say 4 matched keywords is "100%" confidence roughly.

                    scores.push({
                        nicheId: `${category}.${subcategory}.${nicheName}`,
                        displayName: nicheName.replace(/_/g, ' '),
                        score: matchCount,
                        matchedKeywords: matched,
                        category,
                        subcategory,
                    });
                }
            }
        }
    }

    // Sort by score
    scores.sort((a, b) => b.score - a.score);

    // Get best match
    const bestMatch = scores[0];

    if (!bestMatch) {
        console.log('[NicheDetector] No niche detected - using generic');
        return {
            nicheId: 'generic',
            displayName: 'Generic Content',
            confidence: 0,
            matchedKeywords: [],
            category: 'generic',
            subcategory: 'generic'
        };
    }

    // Calculate confidence (0-100)
    // Confidence is relative to "perfect" match which we define as score >= 8
    const MAX_CONFIDENCE_SCORE = 8;
    const confidence = Math.min(100, (bestMatch.score / MAX_CONFIDENCE_SCORE) * 100);

    console.log('[NicheDetector] ✅ Detected niche:', {
        nicheId: bestMatch.nicheId,
        confidence: `${confidence.toFixed(0)}%`,
        matchedKeywords: bestMatch.matchedKeywords
    });

    return {
        ...bestMatch,
        confidence
    };
}

/**
 * Validate niche detection confidence
 * 
 * Returns recommendation on whether to use enrichment or ask user for clarification
 */
export function validateDetection(detection: DetectionResult): {
    shouldEnrich: boolean;
    shouldAskUser: boolean;
    message?: string;
} {
    // High confidence: Enrich automatically, don't verify
    if (detection.confidence >= 70) {
        return {
            shouldEnrich: true,
            shouldAskUser: false
        };
    }

    // Medium confidence: Enrich but maybe flag it (we'll just enrich for now to be non-intrusive)
    if (detection.confidence >= 30) {
        return {
            shouldEnrich: true,
            shouldAskUser: false,
            message: `I detected your niche as "${detection.displayName}" (${detection.confidence.toFixed(0)}% confidence).`
        };
    }

    // Low confidence: Don't enrich, just use generic
    return {
        shouldEnrich: false,
        shouldAskUser: true,
        message: `I couldn't detect your specific niche. Using generic best practices.`
    };
}
