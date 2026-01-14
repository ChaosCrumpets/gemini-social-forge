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
    // Look up the actual Firestore ID from our mapping
    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) return undefined;

    const firestoreSession = await firestoreUtils.getSession(firestoreId);
    if (!firestoreSession) return undefined;

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
      createdAt: firestoreSession.createdAt.toDate(),
      updatedAt: firestoreSession.updatedAt.toDate(),
    };
  },

  async getSessionWithMessages(id: number): Promise<SessionWithMessages | undefined> {
    console.log('[getSessionWithMessages] Called for session:', id);

    const session = await this.getSession(id);
    if (!session) {
      console.log('[getSessionWithMessages] Session not found');
      return undefined;
    }

    console.log('[getSessionWithMessages] Session found:', {
      id: session.id,
      title: session.title,
      hasMessages: 'messages' in session
    });

    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) {
      console.log('[getSessionWithMessages] No Firestore ID found');
      return undefined;
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

    const result = {
      session,
      messages,
      editMessages
    };

    console.log('[getSessionWithMessages] Returning wrapped format:', {
      hasSession: 'session' in result,
      hasMessages: 'messages' in result,
      hasEditMessages: 'editMessages' in result,
      sessionId: result.session?.id,
      messageCount: result.messages?.length,
      editMessageCount: result.editMessages?.length
    });

    return result;
  },

  async listSessions(userId?: string): Promise<Session[]> {
    const firestoreSessions = await firestoreUtils.listSessions(userId);
    return firestoreSessions
      .filter((fs) => fs.numericId !== undefined) // Skip sessions without numericId
      .map((fs) => {
        try {
          return {
            id: fs.numericId!,
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
            createdAt: fs.createdAt ? fs.createdAt.toDate() : new Date(),
            updatedAt: fs.updatedAt ? fs.updatedAt.toDate() : new Date(),
          };
        } catch (e) {
          console.warn('Skipping malformed session:', fs.id, e);
          return null;
        }
      })
      .filter((s): s is Session => s !== null);
  },

  async updateSession(id: number, updates: Record<string, unknown>): Promise<Session | undefined> {
    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) return undefined;

    await firestoreUtils.updateSession(firestoreId, updates as any);
    return this.getSession(id);
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
    const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(id);
    if (!firestoreId) return false;

    // Also delete the ID mapping
    await firestoreUtils.deleteSessionIdMapping(id);
    return firestoreUtils.deleteSession(firestoreId);
  },

  generateSessionTitle(hookContent: string): string {
    return firestoreUtils.generateSessionTitle(hookContent);
  }
};
