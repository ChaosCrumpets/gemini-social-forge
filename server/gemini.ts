import { GoogleGenAI } from "@google/genai";
import { getHookPatternSummary, getRelevantHookPatterns } from "./hookDatabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const CAL_SYSTEM_INSTRUCTION = `You are the Content Assembly Line (C.A.L.) AI, a specialized content generation system for social media creators. Your role is to guide users through creating high-quality short-form video content.

CONVERSATION PHASE:
When gathering information, ask clear, focused questions about:
1. TOPIC - What is the main subject/theme?
2. GOAL - What should viewers feel/learn/do? (educate, entertain, promote, inspire, inform)
3. PLATFORM - Where will this be posted? (TikTok, Instagram Reels, YouTube Shorts, Twitter, LinkedIn)
4. TARGET AUDIENCE - Who is the ideal viewer?
5. TONE - What vibe should it have? (professional, casual, humorous, dramatic, etc.)
6. DURATION - Preferred length (15s, 30s, 60s, 90s)

Be conversational and helpful. Once you have enough information, indicate you're ready to generate hooks.

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
  "readyForHooks": boolean (true when you have at least topic, goal, and platform)
}`;

const HOOK_GENERATION_PROMPT = `Generate 5-6 compelling hooks for short-form video content based on the provided topic, goals, and proven hook patterns from our database.

Hook types to consider:
- QUESTION: Opens with a thought-provoking question
- STATISTIC: Leads with a surprising fact or number
- STORY: Begins with a relatable scenario
- BOLD: Makes a controversial or bold claim
- CHALLENGE: Poses a challenge to the viewer
- INSIGHT: Shares an unexpected insight

SMART RANKING SYSTEM:
After generating hooks, you MUST rank them from 1 (best) to 6 (worst) based on:
1. Alignment with proven viral patterns in the provided database
2. Predicted reach and conversion potential for the target niche
3. Psychological impact (curiosity gap, emotional resonance, urgency)
4. Platform-specific effectiveness
5. Audience relevance

The hook with rank=1 should also have isRecommended=true.

Return ONLY valid JSON in this exact format:
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

const CONTENT_GENERATION_PROMPT = `Generate a complete content package for short-form video. Create professional, engaging content based on the provided inputs and selected hook.

Return ONLY valid JSON in this exact format:
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
        "description": "What footage to find",
        "source": "Stock footage, user footage, screen recording, etc.",
        "timestamp": "When to use in video",
        "keywords": ["search", "keywords"]
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
  currentInputs: Record<string, unknown>
): Promise<ChatResponse> {
  try {
    const contextMessage = `Current gathered inputs: ${JSON.stringify(currentInputs)}
    
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
        readyForHooks: parsed.readyForHooks || false
      };
    } catch {
      return {
        message: text || "I'm here to help you create amazing content. What topic would you like to explore?",
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

    return {
      hooks: parsed.hooks.map((hook: { id?: string; type: string; text: string; preview: string; rank?: number; isRecommended?: boolean }, index: number) => ({
        id: hook.id || `hook-${index + 1}`,
        type: hook.type,
        text: hook.text,
        preview: hook.preview,
        rank: hook.rank || (index + 1),
        isRecommended: hook.isRecommended || (hook.rank === 1)
      }))
    };
  } catch (error) {
    console.error('Gemini hooks error:', error);
    throw new Error('Failed to generate hooks');
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
