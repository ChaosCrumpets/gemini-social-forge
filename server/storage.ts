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
  async createSession(userId?: string): Promise<Session> {
    const session = await firestoreUtils.createSession(userId);
    return session;
  },

  async getSession(id: number): Promise<Session | undefined> {
    try {
      console.log(`[SessionStorage.getSession] 🔍 Looking up session: ${id}`);

      // Look up the actual Firestore ID from our mapping
      const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
      console.log(`[SessionStorage.getSession] Mapping lookup: ${id} → ${firestoreId || 'NOT FOUND'}`);

      let firestoreSession;

      if (!firestoreId) {
        // FALLBACK: Try using the numeric ID directly as document ID
        console.warn(`[SessionStorage.getSession] ⚠️  No mapping found, trying direct lookup: ${id}`);
        firestoreSession = await firestoreUtils.getSession(id.toString());

        if (!firestoreSession) {
          console.error(`[SessionStorage.getSession] ❌ Session ${id} not found (mapping failed AND direct lookup failed)`);
          return undefined;
        }

        console.log(`[SessionStorage.getSession] ✅ Direct lookup succeeded for ${id}!`);
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

      console.log(`[SessionStorage.getSession] ✅ Session ${id} loaded successfully`);
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
      console.warn(`[SessionStorage.getSessionWithMessages] No mapping for ${id}, trying direct lookup`);
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
    console.log('🔍 [SessionStorage.listSessions] Fetching sessions for:', userId || 'ALL (dev mode)');

    const firestoreSessions = await firestoreUtils.listSessions(userId);
    console.log('📊 [SessionStorage.listSessions] Found', firestoreSessions.length, 'raw sessions');

    const processed = firestoreSessions
      .map((fs, index) => {
        try {
          // FIXED: Use numericId if available, otherwise generate from document ID or timestamp
          let sessionId: number;

          if (fs.numericId !== undefined) {
            sessionId = fs.numericId;
            console.log(`  ✅ Session ${index}: Using numericId ${sessionId}`);
          } else {
            // Try parsing document ID as number, or use timestamp
            const parsedId = parseInt(fs.id);
            sessionId = isNaN(parsedId) ? Date.now() + index : parsedId;
            console.warn(`  ⚠️  Session ${index}: No numericId, generated ${sessionId} from ID "${fs.id}"`);
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

    console.log('✅ [SessionStorage.listSessions] Returning', processed.length, 'sessions');
    return processed;
  },



  async updateSession(id: number, updates: Record<string, unknown>): Promise<Session | undefined> {
    // Try to get Firestore ID from mapping, fallback to using numeric ID directly
    let firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) {
      console.warn(`[SessionStorage.updateSession] No mapping for ${id}, trying direct lookup`);
      firestoreId = id.toString();
    }

    try {
      const sanitizedUpdates = JSON.parse(JSON.stringify(updates));
      console.log(`[Storage] Updating session ${id} (Firestore ID: ${firestoreId}) with updates`);
      const updatedRaw = await firestoreUtils.updateSession(firestoreId, sanitizedUpdates);

      if (!updatedRaw) {
        console.error(`[Storage] Update returned null for ${id}`);
        return undefined;
      }

      console.log(`[Storage] Update successful for ${id}, returning mapped object directly`);

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
    return this.updateSession(id, { output, status: "complete" });
  },

  async addMessage(sessionId: number, userId: string, role: string, content: string, isEditMessage: boolean = false): Promise<SessionMessage> {
    console.log(`[Storage] addMessage called for sessionId ${sessionId}, userId ${userId}`);

    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(sessionId);
    console.log(`[Storage] Resolved firestoreId: ${firestoreId}`);

    if (!firestoreId) {
      console.error(`[Storage] Session ${sessionId} not found (no firestoreId mapping)`);
      throw new Error('Session not found');
    }

    // Verify session ownership before adding message
    const session = await firestoreUtils.getSession(firestoreId);
    if (!session) {
      console.error(`[Storage] Firestore session ${firestoreId} does not exist`);
      throw new Error('Session not found');
    }

    // Only check ownership if session has a userId (anonymous sessions might exist but usually have userId)
    if (session.userId && session.userId !== userId) {
      console.error(`[Storage] Ownership mismatch: Session owner ${session.userId} vs Request user ${userId}`);
      throw new Error(`Unauthorized: User ${userId} does not own session ${sessionId}`);
    }

    // Validate role to prevent crashes
    const validRole: "user" | "assistant" = role === "user" || role === "assistant" ? role : "user";
    if (role !== validRole) {
      console.warn(`Invalid message role "${role}" normalized to "${validRole}"`);
    }

    console.log(`[Storage] Adding message to Firestore session ${firestoreId}`);
    const message = await firestoreUtils.addMessage(firestoreId, validRole, content, isEditMessage);
    console.log(`[Storage] Message added with ID: ${message.id}`);

    return {
      id: Date.now(), // Use timestamp as ID for simplicity
      sessionId,
      role: validRole,
      content: message.content,
      isEditMessage: message.isEditMessage,
      timestamp: message.timestamp.toDate(),
    };
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
      console.warn(`[SessionStorage.deleteSession] No mapping for ${id}, trying direct lookup`);
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
