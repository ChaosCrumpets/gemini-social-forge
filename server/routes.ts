import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage, sessionStorage } from "./storage";
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
  getQuestionsFromCategory
} from "./gemini";
import { queryDatabase } from "./queryDatabase";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/chat", async (req, res) => {
    try {
      const { projectId, message, inputs, messages } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      const conversationHistory = (messages || []).map((msg: { role: string; content: string }) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        content: msg.content
      }));

      const response = await chat(message, conversationHistory, inputs || {});

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

  // Legacy hook generation endpoint
  app.post("/api/generate-hooks", async (req, res) => {
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

  // New modality-specific hook endpoints
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

  // New multi-hook content generation endpoint
  app.post("/api/generate-content-multi", async (req, res) => {
    try {
      const { inputs, selectedHooks } = req.body;

      if (!inputs) {
        return res.status(400).json({ error: "Inputs are required" });
      }

      if (!selectedHooks || (!selectedHooks.text && !selectedHooks.verbal && !selectedHooks.visual)) {
        return res.status(400).json({ error: "At least one selected hook is required" });
      }

      const response = await generateContentFromMultiHooks(inputs, selectedHooks);
      res.json(response);
    } catch (error) {
      console.error("Multi-hook content generation error:", error);
      res.status(500).json({ 
        error: "Failed to generate content"
      });
    }
  });

  // Legacy content generation endpoint
  app.post("/api/generate-content", async (req, res) => {
    try {
      const { projectId, inputs, selectedHook } = req.body;

      if (!inputs || !selectedHook) {
        return res.status(400).json({ error: "Inputs and selected hook are required" });
      }

      const response = await generateContent(inputs, selectedHook);

      if (projectId && response.output) {
        await storage.setOutput(projectId, response.output);
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
  app.post("/api/edit-content", async (req, res) => {
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

  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await sessionStorage.listSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Sessions list error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", async (req, res) => {
    try {
      const session = await sessionStorage.createSession();
      res.json(session);
    } catch (error) {
      console.error("Session creation error:", error);
      res.status(500).json({ error: "Failed to create session" });
    }
  });

  app.get("/api/sessions/:id", async (req, res) => {
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

  app.patch("/api/sessions/:id", async (req, res) => {
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

  return httpServer;
}
