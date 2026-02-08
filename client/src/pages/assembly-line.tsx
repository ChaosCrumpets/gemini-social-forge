import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { SkeletonCard } from '@/components/LoadingStates';
import { useProjectStore } from '@/lib/store';
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient, HttpError } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { ChatInterface } from '@/components/ChatInterface';
import { TextHookStage } from '@/components/TextHookStage';
import { VerbalHookStage } from '@/components/VerbalHookStage';
import { VisualHookStage } from '@/components/VisualHookStage';
import { HookOverviewStage } from '@/components/HookOverviewStage';
import { ThinkingState } from '@/components/ThinkingState';
import { DirectorView } from '@/components/DirectorView';
import { SplitDashboard } from '@/components/SplitDashboard';
import { StatusBar } from '@/components/StatusBar';
import { AutoSaveIndicator } from '@/components/AutoSaveIndicator';
import { UnsavedChangesPrompt } from '@/components/UnsavedChangesPrompt';
import { LiveStatusIndicator } from '@/components/LiveStatusIndicator';
import { StageFooter } from '@/components/StageFooter';
import { useAutoSave } from '@/hooks/useAutoSave';
import { ErrorBoundary, StageErrorFallback } from '@/components/ErrorBoundary';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { ProjectStatus } from '@shared/schema';
import type { TextHook, VerbalHook, VisualHook, ChatMessage, AgentStatus, UserInputs, VisualContext, Session, SessionMessage } from '@shared/schema';
import { safeApiCall } from '@/lib/api-wrapper';
import { getSessionIdFromUrl, setSessionIdInUrl, clearSessionFromUrl } from '@/lib/url-utils';

const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutError: string
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(timeoutError)), timeoutMs)
    ),
  ]);
};

interface DiscoveryQuestion {
  id: string;
  question: string;
  answered: boolean;
  answer?: string;
}

export default function AssemblyLine() {
  const {
    project,
    initProject,
    addMessage,
    addEditMessage,
    editMessages,
    reset,
    updateInputs,
    setVisualContext,
    setTextHooks,
    setVerbalHooks,
    setVisualHooks,
    selectTextHook,
    selectVerbalHook,
    selectVisualHook,
    setOutput,
    setStatus,
    goToStage,
    setAgents,
    updateAgent,
    isLoading,
    setLoading,
    setError,
    currentSessionId,
    setCurrentSessionId,
    loadSession
  } = useProjectStore();

  const [showVisualContextForm, setShowVisualContextForm] = useState(false);
  const [localVisualContext, setLocalVisualContext] = useState<VisualContext>({
    location: undefined,
    lighting: undefined,
    onCamera: true
  });

  const { toast } = useToast();

  const [discoveryQuestions, setDiscoveryQuestions] = useState<DiscoveryQuestion[]>([]);
  const [discoveryComplete, setDiscoveryComplete] = useState(false);
  const [isLoadingDiscovery, setIsLoadingDiscovery] = useState(false);
  const [isHydrating, setIsHydrating] = useState(true);
  const [hydrationAttempted, setHydrationAttempted] = useState(false);
  const [sessionCreationInProgress, setSessionCreationInProgress] = useState(false);

  // Phase 3: Unsaved changes protection
  const { save, saveNow, saveStatus, lastSaved } = useAutoSave(currentSessionId?.toString() || null);
  const { hasUnsavedChanges } = useUnsavedChanges(currentSessionId?.toString() || null);

  // Manual save handler
  const handleSaveNow = useCallback(() => {
    if (project) {
      console.log('🔄 MANUAL SAVE TRIGGERED:', new Date().toISOString());
      saveNow(project);
    }
  }, [project, saveNow]);

  // Auto-save when project changes (MESSAGES EXCLUDED - saved individually)
  useEffect(() => {
    if (project && currentSessionId) {
      console.log('📝 Project changed, triggering auto-save:', new Date().toISOString());
      save(project);
    }
  }, [project?.inputs?.topic, project?.inputs, project?.selectedHook, project?.status, currentSessionId, save]);

  useEffect(() => {
    const hydrateFromUrl = async () => {
      if (hydrationAttempted) return;
      setHydrationAttempted(true);

      const urlSessionId = getSessionIdFromUrl();

      if (!urlSessionId) {
        console.log('📝 No session in URL - creating new session...');

        try {
          // Create new session via API
          const response = await apiRequest('POST', '/api/sessions', {});

          if (!response.ok) {
            throw new Error(`Failed to create session: ${response.status}`);
          }

          const newSession: Session = await response.json();
          console.log('✅ New session created:', newSession.id);

          // Set session ID in URL
          setSessionIdInUrl(newSession.id);

          // Load the new session
          loadSession(newSession, [], []);

          toast({
            title: "New Project Started",
            description: "Ready to create amazing content!",
          });
        } catch (error: any) {
          console.error('❌ Failed to create session:', error);

          // Fallback to local-only project
          initProject();

          toast({
            title: "Offline Mode",
            description: "Working locally. Session won't be saved.",
            variant: "destructive"
          });
        }

        setIsHydrating(false);
        return;
      }

      console.log('🔄 Attempting to restore session:', urlSessionId);
      const sessionIdNum = parseInt(urlSessionId, 10);

      if (isNaN(sessionIdNum)) {
        console.error('❌ Invalid session ID format in URL:', urlSessionId);
        clearSessionFromUrl();
        initProject();
        setIsHydrating(false);
        toast({
          title: "Invalid Session Link",
          description: "Starting a new project instead.",
          variant: "destructive"
        });
        return;
      }

      try {
        setLoading(true);
        console.log('📡 Fetching session data from server...');

        const response = await apiRequest('GET', `/api/sessions/${sessionIdNum}`);

        if (!response.ok) {
          throw new Error(`Server returned ${response.status}`);
        }

        const data: {
          session: Session;
          messages: SessionMessage[];
          editMessages: SessionMessage[];
        } = await response.json();

        // ⚠️ DEFENSIVE: Validate session data structure
        if (!data || !data.session || typeof data.session.id === 'undefined') {
          console.error('❌ Invalid session data structure:', data);
          throw new Error('Invalid session data received from server');
        }

        console.log('✅ Session data loaded:', {
          id: data.session.id,
          title: data.session.title,
          messageCount: data.messages?.length || 0
        });

        loadSession(data.session, data.messages || [], data.editMessages || []);

        toast({
          title: "Session Restored",
          description: data.session.title || 'Untitled Project',
        });

      } catch (error: any) {
        console.error('❌ Failed to hydrate session:', error);

        clearSessionFromUrl();

        const errorMessage = error?.status === 404
          ? "Session not found"
          : error?.status === 401
            ? "Authentication required"
            : error?.message?.includes('Invalid session data')
              ? "Session data corrupted"
              : "Could not load session";

        toast({
          title: "Restoration Failed",
          description: `${errorMessage}. Starting new project.`,
          variant: "destructive"
        });

        initProject();

      } finally {
        setLoading(false);
        setIsHydrating(false);
      }
    };

    hydrateFromUrl();
  }, [hydrationAttempted]);

  useEffect(() => {
    if (isHydrating) return;

    if (currentSessionId) {
      console.log('🔗 Syncing URL with session:', currentSessionId);
      setSessionIdInUrl(currentSessionId, false);
    } else {
      console.log('🔗 Clearing session from URL');
      clearSessionFromUrl();
    }
  }, [currentSessionId, isHydrating]);

  // ENTERPRISE: Phase 3 - Save individual message to database (non-blocking)
  const saveMessageToDb = useCallback(async (
    sessionId: number,
    role: 'user' | 'assistant',
    content: string,
    isEditMessage: boolean = false
  ) => {
    try {
      console.log(`💾 Saving ${role} message to session ${sessionId}`);

      await apiRequest('POST', `/api/sessions/${sessionId}/messages`, {
        role,
        content,
        isEditMessage
      });

      console.log(`✅ ${role} message saved to database`);
    } catch (error) {
      console.error(`❌ Failed to save ${role} message:`, error);
      // Non-critical - message is in local state
    }
  }, []);

  const updateSessionData = useCallback(async (sessionId: number, data: Record<string, unknown>) => {
    try {
      const dataString = JSON.stringify(data);
      const sizeInBytes = new Blob([dataString]).size;
      const sizeInMB = sizeInBytes / (1024 * 1024);

      if (sizeInMB > 4) {
        console.warn(`Session data too large (${sizeInMB.toFixed(2)}MB) - skipping update`);
        return;
      }

      await apiRequest('PATCH', `/api/sessions/${sessionId}`, data);
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    } catch (error: any) {
      console.warn('Session update warning:', error?.message || error);

      if (error?.status === 413) {
        console.error('Session data too large - skipping this update');
        toast({
          title: "Save Warning",
          description: "Some data too large to save. Core progress preserved.",
          variant: "default"
        });
      }
    }
  }, []);

  const ensureSession = useCallback(async (): Promise<number | null> => {
    if (currentSessionId) return currentSessionId;
    if (sessionCreationInProgress) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (!sessionCreationInProgress) {
            clearInterval(checkInterval);
            resolve(currentSessionId);
          }
        }, 100);
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve(null);
        }, 5000);
      });
    }

    setSessionCreationInProgress(true);
    try {
      const sessionId = await createSession();
      return sessionId;
    } finally {
      setSessionCreationInProgress(false);
    }
  }, [currentSessionId, sessionCreationInProgress]);

  const createSession = useCallback(async (): Promise<number | null> => {
    try {
      const response = await apiRequest('POST', '/api/sessions');
      const session: Session = await response.json();
      setCurrentSessionId(session.id);

      // Invalidate and refetch to ensure sidebar updates immediately
      await queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      await queryClient.refetchQueries({ queryKey: ['/api/sessions'] });

      console.log('✅ Session created:', session.id);

      return session.id;
    } catch (error: any) {
      console.error('Failed to create session:', error);

      // Handle authentication errors specifically
      if (error?.message?.includes('401') || error?.message?.includes('Authentication required')) {
        toast({
          title: "Authentication Required",
          description: "Please log in to create a new session.",
          variant: "destructive"
        });

        // Note: If you want to redirect to login, uncomment the following:
        // navigate('/login');

        return null;
      }

      // Generic error handling for other failures
      toast({
        title: "Save Failed",
        description: "Could not create session. Working in temporary mode.",
        variant: "destructive"
      });

      return null;
    }
  }, [setCurrentSessionId]);

  const generateTextHooks = useCallback(async (inputsOverride?: Partial<UserInputs>) => {
    if (!project) return;

    const inputsToUse = inputsOverride || project.inputs;

    await safeApiCall<{ textHooks: TextHook[] }>({
      method: 'POST',
      url: '/api/generate-text-hooks',
      data: { inputs: inputsToUse },
      onSuccess: (data) => {
        updateAgent('Text Hook Engineer', 'complete', 'Generated text hook options');

        if (data.textHooks && data.textHooks.length > 0) {
          setTextHooks(data.textHooks);
          // Auto-advance to text hook stage if we were in inputting
          if (project.status === ProjectStatus.INPUTTING) {
            goToStage(ProjectStatus.HOOK_TEXT);
          }

          const hookMessage: ChatMessage = {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: `I've generated ${data.textHooks.length} text hook options. These are the on-screen text that will appear first - on thumbnails, title cards, and caption overlays. Select the one that best grabs attention.`,
            timestamp: Date.now()
          };
          addMessage(hookMessage);
        }
      },
      onError: (error) => {
        console.error('Text hook generation error:', error);
        // Error toast handled by wrapper's default
        setStatus(ProjectStatus.INPUTTING);
      },
      errorMessage: 'Failed to generate text hooks. Please try again.'
    });

    setLoading(false);
  }, [project, setLoading, setStatus, setAgents, updateAgent, setTextHooks, addMessage]);

  const generateVerbalHooks = useCallback(async () => {
    if (!project) return;

    setLoading(true);
    setStatus(ProjectStatus.GENERATING);

    const hookAgents: AgentStatus[] = [
      { name: 'Verbal Hook Engineer', status: 'working', task: 'Crafting compelling script openers' }
    ];
    setAgents(hookAgents);

    await safeApiCall<{ verbalHooks: VerbalHook[] }>({
      method: 'POST',
      url: '/api/generate-verbal-hooks',
      data: { inputs: project.inputs },
      onSuccess: (data) => {
        updateAgent('Verbal Hook Engineer', 'complete', 'Generated verbal hook options');
        if (data.verbalHooks && data.verbalHooks.length > 0) {
          setVerbalHooks(data.verbalHooks);
          goToStage(ProjectStatus.HOOK_VERBAL);
        }
      },
      onError: (error) => {
        console.error('Verbal hook generation error:', error);
        setStatus(ProjectStatus.HOOK_TEXT);
      },
      errorMessage: 'Failed to generate verbal hooks. Please try again.'
    });

    setLoading(false);
  }, [project, setLoading, setStatus, setAgents, updateAgent, setVerbalHooks, goToStage]);

  const generateVisualHooks = useCallback(async (context: VisualContext) => {
    if (!project) return;

    setLoading(true);
    setVisualContext(context);

    const hookAgents: AgentStatus[] = [
      { name: 'Visual Hook Director', status: 'working', task: 'Designing opening visuals' }
    ];
    setAgents(hookAgents);

    await safeApiCall<{ visualHooks: VisualHook[] }>({
      method: 'POST',
      url: '/api/generate-visual-hooks',
      data: {
        inputs: project.inputs,
        visualContext: context
      },
      onSuccess: (data) => {
        updateAgent('Visual Hook Director', 'complete', 'Generated visual hook options');
        if (data.visualHooks && data.visualHooks.length > 0) {
          setVisualHooks(data.visualHooks);
          setShowVisualContextForm(false);
        }
      },
      onError: (error) => {
        console.error('Visual hook generation error:', error);
      },
      errorMessage: 'Failed to generate visual hooks. Please try again.'
    });

    setLoading(false);
  }, [project, setLoading, setVisualContext, setAgents, updateAgent, setVisualHooks]);

  const fetchDiscoveryQuestions = useCallback(async (topic: string, intent?: string) => {
    if (!topic || !topic.trim()) {
      console.log('ℹ️ Skipping discovery questions - topic is empty');
      return false;
    }

    setIsLoadingDiscovery(true);
    try {
      const response = await apiRequest('POST', '/api/generate-discovery-questions', {
        topic,
        intent
      });
      const data = await response.json();

      if (data.questions && data.questions.length > 0) {
        const questions: DiscoveryQuestion[] = data.questions.map((q: string, idx: number) => ({
          id: `dq-${idx}`,
          question: q,
          answered: false
        }));
        setDiscoveryQuestions(questions);

        const discoveryMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Before I generate your hooks, let me ask a few strategic questions to make your content even more powerful:\n\n${data.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n\n')}\n\n${data.explanation || 'Please answer any or all of these questions to help me create more targeted content.'}`,
          timestamp: Date.now()
        };
        addMessage(discoveryMessage);

        return true;
      }
      return false;
    } catch (error) {
      console.error('Discovery questions error:', error);
      return false;
    } finally {
      setIsLoadingDiscovery(false);
    }
  }, [addMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!project) return;

    let sessionId = currentSessionId;
    const isFirstMessage = project.messages.length === 0;

    if (!sessionId) {
      const createdId = await ensureSession();
      if (!createdId) {
        setError('Failed to create session. Please try again.');
        return;
      }
      if (createdId) sessionId = createdId;
    }

    // Generate title from first message (ChatGPT-style)
    if (isFirstMessage && sessionId) {
      const title = content.length > 50
        ? content.substring(0, 50) + '...'
        : content;

      console.log('🏷️ Auto-title: Setting title for session', sessionId, 'to:', title);

      try {
        // Update session with auto-generated title using the dedicated endpoint
        await apiRequest('PATCH', `/api/sessions/${sessionId}/title`, {
          title: title
        });

        // Force sidebar to refresh with new title
        await queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
        await queryClient.refetchQueries({ queryKey: ['/api/sessions'] });

        console.log('✅ Session title set successfully:', title);
      } catch (error) {
        console.error('❌ Failed to set session title:', error);
        // Non-critical, continue anyway
      }
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    addMessage(userMessage);

    // ENTERPRISE: Phase 3 - Save user message to database immediately
    if (sessionId) {
      saveMessageToDb(sessionId, 'user', content);
    }

    setLoading(true);
    setError(null);

    // Backend now handles message persistence in /api/chat
    // Client-side save removed to prevent double-writes and race conditions

    try {
      const response = await apiRequest('POST', '/api/chat', {
        sessionId: sessionId,  // ✅ CHANGED: was projectId: project.id
        message: content,
        inputs: project.inputs,
        messages: [...project.messages, userMessage],
        discoveryComplete
      });

      const data = await response.json();

      const updatedInputs: Partial<UserInputs> = data.extractedInputs
        ? { ...project.inputs, ...data.extractedInputs }
        : project.inputs;

      if (data.extractedInputs) {
        updateInputs(data.extractedInputs);
        if (sessionId) {
          updateSessionData(sessionId, { inputs: updatedInputs });
        }
      }

      if (data.message) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        addMessage(assistantMessage);

        // ENTERPRISE: Phase 3 - Save assistant message to database immediately
        if (sessionId) {
          saveMessageToDb(sessionId, 'assistant', data.message);
        }
      }


      // Simplified discovery flow - avoid complex conditionals
      if (data.readyForHooks && !discoveryComplete) {
        // If we have discovery questions pending, answer them first
        if (discoveryQuestions.length > 0) {
          setDiscoveryComplete(true);
          const enrichedInputs = {
            ...updatedInputs,
            discoveryContext: content
          };
          updateInputs({ discoveryContext: content } as Partial<UserInputs>);
          await generateTextHooks(enrichedInputs);
        } else {
          // No discovery questions - proceed directly
          await generateTextHooks(updatedInputs);
        }
      } else if (data.readyForDiscovery && discoveryQuestions.length === 0) {
        // Fetch discovery questions
        const topic = updatedInputs.topic || (project.inputs as UserInputs).topic || '';
        const intent = updatedInputs.goal || (project.inputs as UserInputs).goal;
        if (topic) {
          await fetchDiscoveryQuestions(topic, intent);
        } else {
          console.log('ℹ️ Skipping discovery questions - no topic identified yet');
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setError('Failed to send message. Please try again.');

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: Date.now()
      };
      addMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [project, addMessage, updateInputs, setLoading, setError, generateTextHooks, currentSessionId, createSession, saveMessageToDb, updateSessionData, discoveryComplete, discoveryQuestions, fetchDiscoveryQuestions]);

  const handleSelectTextHook = useCallback(async (hook: TextHook) => {
    if (!project) return;
    selectTextHook(hook);

    if (currentSessionId) {
      const title = hook.content.split(/\s+/).slice(0, 6).join(' ') + (hook.content.split(/\s+/).length > 6 ? '...' : '');
      updateSessionData(currentSessionId, {
        title,
        selectedHooks: { text: hook },
        status: 'hook_text'
      });
    }
    // Generation is now triggered by the "Continue" button
  }, [project, selectTextHook, currentSessionId, updateSessionData]);

  const handleSelectVerbalHook = useCallback((hook: VerbalHook) => {
    if (!project) return;
    selectVerbalHook(hook);

    if (currentSessionId && project.selectedHooks) {
      updateSessionData(currentSessionId, {
        selectedHooks: { ...project.selectedHooks, verbal: hook },
        status: 'hook_verbal'
      });
    }
    // Navigation is now triggered by "Continue"
  }, [project, selectVerbalHook, currentSessionId, updateSessionData]);

  const handleSelectVisualHook = useCallback((hook: VisualHook) => {
    if (!project) return;
    selectVisualHook(hook);

    if (currentSessionId && project.selectedHooks) {
      updateSessionData(currentSessionId, {
        selectedHooks: { ...project.selectedHooks, visual: hook },
        status: 'hook_overview'
      });
    }
    // Navigation triggered by "Continue"
  }, [project, selectVisualHook, currentSessionId, updateSessionData]);

  const handleEditFromOverview = useCallback((stage: 'text' | 'verbal' | 'visual') => {
    const stageMap = {
      text: ProjectStatus.HOOK_TEXT,
      verbal: ProjectStatus.HOOK_VERBAL,
      visual: ProjectStatus.HOOK_VISUAL
    };
    goToStage(stageMap[stage]);
    if (stage === 'visual') {
      setShowVisualContextForm(false);
    }
  }, [goToStage]);

  const handleConfirmAndGenerate = useCallback(async () => {
    if (!project || !project.selectedHooks) return;

    setLoading(true);
    setStatus(ProjectStatus.GENERATING);

    const contentAgents: AgentStatus[] = [
      { name: 'Script Architect', status: 'working', task: 'Drafting narrative structure' },
      { name: 'Visual Director', status: 'idle', task: 'Planning shot compositions' },
      { name: 'B-Roll Scout', status: 'idle', task: 'Finding supporting footage' },
      { name: 'Tech Specialist', status: 'idle', task: 'Optimizing platform specs' },
      { name: 'Caption Writer', status: 'idle', task: 'Generating accessible text' }
    ];
    setAgents(contentAgents);

    try {
      const response = await withTimeout(
        apiRequest('POST', '/api/generate-content-multi', {
          inputs: project.inputs,
          selectedTextHook: project.selectedHooks?.text,
          selectedVisualHook: project.selectedHooks?.visual,
          selectedVerbalHook: project.selectedHooks?.verbal
        }),
        180000, // 3 minutes timeout (increased for Cloudflare Tunnel latency)
        'Generation timed out'
      );

      const data = await response.json();

      for (const agent of contentAgents) {
        await new Promise(resolve => setTimeout(resolve, 300));
        updateAgent(agent.name, 'working');
      }

      for (const agent of contentAgents) {
        await new Promise(resolve => setTimeout(resolve, 200));
        updateAgent(agent.name, 'complete');
      }

      if (data.output) {
        setOutput(data.output);

        const completeMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Your content package is ready! Browse through the tabs to see your script, storyboard, technical specifications, B-roll suggestions, and captions.',
          timestamp: Date.now()
        };
        addMessage(completeMessage);

        if (currentSessionId) {
          updateSessionData(currentSessionId, {
            output: data.output,
            status: 'complete'
          });
          saveMessageToDb(currentSessionId, 'assistant', completeMessage.content);
        }
      }
    } catch (error: unknown) {
      console.error('Content generation error:', error);

      setStatus(ProjectStatus.HOOK_OVERVIEW);
      setLoading(false);

      if (error instanceof HttpError) {
        // 401 handled globally by queryClient

        if (error.status === 403) {
          toast({
            title: "Premium Required",
            description: "This feature requires a Premium subscription.",
            variant: "destructive",
            action: (
              <ToastAction altText="Upgrade" onClick={() => window.location.href = '/membership'}>
                Upgrade
              </ToastAction>
            )
          });
          return;
        }

        if (error.status === 429) {
          toast({
            title: "Rate Limit Exceeded",
            description: "Please wait a moment before trying again.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Generation Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });

      setError('Failed to generate content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [project, setLoading, setStatus, setAgents, updateAgent, setOutput, addMessage, setError, currentSessionId, updateSessionData, saveMessageToDb]);

  const handleEditMessage = useCallback(async (content: string) => {
    if (!project || !project.output) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };

    addEditMessage(userMessage);
    setLoading(true);
    setError(null);

    if (currentSessionId) {
      saveMessageToDb(currentSessionId, 'user', content, true);
    }

    try {
      const response = await apiRequest('POST', '/api/edit-content', {
        message: content,
        currentOutput: project.output,
        messages: [...editMessages, userMessage]
      });

      const data = await response.json();

      if (data.updatedOutput) {
        setOutput(data.updatedOutput);

        if (currentSessionId) {
          updateSessionData(currentSessionId, { output: data.updatedOutput });
        }
      }

      if (data.message) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        addEditMessage(assistantMessage);

        if (currentSessionId) {
          saveMessageToDb(currentSessionId, 'assistant', data.message, true);
        }
      }
    } catch (error) {
      console.error('Edit error:', error);
      setError('Failed to apply edit. Please try again.');

      const errorMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while trying to edit. Please try again.',
        timestamp: Date.now()
      };
      addEditMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [project, editMessages, addEditMessage, setOutput, setLoading, setError, currentSessionId, saveMessageToDb, updateSessionData]);

  useEffect(() => {
    if (project?.status === ProjectStatus.GENERATING && !isLoading) {
      console.warn('⚠️ Detected stuck generating state - recovering');
      setStatus(ProjectStatus.HOOK_OVERVIEW);
      toast({
        title: "Generation Reset",
        description: "The process appeared stuck and was reset.",
        variant: "default"
      });
    }
  }, [project?.status, isLoading]);

  const handleCreateNew = useCallback(() => {
    reset();
    setCurrentSessionId(null);
    clearSessionFromUrl();
    setShowVisualContextForm(true);
    setLocalVisualContext({
      location: undefined,
      lighting: undefined,
      onCamera: true
    });
    setDiscoveryQuestions([]);
    setDiscoveryComplete(false);
  }, [reset, setCurrentSessionId]);

  if (!project) {
    return (
      <div className="min-h-screen container max-w-4xl py-12">
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (isHydrating) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading session...</p>
          </div>
        </div>
      );
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={project.status}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="flex-1 overflow-hidden h-full flex flex-col"
        >
          {(() => {
            switch (project.status) {
              case ProjectStatus.INPUTTING:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Chat"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.INPUTTING);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 overflow-hidden">
                      <ChatInterface
                        messages={project.messages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading || isLoadingDiscovery}
                      />
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.HOOK_TEXT:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Text Hooks"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.HOOK_TEXT);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 overflow-auto">
                      {project.textHooks && project.textHooks.length > 0 && (
                        <TextHookStage
                          hooks={project.textHooks}
                          onSelectHook={handleSelectTextHook}
                          selectedHookId={project.selectedHooks?.text?.id}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.HOOK_VERBAL:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Verbal Hooks"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.HOOK_VERBAL);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 overflow-auto">
                      {project.verbalHooks && project.verbalHooks.length > 0 && (
                        <VerbalHookStage
                          hooks={project.verbalHooks}
                          onSelectHook={handleSelectVerbalHook}
                          selectedHookId={project.selectedHooks?.verbal?.id}
                          disabled={isLoading}
                        />
                      )}
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.HOOK_VISUAL:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Visual Hooks"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.HOOK_VISUAL);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 overflow-auto">
                      <VisualHookStage
                        hooks={project.visualHooks || []}
                        onSelectHook={handleSelectVisualHook}
                        selectedHookId={project.selectedHooks?.visual?.id}
                        disabled={isLoading}
                        visualContext={localVisualContext}
                        onVisualContextChange={setLocalVisualContext}
                        showContextForm={showVisualContextForm}
                        onContextSubmit={() => generateVisualHooks(localVisualContext)}
                        isLoadingHooks={isLoading}
                      />
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.HOOK_OVERVIEW:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Hook Overview"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.HOOK_OVERVIEW);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 overflow-auto">
                      <HookOverviewStage
                        textHook={project.selectedHooks?.text}
                        verbalHook={project.selectedHooks?.verbal}
                        visualHook={project.selectedHooks?.visual}
                        onEdit={handleEditFromOverview}
                        onConfirm={handleConfirmAndGenerate}
                        disabled={isLoading}
                      />
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.GENERATING:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Content Generation"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.GENERATING);
                        }}
                      />
                    )}
                  >
                    <div className="flex-1 flex items-center justify-center overflow-auto">
                      {project.agents && project.agents.length > 2 ? (
                        <DirectorView
                          agents={project.agents}
                          title="Assembling Your Content"
                          partialOutput={project.output}
                        />
                      ) : project.agents && (
                        <ThinkingState
                          agents={project.agents}
                          title="Generating Hooks"
                        />
                      )}
                    </div>
                  </ErrorBoundary>
                );

              case ProjectStatus.COMPLETE:
                return (
                  <ErrorBoundary
                    fallback={(error, reset) => (
                      <StageErrorFallback
                        error={error}
                        stageName="Content Dashboard"
                        onRetry={() => {
                          reset();
                          setStatus(ProjectStatus.COMPLETE);
                        }}
                      />
                    )}
                  >
                    <SplitDashboard
                      messages={project.messages}
                      editMessages={editMessages}
                      output={project.output!}
                      selectedHook={project.selectedHook}
                      onSendMessage={handleSendMessage}
                      onSendEditMessage={handleEditMessage}
                      onCreateNew={handleCreateNew}
                      isLoading={isLoading}
                    />
                  </ErrorBoundary>
                );

              default:
                return null;
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const handleStageNavigate = (stage: typeof project.status) => {
    goToStage(stage);
  };

  const getCanProceed = () => {
    switch (project.status) {
      case ProjectStatus.INPUTTING:
        // Allow proceeding if we have minimal inputs or if we are just exploring
        return !!project.inputs?.topic || project.messages.length > 2;
      case ProjectStatus.HOOK_TEXT:
        return !!project.selectedHooks?.text;
      case ProjectStatus.HOOK_VERBAL:
        return !!project.selectedHooks?.verbal;
      case ProjectStatus.HOOK_VISUAL:
        return !!project.selectedHooks?.visual;
      case ProjectStatus.HOOK_OVERVIEW:
        return true; // Always can proceed to generate from overview
      default:
        return false;
    }
  };

  const handleProceed = () => {
    switch (project.status) {
      case ProjectStatus.INPUTTING:
        if (project.textHooks && project.textHooks.length > 0) {
          goToStage(ProjectStatus.HOOK_TEXT);
        } else {
          // If no hooks yet, guide user or trigger if inputs exist
          if (project.inputs?.topic) {
            generateTextHooks(project.inputs);
          }
        }
        break;
      case ProjectStatus.HOOK_TEXT:
        // Trigger generation for next stage if moving forward
        generateVerbalHooks();
        break;
      case ProjectStatus.HOOK_VERBAL:
        // Move to Visual Stage (which shows context form first)
        setShowVisualContextForm(true);
        goToStage(ProjectStatus.HOOK_VISUAL);
        break;
      case ProjectStatus.HOOK_VISUAL:
        goToStage(ProjectStatus.HOOK_OVERVIEW);
        break;
      case ProjectStatus.HOOK_OVERVIEW:
        handleConfirmAndGenerate();
        break;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden" data-testid="assembly-line-page">
      {/* Status bar */}
      {project.status !== ProjectStatus.COMPLETE && (
        <StatusBar
          status={project.status}
          highestReachedStatus={project.highestReachedStatus}
          onNavigate={handleStageNavigate}
        />
      )}

      {/* Main content */}
      {renderContent()}

      {/* Persistent Footer for progress */}
      {project.status !== ProjectStatus.COMPLETE && project.status !== ProjectStatus.GENERATING && (
        <StageFooter
          currentStage={project.status}
          canProceed={getCanProceed()}
          onProceed={handleProceed}
          isLoading={isLoading}
        />
      )}

      {/* Phase 3: Auto-save indicator with unsaved changes warning */}
      <AutoSaveIndicator
        status={saveStatus}
        lastSaved={lastSaved}
        onSaveNow={handleSaveNow}
        hasUnsavedChanges={hasUnsavedChanges}
      />

      {/* Phase 3: Browser close protection */}
      <UnsavedChangesPrompt
        when={hasUnsavedChanges}
        onSave={handleSaveNow}
        onDiscard={() => { }}
      />

      {/* Live server status indicator */}
      <LiveStatusIndicator />
    </div>
  );
}
