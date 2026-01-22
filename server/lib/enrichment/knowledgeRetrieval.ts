/**
 * Knowledge Base Retrieval System
 * 
 * Loads niche-specific knowledge bases and best practices.
 * Caches frequently accessed knowledge bases for performance.
 * 
 * @module knowledgeRetrieval
 */

import { KNOWLEDGE_BASES } from './knowledgeBase';

interface KnowledgeBase {
    nicheId: string;
    displayName: string;
    audienceProfile: any;
    contentOpportunities: any;
    bestPractices: any;
    commonObjections?: any;
}

// In-memory cache for knowledge bases
const knowledgeCache = new Map<string, KnowledgeBase>();

/**
 * Retrieve knowledge base for detected niche
 * 
 * @param nicheId - Detected niche identifier (e.g., "b2b_sales.cold_calling")
 * @returns Complete knowledge base or generic fallback
 */
export async function getKnowledgeBase(nicheId: string): Promise<KnowledgeBase> {
    // console.log('[KnowledgeRetrieval] Loading knowledge base:', nicheId);

    // Check cache first
    if (knowledgeCache.has(nicheId)) {
        return knowledgeCache.get(nicheId)!;
    }

    // Load from knowledge base collection
    // Try exact match
    let kb = KNOWLEDGE_BASES[nicheId];

    // If no exact match, try partial match (e.g. category level)
    if (!kb) {
        const parts = nicheId.split('.');
        if (parts.length > 2) {
            // Try category.subcategory
            kb = KNOWLEDGE_BASES[`${parts[0]}.${parts[1]}`];
        }
    }

    if (!kb) {
        console.log(`[KnowledgeRetrieval] No specific KB for ${nicheId}, using generic.`);
        return getGenericKnowledgeBase();
    }

    // Cache for future use
    knowledgeCache.set(nicheId, kb);

    return kb;
}

/**
 * Generic fallback knowledge base
 * 
 * Used when niche detection fails or niche not in database
 */
function getGenericKnowledgeBase(): KnowledgeBase {
    return {
        nicheId: 'generic',
        displayName: 'General Knowledge',

        audienceProfile: {
            primaryAudience: 'General audience',
            psychographics: {
                motivations: ['Learn something new', 'Be entertained', 'Solve a problem'],
                frustrations: ['Information overload', 'Too much fluff', 'No actionable advice'],
                aspirations: ['Improve skills', 'Achieve goals', 'Save time']
            },
            platformBehavior: {
                general: {
                    consumptionStyle: 'Quick, snackable content',
                    contentPreferences: 'Entertaining + educational (edutainment)',
                    engagementTriggers: 'Surprising facts, quick wins, relatability'
                }
            }
        },

        contentOpportunities: {
            provenAngles: [
                {
                    angle: 'How-To',
                    template: 'How to [outcome] in [timeframe]',
                    whyItWorks: 'Clear value proposition',
                },
                {
                    angle: 'List Format',
                    template: '[Number] ways to [outcome]',
                    whyItWorks: 'Easy to consume, memorable',
                },
                {
                    angle: 'Common Mistake',
                    template: 'Stop doing [X]. Do this instead.',
                    whyItWorks: 'Pattern interrupt + solution',
                }
            ],

            uavOpportunities: [
                {
                    uav: 'Your personal experience',
                    marketGap: 'Authenticity',
                    recommendation: 'Be specific'
                }
            ]
        },

        bestPractices: {
            toneOfVoice: {
                style: 'Conversational and authentic',
                avoid: ['Overly formal language', 'Jargon without explanation', 'Condescension'],
                embrace: ['Clear communication', 'Relatability', 'Actionability']
            },

            proofElements: {
                required: ['Specific examples', 'Clear outcomes'],
                highImpact: ['Personal experience', 'Visual demonstrations']
            },

            platformOptimization: {
                general: {
                    optimalLength: '30-60 seconds',
                    visualStyle: 'Clean, well-lit, authentic',
                    captionTips: 'Hook in first line, context in body'
                }
            }
        }
    };
}

/**
 * Merge user inputs with knowledge base recommendations
 * 
 * Preserves all user-provided data, enriches with knowledge base
 */
export function enrichInputs(
    userInputs: any,
    knowledgeBase: KnowledgeBase,
    detection: any
): any {
    // console.log('[KnowledgeRetrieval] Enriching user inputs...');

    const enriched = {
        // ✅ Preserve ALL original user inputs
        ...userInputs,

        // ✅ Add niche detection metadata
        _enrichment: {
            nicheId: detection.nicheId,
            nicheDisplayName: detection.displayName,
            confidence: detection.confidence,
            matchedKeywords: detection.matchedKeywords,

            // ✅ Audience enrichment
            audienceEnrichment: {
                fullDescription: knowledgeBase.audienceProfile.primaryAudience,
                psychographics: knowledgeBase.audienceProfile.psychographics,
                platformBehavior: knowledgeBase.audienceProfile.platformBehavior
            },

            // ✅ Content opportunities
            contentAngles: knowledgeBase.contentOpportunities.provenAngles,
            uavSuggestions: knowledgeBase.contentOpportunities.uavOpportunities,

            // ✅ Best practices
            nicheBestPractices: knowledgeBase.bestPractices,

            // ✅ Timestamp
            enrichedAt: new Date().toISOString()
        }
    };

    return enriched;
}
