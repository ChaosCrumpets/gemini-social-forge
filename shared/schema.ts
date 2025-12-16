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
  duration: z.string().optional()
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

// Script line schema
export const scriptLineSchema = z.object({
  lineNumber: z.number(),
  speaker: z.string().optional(),
  text: z.string(),
  timing: z.string().optional(),
  notes: z.string().optional()
});

export type ScriptLine = z.infer<typeof scriptLineSchema>;

// Storyboard frame schema
export const storyboardFrameSchema = z.object({
  frameNumber: z.number(),
  shotType: z.string(),
  description: z.string(),
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

// B-Roll suggestion schema
export const bRollItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  source: z.string(),
  timestamp: z.string().optional(),
  keywords: z.array(z.string()).optional()
});

export type BRollItem = z.infer<typeof bRollItemSchema>;

// Caption schema
export const captionSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  text: z.string(),
  style: z.string().optional()
});

export type Caption = z.infer<typeof captionSchema>;

// Full content output schema (the 5-panel output)
export const contentOutputSchema = z.object({
  script: z.array(scriptLineSchema),
  storyboard: z.array(storyboardFrameSchema),
  techSpecs: techSpecsSchema,
  bRoll: z.array(bRollItemSchema),
  captions: z.array(captionSchema)
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

export type User = {
  id: string;
  username: string;
  password: string;
};
