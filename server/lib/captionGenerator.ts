/**
 * Caption Generator Module
 * 
 * Generates platform-specific alternative captions with research-backed best practices.
 * Integrates with the content generation pipeline.
 */

import type { AlternativeCaption } from '@shared/schema';

// Platform-specific limits and best practices
export const PLATFORM_CONFIG = {
    tiktok: {
        maxChars: 150,
        maxHashtags: 5,
        emojiAllowed: true,
        toneGuide: 'Casual, punchy, trend-aware',
        hookStyle: 'Question or bold statement',
        ctaExamples: ['Follow for more', 'Save this', 'Try it!']
    },
    instagram: {
        maxChars: 2200,
        maxHashtags: 30,
        emojiAllowed: true,
        toneGuide: 'Story-driven, authentic, relatable',
        hookStyle: 'First line must grab attention (before "...more")',
        ctaExamples: ['Save for later', 'Share with a friend who needs this', 'Double tap if you agree']
    },
    youtube: {
        maxChars: 200,
        maxHashtags: 3,
        emojiAllowed: false,
        toneGuide: 'SEO-focused, descriptive, searchable',
        hookStyle: 'Title-style with keywords',
        ctaExamples: ['Subscribe for more', 'Like & Comment', 'Watch the full video']
    },
    twitter: {
        maxChars: 280,
        maxHashtags: 2,
        emojiAllowed: true,
        toneGuide: 'Ultra-concise, quotable, shareable',
        hookStyle: 'Hot take or insight',
        ctaExamples: ['RT if you agree', 'Quote tweet your take', 'Thread below 🧵']
    },
    linkedin: {
        maxChars: 3000,
        maxHashtags: 3,
        emojiAllowed: false,
        toneGuide: 'Professional, thought-leadership, insightful',
        hookStyle: 'Pattern interrupt + professional hook',
        ctaExamples: ['Agree? Comment below', 'Share your experience', 'Follow for daily insights']
    }
} as const;

export type SupportedPlatform = keyof typeof PLATFORM_CONFIG;

/**
 * Build the prompt section for generating alternative captions
 */
export function buildAlternativeCaptionPromptSection(platforms: string[]): string {
    const validPlatforms = platforms.filter(p => p in PLATFORM_CONFIG) as SupportedPlatform[];

    if (validPlatforms.length === 0) {
        return '';
    }

    let prompt = `
6. ALTERNATIVE CAPTIONS (PLATFORM-SPECIFIC):

Generate 4-6 caption variations FOR EACH PLATFORM the user selected: ${validPlatforms.join(', ')}

PLATFORM BEST PRACTICES (RESEARCH-BACKED):
`;

    for (const platform of validPlatforms) {
        const config = PLATFORM_CONFIG[platform];
        prompt += `
${platform.toUpperCase()} Captions:
- Max length: ${config.maxChars} characters
- Hashtags: ${config.maxHashtags} max
- Emoji: ${config.emojiAllowed ? 'Encouraged (1-3 max)' : 'Avoid'}
- Tone: ${config.toneGuide}
- Hook style: ${config.hookStyle}
- CTA examples: ${config.ctaExamples.join(', ')}
`;
    }

    prompt += `
FOR EACH CAPTION, PROVIDE:
- id: unique identifier (e.g., "tiktok-1")
- platform: the platform name
- caption: the full caption text including hashtags
- hook: the opening line (first 50 chars)
- body: the main content
- cta: call to action (if applicable)
- hashtags: array of hashtags used
- characterCount: total characters
- estimatedEngagement: "low" | "medium" | "high" | "viral"
- researchSource: brief note on why this caption works (e.g., "Uses TikTok trending hook pattern")
`;

    return prompt;
}

/**
 * Build the JSON schema section for alternative captions
 */
export function buildAlternativeCaptionJsonSchema(platforms: string[]): string {
    const validPlatforms = platforms.filter(p => p in PLATFORM_CONFIG);

    const platformExamples = validPlatforms.map(p => `
      "${p}": [
        {
          "id": "${p}-1",
          "platform": "${p}",
          "caption": "Full caption text with hashtags for ${p}",
          "hook": "Opening attention-grabber",
          "body": "Main content that delivers value",
          "cta": "${PLATFORM_CONFIG[p as SupportedPlatform]?.ctaExamples[0] || 'Check it out'}",
          "hashtags": ["#example", "#${p}"],
          "characterCount": 120,
          "estimatedEngagement": "high",
          "researchSource": "Uses ${p} engagement pattern"
        }
        // ... 3-5 more variations for ${p}
      ]`).join(',');

    return `
    "alternativeCaptions": {${platformExamples}
    }`;
}

/**
 * Validate generated captions against platform rules
 */
export function validateCaptions(
    captions: AlternativeCaption[],
    platform: SupportedPlatform
): { valid: boolean; issues: string[] } {
    const config = PLATFORM_CONFIG[platform];
    const issues: string[] = [];

    if (captions.length < 4) {
        issues.push(`Only ${captions.length} captions generated, minimum is 4`);
    }

    for (const caption of captions) {
        if (caption.characterCount > config.maxChars) {
            issues.push(`Caption "${caption.id}" exceeds ${config.maxChars} char limit (${caption.characterCount})`);
        }
        if (caption.hashtags.length > config.maxHashtags) {
            issues.push(`Caption "${caption.id}" has ${caption.hashtags.length} hashtags, max is ${config.maxHashtags}`);
        }
        if (!caption.hook || caption.hook.length < 5) {
            issues.push(`Caption "${caption.id}" missing proper hook`);
        }
    }

    return {
        valid: issues.length === 0,
        issues
    };
}

/**
 * Extract platforms from user inputs with fallback
 */
export function extractPlatforms(inputs: Record<string, unknown>): string[] {
    const rawPlatforms = inputs.platforms;

    if (Array.isArray(rawPlatforms)) {
        return rawPlatforms.map(p => String(p).toLowerCase());
    }

    if (typeof rawPlatforms === 'string') {
        return rawPlatforms.split(',').map(p => p.trim().toLowerCase());
    }

    // Fallback to common platforms
    return ['instagram', 'tiktok'];
}
