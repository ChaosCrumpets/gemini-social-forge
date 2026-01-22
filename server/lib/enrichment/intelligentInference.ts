/**
 * Intelligent Inference Engine
 * 
 * Uses LLM to infer missing context when user inputs are sparse
 * or when static knowledge base is insufficient.
 * 
 * @module intelligentInference
 */

import { llmRouter } from '../llm-router';

/**
 * Infer missing context using LLM when static knowledge is insufficient
 */
export async function inferMissingContext(
    userInputs: any,
    nicheDetection: any,
    knowledgeBase: any
): Promise<any> {

    // Quick validation: if we have strong static data, skip expensive LLM inference
    // unless inputs are extremely sparse.
    const hasAudience = !!userInputs.targetAudience && userInputs.targetAudience.length > 5;
    const hasGoal = !!userInputs.goal;

    // If we have strong niche confidence AND decent inputs, just return static enrichment
    // to save latency and tokens.
    if (nicheDetection.confidence > 0.8 && hasAudience && hasGoal) {
        return {};
    }

    try {
        const prompt = `
You are an expert Content Strategy Consultant.
The user wants to generate content but provided sparse inputs.
Your goal is to infer the missing strategic context based on their inputs and the detected niche.

CONTEXT:
User Inputs: ${JSON.stringify(userInputs)}
Detected Niche: ${nicheDetection.nicheId} (${nicheDetection.displayName})
Static Knowledge Base Audience Profile: ${JSON.stringify(knowledgeBase.audienceProfile)}

TASK:
Analyze the inputs and return a JSON object with INFERRED missing details.
Only return fields that are MISSING or VAGUE in the original User Inputs.
Do not overwrite good existing data.

Return JSON format:
{
  "inferredAudience": "Detailed audience description...",
  "inferredPainPoints": ["Pain point 1", "Pain point 2", "Pain point 3"],
  "inferredPlatformStrategy": {
    "primaryPlatform": "Best platform for this niche",
    "postingStyle": "Recommended posting style"
  }
}
        `;

        // console.log('[IntelligentInference] inferring missing context...');

        const response = await llmRouter.generate({
            category: 'logic',
            messages: [{ role: 'user', content: prompt }],
            responseFormat: 'json',
            temperature: 0.4
        });

        // Parse response with cleanup
        const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
        const start = cleanText.indexOf('{');
        const end = cleanText.lastIndexOf('}');

        if (start === -1 || end === -1) {
            return {};
        }

        const jsonStr = cleanText.substring(start, end + 1);
        const inferredData = JSON.parse(jsonStr);

        return inferredData;

    } catch (error) {
        console.warn('[IntelligentInference] Failed to infer context:', error);
        return {}; // Graceful degradation
    }
}
