import { randomUUID } from "crypto";
import * as firestoreUtils from "./lib/firestore";
import type {
  Project,
  ChatMessage,
  Hook,
  ContentOutput,
  UserInputs,
  ProjectStatusType,
  Session,
  SessionMessage,
  InsertSession,
  TextHook,
  VerbalHook,
  VisualHook,
  SelectedHooks,
  VisualContext
} from "@shared/schema";

const DEBUG = process.env.DEBUG_LOGS === "true";

export interface IStorage {
  createProject(): Promise<Project>;
  getProject(id: string): Promise<Project | undefined>;
  updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined>;
  addMessage(projectId: string, message: ChatMessage): Promise<Project | undefined>;
  updateInputs(projectId: string, inputs: Partial<UserInputs>): Promise<Project | undefined>;
  setHooks(projectId: string, hooks: Hook[]): Promise<Project | undefined>;
  selectHook(projectId: string, hook: Hook): Promise<Project | undefined>;
  setOutput(projectId: string, output: ContentOutput): Promise<Project | undefined>;
  setStatus(projectId: string, status: ProjectStatusType): Promise<Project | undefined>;
}

export class MemStorage implements IStorage {
  private projects: Map<string, Project>;

  constructor() {
    this.projects = new Map();
  }

  async createProject(): Promise<Project> {
    const id = randomUUID();
    const project: Project = {
      id,
      status: "inputting",
      inputs: {},
      visualContext: undefined,
      messages: [],
      textHooks: undefined,
      verbalHooks: undefined,
      visualHooks: undefined,
      selectedHooks: undefined,
      hooks: undefined,
      selectedHook: undefined,
      output: undefined,
      agents: undefined,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    this.projects.set(id, project);
    return project;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | undefined> {
    const project = this.projects.get(id);
    if (!project) return undefined;

    const updated = {
      ...project,
      ...updates,
      updatedAt: Date.now()
    };
    this.projects.set(id, updated);
    return updated;
  }

  async addMessage(projectId: string, message: ChatMessage): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      messages: [...project.messages, message],
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async updateInputs(projectId: string, inputs: Partial<UserInputs>): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      inputs: { ...project.inputs, ...inputs },
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async setHooks(projectId: string, hooks: Hook[]): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      hooks,
      status: "hook_selection" as ProjectStatusType,
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async selectHook(projectId: string, hook: Hook): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      selectedHook: hook,
      status: "generating" as ProjectStatusType,
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async setOutput(projectId: string, output: ContentOutput): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      output,
      status: "complete" as ProjectStatusType,
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }

  async setStatus(projectId: string, status: ProjectStatusType): Promise<Project | undefined> {
    const project = this.projects.get(projectId);
    if (!project) return undefined;

    const updated = {
      ...project,
      status,
      updatedAt: Date.now()
    };
    this.projects.set(projectId, updated);
    return updated;
  }
}

export const storage = new MemStorage();

// ============================================
// Firestore Session Storage
// ============================================

export interface SessionWithMessages {
  session: Session;
  messages: SessionMessage[];
  editMessages: SessionMessage[];
}



export const sessionStorage = {
  async createSession(userId: string): Promise<Session> {
    return await firestoreUtils.createSession(userId);
  },

  async getSession(id: number): Promise<Session | undefined> {
    try {
      if (DEBUG) console.log(`[SessionStorage.getSession] 🔍 Looking up session: ${id}`);

      // Look up the actual Firestore ID from our mapping
      const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
      if (DEBUG) console.log(`[SessionStorage.getSession] Mapping lookup: ${id} → ${firestoreId || 'NOT FOUND'}`);

      let firestoreSession;

      if (!firestoreId) {
        // FALLBACK: Try using the numeric ID directly as document ID
        if (DEBUG) console.warn(`[SessionStorage.getSession] ⚠️  No mapping found, trying direct lookup: ${id}`);
        firestoreSession = await firestoreUtils.getSession(id.toString());

        if (!firestoreSession) {
          console.error(`[SessionStorage.getSession] ❌ Session ${id} not found (mapping failed AND direct lookup failed)`);
          return undefined;
        }

        if (DEBUG) console.log(`[SessionStorage.getSession] ✅ Direct lookup succeeded for ${id}!`);
      } else {
        // Normal path: use the mapped Firestore ID
        firestoreSession = await firestoreUtils.getSession(firestoreId);

        if (!firestoreSession) {
          console.error(`[SessionStorage.getSession] ❌ Firestore session ${firestoreId} not found`);
          return undefined;
        }
      }

      // Safe hydration of timestamps
      const createdAt = firestoreSession.createdAt && typeof firestoreSession.createdAt.toDate === 'function'
        ? firestoreSession.createdAt.toDate()
        : new Date(); // Fallback date if missing/invalid

      const updatedAt = firestoreSession.updatedAt && typeof firestoreSession.updatedAt.toDate === 'function'
        ? firestoreSession.updatedAt.toDate()
        : new Date();

      if (DEBUG) console.log(`[SessionStorage.getSession] ✅ Session ${id} loaded successfully`);
      return {
        id,
        userId: firestoreSession.userId || null,
        title: firestoreSession.title,
        status: firestoreSession.status,
        inputs: firestoreSession.inputs,
        visualContext: firestoreSession.visualContext || null,
        textHooks: firestoreSession.textHooks || null,
        verbalHooks: firestoreSession.verbalHooks || null,
        visualHooks: firestoreSession.visualHooks || null,
        selectedHooks: firestoreSession.selectedHooks || null,
        selectedHook: firestoreSession.selectedHook || null,
        output: firestoreSession.output || null,
        createdAt,
        updatedAt,
      };
    } catch (error) {
      console.error(`[SessionStorage.getSession] Error loading session ${id}:`, error);
      return undefined;
    }
  },

  async getSessionWithMessages(id: number): Promise<SessionWithMessages | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;

    // Try to get Firestore ID from mapping, fallback to using numeric ID directly
    let firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) {
      if (DEBUG) console.warn(`[SessionStorage.getSessionWithMessages] No mapping for ${id}, trying direct lookup`);
      firestoreId = id.toString();
    }

    const allMessages = await firestoreUtils.getMessages(firestoreId, true);
    const messages = allMessages
      .filter(m => !m.isEditMessage)
      .map((m, index) => ({
        id: index + 1,
        sessionId: id,
        role: (m.role === "user" || m.role === "assistant" ? m.role : "user") as "user" | "assistant",
        content: m.content,
        isEditMessage: m.isEditMessage,
        timestamp: m.timestamp.toDate(),
      }));

    const editMessages = allMessages
      .filter(m => m.isEditMessage)
      .map((m, index) => ({
        id: index + 1,
        sessionId: id,
        role: (m.role === "user" || m.role === "assistant" ? m.role : "user") as "user" | "assistant",
        content: m.content,
        isEditMessage: m.isEditMessage,
        timestamp: m.timestamp.toDate(),
      }));

    return {
      session,
      messages,
      editMessages
    };
  },

  async listSessions(userId?: string): Promise<Session[]> {
    if (DEBUG) console.log('🔍 [SessionStorage.listSessions] Fetching sessions for:', userId || 'ALL (dev mode)');

    const firestoreSessions = await firestoreUtils.listSessions(userId);
    if (DEBUG) console.log('📊 [SessionStorage.listSessions] Found', firestoreSessions.length, 'raw sessions');

    const processed = firestoreSessions
      .map((fs, index) => {
        try {
          // FIXED: Use numericId if available, otherwise generate from document ID or timestamp
          let sessionId: number;

          if (fs.numericId !== undefined) {
            sessionId = fs.numericId;
            if (DEBUG) console.log(`  ✅ Session ${index}: Using numericId ${sessionId}`);
          } else {
            // Try parsing document ID as number, or use timestamp
            const parsedId = parseInt(fs.id);
            sessionId = isNaN(parsedId) ? Date.now() + index : parsedId;
            if (DEBUG) console.warn(`  ⚠️  Session ${index}: No numericId, generated ${sessionId} from ID "${fs.id}"`);
          }

          return {
            id: sessionId,
            userId: fs.userId || null,
            title: fs.title || 'Untitled Session',
            status: fs.status || 'inputting',
            inputs: fs.inputs || {},
            visualContext: fs.visualContext || null,
            textHooks: fs.textHooks || null,
            verbalHooks: fs.verbalHooks || null,
            visualHooks: fs.visualHooks || null,
            selectedHooks: fs.selectedHooks || null,
            selectedHook: fs.selectedHook || null,
            output: fs.output || null,
            createdAt: fs.createdAt && typeof fs.createdAt.toDate === 'function'
              ? fs.createdAt.toDate()
              : (fs.createdAt || new Date()),
            updatedAt: fs.updatedAt && typeof fs.updatedAt.toDate === 'function'
              ? fs.updatedAt.toDate()
              : (fs.updatedAt || new Date()),
          };
        } catch (e) {
          console.error('❌ Error processing session:', fs.id, e);
          return null;
        }
      })
      .filter((s): s is Session => s !== null);

    if (DEBUG) console.log('✅ [SessionStorage.listSessions] Returning', processed.length, 'sessions');
    return processed;
  },

  // Helper to get Firestore ID, handling mapping and direct lookup
  async getFirestoreId(id: number): Promise<string | undefined> {
    let firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) {
      if (DEBUG) console.warn(`[SessionStorage.getFirestoreId] No mapping for ${id}, trying direct lookup`);
      firestoreId = id.toString();
      // Verify if a session with this direct ID actually exists
      const sessionExists = await firestoreUtils.getSession(firestoreId);
      if (!sessionExists) {
        return undefined; // No session found with either mapping or direct lookup
      }
    }
    return firestoreId;
  },

  async updateSession(id: number, updates: Record<string, unknown>): Promise<Session | undefined> {
    try {
      if (DEBUG) console.log(`[Storage] updateSession called for ${id} with keys:`, Object.keys(updates));

      const firestoreId = await this.getFirestoreId(id);
      if (!firestoreId) {
        console.error(`[Storage] No Firestore ID found for session ${id}`);
        return undefined;
      }

      // Extract messages if present (they need separate handling)
      const messages = updates.messages as any[];
      const messagesUpdates = { ...updates };
      delete messagesUpdates.messages; // Remove from session updates

      // Sanitize updates
      const sanitizedUpdates: Record<string, unknown> = {};
      Object.entries(messagesUpdates).forEach(([key, value]) => {
        if (value !== undefined) {
          sanitizedUpdates[key] = value;
        }
      });

      if (DEBUG) console.log(`[Storage] Updating session fields for ${id}:`, Object.keys(sanitizedUpdates));

      // Update session fields
      const updatedRaw = await firestoreUtils.updateSession(firestoreId, sanitizedUpdates);

      // Save messages to subcollection if provided
      if (messages && Array.isArray(messages) && messages.length > 0) {
        if (DEBUG) console.log(`[Storage] Saving ${messages.length} messages for session ${id}`);

        // Clear existing messages first to avoid duplicates
        await firestoreUtils.clearMessages(firestoreId);

        // Save each message
        for (const msg of messages) {
          if (msg.role && msg.content) {
            await firestoreUtils.addMessage(
              firestoreId,
              msg.role,
              msg.content,
              msg.isEditMessage || false
            );
          }
        }

        if (DEBUG) console.log(`[Storage] ✅ Saved ${messages.length} messages for session ${id}`);
      }

      if (!updatedRaw) {
        console.error(`[Storage] Update returned null for ${id}`);
        return undefined;
      }

      if (DEBUG) console.log(`[Storage] Update successful for ${id}, returning mapped object directly`);

      // Manually map to Session to ensure we return the latest data without re-fetching
      // safely handling timestamp conversions
      return {
        id,
        userId: updatedRaw.userId || null,
        title: updatedRaw.title || '',
        status: updatedRaw.status || 'started',
        inputs: updatedRaw.inputs || {},
        visualContext: updatedRaw.visualContext || null,
        textHooks: updatedRaw.textHooks || null,
        verbalHooks: updatedRaw.verbalHooks || null,
        visualHooks: updatedRaw.visualHooks || null,
        selectedHooks: updatedRaw.selectedHooks || null,
        selectedHook: updatedRaw.selectedHook || null,
        output: updatedRaw.output || null,
        createdAt: updatedRaw.createdAt && typeof updatedRaw.createdAt.toDate === 'function'
          ? updatedRaw.createdAt.toDate()
          : new Date(),
        updatedAt: updatedRaw.updatedAt && typeof updatedRaw.updatedAt.toDate === 'function'
          ? updatedRaw.updatedAt.toDate()
          : new Date(),
      };
    } catch (e) {
      console.error(`[Storage] Failed to update session ${id}:`, e);
      throw e;
    }
  },

  async updateSessionTitle(id: number, title: string): Promise<Session | undefined> {
    return this.updateSession(id, { title });
  },

  async updateSessionStatus(id: number, status: string): Promise<Session | undefined> {
    return this.updateSession(id, { status });
  },

  async updateSessionInputs(id: number, inputs: UserInputs): Promise<Session | undefined> {
    return this.updateSession(id, { inputs });
  },

  async updateSessionVisualContext(id: number, visualContext: VisualContext): Promise<Session | undefined> {
    return this.updateSession(id, { visualContext });
  },

  async updateSessionHooks(id: number, updates: {
    textHooks?: TextHook[];
    verbalHooks?: VerbalHook[];
    visualHooks?: VisualHook[];
    selectedHooks?: SelectedHooks;
    selectedHook?: Hook;
  }): Promise<Session | undefined> {
    return this.updateSession(id, updates);
  },

  async updateSessionOutput(id: number, output: ContentOutput): Promise<Session | undefined> {
    return this.updateSession(id, { output });
  },

  // ENTERPRISE: Phase 1 - Atomic message persistence (FIXED VERSION)
  async addMessage(
    sessionId: number,
    role: string,
    content: string,
    isEditMessage: boolean = false
  ): Promise<SessionMessage | undefined> {
    try {
      const firestoreId = await this.getFirestoreId(sessionId);
      if (!firestoreId) {
        console.error(`[Storage] No Firestore ID found for session ${sessionId}`);
        return undefined;
      }

      if (DEBUG) console.log(`[Storage] Adding ${role} message to session ${sessionId}`);

      const firestoreMessage = await firestoreUtils.addMessage(
        firestoreId,
        role,
        content,
        isEditMessage
      );

      // Convert Firestore message to SessionMessage
      return {
        id: Date.now(), // Legacy ID compatibility
        sessionId,
        role: firestoreMessage.role as 'user' | 'assistant',
        content: firestoreMessage.content,
        isEditMessage: firestoreMessage.isEditMessage || false,
        timestamp: firestoreMessage.timestamp.toDate()
      };
    } catch (error) {
      console.error(`[Storage] Failed to add message to session ${sessionId}:`, error);
      throw error;
    }
  },

  async addVersion(sessionId: number, versionData: any) {
    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(sessionId);
    if (!firestoreId) throw new Error('Session not found');
    return firestoreUtils.addVersion(firestoreId, versionData);
  },

  async getVersions(sessionId: number) {
    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(sessionId);
    if (!firestoreId) return [];
    return firestoreUtils.getVersions(firestoreId);
  },

  async deleteSession(id: number): Promise<boolean> {
    // Try to get Firestore ID from mapping, fallback to using numeric ID directly
    let firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) {
      if (DEBUG) console.warn(`[SessionStorage.deleteSession] No mapping for ${id}, trying direct lookup`);
      firestoreId = id.toString();
    }

    // Also delete the ID mapping
    await firestoreUtils.deleteSessionIdMapping(id);
    return firestoreUtils.deleteSession(firestoreId);
  },

  generateSessionTitle(hookContent: string): string {
    return firestoreUtils.generateSessionTitle(hookContent);
  }
};
