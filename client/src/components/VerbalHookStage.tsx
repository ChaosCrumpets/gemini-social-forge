import { Badge } from '@/components/ui/badge';
import { HookCard } from './HookCard';
import { Mic, Clock, AlertTriangle, Trophy, Heart, Zap, HelpCircle } from 'lucide-react';
import type { VerbalHook } from '@shared/schema';

interface VerbalHookStageProps {
  hooks: VerbalHook[];
  onSelectHook: (hook: VerbalHook) => void;
  selectedHookId?: string;
  disabled?: boolean;
}

const hookIcons: Record<string, typeof Mic> = {
  effort_condensed: Clock,
  failure: AlertTriangle,
  credibility_arbitrage: Trophy,
  shared_emotion: Heart,
  pattern_interrupt: Zap,
  direct_question: HelpCircle,
  default: Mic
};

const emotionColors: Record<string, string> = {
  curiosity: 'text-blue-500',
  empathy: 'text-pink-500',
  urgency: 'text-red-500',
  surprise: 'text-purple-500',
  validation: 'text-green-500'
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
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4 text-xs font-mono uppercase tracking-widest">
          Stage 2 of 3
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Select Your Verbal Hook
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Choose the first words you will speak. This script opener hooks viewers in the first 2-5 seconds.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4">
        {sortedHooks.map((hook) => (
          <HookCard
            key={hook.id}
            hook={{
              ...hook,
              type: 'verbal',
              description: `Trigger: ${hook.emotionalTrigger || 'None'}`,
              title: `"${hook.content}"`
            }}
            isSelected={selectedHookId === hook.id}
            onSelect={() => onSelectHook(hook)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}


