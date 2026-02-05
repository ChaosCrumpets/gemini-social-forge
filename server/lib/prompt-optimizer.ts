/**
 * Optimize prompts to reduce token usage while maintaining quality
 */

/**
 * Remove unnecessary whitespace and formatting from prompts
 */
export function compressPrompt(prompt: string): string {
    if (!prompt) return '';
    return prompt
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .join('\n');
}

/**
 * Create reusable prompt templates with placeholders
 */
export const PROMPT_TEMPLATES = {
    discovery: `You are an expert content strategist for short-form video.
Ask the user ONE question at a time to understand:
- Their topic/niche
- Target audience
- Unique value proposition
- Platform (TikTok/Reels/Shorts)

Keep questions conversational and specific. Don't ask generic questions.

Current context: {{context}}
Next question:`,

    hookGeneration: `Generate 5 viral hooks for this video concept:
Topic: {{topic}}
Audience: {{audience}}
UAV: {{uav}}

Each hook must:
- Be under 10 words
- Use pattern interrupt
- Promise clear value

Format: 1. [hook] 2. [hook] etc.`,

    contentGeneration: `Create a 5-part video script:
Topic: {{topic}}
Hook: {{hook}}
Audience: {{audience}}

Structure:
1. HOOK (0-3s): {{hook}}
2. CONTEXT (3-8s): Set up the problem
3. CONFLICT (8-20s): Deep dive into struggle
4. TURNING POINT (20-40s): Solution reveal
5. RESOLUTION (40-60s): Actionable takeaway

Each section: timing, dialogue, visuals. Be specific and actionable.`,
};

/**
 * Fill template with actual values
 */
export function fillTemplate(
    template: string,
    variables: Record<string, string>
): string {
    let filled = template;

    for (const [key, value] of Object.entries(variables)) {
        // Escape regex characters in key to be safe
        filled = filled.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }

    return compressPrompt(filled);
}

/**
 * Estimate token count (rough approximation: 1 token ≈ 4 characters)
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
}

/**
 * Truncate text to stay within token limit
 */
export function truncateToTokenLimit(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;

    if (text.length <= maxChars) {
        return text;
    }

    return text.substring(0, maxChars) + '... [truncated]';
}

/**
 * Log token usage for optimization
 */
export function logTokenUsage(
    feature: string,
    inputTokens: number,
    outputTokens: number,
    promptLength: number
) {
    const total = inputTokens + outputTokens;
    const efficiency = promptLength > 0 ? inputTokens / promptLength : 0;

    console.log(`[TokenOptimization] ${feature}:`, {
        input: inputTokens,
        output: outputTokens,
        total,
        promptLength,
        efficiency: efficiency.toFixed(2),
    });

    // Alert if inefficient (e.g. char to token ratio > 0.3 means unusually high token usage per char, or just verbose)
    // Usually 1 token is 3-4 chars, so ratio is approx 0.25-0.33.
    if (efficiency > 0.4) {
        console.warn(`⚠️  [TokenOptimization] High token/char ratio for ${feature}: ${efficiency.toFixed(2)}`);
    }
}
