import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Clock, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { SkeletonCard } from "@/components/LoadingStates";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Session } from "@shared/schema";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline"; icon: typeof Clock }> = {
  inputting: { label: "In Progress", variant: "secondary", icon: Clock },
  hook_text: { label: "Text Hooks", variant: "secondary", icon: Clock },
  hook_verbal: { label: "Verbal Hooks", variant: "secondary", icon: Clock },
  hook_visual: { label: "Visual Hooks", variant: "secondary", icon: Clock },
  hook_overview: { label: "Hook Review", variant: "secondary", icon: Clock },
  generating: { label: "Generating", variant: "secondary", icon: Clock },
  complete: { label: "Complete", variant: "default", icon: CheckCircle },
};

export default function ProjectsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/sessions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Project Deleted",
        description: "The project has been removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete project.",
        variant: "destructive",
      });
    },
  });

  const createNewSession = async () => {
    setCreating(true);
    try {
      const res = await apiRequest("POST", "/api/sessions", { title: "New Script" });
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      setLocation(`/app?session=${data.id}`);
    } catch {
      toast({
        title: "Error",
        description: "Failed to create new project.",
        variant: "destructive",
      });
      setCreating(false);
    }
  };

  const formatDate = (dateStr: string | Date | null | undefined) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="container py-12" data-testid="projects-loading">
        <div className="grid gap-4 max-w-5xl mx-auto">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-12" data-testid="projects-page">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-projects-title">My Projects</h1>
          <p className="text-muted-foreground mt-1">
            Manage your content creation projects
          </p>
        </div>
        <Button onClick={createNewSession} disabled={creating} className="gradient-primary" data-testid="button-new-project">
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          New Project
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card className="text-center py-12" data-testid="card-empty-state">
          <CardContent>
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your first content creation journey
            </p>
            <Button onClick={createNewSession} disabled={creating} className="gradient-primary" data-testid="button-create-first">
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Your First Project
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {sessions.map((session) => {
            const status = statusConfig[session.status] || statusConfig.inputting;
            const StatusIcon = status.icon;
            const inputs = session.inputs as Record<string, string> | null;
            const topic = inputs?.topic;

            return (
              <Card
                key={session.id}
                className="group hover:shadow-lg transition-all duration-200 hover:border-primary/50"
                data-testid={`card-project-${session.id}`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div
                    className="flex-1 cursor-pointer"
                    onClick={() => setLocation(`/app?session=${session.id}`)}
                  >
                    <CardTitle className="text-lg">{session.title || "Untitled Project"}</CardTitle>
                    {topic && (
                      <CardDescription className="mt-1">{topic}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={status.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.label}
                    </Badge>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                          data-testid={`button-delete-${session.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Project</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{session.title || "Untitled Project"}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(session.id)}
                            className="bg-destructive hover:bg-destructive/90"
                            data-testid="button-confirm-delete"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardHeader>
                <CardContent
                  className="cursor-pointer"
                  onClick={() => setLocation(`/app?session=${session.id}`)}
                >
                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <span>Created {formatDate(session.createdAt)}</span>
                    <span>Updated {formatDate(session.updatedAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
