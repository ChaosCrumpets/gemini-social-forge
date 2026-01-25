export function buildEnhancedContext(
    extractedInputs: any,
    selectedHooks: any,
    userProvidedContent?: string
): string {
    // Calculate word count
    const wordCountMap: { [key: string]: number } = {
        '15s': 45,
        '30s': 90,
        '60s': 170,
        '90s': 240,
    };
    const targetWords = wordCountMap[extractedInputs.duration] || 240;

    const context = `
═══════════════════════════════════════════════════════════════
🎯 CRITICAL CONTENT GENERATION REQUIREMENTS
═══════════════════════════════════════════════════════════════

⚠️ ANTI-GENERIC RULES (STRICTLY ENFORCE):

FORBIDDEN PHRASES (Never use these):
❌ "In today's world..."
❌ "Have you ever wondered..."
❌ "The key to success is..."
❌ "It's no secret that..."
❌ "As we all know..."

REQUIRED ELEMENTS (Must include ALL):
✅ Mention topic explicitly: "${extractedInputs.topic}"
✅ Use audience-specific language for: "${extractedInputs.targetAudience}"
✅ Include UAV markers: "${extractedInputs.uavMarkers || 'N/A'}"
✅ Use industry-specific terminology
✅ Include specific numbers, percentages, or data
✅ Give concrete examples (not abstract advice)

WORD COUNT ENFORCEMENT:
Target: ${targetWords} words MINIMUM
Your script MUST have ${targetWords} ±20 words
If you generate ${Math.floor(targetWords * 0.5)} words, you have FAILED.

═══════════════════════════════════════════════════════════════
📥 USER-SPECIFIC INPUTS
═══════════════════════════════════════════════════════════════

TOPIC: "${extractedInputs.topic}"
→ Mention this topic BY NAME in the script
→ Use terminology specific to "${extractedInputs.topic}"

TARGET AUDIENCE: "${extractedInputs.targetAudience}"
→ Describe THEIR specific struggles (not generic pain points)
→ Use language THEY actually use
→ Reference THEIR daily reality

PLATFORMS: ${extractedInputs.platforms?.join(', ')}
→ Match content style to platform culture

DURATION: ${extractedInputs.duration}
→ Generate EXACTLY ${targetWords} words (±20)

UNIQUE VALUE (UAV): "${extractedInputs.uavMarkers || 'Not provided'}"
→ Mention this in Hook or Context beat
→ Make it natural, not forced

${extractedInputs._enrichment ? `
═══════════════════════════════════════════════════════════════
🧠 INTELLIGENT ENRICHMENT DATA
═══════════════════════════════════════════════════════════════
NICHE: ${extractedInputs._enrichment.nicheDisplayName} (${extractedInputs._enrichment.nicheId})
AUDIENCE DESIRES: ${JSON.stringify(extractedInputs._enrichment.audienceEnrichment?.psychographics?.aspirations || [])}
AUDIENCE PAIN: ${JSON.stringify(extractedInputs._enrichment.audienceEnrichment?.psychographics?.frustrations || [])}
PROVEN ANGLES: ${JSON.stringify(extractedInputs._enrichment.contentAngles || [])}
` : ''}

${extractedInputs._ideation ? `
═══════════════════════════════════════════════════════════════
💡 IDEATION BRIEF
═══════════════════════════════════════════════════════════════
CONSOLIDATED INTENT: ${extractedInputs._ideation.brief || 'N/A'}
FOCUS AREAS: ${(extractedInputs._ideation.focusAreas || []).join(', ') || 'N/A'}
` : ''}

${extractedInputs._research ? `
═══════════════════════════════════════════════════════════════
🔎 LIVE RESEARCH DATA
═══════════════════════════════════════════════════════════════
Use this verified information to enhance credibility and relevance:

${extractedInputs._research.facts?.length > 0 ? `
📊 VERIFIED FACTS:
${extractedInputs._research.facts.slice(0, 3).map((f: string) => `• ${f.substring(0, 200)}`).join('\n')}
` : ''}

${extractedInputs._research.trends?.length > 0 ? `
📈 TRENDING TOPICS:
${extractedInputs._research.trends.slice(0, 3).map((t: string) => `• ${t}`).join('\n')}
` : ''}

${extractedInputs._research.hooks?.length > 0 ? `
🎣 VIRAL HOOK EXAMPLES:
${extractedInputs._research.hooks.slice(0, 3).map((h: string) => `• "${h}"`).join('\n')}
` : ''}

${extractedInputs._research.vocabulary?.length > 0 ? `
💬 AUDIENCE VOCABULARY:
${extractedInputs._research.vocabulary.slice(0, 2).map((v: string) => `• ${v.substring(0, 150)}`).join('\n')}
` : ''}

${extractedInputs._research.platformTips?.length > 0 ? `
📱 PLATFORM BEST PRACTICES:
${extractedInputs._research.platformTips.slice(0, 2).map((p: string) => `• ${p}`).join('\n')}
` : ''}

RESEARCH STATUS: ${extractedInputs._research.successRate || 'N/A'}
` : ''}

${userProvidedContent
            ? `
USER-PROVIDED CONTENT (USE VERBATIM):
${userProvidedContent}

⚠️ This is SACRED - preserve exactly as provided!
`
            : ''
        }

SELECTED HOOKS:
Text: "${selectedHooks?.textHook?.content || 'N/A'}"
Verbal: "${selectedHooks?.verbalHook?.content || 'N/A'}"
Visual: "${selectedHooks?.visualHook?.sceneDescription || 'N/A'}"

═══════════════════════════════════════════════════════════════
✍️ CONTENT-AWARE GENERATION INSTRUCTIONS
═══════════════════════════════════════════════════════════════

BEFORE YOU WRITE, ASK YOURSELF:
1. What are 3 SPECIFIC pain points for "${extractedInputs.targetAudience}"?
2. What CONCRETE examples can I give?
3. What NUMBERS or DATA would make this credible?
4. What JARGON does "${extractedInputs.targetAudience}" use?

SCRIPT GENERATION (${targetWords} words):
- Beat 1 (Hook): Use verbal hook, immediate specific pain point
- Beat 2 (Context): Audience-specific language, relatable scenario
- Beat 3 (Conflict): SPECIFIC failed attempts (not "I tried everything")
- Beat 4 (Turning Point): CONCRETE methodology (not vague advice)
- Beat 5 (Resolution): ACTIONABLE next step (not "work harder")

VOCABULARY REQUIREMENTS:
- Use DESCRIPTIVE adjectives (not basic/simple/good)
- Use ACTION verbs (not is/are/have)
- Use CONCRETE examples (not abstract concepts)
- Use NUMBERS when possible (e.g., "12 years", "$2M", "500 clients")

EXAMPLES OF GOOD VS BAD:

❌ BAD: "Cold calling is tough. Here are some tips..."
→ Generic, short, no specifics

✅ GOOD: "I dialed 1,247 cold calls in 90 days as a B2B SDR at a SaaS startup. 
My connect rate? A brutal 3.2%. But after implementing the BAMFAM framework 
I developed over 15 years closing $10M in enterprise deals, that number jumped 
to 18.7% in just 6 weeks..."
→ Specific numbers, industry terms, concrete methodology

═══════════════════════════════════════════════════════════════
🚀 GENERATE CONTENT NOW
═══════════════════════════════════════════════════════════════

Return ONLY valid JSON with all required fields.
Remember: ${targetWords} words minimum, mention "${extractedInputs.topic}" explicitly.
`;

    return context;
}
