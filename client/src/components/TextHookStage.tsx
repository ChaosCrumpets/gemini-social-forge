import { HookCard } from './HookCard';
import { Badge } from '@/components/ui/badge';
import { Type, AlignLeft, MessageSquare, Zap, Eye, Award } from 'lucide-react';
import type { TextHook } from '@shared/schema';

interface TextHookStageProps {
  hooks: TextHook[];
  onSelectHook: (hook: TextHook) => void;
  selectedHookId?: string;
  disabled?: boolean;
}

const hookIcons: Record<string, typeof Type> = {
  bold_statement: Zap,
  listicle: AlignLeft,
  question: MessageSquare,
  contrast: Eye,
  secret: Award,
  result: Award,
  default: Type
};

export function TextHookStage({
  hooks,
  onSelectHook,
  selectedHookId,
  disabled = false
}: TextHookStageProps) {
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
          Stage 1 of 3
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Select Your Text Hook
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Choose the on-screen text that will appear first. This is what viewers read on thumbnails, title cards, and caption overlays.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto px-4">
        {sortedHooks.map((hook) => (
          <HookCard
            key={hook.id}
            hook={{
              ...hook,
              type: 'text'
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


