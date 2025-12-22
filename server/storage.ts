import { randomUUID } from "crypto";
import { eq, desc } from "drizzle-orm";
import { db } from "./db";
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
import { contentSessions, sessionMessages } from "@shared/schema";

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
// Database Session Storage
// ============================================

export interface SessionWithMessages {
  session: Session;
  messages: SessionMessage[];
  editMessages: SessionMessage[];
}

export const sessionStorage = {
  async createSession(): Promise<Session> {
    const [session] = await db.insert(contentSessions)
      .values({
        title: "New Script",
        status: "inputting",
        inputs: {}
      })
      .returning();
    return session;
  },

  async getSession(id: number): Promise<Session | undefined> {
    const [session] = await db.select()
      .from(contentSessions)
      .where(eq(contentSessions.id, id));
    return session;
  },

  async getSessionWithMessages(id: number): Promise<SessionWithMessages | undefined> {
    const session = await this.getSession(id);
    if (!session) return undefined;

    const allMessages = await db.select()
      .from(sessionMessages)
      .where(eq(sessionMessages.sessionId, id))
      .orderBy(sessionMessages.timestamp);

    const messages = allMessages.filter(m => !m.isEditMessage);
    const editMessages = allMessages.filter(m => m.isEditMessage);

    return { session, messages, editMessages };
  },

  async listSessions(): Promise<Session[]> {
    return db.select()
      .from(contentSessions)
      .orderBy(desc(contentSessions.createdAt));
  },

  async updateSession(id: number, updates: Record<string, unknown>): Promise<Session | undefined> {
    const [session] = await db.update(contentSessions)
      .set({ ...updates, updatedAt: new Date() } as Partial<typeof contentSessions.$inferInsert>)
      .where(eq(contentSessions.id, id))
      .returning();
    return session;
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

  async addMessage(sessionId: number, role: string, content: string, isEditMessage: boolean = false): Promise<SessionMessage> {
    const [message] = await db.insert(sessionMessages)
      .values({ sessionId, role, content, isEditMessage })
      .returning();
    return message;
  },

  async deleteSession(id: number): Promise<boolean> {
    const result = await db.delete(contentSessions)
      .where(eq(contentSessions.id, id))
      .returning();
    return result.length > 0;
  },

  generateSessionTitle(hookContent: string): string {
    const words = hookContent.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (hookContent.split(/\s+/).length > 6 ? "..." : "");
  }
};
