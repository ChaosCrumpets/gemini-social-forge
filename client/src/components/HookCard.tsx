import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';

// Generic hook type to handle Text, Verbal, and Visual hooks
export interface BaseHook {
    id: string;
    title?: string; // Optional since text hooks technically use 'content' as title
    content?: string; // Optional since visual hooks focus on description
    description?: string;
    type: 'text' | 'verbal' | 'visual';
    estimatedDuration?: string;
}

interface HookCardProps {
    hook: BaseHook;
    isSelected: boolean;
    onSelect: () => void;
    disabled?: boolean;
    children?: React.ReactNode; // For custom content rendering (like visual storyboard frames)
    className?: string;
}

export function HookCard({
    hook,
    isSelected,
    onSelect,
    disabled = false,
    children,
    className
}: HookCardProps) {
    // Determine title-like content for display
    const titleDisplay = hook.title || hook.content || "Untitled Hook";
    const descDisplay = hook.description || (hook.title ? hook.content : "");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onClick={!disabled ? onSelect : undefined}
            className={cn(
                "relative group cursor-pointer transition-all duration-300 transform",
                !disabled && "md:hover:-translate-y-1 md:hover:shadow-lg active:scale-95",
                isSelected
                    ? "ring-2 ring-blue-600 shadow-md scale-[1.01]"
                    : "md:hover:border-blue-300",
                disabled && "opacity-60 cursor-not-allowed hover:transform-none hover:shadow-none",
                className
            )}
        >
            <Card className={cn(
                "h-full overflow-hidden border-2 transition-colors duration-200",
                isSelected ? "border-blue-600 bg-blue-50/30" : "border-transparent bg-card"
            )}>
                {/* Selection Indicator Checkmark */}
                <div className={cn(
                    "absolute top-3 right-3 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300 shadow-sm",
                    isSelected
                        ? "bg-blue-600 text-white translate-y-0 opacity-100"
                        : "bg-gray-200 text-gray-400 translate-y-1 opacity-0 group-hover:opacity-100"
                )}>
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                </div>

                {/* Content Area */}
                <div className="p-4 md:p-5 h-full flex flex-col">
                    {/* Type Badge */}
                    <div className="mb-3">
                        <span className={cn(
                            "text-[10px] font-mono uppercase tracking-widest px-2 py-1 rounded-sm",
                            hook.type === 'text' ? "bg-amber-100 text-amber-800" :
                                hook.type === 'verbal' ? "bg-purple-100 text-purple-800" :
                                    "bg-indigo-100 text-indigo-800"
                        )}>
                            {hook.type} HOOK
                        </span>
                        {hook.estimatedDuration && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ⏱ {hook.estimatedDuration}
                            </span>
                        )}
                    </div>

                    {/* Render children if provided (custom visual etc), otherwise default text layout */}
                    {children || (
                        <div className="space-y-3 flex-1">
                            <h3 className="font-bold text-lg leading-tight text-foreground/90">
                                {titleDisplay}
                            </h3>
                            {descDisplay && descDisplay !== titleDisplay && (
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {descDisplay}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Selection Highlight Bar at Bottom */}
                <div className={cn(
                    "h-1.5 w-full transition-colors duration-300",
                    isSelected ? "bg-blue-600" : "bg-transparent group-hover:bg-blue-200"
                )} />
            </Card>
        </motion.div>
    );
}
