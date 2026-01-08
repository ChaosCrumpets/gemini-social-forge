import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Crown, Video, Camera, Move, Eye, Layers, Type, Wand2, Film, Copy, Check } from 'lucide-react';
import type { VisualHook, VisualContext } from '@shared/schema';
import { HookCard } from './HookCard';

interface VisualHookStageProps {
  hooks: VisualHook[];
  onSelectHook: (hook: VisualHook) => void;
  selectedHookId?: string;
  disabled?: boolean;
  visualContext?: VisualContext;
  onVisualContextChange?: (context: VisualContext) => void;
  showContextForm?: boolean;
  onContextSubmit?: () => void;
  isLoadingHooks?: boolean;
}

const hookIcons: Record<string, typeof Video> = {
  dynamic_movement: Move,
  close_up_reveal: Eye,
  environment_establish: Layers,
  action_in_progress: Camera,
  contrast_cut: Video,
  text_focused: Type,
  default: Video
};

const locationOptions = [
  { value: 'desk_office', label: 'Desk / Office' },
  { value: 'standing_wall', label: 'Standing / Wall' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'car', label: 'Car' },
  { value: 'gym', label: 'Gym' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'studio', label: 'Professional Studio' },
  { value: 'other', label: 'Other / Flexible' }
];

const lightingOptions = [
  { value: 'natural_window', label: 'Natural Window Light' },
  { value: 'ring_light', label: 'Ring Light' },
  { value: 'professional_studio', label: 'Professional Studio' },
  { value: 'dark_moody', label: 'Dark / Moody' },
  { value: 'mixed', label: 'Mixed Sources' }
];

export function VisualHookStage({
  hooks,
  onSelectHook,
  selectedHookId,
  disabled = false,
  visualContext,
  onVisualContextChange,
  showContextForm = false,
  onContextSubmit,
  isLoadingHooks = false
}: VisualHookStageProps) {

  if (showContextForm && onVisualContextChange && onContextSubmit) {
    return (
      <VisualContextForm
        context={visualContext || {}}
        onChange={onVisualContextChange}
        onSubmit={onContextSubmit}
        isLoading={isLoadingHooks}
      />
    );
  }

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
          Stage 3 of 3
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Select Your Visual Hook
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Choose the opening visual. Each option includes filming instructions AND an AI generation prompt.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto px-4">
        {sortedHooks.map((hook) => (
          <VisualHookCard
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

interface VisualContextFormProps {
  context: VisualContext;
  onChange: (context: VisualContext) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

function VisualContextForm({ context, onChange, onSubmit, isLoading }: VisualContextFormProps) {
  return (
    <div className="py-8">
      <div className="text-center mb-8">
        <Badge variant="outline" className="mb-4 text-xs font-mono uppercase tracking-widest">
          Stage 3 of 3 - Setup
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Your Production Setup
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Tell us about your filming environment so we can generate visual hooks that work for you.
        </p>
      </div>

      <Card className="max-w-md mx-auto p-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="location">Where are you filming?</Label>
            <Select
              value={context.location}
              onValueChange={(value) => onChange({ ...context, location: value as VisualContext['location'] })}
            >
              <SelectTrigger id="location" data-testid="select-location">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                {locationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lighting">What is your lighting setup?</Label>
            <Select
              value={context.lighting}
              onValueChange={(value) => onChange({ ...context, lighting: value as VisualContext['lighting'] })}
            >
              <SelectTrigger id="lighting" data-testid="select-lighting">
                <SelectValue placeholder="Select lighting" />
              </SelectTrigger>
              <SelectContent>
                {lightingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="on-camera">Will you appear on camera?</Label>
              <p className="text-xs text-muted-foreground">
                If no, we'll focus on B-roll and text-based visuals
              </p>
            </div>
            <Switch
              id="on-camera"
              checked={context.onCamera ?? true}
              onCheckedChange={(checked) => onChange({ ...context, onCamera: checked })}
              data-testid="switch-on-camera"
            />
          </div>

          <Button
            className="w-full"
            onClick={onSubmit}
            disabled={isLoading || !context.location || !context.lighting}
            data-testid="button-generate-visual-hooks"
          >
            {isLoading ? (
              <>
                <Wand2 className="w-4 h-4 mr-2 animate-pulse" />
                Generating Visual Hooks...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Visual Hooks
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}

interface VisualHookCardProps {
  hook: VisualHook & { rank: number; isRecommended: boolean };
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function VisualHookCard({ hook, isSelected, onSelect, disabled }: VisualHookCardProps) {
  const [showGenAi, setShowGenAi] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <HookCard
      hook={{
        ...hook,
        type: 'visual',
        description: hook.sceneDescription
      }}
      isSelected={isSelected}
      onSelect={onSelect}
      disabled={disabled}
    >
      {/* Custom children for Visual Hook specific actions (GenAI toggles) */}
      <div className="space-y-3 flex-1">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className="text-xs font-mono uppercase tracking-widest">
            {hook.type.replace(/_/g, ' ')}
          </Badge>

          <div className="flex gap-1 ml-auto" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              variant={showGenAi ? "outline" : "default"}
              className="text-xs h-7"
              onClick={(e) => { e.stopPropagation(); setShowGenAi(false); }}
            >
              <Film className="w-3 h-3 mr-1" />
              FIY
            </Button>
            <Button
              size="sm"
              variant={showGenAi ? "default" : "outline"}
              className="text-xs h-7"
              onClick={(e) => { e.stopPropagation(); setShowGenAi(true); }}
            >
              <Wand2 className="w-3 h-3 mr-1" />
              GenAI
            </Button>
          </div>
        </div>

        {hook.sceneDescription && (
          <p className="font-semibold text-base mb-3 leading-tight">
            {hook.sceneDescription}
          </p>
        )}

        <div className="bg-muted/50 rounded-lg p-4 relative" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono uppercase text-muted-foreground">
              {showGenAi ? 'AI Generation Prompt' : 'Filming Instructions'}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              onClick={(e) => handleCopy(e, showGenAi ? hook.genAiPrompt : hook.fiyGuide)}
              data-testid={`copy-${showGenAi ? 'genai' : 'fiy'}-${hook.id}`}
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            </Button>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {showGenAi ? hook.genAiPrompt : hook.fiyGuide}
          </p>
        </div>
      </div>
    </HookCard>
  );
}
