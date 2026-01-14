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
import { requireAuth, requirePremium, requireAdmin, getUserFromRequest, incrementScriptCount, incrementUsageCount, checkUsageLimit, requireScriptQuota, canGenerateScript } from "./middleware/auth-helpers";
import { ensureUserExists, requireDbUser } from "./middleware/user-provisioning";
import { debugLog, debugError } from "./lib/debug-logger";
import { auth, firestore } from "./db";
import { registerSchema, loginSchema, upgradeSchema, SubscriptionTier, TierInfo } from "@shared/schema";
import * as firestoreUtils from "./lib/firestore";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";

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
  // DIAGNOSTIC MIDDLEWARE - TRACK ALL REQUESTS
  // ============================================

  // Log every incoming request
  app.use((req, res, next) => {
    debugLog('INCOMING REQUEST', {
      method: req.method,
      path: req.path,
      headers: {
        authorization: req.headers.authorization?.substring(0, 50) + '...',
        contentType: req.headers['content-type']
      },
      bodyPreview: req.body ? Object.keys(req.body) : 'no body'
    });
    next();
  });

  // Track middleware execution
  app.use((req, res, next) => {
    const startTime = Date.now();
    res.on('finish', () => {
      debugLog('REQUEST COMPLETE', {
        path: req.path,
        status: res.statusCode,
        duration: `${Date.now() - startTime}ms`
      });
    });
    next();
  });

  // ============================================
  // END DIAGNOSTIC MIDDLEWARE
  // ============================================



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
  app.get("/api/me", optionalFirebaseAuth, async (req: Request, res: Response) => {
    try {
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await firestoreUtils.getUser(userId);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        isPremium: user.isPremium
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Get user quota information
  app.get("/api/user/quota", requireAuth, ensureUserExists, requireDbUser, async (req: Request, res: Response) => {
    try {
      const dbUser = (req as any).dbUser;
      const quota = await canGenerateScript(dbUser);

      res.json({
        currentTier: dbUser.subscriptionTier,
        scriptsGenerated: dbUser.scriptsGenerated,
        scriptsRemaining: quota.scriptsRemaining || 0,
        resetDate: quota.resetDate?.toISOString(),
        allowed: quota.allowed
      });
    } catch (error) {
      console.error("[QuotaCheck] Error:", error);
      res.status(500).json({ error: "Failed to fetch quota" });
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

  // Create new session
  app.post('/api/sessions', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      const { title = 'New Project', ...otherData } = req.body;

      // Generate unique numeric ID
      const sessionId = Date.now();

      const newSession = {
        id: sessionId,
        userId: req.user.uid,
        title,
        status: otherData.status || 'inputting',
        inputs: otherData.inputs || {},
        visualContext: otherData.visualContext || null,
        textHooks: otherData.textHooks || null,
        verbalHooks: otherData.verbalHooks || null,
        visualHooks: otherData.visualHooks || null,
        selectedHooks: otherData.selectedHooks || null,
        selectedHook: otherData.selectedHook || null,
        output: otherData.output || null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      await firestore.collection('sessions').doc(sessionId.toString()).set(newSession);

      console.log(`[API] Created session ${sessionId} for user ${req.user.uid}`);
      res.json(newSession);
    } catch (error) {
      console.error('[API] Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });

  // List all sessions for current user
  app.get('/api/sessions', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      const snapshot = await firestore
        .collection('sessions')
        .where('userId', '==', req.user.uid)
        .limit(50)
        .get();

      const sessions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: parseInt(doc.id),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.() || doc.data().updatedAt
      }));

      res.json(sessions);
    } catch (error) {
      console.error('[API] List sessions error:', error);
      console.error('[API] Error details:', JSON.stringify(error, null, 2));
      console.error('[API] Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('[API] Error stack:', error instanceof Error ? error.stack : 'No stack');

      // Return empty array instead of 500 to allow app to function
      console.log('[API] Returning empty sessions array as fallback');
      res.json([]);
    }
  });

  // Create new session
  app.post('/api/sessions', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      console.log(`[API] Creating new session for user ${req.user.uid}`);

      const session = await sessionStorage.createSession(req.user.uid);

      console.log(`[API] Session created successfully: ${session.id}`);

      res.json({
        ...session,
        createdAt: session.createdAt instanceof Date ? session.createdAt : new Date(session.createdAt),
        updatedAt: session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt)
      });
    } catch (error) {
      console.error('[API] Create session error:', error);
      res.status(500).json({ error: 'Failed to create session' });
    }
  });


  // Get single session by ID
  app.get('/api/sessions/:id', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      const sessionId = req.params.id;
      const docRef = firestore.collection('sessions').doc(sessionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = doc.data();
      if (session?.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json({
        ...session,
        id: parseInt(sessionId),
        createdAt: session.createdAt?.toDate?.() || session.createdAt,
        updatedAt: session.updatedAt?.toDate() || session.updatedAt
      });
    } catch (error) {
      console.error('[API] Get session error:', error);
      res.status(500).json({ error: 'Failed to get session' });
    }
  });

  // Update session data
  app.patch('/api/sessions/:id', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists in Firestore
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      const sessionId = req.params.id;
      console.log(`[API] Updating session ${sessionId} for user ${req.user.uid}`);

      const docRef = firestore.collection('sessions').doc(sessionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        console.log(`[API] Session ${sessionId} not found`);
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = doc.data();
      if (session?.userId !== req.user.uid) {
        console.log(`[API] Session ${sessionId} forbidden for user ${req.user.uid}`);
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Filter valid update fields and sanitize
      const updates = {
        ...req.body,
        updatedAt: Timestamp.now()
      };
      delete updates.id;
      delete updates.userId;
      delete updates.createdAt;

      // Log the update for debugging
      console.log(`[API] Session ${sessionId} update fields:`, Object.keys(updates).filter(k => k !== 'updatedAt'));

      await docRef.update(updates);

      const updated = await docRef.get();
      const updatedData = updated.data();

      console.log(`[API] Session ${sessionId} updated successfully`);

      res.json({
        ...updatedData,
        id: parseInt(sessionId),
        createdAt: updatedData?.createdAt?.toDate?.() || updatedData?.createdAt,
        updatedAt: updatedData?.updatedAt?.toDate?.() || updatedData?.updatedAt
      });
    } catch (error: any) {
      console.error('[API] Update session error:', error);
      console.error('[API] Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack?.split('\n').slice(0, 3)
      });

      // More specific error messages
      if (error.code === 'permission-denied') {
        return res.status(403).json({ error: 'Permission denied' });
      }
      if (error.message?.includes('document size')) {
        return res.status(413).json({ error: 'Update too large - try with smaller data' });
      }

      res.status(500).json({ error: 'Failed to update session', details: error.message });
    }
  });

  // Delete session
  app.delete('/api/sessions/:id', verifyFirebaseToken, requireAuth, ensureUserExists, async (req: Request, res: Response) => {
    try {
      // Use req.user directly - ensureUserExists guarantees user exists
      if (!req.user?.uid) return res.status(401).json({ error: 'Unauthorized' });

      const sessionId = req.params.id;
      const docRef = firestore.collection('sessions').doc(sessionId);
      const doc = await docRef.get();

      if (!doc.exists) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const session = doc.data();
      if (session?.userId !== req.user.uid) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Also delete associated messages and versions subcollections
      const messagesSnapshot = await docRef.collection('messages').get();
      const versionsSnapshot = await docRef.collection('versions').get();

      const batch = firestore.batch();
      messagesSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      versionsSnapshot.docs.forEach(doc => batch.delete(doc.ref));
      batch.delete(docRef);

      await batch.commit();

      console.log(`[API] Deleted session ${sessionId} for user ${req.user.uid}`);
      res.json({ success: true });
    } catch (error) {
      console.error('[API] Delete session error:', error);
      res.status(500).json({ error: 'Failed to delete session' });
    }
  });

  // ============================================
  // Session Messages Endpoint
  // ============================================

  // Add message to session
  app.post(
    "/api/sessions/:id/messages",
    verifyFirebaseToken,
    requireAuth,
    async (req: Request, res: Response) => {
      try {
        const sessionId = parseInt(req.params.id, 10);
        const { role, content, isEditMessage } = req.body;
        const userId = req.user!.uid;

        console.log(`[API] Adding message to session ${sessionId}:`, {
          role,
          contentLength: content?.length,
          isEditMessage,
          userId,
        });

        // Validate session ID
        if (isNaN(sessionId)) {
          return res.status(400).json({ error: "Invalid session ID" });
        }

        // Validate required fields
        if (!role || !content) {
          return res.status(400).json({ error: "Missing role or content" });
        }

        // Validate role value
        if (!["user", "assistant"].includes(role)) {
          return res.status(400).json({ error: "Invalid role. Must be 'user' or 'assistant'" });
        }

        // Verify session exists and user owns it
        const session = await sessionStorage.getSession(sessionId);
        if (!session) {
          console.error(`[API] Session ${sessionId} not found`);
          return res.status(404).json({ error: "Session not found" });
        }

        if (session.userId !== userId) {
          console.error(`[API] User ${userId} does not own session ${sessionId} (owner: ${session.userId})`);
          return res.status(403).json({ error: "Access denied to this session" });
        }

        // Add message to session via sessionStorage
        const message = await sessionStorage.addMessage(
          sessionId,
          userId,
          role,
          content,
          isEditMessage || false
        );

        console.log(`[API] Message added successfully to session ${sessionId}`);
        res.json(message);
      } catch (error: any) {
        console.error("[API] Error adding message to session:", {
          message: error.message,
          stack: error.stack,
          sessionId: req.params.id,
        });
        res.status(500).json({ error: "Failed to add message to session" });
      }
    }
  );


  // Get tier info
  app.get("/api/tiers", (_req: Request, res: Response) => {
    res.json(TierInfo);
  });

  // DEBUG ENDPOINT - Last Error
  let lastError: any = null;
  app.get("/api/debug/last-error", (_req: Request, res: Response) => {
    res.json({
      lastError: lastError ? {
        message: lastError.message,
        stack: lastError.stack,
        name: lastError.name,
        timestamp: lastError.timestamp
      } : null
    });
  });

  // DEVELOPMENT ONLY: Create admin user endpoint
  if (process.env.NODE_ENV !== "production") {
    app.get("/api/dev/create-admin", async (req: Request, res: Response) => {
      try {
        const adminEmail = "admin@test.com";
        const adminPassword = "admin123";

        let userRecord;
        try {
          userRecord = await auth.getUserByEmail(adminEmail);
        } catch (error: any) {
          if (error.code === 'auth/user-not-found') {
            userRecord = await auth.createUser({
              email: adminEmail,
              password: adminPassword,
              displayName: "Admin User",
            });
          } else {
            throw error;
          }
        }

        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        await firestore.collection("users").doc(userRecord.uid).set({
          id: userRecord.uid,
          email: adminEmail,
          password: hashedPassword,
          firstName: "Admin",
          lastName: "User",
          role: "admin",
          subscriptionTier: "diamond",
          isPremium: true,
          scriptsGenerated: 0,
          usageCount: 0,
          lastUsageReset: Timestamp.now(),
          subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }, { merge: true });

        const customToken = await auth.createCustomToken(userRecord.uid);

        res.json({
          success: true,
          message: "Admin user created successfully!",
          credentials: {
            email: adminEmail,
            password: adminPassword,
          },
          user: {
            uid: userRecord.uid,
            email: adminEmail,
            role: "admin",
            tier: "diamond"
          }
        });
      } catch (error) {
        console.error("Error creating admin user:", error);
        res.status(500).json({ error: "Failed to create admin user", details: error });
      }
    });
  }

  app.post("/api/chat", verifyFirebaseToken, requireAuth, async (req, res) => {
    try {
      // ✅ CHANGED: Accept sessionId instead of projectId
      const { sessionId, projectId, message, inputs, messages, discoveryComplete } = req.body;
      const userId = req.user!.uid;

      // Support both sessionId (new) and projectId (backward compat)
      const actualSessionId = sessionId || projectId;

      console.log(`[Chat] Processing message for session ${actualSessionId}. History size: ${messages?.length || 0}`);

      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      // ✅ REMOVED SESSION VALIDATION - IT WAS BREAKING CHAT
      // The working version (commit 78ae240) did not have this validation

      // ✅ UNCHANGED: Use existing chat() function from gemini.ts
      const conversationHistory = (messages || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      // ✅ SAVE USER MESSAGE
      if (actualSessionId && typeof actualSessionId === 'number') {
        try {
          await sessionStorage.addMessage(actualSessionId, userId, 'user', message, false);
        } catch (msgError) {
          console.error(`[Chat] Failed to save user message:`, msgError);
          // Continue execution (don't fail generation if save fails, though ideally we should)
        }
      }

      const response = await chat(message, conversationHistory, inputs || {}, discoveryComplete);

      // ✅ SAVE ASSISTANT MESSAGE
      if (actualSessionId && typeof actualSessionId === 'number' && response.message) {
        try {
          await sessionStorage.addMessage(actualSessionId, userId, 'assistant', response.message, false);
        } catch (msgError) {
          console.error(`[Chat] Failed to save assistant message:`, msgError);
        }
      }

      // ✅ FIXED: Update SESSION storage instead of legacy project storage
      if (actualSessionId && typeof actualSessionId === 'number' && response.extractedInputs) {
        console.log(`[Chat] Updating session ${actualSessionId} inputs:`, response.extractedInputs);

        try {
          // Merge with existing inputs
          const mergedInputs = { ...inputs, ...response.extractedInputs };

          await sessionStorage.updateSession(actualSessionId, {
            inputs: mergedInputs,
          });

          console.log(`[Chat] Session ${actualSessionId} inputs updated successfully`);
        } catch (updateError: any) {
          console.error(`[Chat] Failed to update session inputs:`, {
            sessionId: actualSessionId,
            error: updateError.message,
          });
          // Don't fail the whole request if session update fails
        }
      }

      res.json(response);
    } catch (error: any) {
      // Store for debug endpoint
      lastError = { ...error, timestamp: new Date().toISOString() };

      console.error("❌ Chat error (FULL DETAILS):", {
        message: error.message,
        stack: error.stack,
        name: error.name,
        sessionId: req.body.sessionId || req.body.projectId,
      });

      res.status(500).json({
        error: "Failed to process chat message",
        message: "I apologize, but I'm having trouble processing your message. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
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

  // New modality-specific hook endpoints (Requires auth, premium gating happens after first free use)
  app.post("/api/generate-text-hooks", async (req, res) => {
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

  app.post("/api/generate-verbal-hooks", async (req, res) => {
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

  app.post("/api/generate-visual-hooks", async (req, res) => {
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

  // New multi-hook content generation endpoint (Quota-based)
  app.post("/api/generate-content-multi", verifyFirebaseToken, requireAuth, ensureUserExists, requireDbUser, requireScriptQuota, async (req, res) => {
    debugLog('ENDPOINT: generate-content-multi - START', {
      hasUser: !!req.user,
      userId: req.user?.uid,
      hasDbUser: !!(req as any).dbUser,
      hasQuota: !!(req as any).quota,
      bodyKeys: req.body ? Object.keys(req.body) : []
    });

    try {
      const { inputs, selectedHooks } = req.body;

      // Validation
      if (!inputs) {
        debugError('ENDPOINT: Missing inputs', { bodyKeys: Object.keys(req.body) });
        return res.status(400).json({ error: "Inputs are required" });
      }

      if (!selectedHooks || (!selectedHooks.text && !selectedHooks.verbal && !selectedHooks.visual)) {
        debugError('ENDPOINT: Missing selectedHooks', {
          hasSelectedHooks: !!selectedHooks,
          selectedHooksKeys: selectedHooks ? Object.keys(selectedHooks) : []
        });
        return res.status(400).json({ error: "At least one selected hook is required" });
      }

      debugLog('ENDPOINT: Validated request body', {
        topic: inputs.topic,
        platforms: inputs.platforms,
        targetAudience: inputs.targetAudience,
        selectedHooksKeys: Object.keys(selectedHooks)
      });

      debugLog('ENDPOINT: Calling generateContentFromMultiHooks', {
        functionExists: typeof generateContentFromMultiHooks === 'function'
      });

      const response = await generateContentFromMultiHooks(inputs, selectedHooks);

      debugLog('ENDPOINT: Content generated successfully', {
        hasResponse: !!response,
        responseKeys: response ? Object.keys(response) : []
      });

      // Increment script count (requireAuth guarantees req.user exists)
      if (req.user?.uid) {
        await incrementScriptCount(req.user.uid);
        debugLog('ENDPOINT: Script count incremented', { uid: req.user.uid });
      }

      const quota = (req as any).quota;

      // response already has { output: ContentOutput }, just add scriptsRemaining
      const finalResponse = {
        ...response,
        scriptsRemaining: Math.max(0, (quota?.scriptsRemaining || 1) - 1)
      };

      debugLog('ENDPOINT: Sending success response', {
        hasOutput: !!finalResponse.output,
        scriptsRemaining: finalResponse.scriptsRemaining
      });

      res.json(finalResponse);
    } catch (error: any) {
      debugError('ENDPOINT: generate-content-multi - EXCEPTION', error);
      res.status(500).json({
        error: error.message || "Content generation failed",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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
  app.post("/api/edit-content", verifyFirebaseToken, requireAuth, ensureUserExists, async (req, res) => {
    try {
      const { message, currentOutput, messages } = req.body;

      console.log('[EditContent] Request received:', {
        hasMessage: !!message,
        hasCurrentOutput: !!currentOutput,
        messageLength: messages?.length || 0
      });
      console.log('[EDIT] Edit instruction:', message);
      console.log('[EDIT] Current script last line:', currentOutput?.script?.[currentOutput?.script?.length - 1]);

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

      console.log('[EditContent] Calling editContent function');
      const response = await editContent(message, currentOutput, conversationHistory);

      console.log('[EditContent] Success:', { hasUpdatedOutput: !!response.updatedOutput });
      console.log('[EDIT] Updated script last line:', response.updatedOutput?.script?.[response.updatedOutput?.script?.length - 1]);
      res.json(response);

    } catch (error: any) {
      console.error("[EditContent] Error:", error);
      console.error("[EditContent] Stack:", error.stack);
      res.status(500).json({
        error: "Failed to edit content",
        message: error.message || "I apologize, but I'm having trouble processing your edit request. Please try again.",
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
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

  app.post("/api/generate-discovery-questions", async (req, res) => {
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
  // Session API Endpoints (Database-backed)
  // ============================================

  app.get("/api/sessions", optionalFirebaseAuth, async (req, res) => {
    try {
      const userId = req.user?.uid;
      const sessions = await sessionStorage.listSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Sessions list error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", optionalFirebaseAuth, async (req, res) => {
    try {
      const userId = req.user?.uid; // Optional - sessions can be created without auth
      const session = await sessionStorage.createSession(userId || undefined);
      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('[GET /api/sessions/:id] Request received for session:', id);

      if (isNaN(id)) {
        console.log('[GET /api/sessions/:id] Invalid session ID:', req.params.id);
        return res.status(400).json({ error: "Invalid session ID" });
      }

      console.log('[GET /api/sessions/:id] Calling getSessionWithMessages...');
      const sessionData = await sessionStorage.getSessionWithMessages(id);

      if (!sessionData) {
        console.log('[GET /api/sessions/:id] Session not found');
        return res.status(404).json({ error: "Session not found" });
      }

      // CRITICAL: Log exactly what we got from storage
      console.log('[GET /api/sessions/:id] Raw data from storage:', {
        type: typeof sessionData,
        isArray: Array.isArray(sessionData),
        keys: Object.keys(sessionData || {}),
        hasSession: 'session' in (sessionData || {}),
        hasMessages: 'messages' in (sessionData || {}),
        hasEditMessages: 'editMessages' in (sessionData || {})
      });

      console.log('[GET /api/sessions/:id] Session property type:', typeof sessionData?.session);
      console.log('[GET /api/sessions/:id] Messages property type:', typeof sessionData?.messages);

      // Log the structure
      if (sessionData.session) {
        console.log('[GET /api/sessions/:id] ✅ Has session wrapper');
        console.log('[GET /api/sessions/:id] Session ID:', sessionData.session?.id);
        console.log('[GET /api/sessions/:id] Messages count:', sessionData.messages?.length);
        console.log('[GET /api/sessions/:id] Edit messages count:', sessionData.editMessages?.length);
      } else {
        console.log('[GET /api/sessions/:id] ❌ NO session wrapper - data is flat!');
        console.log('[GET /api/sessions/:id] Direct ID:', (sessionData as any)?.id);
      }

      console.log('[GET /api/sessions/:id] Sending response...');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      res.json(sessionData);
    } catch (error) {
      console.error("[GET /api/sessions/:id] Error:", error);
      res.status(500).json({ error: "Failed to fetch session" });
    }
  });

  // POST message to session
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

  // GET messages for session
  app.get("/api/sessions/:id/messages", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const sessionWithMessages = await sessionStorage.getSessionWithMessages(id);
      if (!sessionWithMessages) {
        // Return empty array if session valid but no messages found logic inside getSessionWithMessages handles undefined
        // Actually getSessionWithMessages returns undefined if session not found.
        return res.status(404).json({ error: "Session not found" });
      }

      res.json(sessionWithMessages.messages);
    } catch (error) {
      console.error("Messages fetch error:", error);
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // POST version to session
  app.post("/api/sessions/:id/versions", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      // Allow minimal validation since frontend handles structure, but basic check is good
      if (!req.body.contentOutput) {
        return res.status(400).json({ error: "Content output required" });
      }

      const version = await sessionStorage.addVersion(id, req.body);
      res.json(version);
    } catch (error) {
      console.error("Version creation error:", error);
      res.status(500).json({ error: "Failed to create version" });
    }
  });

  // GET versions for session
  app.get("/api/sessions/:id/versions", optionalFirebaseAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }

      const versions = await sessionStorage.getVersions(id);
      res.json(versions);
    } catch (error) {
      console.error("Versions fetch error:", error);
      res.status(500).json({ error: "Failed to fetch versions" });
    }
  });

  app.patch("/api/sessions/:id", verifyFirebaseToken, requireAuth, ensureUserExists, async (req, res) => {
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

  app.patch("/api/sessions/:id/title", async (req, res) => {
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

  app.post("/api/sessions/:id/messages", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { role, content, isEditMessage } = req.body;
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid session ID" });
      }
      if (!role || !content) {
        return res.status(400).json({ error: "Role and content are required" });
      }
      const message = await sessionStorage.addMessage(id, role, content, isEditMessage || false);
      res.json(message);
    } catch (error) {
      console.error("Message creation error:", error);
      res.status(500).json({ error: "Failed to add message" });
    }
  });

  app.delete("/api/sessions/:id", async (req, res) => {
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

  // ============================================
  // Admin Routes (Protected by adminRequired)
  // ============================================

  app.get("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const allUsers = await firestoreUtils.getAllUsers();
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

      const updatedUser = await firestoreUtils.updateUser(id, {
        isPremium: isPremium,
        subscriptionEndDate: isPremium ? Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)) : undefined,
      });

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

      const updatedUser = await firestoreUtils.updateUser(id, { role });

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
      const userId = req.user?.uid;
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const user = await firestoreUtils.getUser(userId);
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
          await firestoreUtils.updateUser(userId, {
            isPremium: true,
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: session.subscription as string,
            subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          });
        }
      } else if (event.type === "customer.subscription.deleted") {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        const user = await firestoreUtils.getUserByStripeCustomerId(customerId);
        if (user) {
          await firestoreUtils.updateUser(user.id, {
            isPremium: false,
            subscriptionEndDate: undefined,
          });
        }
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
