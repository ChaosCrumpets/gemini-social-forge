import { useQuery, useMutation } from '@tanstack/react-query';
import { Plus, MessageSquare, Trash2, FileText, PanelLeftClose, PanelLeft, Zap, FolderOpen, MoreVertical, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useProjectStore } from '@/lib/store';
import { useToast } from '@/hooks/use-toast';
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
  const { currentSessionId, loadSession, reset, setLoading, setCurrentSessionId } = useProjectStore();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [sessionToDelete, setSessionToDelete] = useState<number | null>(null);
  const [sessionToRename, setSessionToRename] = useState<number | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/sessions'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/sessions');
      return response.json() as Promise<Session[]>;
    }
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
      setDeletingId(sessionId);
      await apiRequest('DELETE', `/api/sessions/${sessionId}`);
      return sessionId;
    },
    onSuccess: (deletedId) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });

      // Reset current project if deleted
      if (currentSessionId === deletedId) {
        reset();
        setCurrentSessionId(null);
        setLocation('/app', { replace: true });
      }

      setDeletingId(null);

      // Show success toast
      toast({
        title: "Project deleted",
        description: "Your project has been permanently deleted.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      setDeletingId(null);

      // Show error toast
      toast({
        title: "Failed to delete project",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const renameSessionMutation = useMutation({
    mutationFn: async ({ sessionId, title }: { sessionId: number; title: string }) => {
      await apiRequest('PATCH', `/api/sessions/${sessionId}`, { title });
      return { sessionId, title };
    },
    onSuccess: ({ sessionId, title }) => {
      queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });

      // Show success toast
      toast({
        title: "Project renamed",
        description: `Renamed to "${title}"`,
        variant: "default",
      });

      // Reset state
      setSessionToRename(null);
      setNewTitle('');
    },
    onError: (error: any) => {
      // Show error toast
      toast({
        title: "Failed to rename project",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleNewChat = () => {
    reset();
    setCurrentSessionId(null);
    // CRITICAL: Update URL to remove session param for new chat
    setLocation('/app', { replace: false });
    if (isMobile) onClose();
  };

  const handleSelectSession = async (sessionId: number) => {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🖱️ [SIDEBAR] Session clicked:', sessionId);
    console.log('🖱️ [SIDEBAR] Current URL:', window.location.href);
    console.log('🖱️ [SIDEBAR] Current search:', window.location.search);
    console.log('🖱️ [SIDEBAR] Current session ID:', currentSessionId);
    console.log('🖱️ [SIDEBAR] Timestamp:', new Date().toISOString());

    if (sessionId === currentSessionId) {
      console.log('🖱️ [SIDEBAR] Same session selected, skipping');
      if (isMobile) onClose();
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      return;
    }

    console.log('🖱️ [SIDEBAR] Calling setLocation with:', `/app?session=${sessionId}`);
    setLocation(`/app?session=${sessionId}`, { replace: false });
    console.log('🖱️ [SIDEBAR] After setLocation, URL:', window.location.href);
    console.log('🖱️ [SIDEBAR] After setLocation, search:', window.location.search);

    if (isMobile) onClose();
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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
    <>
      {/* Delete Confirmation Dialog */}
      {sessionToDelete && (
        <AlertDialog
          open={!!sessionToDelete}
          onOpenChange={(open) => !open && setSessionToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this project and all its content.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => setSessionToDelete(null)}
                data-testid="dialog-cancel-delete"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (sessionToDelete) {
                    deleteSessionMutation.mutate(sessionToDelete);
                    setSessionToDelete(null);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                data-testid="dialog-confirm-delete"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Rename Dialog */}
      {sessionToRename && (
        <AlertDialog
          open={!!sessionToRename}
          onOpenChange={(open) => {
            if (!open) {
              setSessionToRename(null);
              setNewTitle('');
            }
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Project</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for your project.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-4">
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Project name"
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newTitle.trim()) {
                    renameSessionMutation.mutate({
                      sessionId: sessionToRename,
                      title: newTitle.trim()
                    });
                  }
                  if (e.key === 'Escape') {
                    setSessionToRename(null);
                    setNewTitle('');
                  }
                }}
                data-testid="input-rename-project"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={() => {
                  setSessionToRename(null);
                  setNewTitle('');
                }}
                data-testid="dialog-cancel-rename"
              >
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (newTitle.trim()) {
                    renameSessionMutation.mutate({
                      sessionId: sessionToRename,
                      title: newTitle.trim()
                    });
                  }
                }}
                disabled={!newTitle.trim()}
                data-testid="dialog-confirm-rename"
              >
                Rename
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

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
              {sessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={cn(
                    "group relative flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors w-full max-w-[230px] overflow-hidden hover:bg-sidebar-accent/50",
                    currentSessionId === session.id
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : ""
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
                  <div className="flex-1 min-w-0 pr-8">
                    <p className="text-sm font-medium truncate">{session.title}</p>
                    <p className="text-xs text-sidebar-foreground/60">
                      {formatDate(session.createdAt)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-sidebar-foreground bg-sidebar-accent/0 hover:bg-sidebar-accent/80"
                        onClick={(e) => e.stopPropagation()}
                        disabled={deletingId === session.id}
                        data-testid={`button-session-menu-${session.id}`}
                        aria-label="Session options"
                      >
                        {deletingId === session.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreVertical className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setNewTitle(session.title || '');
                          setSessionToRename(session.id);
                        }}
                        data-testid={`menu-rename-session-${session.id}`}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSessionToDelete(session.id);
                        }}
                        data-testid={`menu-delete-session-${session.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Project
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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
      </div>
    </>
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
