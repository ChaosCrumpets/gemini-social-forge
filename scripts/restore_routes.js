import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths - CORRECTED to 3 levels up to reach "AI" folder
const currentPath = path.join(__dirname, '..', 'server', 'routes.ts');
const backupPath = path.join(__dirname, '..', '..', '..', 'temp_restore', 'Gemini-Social-Forge', 'server', 'routes.ts');

console.log(`Reading current file: ${currentPath}`);
let currentContent = fs.readFileSync(currentPath, 'utf8');

console.log(`Reading backup file: ${backupPath}`);
let backupContent = fs.readFileSync(backupPath, 'utf8');

// 1. Extract Big Block from Backup (Chat ... Stripe)
// Start: app.post("/api/chat"
// End: app.get("/api/upgrade/success", (We stop before this because current file has it)

const startMarker = 'app.post("/api/chat",';
const endMarker = 'app.get("/api/upgrade/success",';

const startIndex = backupContent.indexOf(startMarker);
const endIndex = backupContent.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error(`Could not find markers in backup. Start: ${startIndex}, End: ${endIndex}`);
    process.exit(1);
}

// Extract the raw block
let restoredBlock = backupContent.substring(startIndex, endIndex).trim();
console.log(`Extracted ${restoredBlock.length} bytes from backup (Chat -> Stripe).`);

// 2. Identify and Replace the Old Session Routes inside this block
// Old Start: // Session API Endpoints (Database-backed)
// Old End: // Admin Routes

const oldSessionStart = '// Session API Endpoints (Database-backed)';
const oldSessionEnd = '// Admin Routes';

const rsStart = restoredBlock.indexOf(oldSessionStart);
const rsEnd = restoredBlock.indexOf(oldSessionEnd);

if (rsStart === -1 || rsEnd === -1) {
    console.error("Could not find internal session/admin markers in extracted block.");
    process.exit(1);
}

// 3. Define New Session Routes
const newSessionRoutes = `
  // ============================================
  // Session API Endpoints (SQLite + Optional Auth)
  // ============================================

  app.get("/api/sessions", optionalFirebaseAuth, async (req, res) => {
    try {
      const sessions = await sessionStorage.listSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Sessions list error:", error);
      res.status(500).json({ error: "Failed to fetch sessions" });
    }
  });

  app.post("/api/sessions", optionalFirebaseAuth, async (req, res) => {
    try {
      const userId = req.user?.uid;
      const session = await sessionStorage.createSession(userId || undefined);
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
`;

// Replace the old session routes with new ones in the block
const finalBlock = restoredBlock.substring(0, rsStart) +
    newSessionRoutes +
    "\n\n  " +
    restoredBlock.substring(rsEnd);

// 4. Inject into Current File
// Injection point: `// [REMOVED DUPLICATE FIRESTORE ROUTES]` or `// [REMOVED ORPHAN...`
const injectionMarker = '// [REMOVED DUPLICATE FIRESTORE ROUTES]';
const injectionIndex = currentContent.indexOf(injectionMarker);

if (injectionIndex === -1) {
    console.error("Could not find injection marker in current file.");
    process.exit(1);
}

// Find START of injection area (orphans)
const orphansMarker = '// [REMOVED ORPHAN';
const orphansIndex = currentContent.indexOf(orphansMarker);
const cutStart = orphansIndex !== -1 ? orphansIndex : injectionIndex;

// End marker: `app.get("/api/upgrade/success",`
const currentEndMarker = 'app.get("/api/upgrade/success",';
const currentEndIndex = currentContent.indexOf(currentEndMarker);

if (currentEndIndex === -1) {
    console.error("Could not find upgrade success route in current file.");
    process.exit(1);
}

// We replace from cutStart to currentEndIndex
console.log(`Replacing content from ${cutStart} to ${currentEndIndex} with restored block.`);

const finalFileContent = currentContent.substring(0, cutStart) +
    "\n\n  // --- RESTORED ROUTES ---\n" +
    finalBlock +
    "\n\n  " +
    currentContent.substring(currentEndIndex);

fs.writeFileSync(currentPath, finalFileContent, 'utf8');
console.log("Successfully restored and patched routes!");
