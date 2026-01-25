/**
 * Consolidation & Ideation Module
 * 
 * Stage 1 of the Enhanced Research Pipeline.
 * Takes raw user inputs and:
 * 1. Consolidates scattered context into a unified brief.
 * 2. Expands the user's intent using logical inference.
 * 3. Generates a list of specific research queries (ideation).
 */

import { llmRouter } from '../llm-router';

// ============================================
// Types
// ============================================

export interface ConsolidatedContext {
    /** Original user inputs (preserved) */
    originalInputs: Record<string, any>;

    /** Unified topic brief */
    unifiedBrief: string;

    /** Inferred user intent */
    inferredIntent: {
        primaryGoal: string;
        secondaryGoals: string[];
        audienceNeeds: string[];
        contentType: string;
    };

    /** Expanded context from inference */
    expandedContext: {
        relatedTopics: string[];
        potentialAngles: string[];
        knowledgeGaps: string[];
    };
}

export interface ResearchQuery {
    id: string;
    type: 'fact_check' | 'viral_hooks' | 'platform_trends' | 'vocabulary' | 'composition' | 'captions' | 'general';
    query: string;
    priority: 'high' | 'medium' | 'low';
    rationale: string;
}

export interface IdeationResult {
    queries: ResearchQuery[];
    focusAreas: string[];
    timestamp: number;
}

// ============================================
// Prompts
// ============================================

const CONSOLIDATION_PROMPT = `You are an expert content strategist. Analyze the user's inputs and create a consolidated context brief.

USER INPUTS:
{{inputs}}

Your task:
1. Identify the core topic and intent
2. Infer any missing context (audience, goal, tone)
3. Identify knowledge gaps that need research
4. Suggest related angles to explore

Return ONLY valid JSON:
{
  "unifiedBrief": "A clear 2-3 sentence summary of what the user wants to create",
  "inferredIntent": {
    "primaryGoal": "The main objective (educate|entertain|sell|inspire|inform)",
    "secondaryGoals": ["List of secondary objectives"],
    "audienceNeeds": ["What the target audience is looking for"],
    "contentType": "Type of content (tutorial|story|review|comparison|etc)"
  },
  "expandedContext": {
    "relatedTopics": ["Related topics worth mentioning"],
    "potentialAngles": ["Creative angles to explore"],
    "knowledgeGaps": ["Things we need to research to make this content great"]
  }
}`;

const IDEATION_PROMPT = `You are a research strategist for viral content creation. Based on the consolidated context, generate specific research queries.

CONSOLIDATED CONTEXT:
{{context}}

PLATFORM(S): {{platforms}}
KNOWLEDGE GAPS: {{gaps}}

Generate 3-7 targeted research queries that will:
1. Verify facts and statistics mentioned
2. Find viral hooks and trends for this topic
3. Identify platform-specific best practices
4. Discover trending vocabulary/slang for this audience
5. Research caption styles that perform well

Return ONLY valid JSON:
{
  "queries": [
    {
      "id": "q1",
      "type": "fact_check | viral_hooks | platform_trends | vocabulary | composition | captions | general",
      "query": "The exact search query to run",
      "priority": "high | medium | low",
      "rationale": "Why this research is important"
    }
  ],
  "focusAreas": ["Top 3 areas this content should emphasize based on analysis"]
}`;

// ============================================
// Core Functions
// ============================================

/**
 * Consolidates user inputs into a unified context brief.
 * NON-DESTRUCTIVE: Returns new object, never mutates original inputs.
 */
export async function consolidateInputs(
    inputs: Record<string, any>
): Promise<ConsolidatedContext> {
    console.log('[Consolidation] Starting input consolidation...');

    const startTime = Date.now();

    try {
        const prompt = CONSOLIDATION_PROMPT.replace('{{inputs}}', JSON.stringify(inputs, null, 2));

        const response = await llmRouter.generate({
            messages: [{ role: 'user', content: prompt }],
            category: 'content',
            temperature: 0.3,
            maxTokens: 1000
        });

        // Parse LLM response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse consolidation response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const result: ConsolidatedContext = {
            originalInputs: { ...inputs }, // Preserve original
            unifiedBrief: parsed.unifiedBrief || '',
            inferredIntent: parsed.inferredIntent || {
                primaryGoal: 'educate',
                secondaryGoals: [],
                audienceNeeds: [],
                contentType: 'general'
            },
            expandedContext: parsed.expandedContext || {
                relatedTopics: [],
                potentialAngles: [],
                knowledgeGaps: []
            }
        };

        console.log(`[Consolidation] Completed in ${Date.now() - startTime}ms`);
        console.log(`[Consolidation] Brief: "${result.unifiedBrief.substring(0, 100)}..."`);

        return result;

    } catch (error: any) {
        console.error('[Consolidation] Error:', error.message);

        // Fallback: Return minimal consolidation based on raw inputs
        return {
            originalInputs: { ...inputs },
            unifiedBrief: `Content about ${inputs.topic || 'the given topic'}`,
            inferredIntent: {
                primaryGoal: inputs.goal || 'educate',
                secondaryGoals: [],
                audienceNeeds: [],
                contentType: 'general'
            },
            expandedContext: {
                relatedTopics: [],
                potentialAngles: [],
                knowledgeGaps: [inputs.topic || 'topic research needed']
            }
        };
    }
}

/**
 * Generates targeted research queries based on consolidated context.
 * Uses LLM to ideate what information would make the content better.
 */
export async function ideateResearchTopics(
    consolidatedContext: ConsolidatedContext,
    platforms: string[] = ['tiktok']
): Promise<IdeationResult> {
    console.log('[Ideation] Generating research queries...');

    const startTime = Date.now();

    try {
        const prompt = IDEATION_PROMPT
            .replace('{{context}}', JSON.stringify(consolidatedContext, null, 2))
            .replace('{{platforms}}', platforms.join(', '))
            .replace('{{gaps}}', consolidatedContext.expandedContext.knowledgeGaps.join(', '));

        const response = await llmRouter.generate({
            messages: [{ role: 'user', content: prompt }],
            category: 'content',
            temperature: 0.5,
            maxTokens: 1500
        });

        // Parse LLM response
        const jsonMatch = response.text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse ideation response');
        }

        const parsed = JSON.parse(jsonMatch[0]);

        const result: IdeationResult = {
            queries: (parsed.queries || []).map((q: any, idx: number) => ({
                id: q.id || `q${idx + 1}`,
                type: q.type || 'general',
                query: q.query || '',
                priority: q.priority || 'medium',
                rationale: q.rationale || ''
            })),
            focusAreas: parsed.focusAreas || [],
            timestamp: Date.now()
        };

        console.log(`[Ideation] Generated ${result.queries.length} research queries in ${Date.now() - startTime}ms`);
        result.queries.forEach(q => console.log(`  - [${q.priority}] ${q.type}: "${q.query}"`));

        return result;

    } catch (error: any) {
        console.error('[Ideation] Error:', error.message);

        // Fallback: Generate basic queries from the topic
        const topic = consolidatedContext.originalInputs.topic || 'the topic';
        return {
            queries: [
                {
                    id: 'fallback_1',
                    type: 'fact_check',
                    query: `${topic} statistics and facts 2024`,
                    priority: 'high',
                    rationale: 'Fallback fact-check query'
                },
                {
                    id: 'fallback_2',
                    type: 'viral_hooks',
                    query: `viral ${topic} content examples`,
                    priority: 'high',
                    rationale: 'Fallback viral content query'
                }
            ],
            focusAreas: [topic],
            timestamp: Date.now()
        };
    }
}
