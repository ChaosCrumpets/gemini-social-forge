
import { llmRouter } from './llm-router';
import { log } from '../utils/logger';

/**
 * Interface for the Quality Check result
 */
interface ChatQualityResult {
    score: number;
    reasoning: string;
}

/**
 * Evaluates the quality of a chat interaction asynchronously.
 * 
 * Checks for:
 * 1. User Intent Alignment (Did we answer what was asked?)
 * 2. Logic & Database (Did we use provided context/schema correctly?)
 * 3. Best Practices (Is the advice sound?)
 * 
 * Uses 'logic' category to leverage faster/cheaper models (e.g. Groq/Haiku).
 */
export async function evaluateChatQuality(
    userQuery: string,
    assistantResponse: string,
    context: string = ''
): Promise<void> {
    try {
        // 1. Construct a focused evaluation prompt
        const prompt = `
    You are a Quality Assurance Auditor for an AI coding assistant.
    
    Evaluate the following interaction based on 3 criteria:
    1. INTENT: Did the assistant directly address the user's specific request?
    2. LOGIC: Is the reasoning sound and grounded in the provided context (if any)?
    3. QUALITY: Is the response helpful, clear, and following best practices?

    USER QUERY: "${userQuery.replace(/"/g, "'").slice(0, 500)}..."
    CONTEXT (Snippet): "${context.slice(0, 300)}..."
    ASSISTANT RESPONSE: "${assistantResponse.replace(/"/g, "'").slice(0, 500)}..."

    Return ONLY a JSON object:
    {
      "score": number (0-100),
      "reasoning": "1-sentence summary of why"
    }
    `;

        // 2. Call LLM Router (Fire and forget, but we await here to log)
        // Using 'logic' category to utilize Groq/fast models
        const response = await llmRouter.generate({
            messages: [{ role: 'user', content: prompt }],
            category: 'logic',
            responseFormat: 'json',
            temperature: 0.1 // Deterministic
        });

        // 3. Parse and Log
        const result = JSON.parse(response.text || '{}') as ChatQualityResult;

        if (result.score !== undefined) {
            log.quality({
                score: result.score,
                model: response.model,
                provider: 'chat-evaluator',
                duration: 0,
                passed: result.score >= 70,
                issues: [result.reasoning || 'No reasoning provided']
            });
        }
    } catch (error) {
        // Silent fail - evaluating quality should never break the main app
        // We log a debug warning if needed, but for now we just verify it exists
        if (process.env.DEBUG_LOGS === 'true') {
            console.warn('[Quality Check Failed]', error);
        }
    }
}
