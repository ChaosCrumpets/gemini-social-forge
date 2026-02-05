import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DollarSign, Zap, Activity } from 'lucide-react';

interface UsageSummary {
    totalGenerations: number;
    tokensUsed: number;
    costUSD: number;
    lastUsed: string | null;
}

interface CostBreakdown {
    [feature: string]: {
        count: number;
        cost: number;
        tokens: number;
    };
}

export function UsageDashboard() {
    const { data, isLoading } = useQuery({
        queryKey: ['/api/users/me/usage'],
        queryFn: async () => {
            const response = await apiRequest('GET', '/api/users/me/usage');
            return response.json();
        },
    });

    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map(i => (
                    <Card key={i} className="animate-pulse">
                        <CardHeader className="pb-2">
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const summary = data?.summary as UsageSummary;
    const breakdown = data?.breakdown as CostBreakdown;

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Generations</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summary?.totalGenerations || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            All-time content created
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Tokens Used</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(summary?.tokensUsed || 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Input + Output tokens
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
                            ${(summary?.costUSD || 0).toFixed(4)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Claude API usage
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Cost Breakdown by Feature */}
            {breakdown && Object.keys(breakdown).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Cost Breakdown (Last 30 Days)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {Object.entries(breakdown).map(([feature, stats]) => {
                            const featureLabels: Record<string, string> = {
                                discovery: 'Discovery Questions',
                                hook_generation: 'Hook Generation',
                                content_generation: 'Content Generation',
                                editing: 'Content Editing',
                            };

                            const totalCost = Object.values(breakdown).reduce((sum, s) => sum + s.cost, 0);
                            const percentage = totalCost > 0 ? (stats.cost / totalCost) * 100 : 0;

                            return (
                                <div key={feature}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium">
                                            {featureLabels[feature] || feature}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            ${stats.cost.toFixed(4)} ({stats.count} uses)
                                        </span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                </div>
                            );
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
