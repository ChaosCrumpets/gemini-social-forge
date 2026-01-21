import { z } from "zod";

// Project Status enum with hook substages
export const ProjectStatus = {
  INPUTTING: "inputting",
  HOOK_TEXT: "hook_text",
  HOOK_VERBAL: "hook_verbal",
  HOOK_VISUAL: "hook_visual",
  HOOK_OVERVIEW: "hook_overview",
  GENERATING: "generating",
  COMPLETE: "complete"
} as const;

export type ProjectStatusType = typeof ProjectStatus[keyof typeof ProjectStatus];

// Hook modality types
export const HookModality = {
  TEXT: "text",
  VERBAL: "verbal",
  VISUAL: "visual"
} as const;

export type HookModalityType = typeof HookModality[keyof typeof HookModality];

// Platform options for content generation
export const Platforms = ["tiktok", "instagram", "youtube_shorts", "twitter", "linkedin"] as const;
export type PlatformType = typeof Platforms[number];

// Content goal options
export const Goals = ["educate", "entertain", "promote", "inspire", "inform"] as const;
export type GoalType = typeof Goals[number];

// Chat message schema
export const chatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number()
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

// User inputs collected during conversation
export const userInputsSchema = z.object({
  topic: z.string().optional(),
  goal: z.enum(Goals).optional(),
  platforms: z.array(z.enum(Platforms)).optional(),
  targetAudience: z.string().optional(),
  tone: z.string().optional(),
  duration: z.string().optional(),
  discoveryContext: z.string().optional()
});

export type UserInputs = z.infer<typeof userInputsSchema>;

// Visual context inputs for visual hook generation
export const visualContextSchema = z.object({
  location: z.enum(["desk_office", "standing_wall", "outdoors", "car", "gym", "kitchen", "studio", "other"]).optional(),
  lighting: z.enum(["natural_window", "ring_light", "professional_studio", "dark_moody", "mixed"]).optional(),
  onCamera: z.boolean().optional()
});

export type VisualContext = z.infer<typeof visualContextSchema>;

// Base hook schema with common fields
const baseHookSchema = z.object({
  id: z.string(),
  type: z.string(),
  rank: z.number().min(1).max(6).optional(),
  isRecommended: z.boolean().optional()
});

// Text Hook schema (on-screen text, captions, titles)
export const textHookSchema = baseHookSchema.extend({
  modality: z.literal("text"),
  content: z.string(),
  placement: z.string().optional()
});

export type TextHook = z.infer<typeof textHookSchema>;

// Verbal Hook schema (script openers, spoken words)
export const verbalHookSchema = baseHookSchema.extend({
  modality: z.literal("verbal"),
  content: z.string(),
  emotionalTrigger: z.string().optional(),
  retentionTrigger: z.string().optional()
});

export type VerbalHook = z.infer<typeof verbalHookSchema>;

// Visual Hook schema (scene, camera, lighting with dual output)
export const visualHookSchema = baseHookSchema.extend({
  modality: z.literal("visual"),
  fiyGuide: z.string(),
  genAiPrompt: z.string(),
  sceneDescription: z.string().optional()
});

export type VisualHook = z.infer<typeof visualHookSchema>;

// Legacy hook schema for backward compatibility
export const hookSchema = z.object({
  id: z.string(),
  type: z.string(),
  text: z.string(),
  preview: z.string(),
  rank: z.number().min(1).max(6).optional(),
  isRecommended: z.boolean().optional()
});

export type Hook = z.infer<typeof hookSchema>;

// Selected hooks structure for all three modalities
export const selectedHooksSchema = z.object({
  text: textHookSchema.optional(),
  verbal: verbalHookSchema.optional(),
  visual: visualHookSchema.optional()
});

export type SelectedHooks = z.infer<typeof selectedHooksSchema>;

// Script line schema (enhanced with neurobiology beats)
export const scriptLineSchema = z.object({
  lineNumber: z.number(),
  speaker: z.string().nullable().optional(),
  text: z.string(),
  timing: z.string().optional(),
  notes: z.string().optional(),
  source: z.enum(["user-provided", "AI-enhanced", "AI-generated"]).optional(),
  neurobiologyBeat: z.enum(["hook", "context", "conflict", "turning_point", "resolution"]).optional()
});

export type ScriptLine = z.infer<typeof scriptLineSchema>;

// Storyboard frame schema (enhanced with camera movement and audio)
export const storyboardFrameSchema = z.object({
  frameNumber: z.number(),
  timing: z.string().optional(),
  shotType: z.string(),
  visualDescription: z.string(),
  cameraMovement: z.string().optional(),
  audioVO: z.string().optional(),
  transition: z.string().optional(),
  notes: z.string().optional(),
  // Legacy fields for backward compatibility
  description: z.string().optional(),
  visualNotes: z.string().optional(),
  duration: z.string().optional()
});

export type StoryboardFrame = z.infer<typeof storyboardFrameSchema>;

// Tech specs schema
export const techSpecsSchema = z.object({
  aspectRatio: z.string(),
  resolution: z.string(),
  frameRate: z.string(),
  duration: z.string(),
  audioFormat: z.string().optional(),
  exportFormat: z.string().optional(),
  platforms: z.array(z.string()).optional()
});

export type TechSpecs = z.infer<typeof techSpecsSchema>;

// B-Roll suggestion schema with AI generation prompts
export const bRollItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  source: z.string(),
  timestamp: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  imagePrompt: z.string().optional(),
  videoPrompt: z.string().optional()
});

export type BRollItem = z.infer<typeof bRollItemSchema>;

// Caption schema (enhanced with platform-specific styling)
export const captionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  text: z.string(),
  style: z.enum(["normal", "emphasis", "question"]).optional(),
  platform: z.enum(["tiktok", "instagram", "youtube", "linkedin", "twitter"]).optional(),
  notes: z.string().optional()
});

export type Caption = z.infer<typeof captionSchema>;

// NEW: Cinematography schema (merged tech specs + storyboard)
export const cinematographyTechSpecsSchema = z.object({
  cameraVideo: z.array(z.string()),
  audio: z.array(z.string()),
  lighting: z.array(z.string()),
  platformOptimizations: z.array(z.string()),
  exportSettings: z.array(z.string())
});

export type CinematographyTechSpecs = z.infer<typeof cinematographyTechSpecsSchema>;

export const cinematographySchema = z.object({
  techSpecs: cinematographyTechSpecsSchema,
  storyboard: z.array(storyboardFrameSchema)
});

export type Cinematography = z.infer<typeof cinematographySchema>;

// NEW: Deployment Strategy schema
export const deploymentStrategySchema = z.object({
  postingSchedule: z.record(z.string(), z.object({
    bestTimes: z.array(z.string()),
    frequency: z.string(),
    peakDays: z.array(z.string())
  })),
  hashtagStrategy: z.object({
    tier1_broad: z.array(z.string()),
    tier2_niche: z.array(z.string()),
    tier3_micro: z.array(z.string()),
    recommended: z.array(z.string())
  }),
  captionCopy: z.record(z.string(), z.string()),
  engagementTactics: z.object({
    firstHour: z.array(z.string()),
    first24Hours: z.array(z.string()),
    ongoing: z.array(z.string())
  }),
  crossPromotion: z.array(z.string()),
  analyticsTracking: z.object({
    keyMetrics: z.record(z.string(), z.array(z.string())),
    successBenchmarks: z.record(z.string(), z.string())
  })
});

export type DeploymentStrategy = z.infer<typeof deploymentStrategySchema>;

// Full content output schema (NEW structure from CONTENT_GENERATION_ENGINE)
export const contentOutputSchema = z.object({
  script: z.array(scriptLineSchema),
  cinematography: cinematographySchema,
  bRoll: z.array(bRollItemSchema).optional(),
  captions: z.array(captionSchema),
  deploymentStrategy: deploymentStrategySchema.optional(),
  // Legacy fields for backward compatibility
  storyboard: z.array(storyboardFrameSchema).optional(),
  techSpecs: techSpecsSchema.optional()
});

export type ContentOutput = z.infer<typeof contentOutputSchema>;

// Agent status for thinking state
export const agentStatusSchema = z.object({
  name: z.string(),
  status: z.enum(["idle", "working", "complete"]),
  task: z.string().optional()
});

export type AgentStatus = z.infer<typeof agentStatusSchema>;

// Full project schema
export const projectSchema = z.object({
  id: z.string(),
  status: z.enum(["inputting", "hook_text", "hook_verbal", "hook_visual", "hook_overview", "generating", "complete"]),
  highestReachedStatus: z.enum(["inputting", "hook_text", "hook_verbal", "hook_visual", "hook_overview", "generating", "complete"]).optional(),
  inputs: userInputsSchema,
  visualContext: visualContextSchema.optional(),
  messages: z.array(chatMessageSchema),
  textHooks: z.array(textHookSchema).optional(),
  verbalHooks: z.array(verbalHookSchema).optional(),
  visualHooks: z.array(visualHookSchema).optional(),
  selectedHooks: selectedHooksSchema.optional(),
  hooks: z.array(hookSchema).optional(),
  selectedHook: hookSchema.optional(),
  output: contentOutputSchema.optional(),
  agents: z.array(agentStatusSchema).optional(),
  createdAt: z.number(),
  updatedAt: z.number()
});

export type Project = z.infer<typeof projectSchema>;

// API request/response types
export const sendMessageRequestSchema = z.object({
  projectId: z.string(),
  message: z.string()
});

export type SendMessageRequest = z.infer<typeof sendMessageRequestSchema>;

export const generateHooksRequestSchema = z.object({
  projectId: z.string(),
  modality: z.enum(["text", "verbal", "visual"]).optional()
});

export type GenerateHooksRequest = z.infer<typeof generateHooksRequestSchema>;

export const generateVisualHooksRequestSchema = z.object({
  projectId: z.string(),
  visualContext: visualContextSchema
});

export type GenerateVisualHooksRequest = z.infer<typeof generateVisualHooksRequestSchema>;

export const selectHookRequestSchema = z.object({
  projectId: z.string(),
  hookId: z.string(),
  modality: z.enum(["text", "verbal", "visual"])
});

export type SelectHookRequest = z.infer<typeof selectHookRequestSchema>;

// Legacy user schema for compatibility
export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string()
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// ============================================
// Firestore Document Types
// ============================================

// Session document type (replaces contentSessions table)
export type Session = {
  id: number; // For backward compatibility with existing code
  userId: string | null;
  title: string;
  status: string;
  inputs: UserInputs;
  visualContext: VisualContext | null;
  textHooks: TextHook[] | null;
  verbalHooks: VerbalHook[] | null;
  visualHooks: VisualHook[] | null;
  selectedHooks: SelectedHooks | null;
  selectedHook: Hook | null;
  output: ContentOutput | null;
  createdAt: Date;
  updatedAt: Date;
};

// Message document type (replaces sessionMessages table)
export type SessionMessage = {
  id: number; // For backward compatibility
  sessionId: number;
  role: "user" | "assistant";
  content: string;
  isEditMessage: boolean;
  timestamp: Date;
};

// Insert types for compatibility
export type InsertSession = Omit<Session, "id" | "createdAt" | "updatedAt">;
export type InsertSessionMessage = Omit<SessionMessage, "id" | "timestamp">;

// User type for Firestore
export type User = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  subscriptionTier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  isPremium: boolean;
  scriptsGenerated: number;
  usageCount: number;
  lastUsageReset?: Date;
  subscriptionEndDate?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: Date;
  updatedAt: Date;
};

// Auth schemas for Firebase
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required")
});

export const upgradeSchema = z.object({
  tier: z.enum(["bronze", "silver", "gold", "platinum", "diamond"])
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpgradeInput = z.infer<typeof upgradeSchema>;

// Subscription tiers
export const SubscriptionTier = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
  DIAMOND: "diamond"
} as const;

export type SubscriptionTierType = typeof SubscriptionTier[keyof typeof SubscriptionTier];

// Tier display info
export const TierInfo = {
  bronze: { name: "Bronze", price: 0, priceLabel: "Free", color: "#CD7F32", features: ["5 scripts/month", "Basic hooks", "Community support"] },
  silver: { name: "Silver", price: 10, priceLabel: "$10/mo", color: "#C0C0C0", features: ["25 scripts/month", "All hook types", "Email support"] },
  gold: { name: "Gold", price: 20, priceLabel: "$20/mo", color: "#FFD700", features: ["100 scripts/month", "Priority generation", "B-roll AI prompts"] },
  platinum: { name: "Platinum", price: 50, priceLabel: "$50/mo", color: "#E5E4E2", features: ["Unlimited scripts", "API access", "White-label exports"] },
  diamond: { name: "Diamond", price: 200, priceLabel: "$200 one-time", color: "#B9F2FF", features: ["Lifetime access", "All Platinum features", "Early feature access"] }
} as const;
