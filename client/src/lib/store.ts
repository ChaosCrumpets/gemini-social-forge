import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  Project, ChatMessage, Hook, ContentOutput, AgentStatus, UserInputs, ProjectStatusType,
  TextHook, VerbalHook, VisualHook, SelectedHooks, VisualContext,
  Session, SessionMessage
} from '@shared/schema';
import { ProjectStatus } from '@shared/schema';
import { apiRequest } from './queryClient';

interface ProjectStore {
  project: Project | null;
  isLoading: boolean;
  error: string | null;
  editMessages: ChatMessage[];
  currentSessionId: number | null;


  initProject: () => void;
  addMessage: (message: ChatMessage) => void;
  addEditMessage: (message: ChatMessage) => void;
  clearEditMessages: () => void;
  updateInputs: (inputs: Partial<UserInputs>) => void;
  setVisualContext: (context: VisualContext) => void;
  setTextHooks: (hooks: TextHook[]) => void;
  setVerbalHooks: (hooks: VerbalHook[]) => void;
  setVisualHooks: (hooks: VisualHook[]) => void;
  selectTextHook: (hook: TextHook) => void;
  selectVerbalHook: (hook: VerbalHook) => void;
  selectVisualHook: (hook: VisualHook) => void;
  setHooks: (hooks: Hook[]) => void;
  selectHook: (hook: Hook) => void;
  setOutput: (output: ContentOutput) => void;
  setStatus: (status: ProjectStatusType) => void;
  setAgents: (agents: AgentStatus[]) => void;
  updateAgent: (name: string, status: AgentStatus['status'], task?: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  goToStage: (stage: ProjectStatusType) => void;
  reset: () => void;
  setCurrentSessionId: (id: number | null) => void;
  loadSession: (session: Session, messages: SessionMessage[], editMessages: SessionMessage[]) => void;
  deleteSession: (sessionId: number) => Promise<boolean>;
  renameSession: (sessionId: number, newTitle: string) => Promise<boolean>;
}

const statusOrder: ProjectStatusType[] = [
  ProjectStatus.INPUTTING,
  ProjectStatus.HOOK_TEXT,
  ProjectStatus.HOOK_VERBAL,
  ProjectStatus.HOOK_VISUAL,
  ProjectStatus.HOOK_OVERVIEW,
  ProjectStatus.GENERATING,
  ProjectStatus.COMPLETE
];

const getHigherStatus = (a: ProjectStatusType, b: ProjectStatusType): ProjectStatusType => {
  const indexA = statusOrder.indexOf(a);
  const indexB = statusOrder.indexOf(b);
  return indexA >= indexB ? a : b;
};

const createInitialProject = (): Project => ({
  id: crypto.randomUUID(),
  status: ProjectStatus.INPUTTING,
  highestReachedStatus: ProjectStatus.INPUTTING,
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
});

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      project: null,
      isLoading: false,
      error: null,
      editMessages: [],
      currentSessionId: null,

      initProject: () => {
        set({
          project: createInitialProject(),
          isLoading: false,
          error: null,
          editMessages: [],
          currentSessionId: null
        });
      },

      addMessage: (message: ChatMessage) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            messages: [...project.messages, message],
            updatedAt: Date.now()
          }
        });
      },

      updateInputs: (inputs: Partial<UserInputs>) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            inputs: { ...project.inputs, ...inputs },
            updatedAt: Date.now()
          }
        });
      },

      setVisualContext: (context: VisualContext) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            visualContext: context,
            updatedAt: Date.now()
          }
        });
      },

      setTextHooks: (hooks: TextHook[]) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            textHooks: hooks,
            status: ProjectStatus.HOOK_TEXT,
            updatedAt: Date.now()
          }
        });
      },

      setVerbalHooks: (hooks: VerbalHook[]) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            verbalHooks: hooks,
            status: ProjectStatus.HOOK_VERBAL,
            updatedAt: Date.now()
          }
        });
      },

      setVisualHooks: (hooks: VisualHook[]) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            visualHooks: hooks,
            status: ProjectStatus.HOOK_VISUAL,
            updatedAt: Date.now()
          }
        });
      },

      selectTextHook: (hook: TextHook) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            selectedHooks: {
              ...project.selectedHooks,
              text: hook
            },
            updatedAt: Date.now()
          }
        });
      },

      selectVerbalHook: (hook: VerbalHook) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            selectedHooks: {
              ...project.selectedHooks,
              verbal: hook
            },
            updatedAt: Date.now()
          }
        });
      },

      selectVisualHook: (hook: VisualHook) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            selectedHooks: {
              ...project.selectedHooks,
              visual: hook
            },
            updatedAt: Date.now()
          }
        });
      },

      setHooks: (hooks: Hook[]) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            hooks,
            status: ProjectStatus.HOOK_TEXT,
            updatedAt: Date.now()
          }
        });
      },

      selectHook: (hook: Hook) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            selectedHook: hook,
            status: ProjectStatus.GENERATING,
            updatedAt: Date.now()
          }
        });
      },

      setOutput: (output: ContentOutput) => {
        const { project } = get();
        if (!project) return;

        const currentHighest = project.highestReachedStatus || ProjectStatus.INPUTTING;
        const newHighest = getHigherStatus(ProjectStatus.COMPLETE, currentHighest);

        set({
          project: {
            ...project,
            output,
            status: ProjectStatus.COMPLETE,
            highestReachedStatus: newHighest,
            updatedAt: Date.now()
          }
        });
      },

      setStatus: (status: ProjectStatusType) => {
        const { project } = get();
        if (!project) return;

        const currentHighest = project.highestReachedStatus || ProjectStatus.INPUTTING;
        const newHighest = getHigherStatus(status, currentHighest);

        set({
          project: {
            ...project,
            status,
            highestReachedStatus: newHighest,
            updatedAt: Date.now()
          }
        });
      },

      setAgents: (agents: AgentStatus[]) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            agents,
            updatedAt: Date.now()
          }
        });
      },

      updateAgent: (name: string, status: AgentStatus['status'], task?: string) => {
        const { project } = get();
        if (!project || !project.agents) return;

        const agents = project.agents.map(agent =>
          agent.name === name ? { ...agent, status, task } : agent
        );

        set({
          project: {
            ...project,
            agents,
            updatedAt: Date.now()
          }
        });
      },

      goToStage: (stage: ProjectStatusType) => {
        const { project } = get();
        if (!project) return;

        set({
          project: {
            ...project,
            status: stage,
            updatedAt: Date.now()
          }
        });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      addEditMessage: (message: ChatMessage) => {
        set(state => ({
          editMessages: [...state.editMessages, message]
        }));
      },

      clearEditMessages: () => {
        set({ editMessages: [] });
      },

      reset: () => set({
        project: createInitialProject(),
        isLoading: false,
        error: null,
        editMessages: [],
        currentSessionId: null
      }),

      setCurrentSessionId: (id: number | null) => set({ currentSessionId: id }),

      deleteSession: async (sessionId: number) => {
        try {
          const response = await apiRequest('DELETE', `/api/sessions/${sessionId}`);

          if (!response.ok) {
            throw new Error('Failed to delete session');
          }

          // If we just deleted the current session, reset state
          const { currentSessionId } = get();
          if (currentSessionId === sessionId) {
            set({
              project: createInitialProject(),
              currentSessionId: null,
              editMessages: []
            });
          }

          console.log('[Store] ✅ Session deleted:', sessionId);
          return true;
        } catch (error) {
          console.error('[Store] ❌ Delete failed:', error);
          return false;
        }
      },

      renameSession: async (sessionId: number, newTitle: string) => {
        try {
          const response = await apiRequest('PATCH', `/api/sessions/${sessionId}/title`, {
            title: newTitle
          });

          if (!response.ok) {
            throw new Error('Failed to rename session');
          }

          console.log('[Store] ✅ Session renamed:', sessionId, newTitle);
          return true;
        } catch (error) {
          console.error('[Store] ❌ Rename failed:', error);
          return false;
        }
      },


      loadSession: (session: Session, messages: SessionMessage[], editMsgs: SessionMessage[]) => {
        const chatMessages: ChatMessage[] = messages.map(m => ({
          id: m.id.toString(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.timestamp).getTime()
        }));

        const editMessages: ChatMessage[] = editMsgs.map(m => ({
          id: m.id.toString(),
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.timestamp).getTime()
        }));

        const project: Project = {
          id: session.id.toString(),
          status: (session.status as ProjectStatusType) || ProjectStatus.INPUTTING,
          inputs: session.inputs || {},
          visualContext: session.visualContext || undefined,
          messages: chatMessages,
          textHooks: session.textHooks || undefined,
          verbalHooks: session.verbalHooks || undefined,
          visualHooks: session.visualHooks || undefined,
          selectedHooks: session.selectedHooks || undefined,
          hooks: undefined,
          selectedHook: session.selectedHook || undefined,
          output: session.output || undefined,
          agents: undefined,
          createdAt: new Date(session.createdAt).getTime(),
          updatedAt: new Date(session.updatedAt).getTime()
        };

        set({
          project,
          editMessages,
          currentSessionId: session.id,
          isLoading: false,
          error: null
        });
      }
    }),
    {
      name: 'cal-session-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentSessionId: state.currentSessionId,
      }),
      version: 1,
    }
  )
);

