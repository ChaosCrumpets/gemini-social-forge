import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, ArrowLeft, Loader2, Sparkles, Zap, Infinity } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

const premiumFeatures = [
  { icon: Infinity, text: "Unlimited content generation", id: "unlimited" },
  { icon: Sparkles, text: "Access to all hook styles", id: "hooks" },
  { icon: Zap, text: "Priority processing", id: "priority" },
  { icon: Crown, text: "Premium templates & prompts", id: "templates" },
];

export default function UpgradePage() {
  const { toast } = useToast();

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/create-checkout-session");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.url) {
        window.location.href = data.url;
      }
    },
    onError: () => {
      toast({
        title: "Unable to start checkout",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="container mx-auto p-6 max-w-2xl" data-testid="upgrade-page">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/">
          <Button variant="ghost" size="icon" data-testid="button-upgrade-back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-upgrade-title">Upgrade to Premium</h1>
          <p className="text-muted-foreground" data-testid="text-upgrade-subtitle">Unlock the full power of C.A.L.</p>
        </div>
      </div>

      <Card className="relative overflow-visible">
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white border-0 px-4 dark:from-yellow-600 dark:to-amber-600" data-testid="badge-premium">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
        <CardHeader className="text-center pt-8">
          <CardTitle className="text-3xl" data-testid="text-plan-title">C.A.L. Premium</CardTitle>
          <CardDescription data-testid="text-plan-description">
            Everything you need to create viral content
          </CardDescription>
          <div className="mt-4">
            <span className="text-4xl font-bold" data-testid="text-price">$19.99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {premiumFeatures.map((feature) => (
              <li key={feature.id} className="flex items-center gap-3" data-testid={`feature-item-${feature.id}`}>
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span data-testid={`text-feature-${feature.id}`}>{feature.text}</span>
              </li>
            ))}
          </ul>

          <Button
            className="w-full"
            size="lg"
            onClick={() => checkoutMutation.mutate()}
            disabled={checkoutMutation.isPending}
            data-testid="button-subscribe"
          >
            {checkoutMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown className="mr-2 h-4 w-4" />
                Subscribe Now
              </>
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground" data-testid="text-stripe-note">
            Cancel anytime. Secure payment powered by Stripe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
