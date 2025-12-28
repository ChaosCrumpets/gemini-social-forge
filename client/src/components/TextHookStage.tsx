import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Type, AlignLeft, MessageSquare, Zap, Eye, Award } from 'lucide-react';
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
          <TextHookCard
            key={hook.id}
            hook={hook}
            isSelected={selectedHookId === hook.id}
            onSelect={() => onSelectHook(hook)}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

interface TextHookCardProps {
  hook: TextHook & { rank: number; isRecommended: boolean };
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function TextHookCard({ hook, isSelected, onSelect, disabled }: TextHookCardProps) {
  const hookType = hook.type?.toLowerCase() || 'default';
  const Icon = hookIcons[hookType] || hookIcons.default;
  
  return (
    <Card
      className={`
        p-6 cursor-pointer transition-all duration-200 relative
        hover-elevate active-elevate-2
        ${hook.isRecommended 
          ? 'border-amber-500/50 border-2 ring-1 ring-amber-500/20' 
          : isSelected 
            ? 'border-primary border-2 bg-primary/5' 
            : 'border-card-border'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      onClick={() => !disabled && onSelect()}
      data-testid={`text-hook-card-${hook.id}`}
    >
      <div 
        className={`
          absolute -top-2 -left-2 w-7 h-7 rounded-full flex items-center justify-center
          text-xs font-bold shadow-sm
          ${hook.isRecommended 
            ? 'bg-amber-500 text-amber-950' 
            : 'bg-muted text-muted-foreground border border-border'
          }
        `}
        data-testid={`rank-badge-${hook.id}`}
      >
        {hook.rank}
      </div>
      
      {hook.isRecommended && (
        <div className="absolute -top-2 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-amber-950 text-xs font-semibold shadow-sm" data-testid={`recommended-badge-${hook.id}`}>
          <Crown className="w-3 h-3" />
          <span>Recommended</span>
        </div>
      )}
      
      <div className="flex items-start gap-4 mt-2">
        <div className={`
          p-2 rounded-lg
          ${hook.isRecommended 
            ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' 
            : isSelected 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted'
          }
        `}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge 
              variant="secondary" 
              className="text-xs font-mono uppercase tracking-widest"
            >
              {hook.type.replace('_', ' ')}
            </Badge>
            {hook.placement && (
              <Badge variant="outline" className="text-xs">
                {hook.placement.replace('_', ' ')}
              </Badge>
            )}
          </div>
          
          <p className="font-bold text-xl leading-tight tracking-tight">
            {hook.content}
          </p>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-4 pt-4 border-t border-primary/20">
          <span className="text-xs font-mono uppercase tracking-widest text-primary">
            Selected
          </span>
        </div>
      )}
    </Card>
  );
}
