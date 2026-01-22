import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Circle, ArrowRight, Check } from 'lucide-react';
import type { ProjectStatusType } from '@shared/schema';
import { ProjectStatus } from '@shared/schema';

interface StatusBarProps {
  status: ProjectStatusType;
  highestReachedStatus?: ProjectStatusType;
  onNavigate?: (status: ProjectStatusType) => void;
}

const statusLabels: Record<ProjectStatusType, string> = {
  [ProjectStatus.INPUTTING]: 'Gathering Inputs',
  [ProjectStatus.HOOK_TEXT]: 'Text Hook',
  [ProjectStatus.HOOK_VERBAL]: 'Verbal Hook',
  [ProjectStatus.HOOK_VISUAL]: 'Visual Hook',
  [ProjectStatus.HOOK_OVERVIEW]: 'Review',
  [ProjectStatus.GENERATING]: 'Generating Content',
  [ProjectStatus.COMPLETE]: 'Complete'
};

const statusOrder: ProjectStatusType[] = [
  ProjectStatus.INPUTTING,
  ProjectStatus.HOOK_TEXT,
  ProjectStatus.HOOK_VERBAL,
  ProjectStatus.HOOK_VISUAL,
  ProjectStatus.HOOK_OVERVIEW,
  ProjectStatus.GENERATING,
  ProjectStatus.COMPLETE
];

export { statusOrder };

export function StatusBar({ status, highestReachedStatus, onNavigate }: StatusBarProps) {
  const currentIndex = statusOrder.indexOf(status);
  const highestIndex = highestReachedStatus ? statusOrder.indexOf(highestReachedStatus) : currentIndex;

  const handleClick = (step: ProjectStatusType, index: number) => {
    if (!onNavigate) return;

    // Can only navigate to steps that have been completed (at or before highest reached)
    if (index <= highestIndex && step !== status) {
      onNavigate(step);
    }
  };

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 p-3 sm:p-4 bg-muted border-b border-border overflow-x-auto flex-shrink-0 min-h-[60px]">
      {statusOrder.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;
        const isClickable = !!(onNavigate && index <= highestIndex && step !== status);
        const wasReached = index <= highestIndex;

        return (
          <div key={step} className="flex items-center gap-1 sm:gap-2 shrink-0">
            <StatusStep
              label={statusLabels[step]}
              isComplete={isComplete}
              isCurrent={isCurrent}
              isPending={isPending}
              isClickable={isClickable}
              wasReached={wasReached}
              onClick={() => handleClick(step, index)}
            />
            {index < statusOrder.length - 1 && (
              <ArrowRight className={`w-3 h-3 sm:w-4 sm:h-4 ${wasReached ? 'text-primary' : 'text-muted-foreground/30'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StatusStepProps {
  label: string;
  isComplete: boolean;
  isCurrent: boolean;
  isPending: boolean;
  isClickable: boolean;
  wasReached: boolean;
  onClick: () => void;
}

function StatusStep({ label, isComplete, isCurrent, isPending, isClickable, wasReached, onClick }: StatusStepProps) {
  let variant: 'default' | 'secondary' | 'outline' = 'outline';
  let indicatorClass = 'bg-muted-foreground/30';

  if (isComplete) {
    variant = 'default';
    indicatorClass = 'bg-primary';
  } else if (isCurrent) {
    variant = 'secondary';
    indicatorClass = 'bg-amber-500 animate-pulse';
  } else if (wasReached) {
    variant = 'outline';
    indicatorClass = 'bg-primary/50';
  }

  const badge = (
    <Badge
      variant={variant}
      className={`
        text-[10px] sm:text-xs font-mono font-bold uppercase tracking-widest gap-1 sm:gap-2 px-2 py-0.5 sm:px-3 sm:py-1
        transition-all duration-200
        ${isPending && !wasReached ? 'opacity-50' : ''}
        ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105' : ''}
      `}
      onClick={isClickable ? onClick : undefined}
      data-testid={`status-step-${label.toLowerCase().replace(/\s+/g, '-')}`}
    >
      {isComplete ? (
        <Check className="w-2 h-2 sm:w-3 sm:h-3" />
      ) : (
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 ${indicatorClass} rounded-full`} />
      )}
      {label}
    </Badge>
  );

  if (isClickable) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span>{badge}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click to go back to {label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return badge;
}
