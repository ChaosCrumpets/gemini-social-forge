export interface LLMProvider {
  name: string;
  apiKey: string;
  rpm: number;  // Requests per minute
  logicModel: string;
  contentModel: string;
  enabled: boolean;
  priority: number;  // 1 = highest
}

export const providers: LLMProvider[] = [
  {
    name: 'gemini',
    apiKey: process.env.GEMINI_API_KEY || '',
    rpm: 60,
    logicModel: 'gemini-1.5-flash-001',
    contentModel: 'gemini-1.5-flash-001',
    enabled: !!process.env.GEMINI_API_KEY,
    priority: 1
  },
  {
    name: 'claude',
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    rpm: 50,
    logicModel: 'claude-3-5-sonnet-20240620',
    contentModel: 'claude-3-haiku-20240307',
    enabled: !!process.env.ANTHROPIC_API_KEY,
    priority: 2
  },
  {
    name: 'deepseek',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
    rpm: 120, // High throughput
    logicModel: 'deepseek-chat',
    contentModel: 'deepseek-chat',
    enabled: !!process.env.DEEPSEEK_API_KEY,
    priority: 3
  },
  {
    name: 'groq',
    apiKey: process.env.GROQ_API_KEY || '',
    rpm: 30, // Default free tier limit
    logicModel: 'llama-3.3-70b-versatile',
    contentModel: 'llama-3.3-70b-versatile',
    enabled: !!process.env.GROQ_API_KEY,
    priority: 4
  },
  {
    name: 'openrouter',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    rpm: 200,
    logicModel: 'anthropic/claude-3.5-haiku',
    contentModel: 'google/gemini-2.0-flash-exp:free',
    enabled: !!process.env.OPENROUTER_API_KEY,
    priority: 5
  }
];
