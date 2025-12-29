import { GoogleGenAI } from "@google/genai";
import { getHookPatternSummary, getRelevantHookPatterns } from "./hookDatabase";
import { queryDatabase, getAllCategories } from "./queryDatabase";
import type { ContentOutput } from "@shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CAL_SYSTEM_INSTRUCTION = `You are the Content Assembly Line (C.A.L.) AI, a specialized content generation system for social media creators. Your role is to guide users through creating high-quality short-form video content.

You have access to a Master Query Database containing 200+ strategic discovery questions across 11 categories:
- UAV & C.A.L Context (user methodology)
- Identity, Origin & Why (personal story)
- Audience Psychography (pain points, desires)
- Strategic Positioning (USP, differentiation)
- Content Formats (video styles)
- Hooks & Headlines (attention techniques)
- Scripting & Storytelling (narrative structure)
- Visuals & Filming (production aesthetics)
- Editing & Pacing (post-production)
- Distribution & Growth (platform strategy)
- Monetization & Conversion (revenue)

Always reference this database to deepen user context before generating the final output.

CONVERSATION FLOW:
1. First, gather basic information (topic, goal, platform)
2. Once you have the basics, the system will present Discovery Questions to deepen context
3. After discovery answers are gathered, proceed to hook generation

BASIC INPUT GATHERING:
When gathering initial information, ask clear, focused questions about:
1. TOPIC - What is the main subject/theme?
2. GOAL - What should viewers feel/learn/do? (educate, entertain, promote, inspire, inform)
3. PLATFORM - Where will this be posted? (TikTok, Instagram Reels, YouTube Shorts, Twitter, LinkedIn)
4. TARGET AUDIENCE - Who is the ideal viewer?
5. TONE - What vibe should it have? (professional, casual, humorous, dramatic, etc.)
6. DURATION - Preferred length (15s, 30s, 60s, 90s)

Set "readyForDiscovery" to true when you have at least topic, goal, and platform.
Set "readyForHooks" to true when discovery questions have been answered and you're ready to generate hooks.

RESPONSE FORMAT:
Always respond in valid JSON with this structure:
{
  "message": "Your conversational response to the user",
  "extractedInputs": {
    "topic": "extracted topic or null",
    "goal": "extracted goal or null", 
    "platforms": ["extracted platforms"] or null,
    "targetAudience": "extracted audience or null",
    "tone": "extracted tone or null",
    "duration": "extracted duration or null"
  },
  "discoveryAnswers": { "key": "answer" } or null (when user answers discovery questions),
  "readyForDiscovery": boolean (true when you have topic, goal, and platform, but haven't done discovery yet),
  "readyForHooks": boolean (true when discovery phase is complete and ready for hook generation)
}`;

const HOOK_GENERATION_PROMPT = `Generate 5-6 compelling hooks for short-form video content using CHAIN-OF-THOUGHT reasoning.

STEP 1: ANALYZE THE NICHE
First, reason through what makes content go viral in this specific niche:
- What psychological triggers resonate with this audience?
- What format patterns have proven successful?
- What common objections or pain points exist?

STEP 2: APPLY VIRAL FRAMEWORKS
For each hook, consider these proven psychological principles:
- CURIOSITY GAP: Create tension between what viewers know and want to know
- PATTERN INTERRUPT: Break expectations to capture attention
- SELF-IDENTIFICATION: Make viewers see themselves in the content
- OPEN LOOP: Leave something unresolved that demands closure
- AUTHORITY SIGNAL: Establish credibility in the first 2 seconds

HOOK TYPES TO USE:
- QUESTION: Opens with a thought-provoking question
- STATISTIC: Leads with a surprising fact or number
- STORY: Begins with a relatable scenario
- BOLD: Makes a controversial or bold claim
- CHALLENGE: Poses a challenge to the viewer
- INSIGHT: Shares an unexpected insight

STEP 3: GENERATE AND RANK
Create hooks that combine proven patterns with novel execution.
Rank them 1 (best) to 6 (worst) based on:
1. Alignment with proven viral patterns in the provided database
2. Predicted reach and conversion potential for the target niche
3. Psychological impact (curiosity gap, emotional resonance, urgency)
4. Platform-specific effectiveness (TikTok hooks differ from LinkedIn)
5. Scroll-stopping potential in the first 1.5 seconds

The hook with rank=1 should also have isRecommended=true.

STEP 4: OUTPUT (Return ONLY this JSON, no additional text):
{
  "hooks": [
    {
      "id": "unique-id",
      "type": "QUESTION|STATISTIC|STORY|BOLD|CHALLENGE|INSIGHT",
      "text": "The actual hook text (first 2-3 seconds of video)",
      "preview": "Brief explanation of how this hook works and why it's effective",
      "rank": 1-6 (1 is best, must be unique for each hook),
      "isRecommended": true (only for rank 1) or false
    }
  ]
}`;

const CONTENT_GENERATION_PROMPT = `Generate a complete content package for short-form video using CHAIN-OF-THOUGHT reasoning.

STEP 1: CONTENT ARCHITECTURE ANALYSIS
Before generating, reason through:
- What is the core transformation or insight this content delivers?
- What retention strategy will keep viewers watching? (Tension-release, escalation, surprise)
- What call-to-action naturally flows from this content?

STEP 2: SCRIPT ENGINEERING
Apply the "AIDA" framework for viral scripts:
- ATTENTION: Hook must stop the scroll in 1.5 seconds
- INTEREST: Build curiosity through specific, relatable details
- DESIRE: Create emotional investment in the outcome
- ACTION: Clear next step that feels natural, not forced

STEP 3: VISUAL STORYTELLING
Consider visual hierarchy and pacing:
- Opening shots must match hook energy (high energy = quick cuts, intimate = steady shots)
- B-roll should reinforce, not distract from, the message
- Transitions should feel intentional, not decorative

STEP 4: B-ROLL GENERATION (THREE OUTPUTS PER ITEM)
1. description: FIY (Film It Yourself) - practical filming instructions
2. imagePrompt: Alpha Image Prompt - cinematic, photorealistic following the 3-Pillar Framework:
   - Structure Pillar: Camera setup, lens, aperture, lighting direction, environmental physics
   - Reference Pillar: Photographic era, analog formats, cinematographic influences
   - Vision Pillar: Emotional tone, color palette, intentional imperfections (motion blur, chromatic flares, film grain)
   - Write as a flowing creative-director brief, not a list
   - Include technical specs: lens, aperture, ISO, aspect ratio (--ar 9:16 for vertical)
3. videoPrompt: Omega Video Prompt - cinematic sequence that evolves the image into motion:
   - Opening: Establish continuity with commanded lighting and physical textures
   - Camera Movement: Deliberate motion paths (dolly, pan, push, tracking)
   - Cinematography: Lens behavior, focal transitions, lighting evolution
   - Narrative Arc: Tone progression, emotional escalation, controlled chaos
   - Include: aspect ratio, duration (3-5 seconds), camera dynamics

STEP 5: OUTPUT (Return ONLY this JSON, no additional text):
{
  "output": {
    "script": [
      {
        "lineNumber": 1,
        "speaker": "HOST or null",
        "text": "The spoken words",
        "timing": "0:00-0:03",
        "notes": "Optional direction notes"
      }
    ],
    "storyboard": [
      {
        "frameNumber": 1,
        "shotType": "CLOSE-UP|MEDIUM|WIDE|B-ROLL|TEXT-OVERLAY",
        "description": "What the viewer sees",
        "visualNotes": "Camera movement, transitions, effects",
        "duration": "3s"
      }
    ],
    "techSpecs": {
      "aspectRatio": "9:16 for vertical, 16:9 for horizontal",
      "resolution": "1080x1920 or 1920x1080",
      "frameRate": "30fps or 60fps",
      "duration": "Total duration",
      "audioFormat": "AAC 128kbps stereo",
      "exportFormat": "MP4 H.264",
      "platforms": ["list of target platforms"]
    },
    "bRoll": [
      {
        "id": "unique-id",
        "description": "FIY filming instructions - what to film and how",
        "source": "Stock footage, user footage, screen recording, etc.",
        "timestamp": "When to use in video",
        "keywords": ["search", "keywords"],
        "imagePrompt": "Alpha Image Prompt - cinematic photorealistic prompt with 3-pillar framework, technical specs, and --ar 9:16",
        "videoPrompt": "Omega Video Prompt - cinematic sequence with camera movement, 3-5 second duration, narrative arc, and motion dynamics"
      }
    ],
    "captions": [
      {
        "id": "unique-id",
        "timestamp": "0:00",
        "text": "Caption text",
        "style": "normal|emphasis|question"
      }
    ]
  }
}`;

export interface ChatResponse {
  message: string;
  extractedInputs?: {
    topic?: string;
    goal?: string;
    platforms?: string[];
    targetAudience?: string;
    tone?: string;
    duration?: string;
  };
  discoveryAnswers?: Record<string, string>;
  readyForDiscovery: boolean;
  readyForHooks: boolean;
}

export interface HooksResponse {
  hooks: Array<{
    id: string;
    type: string;
    text: string;
    preview: string;
    rank: number;
    isRecommended: boolean;
  }>;
}

export interface ContentResponse {
  output: {
    script: Array<{
      lineNumber: number;
      speaker?: string;
      text: string;
      timing?: string;
      notes?: string;
    }>;
    storyboard: Array<{
      frameNumber: number;
      shotType: string;
      description: string;
      visualNotes?: string;
      duration?: string;
    }>;
    techSpecs: {
      aspectRatio: string;
      resolution: string;
      frameRate: string;
      duration: string;
      audioFormat?: string;
      exportFormat?: string;
      platforms?: string[];
    };
    bRoll: Array<{
      id: string;
      description: string;
      source: string;
      timestamp?: string;
      keywords?: string[];
      imagePrompt?: string;
      videoPrompt?: string;
    }>;
    captions: Array<{
      id: string;
      timestamp: string;
      text: string;
      style?: string;
    }>;
  };
}

export async function chat(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  currentInputs: Record<string, unknown>,
  discoveryComplete?: boolean
): Promise<ChatResponse> {
  try {
    const contextMessage = `Current gathered inputs: ${JSON.stringify(currentInputs)}
Discovery phase completed: ${discoveryComplete ? 'yes' : 'no'}
    
User message: ${userMessage}`;

    const messages = [
      ...conversationHistory.map(msg => ({
        role: msg.role as 'user' | 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user' as const,
        parts: [{ text: contextMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: CAL_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json"
      },
      contents: messages
    });

    const text = response.text || '';
    
    try {
      const parsed = JSON.parse(text);
      return {
        message: parsed.message || "I'm processing your request...",
        extractedInputs: parsed.extractedInputs,
        discoveryAnswers: parsed.discoveryAnswers,
        readyForDiscovery: parsed.readyForDiscovery || false,
        readyForHooks: parsed.readyForHooks || false
      };
    } catch {
      return {
        message: text || "I'm here to help you create amazing content. What topic would you like to explore?",
        readyForDiscovery: false,
        readyForHooks: false
      };
    }
  } catch (error) {
    console.error('Gemini chat error:', error);
    throw new Error('Failed to process chat message');
  }
}

export async function generateHooks(
  inputs: Record<string, unknown>
): Promise<HooksResponse> {
  try {
    const topic = (inputs.topic as string) || 'general content';
    const niche = `${topic} ${inputs.targetAudience || ''} ${inputs.goal || ''}`;
    
    const hookPatterns = getHookPatternSummary(niche);
    const relevantTemplates = getRelevantHookPatterns(niche, 10);
    
    const templateExamples = relevantTemplates.slice(0, 5).map(t => `- "${t.template}"`).join('\n');

    const prompt = `${HOOK_GENERATION_PROMPT}

PROVEN VIRAL HOOK PATTERNS FOR THIS NICHE:
${hookPatterns}

HIGH-PERFORMING HOOK TEMPLATES TO DRAW INSPIRATION FROM:
${templateExamples}

Use these proven patterns as inspiration to create hooks that align with what has already gone viral in similar niches. Adapt the templates to the specific topic while maintaining the psychological hooks that made them successful.

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}
- Duration: ${inputs.duration || '30-60 seconds'}

Generate 6 hooks with unique ranks (1-6, where 1 is best). The rank=1 hook should have isRecommended=true:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json"
      },
      contents: prompt
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    
    if (!parsed.hooks || !Array.isArray(parsed.hooks)) {
      throw new Error('Invalid hooks response format');
    }

    const rawHooks = parsed.hooks.map((hook: { id?: string; type: string; text: string; preview: string; rank?: number; isRecommended?: boolean }, index: number) => ({
      id: hook.id || `hook-${index + 1}`,
      type: hook.type || 'INSIGHT',
      text: hook.text || '',
      preview: hook.preview || '',
      rank: hook.rank,
      isRecommended: hook.isRecommended
    }));

    const usedRanks = new Set<number>();
    const validatedHooks = rawHooks.map((hook: { id: string; type: string; text: string; preview: string; rank?: number; isRecommended?: boolean }, index: number) => {
      let rank = hook.rank;
      
      if (typeof rank !== 'number' || rank < 1 || rank > 6 || usedRanks.has(rank)) {
        for (let r = 1; r <= 6; r++) {
          if (!usedRanks.has(r)) {
            rank = r;
            break;
          }
        }
        if (!rank) rank = index + 1;
      }
      
      usedRanks.add(rank);
      
      return {
        ...hook,
        rank,
        isRecommended: rank === 1
      };
    });

    validatedHooks.sort((a: { rank: number }, b: { rank: number }) => a.rank - b.rank);

    return { hooks: validatedHooks };
  } catch (error) {
    console.error('Gemini hooks error:', error);
    throw new Error('Failed to generate hooks');
  }
}

// TEXT HOOK GENERATION (On-screen text, captions, titles)
const TEXT_HOOK_PROMPT = `Generate 6 TEXT HOOKS for short-form video content using CHAIN-OF-THOUGHT reasoning.

STEP 1: AUDIENCE PSYCHOLOGY ANALYSIS
Before generating, reason through:
- What SINGLE emotion will make this audience stop scrolling? (fear of missing out, curiosity, validation-seeking)
- What specific RESULT or TRANSFORMATION are they seeking?
- What contrarian or unexpected angle will pattern-interrupt their feed?

STEP 2: TEXT HOOK ENGINEERING
Apply the "3-Second Rule" - if it can't be understood in 3 seconds, it fails:
- SHORT: 3-8 words maximum
- PUNCHY: High-impact words that create visual weight
- SCANNABLE: Works at thumbnail size and full screen
- STANDALONE: Creates curiosity without audio context

Hook types to apply:
- bold_statement: Direct, provocative claims that challenge assumptions
- listicle: "3 Things...", "5 Ways..." with specific numbers
- question: Short questions that create self-identification
- contrast: "Stop [X]. Do [Y]." with clear before/after
- secret: "The truth about...", "What they don't tell you..."
- result: "How I [achieved specific result]" with social proof

STEP 3: RANKING (1=best, 6=worst, all unique)
Evaluate each hook on:
1. Scan-speed readability (instant comprehension test)
2. Curiosity gap strength (how badly do they need to know more?)
3. Niche relevance and platform fit
4. Thumbnail/scroll-stopping visual power

STEP 4: OUTPUT (Return ONLY this JSON, no additional text):
{
  "textHooks": [
    {
      "id": "T1",
      "type": "bold_statement|listicle|question|contrast|secret|result",
      "content": "The actual text hook (3-8 words)",
      "placement": "thumbnail|title_card|caption_overlay",
      "rank": 1-6 (1 is best, unique),
      "isRecommended": true (only for rank 1) or false
    }
  ]
}`;

// VERBAL HOOK GENERATION (Script openers, spoken words)
const VERBAL_HOOK_PROMPT = `Generate 6 VERBAL HOOKS for short-form video content using CHAIN-OF-THOUGHT reasoning.

STEP 1: VOICE PSYCHOLOGY ANALYSIS
Before generating, reason through:
- What TONE will resonate with this audience? (mentor, peer, provocateur, insider)
- What PACING creates the right tension? (rapid-fire urgency vs. measured authority)
- What CONVERSATIONAL STYLE feels authentic to this niche?

STEP 2: SUPER HOOK METHODOLOGY
Apply proven verbal hook frameworks:
- effort_condensed: "I spent 1000 hours..." / "After testing 50 methods..." (borrowed authority through effort)
- failure: "I failed 5 times, but..." / "Everyone told me I was wrong..." (vulnerability + redemption)
- credibility_arbitrage: "According to [authority]..." / "Research shows..." (external validation)
- shared_emotion: "If you've ever felt..." / "You know that feeling when..." (instant relatability)
- pattern_interrupt: "Stop what you're doing." / "This is urgent." (disrupts scroll autopilot)
- direct_question: "Want to know the secret?" / "Have you ever wondered...?" (activates curiosity)

STEP 3: VERBAL DELIVERY OPTIMIZATION
Design for spoken performance:
- First 2-5 seconds only (8-15 words maximum)
- Natural speech rhythm (how would you say this to a friend?)
- Built-in pause points for emphasis
- Conversational, not scripted-sounding

STEP 4: RANKING (1=best, 6=worst, all unique)
Evaluate each hook on:
1. Emotional engagement strength (does it create a visceral response?)
2. Alignment with Super Hook strategy (proven psychological triggers)
3. Credibility establishment speed (authority in under 3 seconds)
4. Platform-specific effectiveness (TikTok energy vs LinkedIn professionalism)

STEP 5: OUTPUT (Return ONLY this JSON, no additional text):
{
  "verbalHooks": [
    {
      "id": "V1",
      "type": "effort_condensed|failure|credibility_arbitrage|shared_emotion|pattern_interrupt|direct_question",
      "content": "The spoken words (first 2-5 seconds)",
      "emotionalTrigger": "curiosity|empathy|urgency|surprise|validation",
      "retentionTrigger": "open_loop|information_gap|relatability|authority",
      "rank": 1-6 (1 is best, unique),
      "isRecommended": true (only for rank 1) or false
    }
  ]
}`;

// VISUAL HOOK GENERATION (Scene, camera, setting)
const VISUAL_HOOK_PROMPT = `Generate 6 VISUAL HOOKS for short-form video content. These define the visual composition, camera work, and scene setting for the opening shot.

CRITICAL: Each visual hook must provide TWO execution paths:
1. FIY (Film It Yourself): Directorial instructions for shooting
2. GenAI Prompt: Optimized prompt for Midjourney/DALL-E B-roll generation

VISUAL HOOK CHARACTERISTICS:
- First 2-3 seconds of visual content
- Sets mood, establishes authority, creates intrigue
- Camera angles, movement, lighting, composition
- Must work with or without the creator on camera

Visual types to consider:
- dynamic_movement: Walking into frame, camera push/pull
- close_up_reveal: Product/face reveal, dramatic lighting
- environment_establish: Wide establishing shot
- action_in_progress: Caught mid-activity
- contrast_cut: Before/after, problem/solution visual
- text_focused: Minimal background, text-forward

RANKING CRITERIA:
1. Scroll-stopping visual impact
2. Production feasibility with user's setup
3. Platform optimization (vertical format priority)
4. Emotional/tonal alignment with content

Return ONLY valid JSON:
{
  "visualHooks": [
    {
      "id": "VIS1",
      "type": "dynamic_movement|close_up_reveal|environment_establish|action_in_progress|contrast_cut|text_focused",
      "fiyGuide": "Detailed filming instructions: camera angle, movement, lighting, action, props",
      "genAiPrompt": "Optimized prompt for AI image/video generation, include style, composition, mood --ar 9:16",
      "sceneDescription": "Brief summary of the visual concept",
      "rank": 1-6 (1 is best, unique),
      "isRecommended": true (only for rank 1) or false
    }
  ]
}`;

export interface TextHookResponse {
  textHooks: Array<{
    id: string;
    type: string;
    content: string;
    placement?: string;
    rank: number;
    isRecommended: boolean;
  }>;
}

export interface VerbalHookResponse {
  verbalHooks: Array<{
    id: string;
    type: string;
    content: string;
    emotionalTrigger?: string;
    retentionTrigger?: string;
    rank: number;
    isRecommended: boolean;
  }>;
}

export interface VisualHookResponse {
  visualHooks: Array<{
    id: string;
    type: string;
    fiyGuide: string;
    genAiPrompt: string;
    sceneDescription?: string;
    rank: number;
    isRecommended: boolean;
  }>;
}

export async function generateTextHooks(
  inputs: Record<string, unknown>
): Promise<TextHookResponse> {
  try {
    const topic = (inputs.topic as string) || 'general content';
    const niche = `${topic} ${inputs.targetAudience || ''} ${inputs.goal || ''}`;
    const discoveryContext = (inputs.discoveryContext as string) || '';
    
    const hookPatterns = getHookPatternSummary(niche);

    const discoverySection = discoveryContext 
      ? `\n\nDEEPER CONTEXT FROM DISCOVERY:\n${discoveryContext}\n\nUse this additional context to create more targeted and personalized hooks.`
      : '';

    const prompt = `${TEXT_HOOK_PROMPT}

PROVEN PATTERNS FOR THIS NICHE:
${hookPatterns}${discoverySection}

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}

Generate 6 text hooks with unique ranks (1-6, where 1 is best):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt
    });

    const parsed = JSON.parse(response.text || '');
    
    if (!parsed.textHooks || !Array.isArray(parsed.textHooks)) {
      throw new Error('Invalid text hooks response');
    }

    return { textHooks: validateAndRankHooks(parsed.textHooks, 'text') };
  } catch (error) {
    console.error('Text hooks error:', error);
    throw new Error('Failed to generate text hooks');
  }
}

export async function generateVerbalHooks(
  inputs: Record<string, unknown>
): Promise<VerbalHookResponse> {
  try {
    const topic = (inputs.topic as string) || 'general content';
    const niche = `${topic} ${inputs.targetAudience || ''} ${inputs.goal || ''}`;
    const discoveryContext = (inputs.discoveryContext as string) || '';
    
    const hookPatterns = getHookPatternSummary(niche);
    const relevantTemplates = getRelevantHookPatterns(niche, 8);
    const templateExamples = relevantTemplates.slice(0, 5).map(t => `- "${t.template}"`).join('\n');

    const discoverySection = discoveryContext 
      ? `\n\nDEEPER CONTEXT FROM DISCOVERY:\n${discoveryContext}\n\nUse this additional context to create more targeted and personalized hooks.`
      : '';

    const prompt = `${VERBAL_HOOK_PROMPT}

PROVEN VIRAL PATTERNS FOR THIS NICHE:
${hookPatterns}

HIGH-PERFORMING VERBAL TEMPLATES:
${templateExamples}${discoverySection}

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}
- Brand Voice: ${inputs.tone === 'educational' ? 'Educator' : inputs.tone === 'fun' ? 'Gamifier' : 'Experimenter'}

Generate 6 verbal hooks with unique ranks (1-6, where 1 is best):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt
    });

    const parsed = JSON.parse(response.text || '');
    
    if (!parsed.verbalHooks || !Array.isArray(parsed.verbalHooks)) {
      throw new Error('Invalid verbal hooks response');
    }

    return { verbalHooks: validateAndRankHooks(parsed.verbalHooks, 'verbal') };
  } catch (error) {
    console.error('Verbal hooks error:', error);
    throw new Error('Failed to generate verbal hooks');
  }
}

export async function generateVisualHooks(
  inputs: Record<string, unknown>,
  visualContext: { location?: string; lighting?: string; onCamera?: boolean }
): Promise<VisualHookResponse> {
  try {
    const locationMap: Record<string, string> = {
      desk_office: 'desk or office environment',
      standing_wall: 'standing against a wall or backdrop',
      outdoors: 'outdoor location',
      car: 'inside a car',
      gym: 'gym or fitness environment',
      kitchen: 'kitchen setting',
      studio: 'professional studio setup',
      other: 'flexible environment'
    };

    const lightingMap: Record<string, string> = {
      natural_window: 'natural window lighting',
      ring_light: 'ring light setup',
      professional_studio: 'professional studio lighting',
      dark_moody: 'dark and moody atmosphere',
      mixed: 'mixed lighting sources'
    };

    const prompt = `${VISUAL_HOOK_PROMPT}

PRODUCTION CONTEXT:
- Filming Location: ${locationMap[visualContext.location || 'other'] || 'flexible environment'}
- Lighting Setup: ${lightingMap[visualContext.lighting || 'mixed'] || 'available lighting'}
- Creator On Camera: ${visualContext.onCamera ? 'Yes - include presenter shots' : 'No - B-roll and text-focused only'}

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}

Generate 6 visual hooks optimized for the user's production setup. Each must include both FIY filming instructions AND a GenAI prompt for AI-generated alternatives:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt
    });

    const parsed = JSON.parse(response.text || '');
    
    if (!parsed.visualHooks || !Array.isArray(parsed.visualHooks)) {
      throw new Error('Invalid visual hooks response');
    }

    return { visualHooks: validateAndRankHooks(parsed.visualHooks, 'visual') };
  } catch (error) {
    console.error('Visual hooks error:', error);
    throw new Error('Failed to generate visual hooks');
  }
}

function validateAndRankHooks<T extends { id?: string; rank?: number; isRecommended?: boolean }>(
  hooks: T[],
  modality: string
): T[] {
  const usedRanks = new Set<number>();
  
  const validated = hooks.map((hook, index) => {
    let rank = hook.rank;
    
    if (typeof rank !== 'number' || rank < 1 || rank > 6 || usedRanks.has(rank)) {
      for (let r = 1; r <= 6; r++) {
        if (!usedRanks.has(r)) {
          rank = r;
          break;
        }
      }
      if (!rank) rank = index + 1;
    }
    
    usedRanks.add(rank);
    
    return {
      ...hook,
      id: hook.id || `${modality.charAt(0).toUpperCase()}${index + 1}`,
      rank,
      isRecommended: rank === 1,
      modality
    };
  });

  return validated.sort((a, b) => (a.rank || 99) - (b.rank || 99)) as T[];
}

export async function generateContentFromMultiHooks(
  inputs: Record<string, unknown>,
  selectedHooks: {
    text?: { content: string; type: string };
    verbal?: { content: string; type: string };
    visual?: { fiyGuide: string; genAiPrompt: string; type: string };
  }
): Promise<ContentResponse> {
  try {
    const prompt = `${CONTENT_GENERATION_PROMPT}

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}
- Duration: ${inputs.duration || '30-60 seconds'}

SELECTED HOOKS (Integrate all three into the content):

TEXT HOOK (On-screen/Title):
- Type: ${selectedHooks.text?.type || 'Not selected'}
- Content: "${selectedHooks.text?.content || 'Not selected'}"

VERBAL HOOK (Script Opener):
- Type: ${selectedHooks.verbal?.type || 'Not selected'}
- Content: "${selectedHooks.verbal?.content || 'Not selected'}"

VISUAL HOOK (Opening Shot):
- Type: ${selectedHooks.visual?.type || 'Not selected'}
- FIY Guide: ${selectedHooks.visual?.fiyGuide || 'Not selected'}
- GenAI Prompt: ${selectedHooks.visual?.genAiPrompt || 'Not selected'}

Generate a cohesive content package that integrates all three hook elements seamlessly:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: { responseMimeType: "application/json" },
      contents: prompt
    });

    const parsed = JSON.parse(response.text || '');
    
    if (!parsed.output) {
      throw new Error('Invalid content response format');
    }

    return parsed as ContentResponse;
  } catch (error) {
    console.error('Content generation error:', error);
    throw new Error('Failed to generate content');
  }
}

// Edit content output via chat
const EDIT_CONTENT_PROMPT = `You are the Content Assembly Line (C.A.L.) AI editor. The user has completed content generation and now wants to make edits to their content package.

Your job is to:
1. Understand what the user wants to change
2. Apply their requested edits to the appropriate section(s)
3. Return the complete updated content with their changes applied

Editable sections:
- script: Array of script lines with speaker, text, timing, and notes
- storyboard: Array of frames with shotType, description, visualNotes, and duration
- techSpecs: Technical specifications object (aspectRatio, resolution, frameRate, duration, audioFormat, exportFormat, platforms)
- bRoll: Array of B-roll items with description, source, timestamp, keywords, imagePrompt, videoPrompt
- captions: Array of caption objects with timestamp, text, and style

When the user requests changes:
- Be helpful and apply their edits precisely
- Maintain the overall structure and quality
- Only modify what they ask for, keep everything else the same
- If they want to change tech specs (like switching platforms or aspect ratios), update accordingly

RESPONSE FORMAT:
Return ONLY valid JSON in this exact format:
{
  "message": "Brief description of what you changed",
  "updatedOutput": {
    "script": [...],
    "storyboard": [...],
    "techSpecs": {...},
    "bRoll": [...],
    "captions": [...]
  }
}`;

export interface EditContentResponse {
  message: string;
  updatedOutput: ContentOutput;
}

export async function editContent(
  userMessage: string,
  currentOutput: ContentOutput,
  conversationHistory: Array<{ role: string; content: string }>
): Promise<EditContentResponse> {
  try {
    const systemContext = `${EDIT_CONTENT_PROMPT}

Current content package:
${JSON.stringify(currentOutput, null, 2)}`;

    const contents = [
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      })),
      {
        role: 'user' as const,
        parts: [{ text: userMessage }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json",
        systemInstruction: systemContext
      },
      contents
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    if (!parsed.updatedOutput) {
      throw new Error('Invalid edit response format');
    }

    return {
      message: parsed.message || 'Content updated successfully',
      updatedOutput: parsed.updatedOutput
    };
  } catch (error) {
    console.error('Edit content error:', error);
    throw new Error('Failed to edit content');
  }
}

export async function generateContent(
  inputs: Record<string, unknown>,
  selectedHook: { id: string; type: string; text: string; preview: string }
): Promise<ContentResponse> {
  try {
    const prompt = `${CONTENT_GENERATION_PROMPT}

Content Details:
- Topic: ${inputs.topic || 'Not specified'}
- Goal: ${inputs.goal || 'Not specified'}
- Platforms: ${Array.isArray(inputs.platforms) ? inputs.platforms.join(', ') : 'Not specified'}
- Target Audience: ${inputs.targetAudience || 'General audience'}
- Tone: ${inputs.tone || 'Engaging and professional'}
- Duration: ${inputs.duration || '30-60 seconds'}

Selected Hook:
- Type: ${selectedHook.type}
- Text: "${selectedHook.text}"
- Preview: ${selectedHook.preview}

Generate the complete content package now, starting with this hook:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json"
      },
      contents: prompt
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);
    
    if (!parsed.output) {
      throw new Error('Invalid content response format');
    }

    return parsed as ContentResponse;
  } catch (error) {
    console.error('Gemini content error:', error);
    throw new Error('Failed to generate content');
  }
}

export interface DiscoveryQuestionsResponse {
  category: string;
  categoryName: string;
  questions: string[];
  explanation: string;
}

const DISCOVERY_QUESTIONS_PROMPT = `You are analyzing a user's topic to select the most relevant discovery questions from the C.A.L. Master Query Database.

AVAILABLE CATEGORIES:
{{categories}}

QUESTION DATABASE:
{{questionDatabase}}

USER'S TOPIC: {{topic}}
USER'S INTENT/GOAL: {{intent}}

Your task:
1. Analyze the topic and intent to determine which category from the database is MOST relevant
2. Select exactly 3-5 questions from that specific category that will help deepen the user's content strategy
3. Choose questions that will uncover unique angles, emotional hooks, or strategic insights

RESPONSE FORMAT (JSON only):
{
  "category": "category_id",
  "categoryName": "Full Category Name",
  "questions": ["Question 1?", "Question 2?", "Question 3?"],
  "explanation": "Brief explanation of why these questions matter for this topic"
}`;

export async function generateDiscoveryQuestions(
  topic: string,
  intent?: string
): Promise<DiscoveryQuestionsResponse> {
  try {
    const categories = getAllCategories()
      .map(c => `- ${c.id}: ${c.name} - ${c.description}`)
      .join('\n');
    
    const questionDb = queryDatabase
      .map(cat => `## ${cat.name}\n${cat.questions.slice(0, 10).map((q, i) => `${i + 1}. ${q}`).join('\n')}`)
      .join('\n\n');

    const prompt = DISCOVERY_QUESTIONS_PROMPT
      .replace('{{categories}}', categories)
      .replace('{{questionDatabase}}', questionDb)
      .replace('{{topic}}', topic)
      .replace('{{intent}}', intent || 'general content creation');

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        responseMimeType: "application/json"
      },
      contents: prompt
    });

    const text = response.text || '';
    const parsed = JSON.parse(text);

    return {
      category: parsed.category || 'identity',
      categoryName: parsed.categoryName || 'Identity & Origin',
      questions: parsed.questions || [],
      explanation: parsed.explanation || 'These questions will help deepen your content strategy.'
    };
  } catch (error) {
    console.error('Discovery questions error:', error);
    throw new Error('Failed to generate discovery questions');
  }
}

export function getQueryDatabaseCategories() {
  return getAllCategories();
}

export function getQuestionsFromCategory(categoryId: string, count: number = 5) {
  const category = queryDatabase.find(c => c.id === categoryId);
  if (!category) return [];
  
  const shuffled = [...category.questions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Remix a text fragment based on an instruction
export async function remixText(
  selectedText: string, 
  instruction: string,
  context?: string
): Promise<{ remixedText: string }> {
  try {
    const prompt = `You are a professional script editor. Your task is to rewrite ONLY the selected text fragment based on the instruction provided.

INSTRUCTION: ${instruction}

SELECTED TEXT TO REWRITE:
"${selectedText}"

${context ? `CONTEXT (for reference, DO NOT include in output):
${context}` : ''}

RULES:
1. ONLY output the rewritten text - no explanations, no quotes, no additional formatting
2. Maintain the same general meaning unless the instruction specifically asks to change it
3. Keep approximately the same length unless the instruction specifies otherwise
4. Match the tone and style of the original text
5. If the instruction is "Shorten", reduce word count by 30-50%
6. If the instruction is "Make Funnier", add humor while keeping the message
7. If the instruction is "Rewrite", provide a fresh take with different wording

OUTPUT ONLY THE REWRITTEN TEXT:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const remixedText = (response.text || selectedText).trim();
    
    return { remixedText };
  } catch (error) {
    console.error('Remix text error:', error);
    throw new Error('Failed to remix text');
  }
}
