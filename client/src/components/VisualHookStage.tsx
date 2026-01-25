import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  Check, Crown, Video, Camera, Move, Eye, Layers, Type, Wand2, Film, Copy,
  Brain, Sparkles, Heart, Activity
} from 'lucide-react';
import type { VisualHook, VisualContext } from '@shared/schema';

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

// Hook category display configuration
const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof Video; color: string; bgColor: string }> = {
  dynamic_movement: { label: 'Dynamic Movement', icon: Move, color: 'text-blue-700', bgColor: 'bg-blue-100' },
  close_up_reveal: { label: 'Close-Up Reveal', icon: Eye, color: 'text-purple-700', bgColor: 'bg-purple-100' },
  environment_establish: { label: 'Environment', icon: Layers, color: 'text-green-700', bgColor: 'bg-green-100' },
  action_in_progress: { label: 'Action Shot', icon: Camera, color: 'text-orange-700', bgColor: 'bg-orange-100' },
  contrast_cut: { label: 'Contrast Cut', icon: Video, color: 'text-red-700', bgColor: 'bg-red-100' },
  text_focused: { label: 'Text Focused', icon: Type, color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
};

// Neurobiology trigger display configuration
const NEURO_CONFIG: Record<string, { label: string; icon: typeof Brain; color: string }> = {
  'RAS': { label: 'RAS Activation', icon: Activity, color: 'text-rose-600' },
  'mirror_neurons': { label: 'Mirror Neurons', icon: Heart, color: 'text-pink-600' },
  'dopamine': { label: 'Dopamine', icon: Sparkles, color: 'text-yellow-600' },
  'amygdala': { label: 'Amygdala', icon: Brain, color: 'text-red-600' },
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
      {/* Header Section */}
      <div className="text-center mb-10">
        <Badge variant="outline" className="mb-4 text-xs font-mono uppercase tracking-widest border-primary/30">
          Stage 3 of 3
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-3">
          Select Your Visual Hook
        </h2>
        <p className="text-muted-foreground text-sm max-w-xl mx-auto leading-relaxed">
          Choose the opening visual. Each option includes <strong>filming instructions (FIY)</strong> AND an <strong>AI generation prompt</strong> — the first frame that captures attention.
        </p>
      </div>

      {/* Hooks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto px-4">
        {sortedHooks.map((hook, index) => (
          <EnhancedVisualHookCard
            key={hook.id}
            hook={hook}
            index={index}
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
        <Badge variant="outline" className="mb-4 text-xs font-mono uppercase tracking-widest border-primary/30">
          Stage 3 of 3 - Setup
        </Badge>
        <h2 className="text-2xl font-semibold tracking-tight mb-2">
          Your Production Setup
        </h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">
          Tell us about your filming environment so we can generate visual hooks that work for you.
        </p>
      </div>

      <Card className="max-w-md mx-auto p-6 border-2">
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

interface EnhancedVisualHookCardProps {
  hook: VisualHook & { rank: number; isRecommended: boolean };
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

function EnhancedVisualHookCard({ hook, index, isSelected, onSelect, disabled }: EnhancedVisualHookCardProps) {
  const [showGenAi, setShowGenAi] = useState(false);
  const [copied, setCopied] = useState(false);

  const category = hook.category || hook.type || 'dynamic_movement';
  const categoryConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.dynamic_movement;
  const neuroTrigger = hook.neurobiologyTrigger || 'RAS';
  const neuroConfig = NEURO_CONFIG[neuroTrigger] || NEURO_CONFIG.RAS;
  const CategoryIcon = categoryConfig.icon;
  const NeuroIcon = neuroConfig.icon;

  const handleCopy = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      onClick={!disabled ? onSelect : undefined}
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
            <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold uppercase tracking-wider shadow-sm">
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

          {/* Scene Description */}
          {hook.sceneDescription && (
            <h3 className="text-lg font-bold leading-snug text-foreground">
              {hook.sceneDescription}
            </h3>
          )}

          {/* Description */}
          {hook.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {hook.description}
            </p>
          )}

          {/* FIY / GenAI Toggle */}
          <div className="flex gap-2" onClick={e => e.stopPropagation()}>
            <Button
              size="sm"
              variant={showGenAi ? "outline" : "default"}
              className="text-xs h-8 flex-1"
              onClick={(e) => { e.stopPropagation(); setShowGenAi(false); }}
            >
              <Film className="w-3 h-3 mr-1" />
              FIY Instructions
            </Button>
            <Button
              size="sm"
              variant={showGenAi ? "default" : "outline"}
              className="text-xs h-8 flex-1"
              onClick={(e) => { e.stopPropagation(); setShowGenAi(true); }}
            >
              <Wand2 className="w-3 h-3 mr-1" />
              AI Prompt
            </Button>
          </div>

          {/* Content Panel */}
          <div className="bg-muted/50 rounded-lg p-4 relative" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase text-muted-foreground">
                {showGenAi ? '🎨 AI Generation Prompt' : '🎬 Filming Instructions'}
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

          {/* Research Source */}
          {hook.researchSource && (
            <div className="flex items-start gap-2 pt-2 border-t border-border/50">
              <span className="text-indigo-500">💡</span>
              <p className="text-xs text-muted-foreground italic">
                {hook.researchSource}
              </p>
            </div>
          )}

          {/* Rank Indicator */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-mono">
              Rank #{hook.rank}
            </span>
          </div>
        </div>

        {/* Selection Highlight Bar */}
        <div className={cn(
          "h-1 w-full transition-all duration-300",
          isSelected
            ? "bg-gradient-to-r from-indigo-500 to-purple-500"
            : "bg-transparent group-hover:bg-primary/20"
        )} />
      </Card>
    </motion.div>
  );
}
