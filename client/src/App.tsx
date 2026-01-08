import { Switch, Route, useLocation, Redirect } from "wouter";
import { useState, useEffect } from "react";
import { queryClient, getQueryFn } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Crown, LogOut, Settings, Loader2 } from "lucide-react";
import NotFound from "@/pages/not-found";
import AssemblyLine from "@/pages/assembly-line";
import AdminDashboard from "@/pages/admin";
import LandingPage from "@/pages/landing";
import ProjectsPage from "@/pages/projects";
import AuthPage from "@/pages/auth";
import MembershipPage from "@/pages/membership";
import { SessionSidebar, SidebarToggle } from "@/components/SessionSidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FullPageLoader } from "@/components/FullPageLoader";
import { useLogout, type User as UserType } from "@/hooks/use-user";
import { AuthProvider } from "@/contexts/AuthContext";

import { cn } from "@/lib/utils";

const tierColors: Record<string, string> = {
  bronze: "bg-amber-600 text-white",
  silver: "bg-slate-400 text-white",
  gold: "bg-yellow-500 text-yellow-950",
  platinum: "bg-slate-300 text-slate-800",
  diamond: "bg-cyan-400 text-cyan-950"
};

function UserNav({ user }: { user: UserType }) {
  const [, navigate] = useLocation();
  const logoutMutation = useLogout();

  const initials = user.firstName && user.lastName
    ? `${user.firstName[0]}${user.lastName[0]}`
    : user.email?.[0]?.toUpperCase() || "U";

  return (
    <div className="flex items-center gap-2">
      <Badge
        className={cn("capitalize text-xs", tierColors[user.subscriptionTier] || "bg-primary")}
        data-testid="badge-tier"
      >
        {user.subscriptionTier}
      </Badge>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-9 w-9 rounded-full" data-testid="button-user-menu">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.profileImageUrl || undefined} alt={user.firstName || user.email} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.firstName && (
                <p className="font-medium">{user.firstName} {user.lastName}</p>
              )}
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => navigate("/membership")}
            data-testid="menu-item-membership"
          >
            <Crown className="mr-2 h-4 w-4" />
            Membership
          </DropdownMenuItem>
          {user.role === "admin" && (
            <DropdownMenuItem
              onClick={() => navigate("/admin")}
              data-testid="menu-item-admin"
            >
              <Settings className="mr-2 h-4 w-4" />
              Admin Dashboard
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            data-testid="menu-item-logout"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const { data: user, isLoading } = useQuery<UserType | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
  });

  if (isLoading) {
    return <FullPageLoader message="Checking authentication..." />;
  }

  if (!user) {
    sessionStorage.setItem("returnTo", location);
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useQuery<UserType | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  if (isLoading) {
    return <FullPageLoader message="Verifying access..." />;
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  if (user.role !== "admin") {
    return <Redirect to="/app" />;
  }

  return <>{children}</>;
}

function AppRouter() {
  return (
    <Switch>
      <Route path="/app">
        <ProtectedRoute>
          <AssemblyLine />
        </ProtectedRoute>
      </Route>
      <Route path="/projects">
        <ProtectedRoute>
          <ProjectsPage />
        </ProtectedRoute>
      </Route>
      <Route path="/admin">
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      </Route>
      <Route path="/membership">
        <ProtectedRoute>
          <MembershipPage />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const { data: user } = useQuery<UserType | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="flex h-screen w-full">
      <SessionSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            {isMobile && <SidebarToggle onClick={() => setSidebarOpen(true)} />}
          </div>
          {user && <UserNav user={user} />}
        </header>
        <main className="flex-1 overflow-hidden">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

function AppContent() {
  const [location] = useLocation();

  // Fetch user to determine auth status
  const { data: user, isLoading } = useQuery<UserType | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false
  });

  // Show loading while checking auth
  if (isLoading) {
    return <FullPageLoader message="Starting up..." />;
  }

  const publicOnlyRoutes = ["/", "/auth"]; // Routes only for non-authenticated users
  const isPublicOnlyRoute = publicOnlyRoutes.includes(location);

  // If logged in and trying to access landing page or auth, redirect to app
  if (user && isPublicOnlyRoute) {
    return <Redirect to="/app" />;
  }

  // Public routes
  const publicRoutes = ["/", "/auth"];
  const isPublicRoute = publicRoutes.includes(location);

  if (isPublicRoute) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route path="/auth" component={AuthPage} />
      </Switch>
    );
  }

  return <AppLayout />;
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ErrorBoundary>
            <AppContent />
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
