import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, MessageSquare, Trash2, FileText, PanelLeftClose, PanelLeft, Zap, FolderOpen, Pencil, Check, X, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useProjectStore } from '@/lib/store';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { Session, SessionMessage } from '@shared/schema';
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';

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
  const [, setLocation] = useLocation();
  const { currentSessionId, loadSession, reset, setLoading, setCurrentSessionId, renameSession } = useProjectStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Get current user to ensure we don't fetch sessions anonymously
  // We use useProjectStore which doesn't directly expose user, so we need to grab it from a hook or store
  // Since we don't have a global useAuth hook exposed here easily, 
  // we can rely on the fact that apiRequest handles 401s, BUT preventing the call is better.

  // For now, let's just make the query more robust by NOT refetching on window focus if we just got a 401
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
    queryFn: async () => {
      // apiRequest handles token injection. If it fails with 401, it throws.
      const response = await apiRequest('GET', '/api/sessions');
      return response.json() as Promise<Session[]>;
    },
    staleTime: 0,
    refetchOnWindowFocus: (query) => {
      // Don't refetch on focus if we are in an error state (likely auth)
      if (query.state.status === 'error') return false;
      return true;
    },
    refetchOnMount: true,
    retry: 1 // Reduce retries for session list to avoid spamming 401s
  });

  // Client-side sort to guarantee "Newest Top" regardless of API order or caching
  const sortedSessions = [...sessions].sort((a, b) => {
    // Priority: UpdatedAt -> CreatedAt
    const dateA = new Date(a.updatedAt || a.createdAt).getTime();
    const dateB = new Date(b.updatedAt || b.createdAt).getTime();
    // Descending: Newest (Larger timestamp) first
    return dateB - dateA;
  });

  const loadSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest('GET', `/api/sessions/${sessionId}`);
      const data = await response.json() as Promise<SessionWithMessages>;
      return data;
    },
    onSuccess: (data) => {
      loadSession(data.session, data.messages, data.editMessages);
    },
    onError: (error) => {
      console.error('[LoadSession] Mutation failed:', error);
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
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    setDeletingId(sessionId);
    deleteSessionMutation.mutate(sessionId);
  };

  const handleSelectSession = (sessionId: number) => {
    if (currentSessionId === sessionId) return;
    if (editingId) return; // Don't select while editing
    setCurrentSessionId(sessionId);
    loadSessionMutation.mutate(sessionId);
    if (isMobile) onToggle();
  };

  const handleStartRename = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingId(session.id);
    setEditTitle(session.title || 'Untitled Session');
  };

  const handleSaveRename = async (e: React.MouseEvent, sessionId: number) => {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    const success = await renameSession(sessionId, editTitle.trim());
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
    setEditTitle('');
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  };

  const sidebarContent = (
    <div className="h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col">
      {/* Header with branding */}
      <div className="p-4 border-b border-sidebar-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="font-bold text-sidebar-foreground" data-testid="text-sidebar-logo">C.A.L.</span>
        </Link>
      </div>

      {/* Actions */}
      <div className="p-2 space-y-1">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start"
          variant="outline"
          data-testid="button-new-chat"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Project
        </Button>
        <Button
          variant="ghost"
          className="w-full justify-start text-sidebar-foreground"
          asChild
          data-testid="button-view-projects"
        >
          <Link href="/projects">
            <FolderOpen className="h-4 w-4 mr-2" />
            View All Projects
          </Link>
        </Button>
      </div>

      {/* Recent sessions */}
      <div className="px-2 py-1">
        <p className="text-xs font-medium text-sidebar-foreground/60 px-2 mb-1">Recent</p>
      </div>
      <ScrollArea className="flex-1 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-2 h-2 rounded-full bg-sidebar-primary animate-pulse" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-8 text-sidebar-foreground/60 text-sm">
            No saved sessions yet
          </div>
        ) : (
          <div className="space-y-1">
            {sortedSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={cn(
                  "group grid grid-cols-[auto_1fr_auto] items-center gap-2 p-2 rounded-md cursor-pointer transition-colors",
                  currentSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "hover:bg-sidebar-accent/50"
                )}
                data-testid={`session-item-${session.id}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {session.status === 'complete' ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 pr-1">
                  {editingId === session.id ? (
                    <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="h-6 text-xs px-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(e as any, session.id);
                          if (e.key === 'Escape') handleCancelRename(e as any);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={(e) => handleSaveRename(e, session.id)}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5 p-0"
                        onClick={handleCancelRename}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-sidebar-foreground/60">
                        {formatDate(session.createdAt)}
                      </p>
                    </>
                  )}
                </div>

                {/* Menu Button - Static Flex Item - GUARANTEED VISIBLE */}
                {editingId !== session.id && (
                  <div className="relative flex items-center justify-center w-6" onClick={e => e.stopPropagation()}>
                    <button
                      className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-sidebar-accent transition-colors text-foreground font-bold z-10 min-w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Find the dropdown menu sibling
                        const parent = e.currentTarget.parentElement;
                        const menu = parent?.querySelector('.custom-dropdown-menu') as HTMLElement;

                        // Close all other open menus first
                        document.querySelectorAll('.custom-dropdown-menu').forEach((el) => {
                          if (el !== menu) (el as HTMLElement).style.display = 'none';
                        });

                        if (menu) {
                          const isHidden = menu.style.display === 'none' || menu.style.display === '';
                          menu.style.display = isHidden ? 'block' : 'none';
                        }
                      }}
                    >
                      <span className="text-lg leading-none font-bold mb-1">⋮</span>
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className="custom-dropdown-menu hidden bg-popover text-popover-foreground border border-border rounded-md shadow-md z-50 min-w-[140px] p-1 absolute right-0 top-full"
                    >
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartRename(e as any, session);
                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span>Rename</span>
                      </div>
                      <div
                        className="flex items-center gap-2 px-2 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded-sm cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this session?')) {
                            handleDeleteSession(e as any, session.id);
                          }
                          (e.currentTarget.parentElement as HTMLElement).style.display = 'none';
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer with collapse button */}
      <div className="p-2 border-t border-sidebar-border space-y-2">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="w-full text-sidebar-foreground"
          data-testid="button-close-sidebar"
        >
          <PanelLeftClose className="h-4 w-4" />
        </Button>
      </div>
    </div >
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
