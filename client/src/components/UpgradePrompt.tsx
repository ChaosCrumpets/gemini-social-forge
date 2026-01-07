import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Crown, Sparkles, Zap, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    feature?: string;
    requiredTier?: string;
}

export function UpgradePrompt({ isOpen, onClose, feature = 'this feature', requiredTier = 'premium' }: UpgradePromptProps) {
    const [, navigate] = useLocation();

    const handleUpgrade = () => {
        onClose();
        navigate('/membership');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md" data-testid="dialog-upgrade-prompt">
                <DialogHeader className="text-center">
                    <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-yellow-600 flex items-center justify-center">
                        <Crown className="h-8 w-8 text-white" />
                    </div>
                    <DialogTitle className="text-xl" data-testid="text-upgrade-title">
                        Upgrade Required
                    </DialogTitle>
                    <DialogDescription className="text-center">
                        <span className="block mt-2" data-testid="text-upgrade-description">
                            <Lock className="inline h-4 w-4 mr-1" />
                            Access to <strong>{feature}</strong> requires a <strong className="capitalize">{requiredTier}</strong> subscription.
                        </span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-4">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Sparkles className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Unlock Premium Features</p>
                            <p className="text-xs text-muted-foreground">
                                Get access to advanced hooks, unlimited generations, and priority support.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                        <Zap className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-sm">Faster Generation</p>
                            <p className="text-xs text-muted-foreground">
                                Skip the queue and get your content generated instantly.
                            </p>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col gap-2 sm:flex-col">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700"
                        data-testid="button-upgrade-now"
                    >
                        <Crown className="h-4 w-4 mr-2" />
                        Upgrade Now
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="w-full"
                        data-testid="button-upgrade-later"
                    >
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Hook to use upgrade prompt
import { useState, useCallback } from 'react';

export function useUpgradePrompt() {
    const [isOpen, setIsOpen] = useState(false);
    const [feature, setFeature] = useState('');
    const [requiredTier, setRequiredTier] = useState('premium');

    const showUpgradePrompt = useCallback((featureName: string, tier: string = 'premium') => {
        setFeature(featureName);
        setRequiredTier(tier);
        setIsOpen(true);
    }, []);

    const closeUpgradePrompt = useCallback(() => {
        setIsOpen(false);
    }, []);

    const UpgradePromptComponent = useCallback(() => (
        <UpgradePrompt
            isOpen={isOpen}
            onClose={closeUpgradePrompt}
            feature={feature}
            requiredTier={requiredTier}
        />
    ), [isOpen, closeUpgradePrompt, feature, requiredTier]);

    return {
        showUpgradePrompt,
        closeUpgradePrompt,
        UpgradePromptComponent,
        isUpgradePromptOpen: isOpen
    };
}
