import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Crown, Check, Loader2, Sparkles, Zap, Star, Diamond, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type TierKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

interface TierInfo {
  name: string;
  price: number;
  priceLabel: string;
  color: string;
  features: string[];
}

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier: TierKey;
  isPremium: boolean;
}

const tierIcons: Record<TierKey, typeof Crown> = {
  bronze: Award,
  silver: Star,
  gold: Crown,
  platinum: Sparkles,
  diamond: Diamond
};

const tierGradients: Record<TierKey, string> = {
  bronze: "from-amber-600 to-amber-800",
  silver: "from-slate-400 to-slate-600",
  gold: "from-yellow-400 to-amber-500",
  platinum: "from-slate-300 to-slate-500",
  diamond: "from-cyan-300 to-blue-500"
};

export default function MembershipPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/me"],
    retry: false
  });

  const { data: tiers, isLoading: tiersLoading } = useQuery<Record<TierKey, TierInfo>>({
    queryKey: ["/api/tiers"]
  });

  const upgradeMutation = useMutation({
    mutationFn: async (tier: TierKey) => {
      const response = await apiRequest("POST", "/api/upgrade", { tier });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ 
        title: "Upgrade successful!", 
        description: data.message || `You are now on the ${data.subscriptionTier} tier!`
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Upgrade failed", 
        description: error.message || "Could not process upgrade", 
        variant: "destructive" 
      });
    }
  });

  if (userLoading || tiersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const tierOrder: TierKey[] = ["bronze", "silver", "gold", "platinum", "diamond"];
  const currentTierIndex = tierOrder.indexOf(user.subscriptionTier);

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-12">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">C.A.L.</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Choose Your <span className="gradient-text">Membership</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Unlock the full power of the Content Assembly Line. Select the plan that fits your creative needs.
          </p>
          <div className="mt-4">
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Current plan: <span className="font-semibold capitalize ml-1">{user.subscriptionTier}</span>
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
          {tierOrder.map((tierKey, index) => {
            const tier = tiers?.[tierKey];
            if (!tier) return null;
            
            const TierIcon = tierIcons[tierKey];
            const isCurrentTier = user.subscriptionTier === tierKey;
            const canUpgrade = index > currentTierIndex;
            const isPopular = tierKey === "gold";

            return (
              <Card 
                key={tierKey}
                className={cn(
                  "relative flex flex-col transition-all duration-200",
                  isCurrentTier && "ring-2 ring-primary",
                  isPopular && "ring-2 ring-yellow-500 shadow-lg shadow-yellow-500/20"
                )}
                data-testid={`card-tier-${tierKey}`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-500">
                      Most Popular
                    </Badge>
                  </div>
                )}
                {isCurrentTier && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="default">Current Plan</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-4">
                  <div className={cn(
                    "h-12 w-12 mx-auto rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br",
                    tierGradients[tierKey]
                  )}>
                    <TierIcon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg capitalize">{tier.name}</CardTitle>
                  <CardDescription className="mt-2">
                    <span className="text-3xl font-bold text-foreground">
                      {tier.price === 0 ? "Free" : `$${tier.price}`}
                    </span>
                    {tier.price > 0 && tierKey !== "diamond" && (
                      <span className="text-muted-foreground text-sm">/mo</span>
                    )}
                    {tierKey === "diamond" && tier.price > 0 && (
                      <span className="text-muted-foreground text-sm"> one-time</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className={cn(
                      "w-full",
                      canUpgrade && "gradient-primary",
                      isCurrentTier && "opacity-50"
                    )}
                    variant={canUpgrade ? "default" : "outline"}
                    disabled={isCurrentTier || upgradeMutation.isPending}
                    onClick={() => canUpgrade && upgradeMutation.mutate(tierKey)}
                    data-testid={`button-upgrade-${tierKey}`}
                  >
                    {upgradeMutation.isPending && upgradeMutation.variables === tierKey ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    {isCurrentTier ? "Current" : canUpgrade ? "Upgrade" : "Downgrade"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => navigate("/app")} data-testid="button-back-to-app">
            Back to App
          </Button>
        </div>
      </div>
    </div>
  );
}
