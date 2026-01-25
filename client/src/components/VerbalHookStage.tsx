import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Check, Mic, Clock, AlertTriangle, Trophy, Heart, Zap, HelpCircle,
  Brain, Sparkles, Activity, MessageCircle
} from 'lucide-react';
import type { VerbalHook } from '@shared/schema';

interface VerbalHookStageProps {
  hooks: VerbalHook[];
  onSelectHook: (hook: VerbalHook) => void;
  selectedHookId?: string;
  disabled?: boolean;
}

// Hook category display configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Mic; color: string; bgColor: string }> = {
  effort_condensed: { label: 'Effort Condensed', icon: Clock, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  failure: { label: 'Failure Hook', icon: AlertTriangle, color: 'text-red-700', bgColor: 'bg-red-100' },
  credibility_arbitrage: { label: 'Credibility', icon: Trophy, color: 'text-amber-700', bgColor: 'bg-amber-100' },
  shared_emotion: { label: 'Shared Emotion', icon: Heart, color: 'text-pink-700', bgColor: 'bg-pink-100' },
  pattern_interrupt: { label: 'Pattern Interrupt', icon: Zap, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  direct_question: { label: 'Direct Question', icon: HelpCircle, color: 'text-green-700', bgColor: 'bg-green-100' },
};

// Neurobiology trigger display configuration
const NEURO_CONFIG: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  'RAS': { label: 'RAS Activation', icon: Activity, color: 'text-rose-600' },
  'mirror_neurons': { label: 'Mirror Neurons', icon: Heart, color: 'text-pink-600' },
  'dopamine': { label: 'Dopamine', icon: Sparkles, color: 'text-yellow-600' },
  'amygdala': { label: 'Amygdala', icon: Brain, color: 'text-red-600' },
};

// Emotional trigger badges
const EMOTION_CONFIG: Record<string, { color: string }> = {
  curiosity: { color: 'bg-blue-100 text-blue-700' },
  empathy: { color: 'bg-pink-100 text-pink-700' },
  urgency: { color: 'bg-red-100 text-red-700' },
  surprise: { color: 'bg-purple-100 text-purple-700' },
  validation: { color: 'bg-green-100 text-green-700' },
};

export function VerbalHookStage({
  hooks,
  onSelectHook,
  selectedHookId,
  disabled = false
}: VerbalHookStageProps) {
  const hooksWithFallbackRanks = hooks.map((hook, index) => ({
    ...hook,
    rank: hook.rank ?? (index + 1),
    isRecommended: hook.isRecommended ?? (index === 0)
  }));

  const sortedHooks = [...hooksWithFallbackRanks].sort((a, b) => a.rank - b.rank);

  return (
    <div className="py-8">
      {/* Header Section */}
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-4 text-xs font-mono uppercase tracking-widest border-primary/30">
          Stage 2 of 3
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          Select Your Verbal Hook
        </h2>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
          Choose the first words you will speak. This <strong>script opener</strong> hooks viewers in the first <strong>2-5 seconds</strong> — the make-or-break moment for watch time.
        </p>
      </div>

      {/* Hooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto px-4">
        {sortedHooks.map((hook, index) => {
          const isSelected = selectedHookId === hook.id;
          const category = hook.category || hook.type || 'pattern_interrupt';
          const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.pattern_interrupt;
          const neuroTrigger = hook.neurobiologyTrigger || 'dopamine';
          const neuroConfig = NEURO_CONFIG[neuroTrigger] || NEURO_CONFIG.dopamine;
          const CategoryIcon = categoryConfig.icon;
          const NeuroIcon = neuroConfig.icon;
          const emotionConfig = EMOTION_CONFIG[hook.emotionalTrigger || ''] || { color: 'bg-gray-100 text-gray-700' };

          return (
            <motion.div
              key={hook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              onClick={!disabled ? () => onSelectHook(hook) : undefined}
              className={cn(
                "relative group cursor-pointer transition-all duration-300",
                !disabled && "hover:-translate-y-1 hover:shadow-xl active:scale-[0.98]",
                disabled && "opacity-60 cursor-not-allowed"
              )}
            >
              <Card className={cn(
                "h-full overflow-hidden border-2 transition-all duration-300",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg ring-2 ring-primary/20"
                  : "border-border/50 hover:border-primary/30 bg-card"
              )}>
                {/* Recommended Badge */}
                {hook.isRecommended && (
                  <div className="absolute -top-2 left-4 z-10">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      ⭐ Recommended
                    </Badge>
                  </div>
                )}

                {/* Selection Checkmark */}
                <div className={cn(
                  "absolute top-4 right-4 z-10 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300",
                  isSelected
                    ? "bg-primary text-primary-foreground scale-100"
                    : "bg-muted text-muted-foreground scale-90 opacity-0 group-hover:opacity-100"
                )}>
                  <Check className="w-4 h-4 stroke-[3px]" />
                </div>

                <div className="p-5 space-y-4">
                  {/* Category & Neurobiology Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] font-semibold uppercase tracking-wide gap-1", categoryConfig.bgColor, categoryConfig.color)}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {categoryConfig.label}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px] gap-1 border-dashed", neuroConfig.color)}
                    >
                      <NeuroIcon className="w-3 h-3" />
                      {neuroConfig.label}
                    </Badge>
                  </div>

                  {/* Main Hook Content - Quote Style */}
                  <div className="relative pl-4 border-l-4 border-primary/30">
                    <MessageCircle className="absolute -left-3 -top-1 w-5 h-5 text-primary/50 bg-card" />
                    <h3 className="text-lg font-semibold leading-snug text-foreground italic">
                      "{hook.content}"
                    </h3>
                  </div>

                  {/* Triggers Row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {hook.emotionalTrigger && (
                      <Badge variant="outline" className={cn("text-[10px]", emotionConfig.color)}>
                        ❤️ {hook.emotionalTrigger}
                      </Badge>
                    )}
                    {hook.retentionTrigger && (
                      <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700">
                        🎯 {hook.retentionTrigger.replace(/_/g, ' ')}
                      </Badge>
                    )}
                  </div>

                  {/* Description */}
                  {hook.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {hook.description}
                    </p>
                  )}

                  {/* Research Source */}
                  {hook.researchSource && (
                    <div className="flex items-start gap-2 pt-2 border-t border-border/50">
                      <span className="text-purple-500">💡</span>
                      <p className="text-xs text-muted-foreground italic">
                        {hook.researchSource}
                      </p>
                    </div>
                  )}

                  {/* Rank Indicator */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground font-mono">
                      Rank #{hook.rank}
                    </span>
                  </div>
                </div>

                {/* Selection Highlight Bar */}
                <div className={cn(
                  "h-1 w-full transition-all duration-300",
                  isSelected
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-transparent group-hover:bg-primary/20"
                )} />
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
