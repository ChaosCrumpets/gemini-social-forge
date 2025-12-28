import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AssemblyLine from "@/pages/assembly-line";
import AdminDashboard from "@/pages/admin";
import UpgradePage from "@/pages/upgrade";
import LandingPage from "@/pages/landing";
import ProjectsPage from "@/pages/projects";
import { SessionSidebar, SidebarToggle } from "@/components/SessionSidebar";

function AppRouter() {
  return (
    <Switch>
      <Route path="/app" component={AssemblyLine} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/upgrade" component={UpgradePage} />
      <Route path="/upgrade/success" component={AssemblyLine} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

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
        {isMobile && (
          <div className="flex items-center p-2 border-b md:hidden">
            <SidebarToggle onClick={() => setSidebarOpen(true)} />
          </div>
        )}
        <main className="flex-1 overflow-hidden">
          <AppRouter />
        </main>
      </div>
    </div>
  );
}

function App() {
  const [location] = useLocation();
  
  const isLandingOrProjects = location === "/" || location === "/projects";

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        {isLandingOrProjects ? (
          <Switch>
            <Route path="/" component={LandingPage} />
            <Route path="/projects" component={ProjectsPage} />
          </Switch>
        ) : (
          <AppLayout />
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
