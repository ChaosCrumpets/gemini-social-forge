import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, sessionStorage } from "./storage";
import { llmRouter } from "./lib/llm-router";
import { providers } from "./lib/llm-providers";
import {
  chat,
  generateHooks,
  generateContent,
  generateTextHooks,
  generateVerbalHooks,
  generateVisualHooks,
  generateContentFromMultiHooks,
  editContent,
  generateDiscoveryQuestions,
  getQueryDatabaseCategories,
  getQuestionsFromCategory,
  remixText
} from "./gemini";
import { queryDatabase } from "./queryDatabase";
import { verifyFirebaseToken, optionalFirebaseAuth } from "./middleware/firebase-auth";
import { requireAuth, requirePremium, requireAdmin, getUserFromRequest, incrementScriptCount, incrementUsageCount, checkUsageLimit } from "./middleware/auth-helpers";
import { ensureUserExists, requireDbUser } from "./middleware/user-provisioning";
import { auth, firestore } from "./db";
import { registerSchema, loginSchema, upgradeSchema, SubscriptionTier, TierInfo } from "@shared/schema";
import * as firestoreUtils from "./lib/firestore";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";

// DEBUG: Verify this file is loading
console.log('🔥🔥🔥 ROUTES.TS LOADING - TIMESTAMP:', new Date().toISOString());
console.log('🔥🔥🔥 optionalFirebaseAuth type:', typeof optionalFirebaseAuth);
console.log('🔥🔥🔥 verifyFirebaseToken type:', typeof verifyFirebaseToken);


export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Health monitoring
  const serverStartTime = new Date().toISOString();
  let requestCount = 0;
  console.log('\n🚀 SERVER STARTED:', serverStartTime);
  console.log('📍 Port: 5000\n');

  // Health check endpoint
  app.post('/api/health', (req: Request, res: Response) => {
    requestCount++;
    const timestamp = new Date().toISOString();
    console.log(`✅ Health check #${requestCount} - ${timestamp}`);
    res.json({
      status: 'alive',
      startTime: serverStartTime,
      requestCount,
      timestamp
    });
  });

  // ============================================
  // Global Middleware Chain
  // ============================================

  // 1. Verify Firebase token (sets req.user)
  app.use(optionalFirebaseAuth);

  // 2. Ensure Firestore user exists (sets req.dbUser)
  app.use(ensureUserExists);


  // ============================================
  // Firebase Authentication Routes
  // ============================================

  // Register new user (Firebase Auth + Firestore)
  app.post("/api/register", async (req: Request, res: Response) => {
    try {
      const parseResult = registerSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }

      const { email, password, firstName, lastName } = parseResult.data;

      // Check if user already exists in Firestore
      const existingUser = await firestoreUtils.getUser(email);
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      // Hash password for storage
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email,
        password,
        displayName: firstName && lastName ? `${firstName} ${lastName}` : firstName || email.split('@')[0],
      });

      // Create user profile in Firestore
      const newUser = await firestoreUtils.createUser({
        id: userRecord.uid,
        email,
        password: hashedPassword, // Store hashed password for legacy compatibility
        firstName,
        lastName,
      });

      // Create custom token for immediate login
      const customToken = await auth.createCustomToken(userRecord.uid);

      res.json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        role: newUser.role,
        subscriptionTier: newUser.subscriptionTier,
        isPremium: newUser.isPremium,
        customToken, // Client uses this to sign in
      });
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle Firebase Auth errors
      if (error.code === 'auth/email-already-exists') {
        return res.status(400).json({ error: "Email already registered" });
      }
      if (error.code === 'auth/invalid-password') {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      res.status(500).json({ error: "Failed to register user" });
    }
  });

  // Login user (Firebase Auth)
  app.post("/api/login", async (req: Request, res: Response) => {
    try {
      const parseResult = loginSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }

      const { email, password } = parseResult.data;

      // Find user in Firestore (we need to verify against stored hash)
      console.log(`[Login] Attempting login for: ${email}`);
      const user = await firestoreUtils.getUserByEmail(email);

      if (!user) {
        console.log(`[Login] User not found in Firestore: ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      if (!user.password) {
        console.log(`[Login] User found but has no password hash: ${email}`);
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      console.log(`[Login] Password check result for ${email}: ${isValidPassword}`);

      if (!isValidPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Create custom token for Firebase Auth
      const customToken = await auth.createCustomToken(user.id);

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.isPremium,
        customToken, // Client uses this to sign in
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout user (Firebase - client handles signOut)
  app.post("/api/logout", (req: Request, res: Response) => {
    // With Firebase, logout is handled client-side
    // This endpoint just confirms the logout request
    res.json({ success: true });
  });

  // Get current user (requires Firebase Auth token)
  app.get("/api/me", requireAuth, requireDbUser, async (req: Request, res: Response) => {
    try {
      const dbUser = (req as any).dbUser;

      res.json({
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.displayName || `${dbUser.firstName || ''} ${dbUser.lastName || ''}`.trim(),
        firstName: dbUser.firstName,
        lastName: dbUser.lastName,
        profileImageUrl: dbUser.profileImageUrl,
        role: dbUser.role,
        subscriptionTier: dbUser.subscriptionTier,
        isPremium: dbUser.isPremium,
        isAdmin: dbUser.isAdmin,
        scriptsGenerated: dbUser.scriptsGenerated,
        usageCount: dbUser.usageCount
      });
    } catch (error) {
      console.error("[/api/me] Error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // ============================================
  // Hook Generation Routes
  // ============================================

  // Generate text hooks
  app.post("/api/generate-text-hooks", requireAuth, async (req, res) => {
    try {
      const { inputs } = req.body;

      if (!inputs) {
        return res.status(400).json({ error: "Inputs are required" });
      }

      console.log('[generate-text-hooks] Generating text hooks...');
      const response = await generateTextHooks(inputs);

      res.json(response);
    } catch (error: any) {
      console.error("[generate-text-hooks] Error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate text hooks",
        textHooks: []
      });
    }
  });

  // Generate visual hooks
  app.post("/api/generate-visual-hooks", requireAuth, async (req, res) => {
    const startTime = Date.now();
    const requestId = `vhooks-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n┌─────────────────────────────────────────────────────────────`);
    console.log(`│ [VISUAL HOOKS] Request Start - ID: ${requestId}`);
    console.log(`│ Timestamp: ${new Date().toISOString()}`);
    console.log(`│ User: ${req.user?.email || 'unknown'}`);
    console.log(`└─────────────────────────────────────────────────────────────`);

    try {
      const { inputs, visualContext } = req.body;

      console.log(`[${requestId}] 📥 Request Body:`);
      console.log(`  - Inputs:`, JSON.stringify(inputs, null, 2));
      console.log(`  - Visual Context:`, JSON.stringify(visualContext, null, 2));

      if (!inputs) {
        console.log(`[${requestId}] ❌ Validation failed: Missing inputs`);
        return res.status(400).json({ error: "Inputs are required" });
      }

      console.log(`[${requestId}] ✅ Validation passed`);
      console.log(`[${requestId}] 🔄 Calling generateVisualHooks...`);

      try {
        const response = await generateVisualHooks(inputs, visualContext || {});
        const duration = Date.now() - startTime;

        console.log(`[${requestId}] ✅ API Success - Duration: ${duration}ms`);
        console.log(`[${requestId}] 📤 Response:`, JSON.stringify(response, null, 2));
        console.log(`┌─────────────────────────────────────────────────────────────`);
        console.log(`│ [VISUAL HOOKS] Request Complete - ${duration}ms`);
        console.log(`└─────────────────────────────────────────────────────────────\n`);

        res.json(response);
      } catch (apiError: any) {
        const duration = Date.now() - startTime;

        console.log(`[${requestId}] ⚠️  API Failed - Duration: ${duration}ms`);
        console.log(`[${requestId}] 📛 Error Name: ${apiError.name}`);
        console.log(`[${requestId}] 📛 Error Message: ${apiError.message}`);
        console.log(`[${requestId}] 📛 Error Stack:\n${apiError.stack}`);
        console.log(`[${requestId}] ��� Using Mock Fallback Data`);

        const mockResponse = {
          visualHooks: [
            {
              id: 'mock-visual-1',
              type: 'Dynamic Opening',
              fiyGuide: 'Start with an attention-grabbing visual that immediately hooks the viewer.',
              genAiPrompt: 'Person looking directly at camera with surprised expression, bright lighting',
              sceneDescription: 'Medium shot, person centered, warm color grading',
              rank: 1,
              isRecommended: true
            },
            {
              id: 'mock-visual-2',
              type: 'Context Setting',
              fiyGuide: 'Establish the scene and context for what\'s coming.',
              genAiPrompt: 'Workspace setup with laptop and creative materials visible',
              sceneDescription: 'Wide shot, organized desk, natural window light',
              rank: 2,
              isRecommended: false
            },
            {
              id: 'mock-visual-3',
              type: 'Action Shot',
              fiyGuide: 'Show movement and energy to maintain engagement.',
              genAiPrompt: 'Hands actively working on project, dynamic angle',
              sceneDescription: 'Close-up, shallow depth of field, energetic composition',
              rank: 3,
              isRecommended: false
            }
          ]
        };

        console.log(`[${requestId}] 📤 Mock Response:`, JSON.stringify(mockResponse, null, 2));
        console.log(`┌─────────────────────────────────────────────────────────────`);
        console.log(`│ [VISUAL HOOKS] Request Complete (Mock) - ${duration}ms`);
        console.log(`└─────────────────────────────────────────────────────────────\n`);

        res.json(mockResponse);
      }
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.log(`[${requestId}] 💥 CRITICAL ERROR - Duration: ${duration}ms`);
      console.log(`[${requestId}] 💥 Error Name: ${error.name}`);
      console.log(`[${requestId}] 💥 Error Message: ${error.message}`);
      console.log(`[${requestId}] 💥 Error Stack:\n${error.stack}`);
      console.log(`┌─────────────────────────────────────────────────────────────`);
      console.log(`│ [VISUAL HOOKS] Request Failed - ${duration}ms`);
      console.log(`└─────────────────────────────────────────────────────────────\n`);

      res.status(500).json({
        error: error.message || "Failed to generate visual hooks",
        visualHooks: []
      });
    }
  });

  // Generate verbal hooks
  app.post("/api/generate-verbal-hooks", requireAuth, async (req, res) => {
    try {
      const { inputs } = req.body;

      if (!inputs) {
        return res.status(400).json({ error: "Inputs are required" });
      }

      console.log('[generate-verbal-hooks] Generating verbal hooks...');
      const response = await generateVerbalHooks(inputs);

      res.json(response);
    } catch (error: any) {
      console.error("[generate-verbal-hooks] Error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate verbal hooks",
        verbalHooks: []
      });
    }
  });

  // Generate final content from selected hooks
  app.post("/api/generate-content-multi", requireAuth, async (req, res) => {
    const startTime = Date.now();
    const requestId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`\n┌─────────────────────────────────────────────────────────────`);
    console.log(`│ [CONTENT GENERATION] Request Start - ID: ${requestId}`);
    console.log(`│ Timestamp: ${new Date().toISOString()}`);
    console.log(`│ User: ${req.user?.email || 'unknown'}`);
    console.log(`└─────────────────────────────────────────────────────────────`);

    try {
      const { inputs, selectedTextHook, selectedVisualHook, selectedVerbalHook } = req.body;

      console.log(`[${requestId}] 📥 Request Body Inspection:`);
      console.log(`  - Inputs: ${inputs ? 'PROVIDED' : '❌ MISSING'}`);
      console.log(`  - Text Hook: ${selectedTextHook ? 'PROVIDED' : '❌ MISSING'}`);
      console.log(`  - Visual Hook: ${selectedVisualHook ? 'PROVIDED' : '❌ MISSING'}`);
      console.log(`  - Verbal Hook: ${selectedVerbalHook ? 'PROVIDED' : '❌ MISSING'}`);

      console.log(`[${requestId}] 📊 Full Request Data:`);
      console.log(JSON.stringify({ inputs, selectedTextHook, selectedVisualHook, selectedVerbalHook }, null, 2));

      if (!inputs || !selectedTextHook || !selectedVisualHook || !selectedVerbalHook) {
        console.log(`[${requestId}] ❌ Validation Failed`);
        return res.status(400).json({ error: "All hooks must be selected" });
      }

      console.log(`[${requestId}] ✅ Validation passed - Calling API...`);
      const response = await generateContentFromMultiHooks(
        inputs,
        {
          text: selectedTextHook,
          visual: selectedVisualHook,
          verbal: selectedVerbalHook
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[${requestId}] ✅ Success - ${duration}ms`);
      res.json(response);
    } catch (error: any) {
      console.error("[generate-content-multi] Error:", error);
      res.status(500).json({
        error: error.message || "Failed to generate content"
      });
    }
  });

  // Upgrade subscription tier (requires Firebase Auth)
  app.post("/api/upgrade", verifyFirebaseToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const parseResult = upgradeSchema.safeParse(req.body);
      if (!parseResult.success) {
        return res.status(400).json({ error: parseResult.error.errors[0].message });
      }

      const { tier } = parseResult.data;
      const tierData = TierInfo[tier as keyof typeof TierInfo];

      // Determine if premium based on tier
      const isPremium = tier !== "bronze";

      // Calculate subscription end date (1 year for diamond, 1 month for others)
      const subscriptionEndDate = tier === "diamond"
        ? new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000) // 100 years for lifetime
        : tier !== "bronze"
          ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 month
          : undefined;

      // Update user in Firestore
      const updatedUser = await firestoreUtils.updateUser(userId, {
        subscriptionTier: tier as any,
        isPremium,
        subscriptionEndDate: subscriptionEndDate ? Timestamp.fromDate(subscriptionEndDate) : undefined,
      });

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        role: updatedUser.role,
        subscriptionTier: updatedUser.subscriptionTier,
        isPremium: updatedUser.isPremium,
        message: `Successfully upgraded to ${tierData.name}!`
      });
    } catch (error) {
      console.error("Upgrade error:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });


  // ============================================
  // Sessions API (Projects/Content)
  // ============================================




  // --- RESTORED ROUTES ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { projectId, message, inputs, messages, discoveryComplete } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const conversationHistory = (messages || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      const response = await chat(message, conversationHistory, inputs || {}, discoveryComplete);

      if (projectId && response.extractedInputs) {
        await storage.updateInputs(projectId, response.extractedInputs as Partial<{
          topic?: string;
          goal?: "educate" | "entertain" | "promote" | "inspire" | "inform";
          platforms?: ("tiktok" | "instagram" | "youtube_shorts" | "twitter" | "linkedin")[];
          targetAudience?: string;
          tone?: string;
          duration?: string;
        }>);
      }

      res.json(response);
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({
        error: "Failed to process chat message",
        message: "I apologize, but I'm having trouble processing your message. Please try again."
      });
    }
  });

  // Legacy hook generation endpoint (Premium required)
  app.post("/api/generate-hooks", requireAuth, requirePremium, async (req, res) => {
    try {
      const { projectId, inputs } = req.body;

      if (!inputs || !inputs.topic) {
        return res.status(400).json({ error: "Topic is required to generate hooks" });
      }

      const response = await generateHooks(inputs);

      if (projectId && response.hooks) {
        await storage.setHooks(projectId, response.hooks);
      }

      res.json(response);
    } catch (error) {
      console.error("Hooks generation error:", error);
      res.status(500).json({
        error: "Failed to generate hooks",
        hooks: []
      });
    }
  });

  // New modality-specific hook endpoints (Premium required)
  app.post("/api/generate-text-hooks", requireAuth, requirePremium, async (req, res) => {
    try {
      const { inputs } = req.body;

      if (!inputs || !inputs.topic) {
        return res.status(400).json({ error: "Topic is required to generate text hooks" });
      }

      const response = await generateTextHooks(inputs);
      res.json(response);
    } catch (error) {
      console.error("Text hooks generation error:", error);
      res.status(500).json({
        error: "Failed to generate text hooks",
        textHooks: []
      });
    }
  });

  app.post("/api/generate-verbal-hooks", requireAuth, requirePremium, async (req, res) => {
    try {
      const { inputs } = req.body;

      if (!inputs || !inputs.topic) {
        return res.status(400).json({ error: "Topic is required to generate verbal hooks" });
      }

      const response = await generateVerbalHooks(inputs);
      res.json(response);
    } catch (error) {
      console.error("Verbal hooks generation error:", error);
      res.status(500).json({
        error: "Failed to generate verbal hooks",
        verbalHooks: []
      });
    }
  });

  app.post("/api/generate-visual-hooks", requireAuth, requirePremium, async (req, res) => {
    try {
      const { inputs, visualContext } = req.body;

      if (!inputs || !inputs.topic) {
        return res.status(400).json({ error: "Topic is required to generate visual hooks" });
      }

      if (!visualContext) {
        return res.status(400).json({ error: "Visual context is required for visual hooks" });
      }

      const response = await generateVisualHooks(inputs, visualContext);
      res.json(response);
    } catch (error) {
      console.error("Visual hooks generation error:", error);
      res.status(500).json({
        error: "Failed to generate visual hooks",
        visualHooks: []
      });
    }
  });

  // New multi-hook content generation endpoint (Premium required)
  app.post("/api/generate-content-multi", requireAuth, requirePremium, async (req, res) => {
    try {
      const { inputs, selectedHooks } = req.body;

      if (!inputs) {
        return res.status(400).json({ error: "Inputs are required" });
      }

      if (!selectedHooks || (!selectedHooks.text && !selectedHooks.verbal && !selectedHooks.visual)) {
        return res.status(400).json({ error: "At least one selected hook is required" });
      }

      const response = await generateContentFromMultiHooks(inputs, selectedHooks);

      // Increment script count for Bronze users using their free script
      if ((req as any).isFreeScript && (req as any).dbUser?.id) {
        await incrementScriptCount((req as any).dbUser.id);
      }

      res.json(response);
    } catch (error) {
      console.error("Multi-hook content generation error:", error);
      res.status(500).json({
        error: "Failed to generate content"
      });
    }
  });

  // Legacy content generation endpoint (Premium required)
  app.post("/api/generate-content", requireAuth, requirePremium, async (req, res) => {
    try {
      const { projectId, inputs, selectedHook } = req.body;

      if (!inputs || !selectedHook) {
        return res.status(400).json({ error: "Inputs and selected hook are required" });
      }

      const response = await generateContent(inputs, selectedHook);

      if (projectId && response.output) {
        await storage.setOutput(projectId, response.output);
      }

      // Increment script count for Bronze users using their free script
      if ((req as any).isFreeScript && (req as any).dbUser?.id) {
        await incrementScriptCount((req as any).dbUser.id);
      }

      res.json(response);
    } catch (error) {
      console.error("Content generation error:", error);
      res.status(500).json({
        error: "Failed to generate content"
      });
    }
  });

  // Edit content output via chat
  app.post("/api/edit-content", requireAuth, requirePremium, async (req, res) => {
    try {
      const { message, currentOutput, messages } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      if (!currentOutput) {
        return res.status(400).json({ error: "Current output is required" });
      }

      const conversationHistory = (messages || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      const response = await editContent(message, currentOutput, conversationHistory);

      res.json(response);
    } catch (error) {
      console.error("Edit content error:", error);
      res.status(500).json({
        error: "Failed to edit content",
        message: "I apologize, but I'm having trouble processing your edit request. Please try again."
      });
    }
  });

  // Remix selected text fragment (with usage limits)
  app.post("/api/remix", requireAuth, checkUsageLimit, async (req, res) => {
    try {
      const { selectedText, instruction, context } = req.body;

      if (!selectedText || !instruction) {
        return res.status(400).json({ error: "Selected text and instruction are required" });
      }

      const response = await remixText(selectedText, instruction, context);

      // Increment usage count after successful remix
      if ((req as any).dbUser?.id) {
        await incrementUsageCount((req as any).dbUser.id);
      }

      res.json(response);
    } catch (error) {
      console.error("Remix error:", error);
      res.status(500).json({
        error: "Failed to remix text",
        remixedText: null
      });
    }
  });

  // ============================================
  // Query Database API Endpoints
  // ============================================

  app.get("/api/query-database", (req, res) => {
    try {
      res.json(queryDatabase);
    } catch (error) {
      console.error("Query database error:", error);
      res.status(500).json({ error: "Failed to fetch query database" });
    }
  });

  app.get("/api/query-database/categories", (req, res) => {
    try {
      const categories = getQueryDatabaseCategories();
      res.json(categories);
    } catch (error) {
      console.error("Query categories error:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/query-database/:categoryId", (req, res) => {
    try {
      const { categoryId } = req.params;
      const count = parseInt(req.query.count as string) || 5;
      const questions = getQuestionsFromCategory(categoryId, count);

      if (questions.length === 0) {
        return res.status(404).json({ error: "Category not found" });
      }

      res.json({ categoryId, questions });
    } catch (error) {
      console.error("Query questions error:", error);
      res.status(500).json({ error: "Failed to fetch questions" });
    }
  });

  app.post("/api/generate-discovery-questions", optionalFirebaseAuth, requireAuth, async (req, res) => {
    try {
      const { topic, intent } = req.body;

      if (!topic) {
        return res.status(400).json({ error: "Topic is required" });
      }

      const response = await generateDiscoveryQuestions(topic, intent);
      res.json(response);
    } catch (error) {
      console.error("Discovery questions error:", error);
      res.status(500).json({
        error: "Failed to generate discovery questions",
        questions: []
      });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const project = await storage.createProject();
      res.json(project);
    } catch (error) {
      console.error("Project creation error:", error);
      res.status(500).json({ error: "Failed to create project" });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const project = await storage.getProject(req.params.id);
      if (!project) {
        return res.status(404).json({ error: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Project fetch error:", error);
      res.status(500).json({ error: "Failed to fetch project" });
    }
  });

  // ============================================

  // ============================================
  // Session API Endpoints (SQLite + Optional Auth)
  // ============================================

  app.get("/api/sessions", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      console.log('[Sessions List] Fetching sessions for user:', userId);
      const sessions = await sessionStorage.listSessions(userId);
      console.log('[Sessions List] Found', sessions.length, 'sessions');
      res.json(sessions);
    } catch (error) {
      console.error("Sessions list error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", verifyFirebaseToken, async (req, res) => {
    try {
      const userId = req.user?.uid;

      if (!userId) {
        return res.status(401).json({ error: 'Authentication required to create session' });
      }

      const session = await sessionStorage.createSession(userId);
      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      const sessionData = await sessionStorage.getSessionWithMessages(id);
      if (!sessionData) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(sessionData);
    } catch (error) {
      console.error("Session fetch error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  app.patch("/api/sessions/:id", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      const session = await sessionStorage.updateSession(id, req.body);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Session update error:", error);
      res.status(500).json({ error: "Failed to update session" });
    }
  });

  // POST /api/sessions/:id/messages - Add single message (ENTERPRISE: Phase 1)
  app.post("/api/sessions/:id/messages", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const { role, content, isEditMessage } = req.body;

      if (!role || !content) {
        return res.status(400).json({ error: "Role and content required" });
      }

      const message = await sessionStorage.addMessage(id, role, content, isEditMessage || false);

      if (!message) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.status(201).json(message);
    } catch (error) {
      console.error("Add message error:", error);
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  app.patch("/api/sessions/:id/title", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }
      const session = await sessionStorage.updateSessionTitle(id, title);
      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Session title update error:", error);
      res.status(500).json({ error: "Failed to update session title" });
    }
  });

  app.delete("/api/sessions/:id", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      const deleted = await sessionStorage.deleteSession(id);
      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Session delete error:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  app.post("/api/sessions/:id/messages", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const { role, content } = req.body;
      if (!role || !content) {
        return res.status(400).json({ error: "Role and content required" });
      }

      const userId = req.user?.uid || "anonymous";
      const message = await sessionStorage.addMessage(id, userId, role, content, false);
      res.json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });


  // Admin Routes (Protected by adminRequired)
  // ============================================

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await db.select().from(users);
      res.json(allUsers);
    } catch (error) {
      console.error("Admin users fetch error:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.patch("/api/admin/users/:id/premium", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { isPremium } = req.body;

      const [updatedUser] = await db.update(users)
        .set({
          isPremium: isPremium,
          subscriptionEndDate: isPremium ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) : null,
          updatedAt: new Date()
        })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Admin toggle premium error:", error);
      res.status(500).json({ error: "Failed to update user premium status" });
    }
  });

  app.patch("/api/admin/users/:id/role", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (role !== "user" && role !== "admin") {
        return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
      }

      const [updatedUser] = await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, id))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error("Admin toggle role error:", error);
      res.status(500).json({ error: "Failed to update user role" });
    }
  });

  // ============================================
  // Stripe Payment Routes
  // ============================================

  app.post("/api/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const user = await getUserFromSession(req);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeKey) {
        return res.status(500).json({ error: "Stripe not configured" });
      }

      const stripe = await import("stripe").then(m => new m.default(stripeKey));

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: user.email || undefined,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: "C.A.L. Premium",
                description: "Unlimited content generation with all features"
              },
              unit_amount: 1999,
              recurring: {
                interval: "month"
              }
            },
            quantity: 1
          }
        ],
        success_url: `${req.protocol}://${req.get("host")}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/upgrade`,
        metadata: {
          userId: user.id
        }
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Checkout session error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/webhook/stripe", async (req, res) => {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!stripeKey) {
      return res.status(500).json({ error: "Stripe not configured" });
    }

    try {
      const stripe = await import("stripe").then(m => new m.default(stripeKey));

      let event;

      if (webhookSecret) {
        const sig = req.headers["stripe-signature"] as string;
        event = stripe.webhooks.constructEvent(req.rawBody as Buffer, sig, webhookSecret);
      } else {
        event = req.body;
      }

      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId = session.metadata?.userId;

        if (userId) {
          await db.update(users)
            .set({
              isPremium: true,
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              updatedAt: new Date()
            })
            .where(eq(users.id, userId));
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        await db.update(users)
          .set({
            isPremium: false,
            subscriptionEndDate: null,
            updatedAt: new Date()
          })
          .where(eq(users.stripeCustomerId, customerId));
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Webhook error:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  });

  app.get("/api/upgrade/success", requireAuth, async (req, res) => {
    try {
      const { session_id } = req.query;
      const stripeKey = process.env.STRIPE_SECRET_KEY;

      if (!stripeKey || !session_id) {
        return res.redirect("/");
      }

      const stripe = await import("stripe").then(m => new m.default(stripeKey));
      const session = await stripe.checkout.sessions.retrieve(session_id as string);

      if (session.payment_status === "paid" && session.metadata?.userId) {
        await firestoreUtils.updateUser(session.metadata.userId, {
          isPremium: true,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        });
      }

      res.redirect("/");
    } catch (error) {
      console.error("Upgrade success error:", error);
      res.redirect("/");
    }
  });

  // Debug: Get LLM Router stats
  app.get("/api/debug/llm-stats", (_req, res) => {
    res.json(llmRouter.getStats());
  });

  return httpServer;
}
