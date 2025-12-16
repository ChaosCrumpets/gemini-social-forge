import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  chat, 
  generateHooks, 
  generateContent,
  generateTextHooks,
  generateVerbalHooks,
  generateVisualHooks,
  generateContentFromMultiHooks
} from "./gemini";

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
        await storage.updateInputs(projectId, response.extractedInputs);
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

  return httpServer;
}
