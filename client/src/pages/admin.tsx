
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { showSuccess, showError } from '@/lib/toast-helper';
import {
  Users,
  DollarSign,
  Activity,
  TrendingUp,
  Mail,
  Shield,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Link } from "wouter";

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  role: 'user' | 'admin';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  isPremium: boolean;
  createdAt: string;
  lastActive: string | null;
  scriptsGenerated: number;
  usageCount: number;
  // Plan compliance fields
  totalGenerations: number;
  tokensUsed: number;
  costUSD: number;
}

interface Metrics {
  users: {
    total: number;
    active: number;
    byTier: Record<string, number>;
  };
  generations: {
    total: number;
    thisMonth: number;
    avgPerUser: number;
  };
  costs: {
    total: number;
    thisMonth: number;
    avgPerUser: number;
  };
  system: {
    errorRate: string;
    uptime: number;
    avgResponseTime: number;
  };
  timestamp: string;
}

interface ClientError {
  id: string;
  timestamp: string;
  userId?: string;
  error: {
    message: string;
    stack?: string;
  };
  context: {
    url: string;
    userAgent: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState('overview');

  // Fetch metrics
  const { data: metricsData } = useQuery<{ metrics: Metrics }>({
    queryKey: ['/api/admin/metrics'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch users
  const { data: usersData, isLoading: usersLoading, error: usersError } = useQuery<{ users: User[] }>({
    queryKey: ['/api/admin/users'],
  });

  // Fetch errors
  const { data: errorsData } = useQuery({
    queryKey: ['/api/admin/errors'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/errors?limit=50');
      const json = await response.json();
      return json.errors as ClientError[];
    },
  });

  // Update tier mutation
  const updateTierMutation = useMutation({
    mutationFn: async ({ userId, tier, role }: { userId: string; tier?: string, role?: string }) => {
      const response = await apiRequest('PATCH', `/api/admin/users/${userId}/tier`, { tier, role });
      return response.json();
    },
    onSuccess: (data) => {
      showSuccess(`User updated: ${data.message || 'Success'}`);
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/metrics'] });
    },
    onError: () => {
      showError('Failed to update user');
    },
  });

  // Send password reset mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest('POST', `/api/admin/users/${userId}/reset-password`, {});
      return response.json();
    },
    onSuccess: (data) => {
      showSuccess('Password reset link generated');
      // In production, this would send an email
      console.log('Reset link:', data.resetLink);
    },
    onError: () => {
      showError('Failed to send password reset');
    },
  });

  const metrics = metricsData?.metrics as Metrics | undefined;
  const users = (usersData?.users as User[]) || [];
  const errors = errorsData || [];

  if (usersError) {
    const errorMessage = (usersError as any).message || "";
    if (errorMessage.includes("403") || errorMessage.includes("Forbidden")) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 pt-20">
          <Shield className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      );
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">Manage users, monitor metrics, and view system health</p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to App
          </Button>
        </Link>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
        <TabsList className="mb-4 w-full justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-4">
          {/* Metrics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.users.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.users.active || 0} active this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Generations</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.generations.total || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics?.generations.thisMonth || 0} this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${(metrics?.costs?.total || 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(metrics?.costs?.avgPerUser || 0).toFixed(2)} per user
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics?.system.errorRate || 0}%</div>
                <p className="text-xs text-muted-foreground">
                  Uptime: {metrics?.system.uptime || 0}%
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tier Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>User Distribution by Tier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-600 text-white border-0">Bronze</Badge>
                    <span className="text-sm text-muted-foreground">Free Tier</span>
                  </div>
                  <span className="font-bold">{metrics?.users.byTier.bronze || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-400 text-white border-0">Silver</Badge>
                    <span className="text-sm text-muted-foreground">Basic Paid</span>
                  </div>
                  <span className="font-bold">{metrics?.users.byTier.silver || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-500 text-yellow-950 border-0">Gold</Badge>
                    <span className="text-sm text-muted-foreground">Pro</span>
                  </div>
                  <span className="font-bold">{metrics?.users.byTier.gold || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-slate-300 text-slate-800 border-0">Platinum</Badge>
                    <span className="text-sm text-muted-foreground">Advanced</span>
                  </div>
                  <span className="font-bold">{metrics?.users.byTier.platinum || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-cyan-400 text-cyan-950 border-0">Diamond</Badge>
                    <span className="text-sm text-muted-foreground">Lifetime</span>
                  </div>
                  <span className="font-bold">{metrics?.users.byTier.diamond || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users" className="flex-1">
          <Card className="h-full flex flex-col">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {usersLoading ? (
                <div className="flex items-center justify-center p-8">
                  <ArrowLeft className="animate-spin h-8 w-8 text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Generations</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.displayName || user.email}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(role) =>
                              updateTierMutation.mutate({ userId: user.id, role })
                            }
                            disabled={updateTierMutation.isPending}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.tier || 'bronze'}
                            onValueChange={(tier) =>
                              updateTierMutation.mutate({ userId: user.id, tier })
                            }
                            disabled={updateTierMutation.isPending}
                          >
                            <SelectTrigger className="w-28 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bronze">Bronze (Free)</SelectItem>
                              <SelectItem value="silver">Silver</SelectItem>
                              <SelectItem value="gold">Gold</SelectItem>
                              <SelectItem value="platinum">Platinum</SelectItem>
                              <SelectItem value="diamond">Diamond</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {user.totalGenerations}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            ${user.costUSD.toFixed(2)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {user.lastActive
                              ? formatDistanceToNow(new Date(user.lastActive), { addSuffix: true })
                              : 'Never'
                            }
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => resetPasswordMutation.mutate(user.id)}
                            title="Send Password Reset"
                          >
                            <Mail className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ERRORS TAB */}
        <TabsContent value="errors">
          <Card>
            <CardHeader>
              <CardTitle>Recent Errors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errors.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p>No errors recorded</p>
                  </div>
                ) : (
                  errors.map((error) => (
                    <div key={error.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className={`h-4 w-4 ${error.severity === 'critical' ? 'text-red-600' :
                            error.severity === 'high' ? 'text-orange-600' :
                              error.severity === 'medium' ? 'text-yellow-600' :
                                'text-blue-600'
                            }`} />
                          <Badge variant={
                            error.severity === 'critical' ? 'destructive' : 'secondary'
                          }>
                            {error.severity}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="font-medium text-sm mb-1">{error.error.message}</p>
                      <p className="text-xs text-muted-foreground">{error.context.url}</p>
                      {error.userId && (
                        <p className="text-xs text-muted-foreground mt-1">User: {error.userId}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
