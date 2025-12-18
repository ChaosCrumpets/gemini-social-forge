import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, MessageSquare, Trash2, FileText, PanelLeftClose, PanelLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useProjectStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { Session, SessionMessage } from '@shared/schema';
import { useState, useEffect } from 'react';

interface SessionWithMessages {
  session: Session;
  messages: SessionMessage[];
  editMessages: SessionMessage[];
}

interface SessionSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
}

export function SessionSidebar({ isOpen, onClose, onToggle }: SessionSidebarProps) {
  const { currentSessionId, loadSession, reset, setLoading, setCurrentSessionId } = useProjectStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions']
  });

  const loadSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('GET', `/api/sessions/${sessionId}`);
      return response.json() as Promise<SessionWithMessages>;
    },
    onSuccess: (data) => {
      loadSession(data.session, data.messages, data.editMessages);
    }
  });

  const deleteSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      await apiRequest('DELETE', `/api/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
      if (currentSessionId === deletedId) {
        reset();
        setCurrentSessionId(null);
      }
      setDeletingId(null);
    }
  });

  const handleNewChat = () => {
    reset();
    setCurrentSessionId(null);
    if (isMobile) onClose();
  };

  const handleSelectSession = async (sessionId: number) => {
    if (sessionId === currentSessionId) {
      if (isMobile) onClose();
      return;
    }
    setLoading(true);
    try {
      await loadSessionMutation.mutateAsync(sessionId);
      if (isMobile) onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    deleteSessionMutation.mutate(sessionId);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const d = new Date(date);
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return d.toLocaleDateString();
  };

  const sidebarContent = (
    <div className="h-full w-64 bg-sidebar flex flex-col">
      <div className="flex items-center justify-between gap-2 p-3 border-b">
        <Button
          onClick={handleNewChat}
          className="flex-1"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No saved sessions yet
          </div>
        ) : (
          <div className="space-y-1">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={cn(
                  "group flex items-start gap-2 p-2 rounded-md cursor-pointer hover-elevate",
                  currentSessionId === session.id && "bg-accent"
                )}
                data-testid={`session-item-${session.id}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {session.status === 'complete' ? (
                    <FileText className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(session.createdAt)}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={(e) => handleDeleteSession(e, session.id)}
                  disabled={deletingId === session.id}
                  data-testid={`button-delete-session-${session.id}`}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 transition-opacity"
            onClick={onClose}
            data-testid="sidebar-backdrop"
          />
        )}
        <div
          className={cn(
            "fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </>
    );
  }

  if (!isOpen) {
    return (
      <div className="h-full w-12 border-r bg-sidebar flex flex-col items-center py-3 gap-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggle}
          data-testid="button-expand-sidebar"
        >
          <PanelLeft className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleNewChat}
          data-testid="button-new-chat-collapsed"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full border-r">
      {sidebarContent}
    </div>
  );
}

export function SidebarToggle({ onClick }: { onClick: () => void }) {
  return (
    <Button
      size="icon"
      variant="ghost"
      onClick={onClick}
      className="md:hidden"
      data-testid="button-mobile-sidebar-toggle"
    >
      <PanelLeft className="h-4 w-4" />
    </Button>
  );
}
