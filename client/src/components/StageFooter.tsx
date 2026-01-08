import { Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface StageFooterProps {
    currentStage: string;
    canProceed: boolean;
    onProceed: () => void;
    isLoading?: boolean;
}

export function StageFooter({ currentStage, canProceed, onProceed, isLoading }: StageFooterProps) {
    const STAGES = [
        { id: 'inputting', label: 'Brief' },
        { id: 'hook_text', label: 'Text Hook' },
        { id: 'hook_verbal', label: 'Verbal Hook' },
        { id: 'hook_visual', label: 'Visual Hook' },
        { id: 'hook_overview', label: 'Review' }
    ];

    const currentIndex = STAGES.findIndex(s => s.id === currentStage);

    // If we can't find the stage (e.g. generating/complete), don't show footer or show minimal
    if (currentIndex === -1) return null;

    return (
        <div className="sticky bottom-0 left-0 right-0 bg-background/80 backdrop-blur-md border-t z-20 animate-in slide-in-from-bottom-full duration-500">
            <div className="max-w-5xl mx-auto px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">

                {/* Progress Steps */}
                <div className="flex items-center space-x-2 hidden md:flex">
                    {STAGES.map((stage, idx) => {
                        const isCompleted = idx < currentIndex;
                        const isCurrent = idx === currentIndex;

                        return (
                            <div key={stage.id} className="flex items-center">
                                <div className={cn(
                                    "flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
                                    isCompleted ? "bg-green-100 text-green-700" :
                                        isCurrent ? "bg-primary text-primary-foreground shadow-sm" :
                                            "text-muted-foreground bg-muted/50"
                                )}>
                                    {isCompleted ? (
                                        <Check className="w-3.5 h-3.5" />
                                    ) : (
                                        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">
                                            {idx + 1}
                                        </span>
                                    )}
                                    <span>{stage.label}</span>
                                </div>

                                {idx < STAGES.length - 1 && (
                                    <div className={cn(
                                        "w-6 h-px mx-1",
                                        idx < currentIndex ? "bg-green-200" : "bg-border"
                                    )} />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Mobile Simple Progress */}
                <div className="md:hidden text-sm text-muted-foreground font-medium">
                    Step {currentIndex + 1} of {STAGES.length}: <span className="text-foreground">{STAGES[currentIndex].label}</span>
                </div>

                {/* Action Button */}
                <Button
                    onClick={onProceed}
                    disabled={!canProceed || isLoading}
                    size="lg"
                    className={cn(
                        "rounded-full shadow-lg transition-all duration-300",
                        "px-6 h-10 text-sm md:px-8 md:h-11 md:text-base", // Responsive size
                        canProceed ? "hover:scale-105 active:scale-95" : "opacity-80"
                    )}
                >
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2 font-semibold">
                            Continue
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
