import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Users, Crown, Shield, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  role: "user" | "admin";
  isPremium: boolean;
  subscriptionEndDate: string | null;
  createdAt: string;
}

export default function AdminDashboard() {
  const { toast } = useToast();

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const togglePremiumMutation = useMutation({
    mutationFn: async ({ userId, isPremium }: { userId: string; isPremium: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/premium`, { isPremium });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User premium status updated" });
    },
    onError: () => {
      toast({ title: "Failed to update premium status", variant: "destructive" });
    },
  });

  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "User role updated" });
    },
    onError: () => {
      toast({ title: "Failed to update role", variant: "destructive" });
    },
  });

  if (error) {
    const errorMessage = error?.message || "";
    const isAccessDenied = errorMessage.includes("401") || errorMessage.includes("403") || errorMessage.includes("Forbidden") || errorMessage.includes("Unauthorized");
    
    if (isAccessDenied) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4" data-testid="admin-access-denied">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold" data-testid="text-access-denied-title">Access Denied</h2>
          <p className="text-muted-foreground" data-testid="text-access-denied-message">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button data-testid="button-back-home">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4" data-testid="admin-error">
        <p className="text-destructive" data-testid="text-error-message">Error loading users</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-admin-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage users and subscriptions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({users?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-wrap items-center justify-between gap-4 p-4 border rounded-md"
                  data-testid={`user-row-${user.id}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt=""
                        className="h-10 w-10 rounded-full"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                        <Users className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {user.firstName || user.lastName
                          ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
                          : "Unnamed User"}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email || user.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Crown className={`h-4 w-4 ${user.isPremium ? "text-yellow-500" : "text-muted-foreground"}`} />
                      <Switch
                        checked={user.isPremium}
                        onCheckedChange={(checked) =>
                          togglePremiumMutation.mutate({ userId: user.id, isPremium: checked })
                        }
                        disabled={togglePremiumMutation.isPending}
                        data-testid={`switch-premium-${user.id}`}
                      />
                      {user.isPremium && (
                        <Badge variant="secondary" className="text-xs">
                          Premium
                        </Badge>
                      )}
                    </div>

                    <Select
                      value={user.role}
                      onValueChange={(role) =>
                        changeRoleMutation.mutate({ userId: user.id, role })
                      }
                      disabled={changeRoleMutation.isPending}
                    >
                      <SelectTrigger className="w-28" data-testid={`select-role-${user.id}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
