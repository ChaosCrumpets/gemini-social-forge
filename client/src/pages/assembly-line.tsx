import { useEffect, useCallback } from 'react';
import { useProjectStore } from '@/lib/store';
import { ChatInterface } from '@/components/ChatInterface';
import { HookSelection } from '@/components/HookSelection';
import { ThinkingState } from '@/components/ThinkingState';
import { SplitDashboard } from '@/components/SplitDashboard';
import { StatusBar } from '@/components/StatusBar';
import { ProjectStatus } from '@shared/schema';
import type { Hook, ChatMessage, AgentStatus, UserInputs } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

export default function AssemblyLine() {
  const { 
    project, 
    initProject, 
    addMessage, 
    updateInputs,
    setHooks, 
    selectHook, 
    setOutput,
    setStatus,
    setAgents,
    updateAgent,
    isLoading, 
    setLoading,
    setError
  } = useProjectStore();

  useEffect(() => {
    if (!project) {
      initProject();
    }
  }, [project, initProject]);

  const generateHooks = useCallback(async (inputsOverride?: Partial<UserInputs>) => {
    if (!project) return;

    setLoading(true);
    setStatus(ProjectStatus.GENERATING);
    
    const hookAgents: AgentStatus[] = [
      { name: 'Hook Engineer', status: 'working', task: 'Analyzing topic for hook angles' }
    ];
    setAgents(hookAgents);

    const inputsToUse = inputsOverride || project.inputs;

    try {
      const response = await apiRequest('POST', '/api/generate-hooks', {
        projectId: project.id,
        inputs: inputsToUse
      });

      const data = await response.json();
      
      updateAgent('Hook Engineer', 'complete', 'Generated hook options');
      
      if (data.hooks && data.hooks.length > 0) {
        setHooks(data.hooks);
        
        const hookMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `I've generated ${data.hooks.length} hook options for your content. Select the one that best captures your audience's attention.`,
          timestamp: Date.now()
        };
        addMessage(hookMessage);
      }
    } catch (error) {
      console.error('Hook generation error:', error);
      setError('Failed to generate hooks. Please try again.');
      setStatus(ProjectStatus.INPUTTING);
    } finally {
      setLoading(false);
    }
  }, [project, setLoading, setStatus, setAgents, updateAgent, setHooks, addMessage, setError]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!project) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now()
    };
    
    addMessage(userMessage);
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('POST', '/api/chat', {
        projectId: project.id,
        message: content,
        inputs: project.inputs,
        messages: [...project.messages, userMessage]
      });

      const data = await response.json();

      const updatedInputs: Partial<UserInputs> = data.extractedInputs 
        ? { ...project.inputs, ...data.extractedInputs }
        : project.inputs;
      
      if (data.extractedInputs) {
        updateInputs(data.extractedInputs);
      }

      if (data.message) {
        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.message,
          timestamp: Date.now()
        };
        addMessage(assistantMessage);
      }

      if (data.readyForHooks) {
        await generateHooks(updatedInputs);
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
  }, [project, addMessage, updateInputs, setLoading, setError, generateHooks]);

  const handleSelectHook = useCallback(async (hook: Hook) => {
    if (!project) return;

    selectHook(hook);
    setLoading(true);
    
    const contentAgents: AgentStatus[] = [
      { name: 'Script Architect', status: 'working', task: 'Drafting narrative structure' },
      { name: 'Visual Director', status: 'idle', task: 'Planning shot compositions' },
      { name: 'B-Roll Scout', status: 'idle', task: 'Finding supporting footage' },
      { name: 'Tech Specialist', status: 'idle', task: 'Optimizing platform specs' },
      { name: 'Caption Writer', status: 'idle', task: 'Generating accessible text' }
    ];
    setAgents(contentAgents);

    try {
      const response = await apiRequest('POST', '/api/generate-content', {
        projectId: project.id,
        inputs: project.inputs,
        selectedHook: hook
      });

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
      }
    } catch (error) {
      console.error('Content generation error:', error);
      setError('Failed to generate content. Please try again.');
      setStatus(ProjectStatus.HOOK_SELECTION);
    } finally {
      setLoading(false);
    }
  }, [project, selectHook, setLoading, setAgents, updateAgent, setOutput, addMessage, setError, setStatus]);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
      </div>
    );
  }

  const renderContent = () => {
    switch (project.status) {
      case ProjectStatus.INPUTTING:
        return (
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              messages={project.messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>
        );

      case ProjectStatus.HOOK_SELECTION:
        return (
          <div className="flex-1 overflow-auto">
            <div className="max-w-3xl mx-auto px-4">
              <ChatInterface
                messages={project.messages}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                disabled
              />
            </div>
            {project.hooks && project.hooks.length > 0 && (
              <div className="px-4 pb-8">
                <HookSelection
                  hooks={project.hooks}
                  onSelectHook={handleSelectHook}
                  selectedHookId={project.selectedHook?.id}
                  disabled={isLoading}
                />
              </div>
            )}
          </div>
        );

      case ProjectStatus.GENERATING:
        return (
          <div className="flex-1 flex items-center justify-center">
            {project.agents && (
              <ThinkingState 
                agents={project.agents}
                title="Assembling Your Content"
              />
            )}
          </div>
        );

      case ProjectStatus.COMPLETE:
        return (
          <SplitDashboard
            messages={project.messages}
            output={project.output!}
            selectedHook={project.selectedHook}
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background" data-testid="assembly-line-page">
      {project.status !== ProjectStatus.COMPLETE && (
        <StatusBar status={project.status} />
      )}
      {renderContent()}
    </div>
  );
}
