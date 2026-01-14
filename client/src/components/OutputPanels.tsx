import { useState, useRef, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, Film, Camera, Video, MessageSquare, Share2, Clapperboard, ImageIcon, Copy, Check, Download, FileSpreadsheet, Subtitles, FileDown, Lock } from 'lucide-react';
import { FloatingRemixMenu } from './FloatingRemixMenu';
import { exportToCSV, exportToSRT, exportToPDF } from '@/lib/exports';
import { useUser } from '@/hooks/use-user';
import type { ContentOutput, ScriptLine, StoryboardFrame, TechSpecs, Cinematography, BRollItem, Caption, Deployment } from '@shared/schema';

interface OutputPanelsProps {
  output: ContentOutput;
  onOutputUpdate?: (updatedOutput: ContentOutput) => void;
  projectTitle?: string;
}

export function OutputPanels({ output, onOutputUpdate, projectTitle = 'Script' }: OutputPanelsProps) {
  const [localOutput, setLocalOutput] = useState(output);
  const scriptRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: isUserLoading } = useUser();

  // 🔥 CRITICAL FIX: Update localOutput when output prop changes
  useEffect(() => {
    console.log('🔄 OutputPanels: output prop changed, updating localOutput');
    setLocalOutput(output);
  }, [output]);

  const canExport = !isUserLoading && user?.subscriptionTier && user.subscriptionTier !== 'bronze';

  const handleScriptRemix = (originalText: string, remixedText: string) => {
    const updatedScript = localOutput.script.map(line => ({
      ...line,
      text: line.text.replace(originalText, remixedText)
    }));

    const newOutput = { ...localOutput, script: updatedScript };
    setLocalOutput(newOutput);
    onOutputUpdate?.(newOutput);
  };

  const handleExport = (type: 'csv' | 'srt' | 'pdf') => {
    if (!canExport) return;

    switch (type) {
      case 'csv':
        exportToCSV(localOutput, projectTitle);
        break;
      case 'srt':
        exportToSRT(localOutput, projectTitle);
        break;
      case 'pdf':
        exportToPDF(localOutput, projectTitle);
        break;
    }
  };

  return (
    <Tabs defaultValue="script" className="h-full flex flex-col">
      <div className="border-b border-border px-4 shrink-0 flex items-center justify-between gap-2">
        <TabsList className="bg-transparent h-auto p-0 gap-1">
          <TabButton value="script" icon={FileText} label="Script" />
          <TabButton value="storyboard" icon={Film} label="Storyboard" />
          <TabButton value="cinema" icon={Camera} label="Cinematography" />
          <TabButton value="broll" icon={Video} label="B-Roll" />
          <TabButton value="captions" icon={MessageSquare} label="Captions" />
          <TabButton value="deployment" icon={Share2} label="Deployment" />
        </TabsList>

        {isUserLoading ? (
          <Button variant="outline" size="sm" className="gap-2 opacity-50" disabled data-testid="button-export-loading">
            <Download className="w-4 h-4" />
            Export
          </Button>
        ) : canExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" data-testid="button-export">
                <Download className="w-4 h-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')} data-testid="menu-export-csv">
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                CSV (Bulk Upload)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('srt')} data-testid="menu-export-srt">
                <Subtitles className="w-4 h-4 mr-2" />
                SRT (Subtitles)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')} data-testid="menu-export-pdf">
                <FileDown className="w-4 h-4 mr-2" />
                PDF (Shot List)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={-1}>
                <Button variant="outline" size="sm" className="gap-2 opacity-50 pointer-events-none" disabled data-testid="button-export-disabled">
                  <Lock className="w-4 h-4" />
                  Export
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>Upgrade to Silver for Exports</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8">
            <TabsContent value="script" className="mt-0">
              <div ref={scriptRef} className="relative">
                <ScriptPanel lines={localOutput.script} />
                <FloatingRemixMenu
                  containerRef={scriptRef as React.RefObject<HTMLElement>}
                  onRemix={handleScriptRemix}
                  context={localOutput.script.map(l => l.text).join('\n')}
                />
              </div>
            </TabsContent>

            <TabsContent value="storyboard" className="mt-0">
              <StoryboardPanel frames={localOutput.storyboard} />
            </TabsContent>

            <TabsContent value="cinema" className="mt-0">
              <CinematographyPanel specs={localOutput.cinematography || localOutput.techSpecs} />
            </TabsContent>

            <TabsContent value="broll" className="mt-0">
              <BRollPanel items={localOutput.bRoll} />
            </TabsContent>

            <TabsContent value="captions" className="mt-0">
              <CaptionsPanel captions={localOutput.captions} />
            </TabsContent>

            <TabsContent value="deployment" className="mt-0">
              {localOutput.deployment ? (
                <DeploymentPanel deployment={localOutput.deployment} />
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <p>Deployment strategy not yet generated.</p>
                  <p className="text-sm mt-2">This feature will be available with enhanced CAL prompt.</p>
                </div>
              )}
            </TabsContent>
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  );
}

interface TabButtonProps {
  value: string;
  icon: typeof FileText;
  label: string;
}

function TabButton({ value, icon: Icon, label }: TabButtonProps) {
  return (
    <TabsTrigger
      value={value}
      className="px-6 py-3 text-sm font-medium uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
      data-testid={`tab-${value}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </TabsTrigger>
  );
}

function ScriptPanel({ lines }: { lines: ScriptLine[] }) {
  return (
    <div className="space-y-1" data-testid="panel-script">
      <PanelHeader title="Script" count={lines.length} unit="lines" />

      <div className="font-mono text-sm space-y-2 mt-6">
        {lines.map((line) => (
          <div key={line.lineNumber} className="flex gap-4 group">
            <span className="text-xs text-muted-foreground/50 w-8 shrink-0 text-right pt-0.5">
              {line.lineNumber.toString().padStart(2, '0')}
            </span>
            <div className="flex-1">
              {line.speaker && (
                <span className="text-primary font-medium uppercase text-xs tracking-wider block mb-1">
                  {line.speaker}
                </span>
              )}
              <p className="leading-relaxed">{line.text}</p>
              {line.notes && (
                <p className="text-xs text-muted-foreground italic mt-1">
                  [{line.notes}]
                </p>
              )}
            </div>
            {line.timing && (
              <span className="text-xs text-muted-foreground shrink-0 font-mono">
                {line.timing}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryboardPanel({ frames }: { frames: StoryboardFrame[] }) {
  return (
    <div data-testid="panel-storyboard">
      <PanelHeader title="Storyboard" count={frames.length} unit="frames" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {frames.map((frame) => (
          <Card key={frame.frameNumber} className="p-4 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono uppercase text-muted-foreground">
                Frame {frame.frameNumber.toString().padStart(2, '0')}
              </span>
              <Badge variant="secondary" className="text-xs">
                {frame.shotType}
              </Badge>
              {frame.duration && (
                <span className="text-xs text-muted-foreground ml-auto font-mono">
                  {frame.duration}
                </span>
              )}
            </div>

            <p className="text-sm leading-relaxed mb-2">
              {frame.description}
            </p>

            {frame.visualNotes && (
              <p className="text-xs text-muted-foreground italic mt-2">
                {frame.visualNotes}
              </p>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CinematographyPanel({ specs }: { specs?: Cinematography | TechSpecs }) {
  const [mode, setMode] = useState<'amateur' | 'professional'>('amateur');

  if (!specs) {
    return (
      <div data-testid="panel-cinematography">
        <PanelHeader title="Cinematography & Director Notes" />
        <p className="text-muted-foreground text-sm">No cinematography guidelines available.</p>
      </div>
    );
  }

  // Check if we have enhanced cinematography data  const hasCinematography = 'amateurMode' in specs || 'professionalMode' in specs;

  const specItems = [
    { label: 'Aspect Ratio', value: specs.aspectRatio },
    { label: 'Resolution', value: specs.resolution },
    { label: 'Frame Rate', value: specs.frameRate },
    { label: 'Duration', value: specs.duration },
    { label: 'Audio Format', value: 'audioFormat' in specs ? specs.audioFormat : undefined },
    { label: 'Export Format', value: 'exportFormat' in specs ? specs.exportFormat : undefined }
  ].filter(item => item.value);

  return (
    <div data-testid="panel-cinematography">
      <PanelHeader title="Cinematography & Director Notes" />

      {/* Mode Toggle (only show if enhanced data available) */}
      {hasCinematography && 'amateurMode' in specs && 'professionalMode' in specs && (
        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setMode('amateur')}
            variant={mode === 'amateur' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            📱 Amateur Mode
          </Button>
          <Button
            onClick={() => setMode('professional')}
            variant={mode === 'professional' ? 'default' : 'outline'}
            size="sm"
            className="flex-1"
          >
            🎬 Professional Mode
          </Button>
        </div>
      )}

      {/* Technical Specifications */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Technical Specifications
        </h4>
        <div className="space-y-3">
          {specItems.map((item) => (
            <div key={item.label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
              <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
                {item.label}
              </span>
              <span className="text-sm font-mono">
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {specs.platforms && specs.platforms.length > 0 && (
          <div className="pt-4">
            <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground block mb-2">
              Target Platforms
            </span>
            <div className="flex flex-wrap gap-2">
              {specs.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platform}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mode-Specific Guidance */}
      {hasCinematography && 'amateurMode' in specs && mode === 'amateur' && specs.amateurMode && (
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Equipment Needed
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {specs.amateurMode.equipment.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Filming Tips
            </h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {specs.amateurMode.tips.map((tip, idx) => (
                <li key={idx}>{tip}</li>
              ))}
            </ul>
          </div>

          {specs.amateurMode.warnings && specs.amateurMode.warnings.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <h4 className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-2">
                ⚠️ Warnings
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-amber-700 dark:text-amber-300">
                {specs.amateurMode.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {hasCinematography && 'professionalMode' in specs && mode === 'professional' && specs.professionalMode && (
        <div className="space-y-4">
          {specs.professionalMode.cameraSettings && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Camera Settings
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {specs.professionalMode.cameraSettings.aperture && (
                  <div className="bg-muted/30 rounded p-2">
                    <span className="text-xs text-muted-foreground block">Aperture</span>
                    <span className="font-mono font-medium">{specs.professionalMode.cameraSettings.aperture}</span>
                  </div>
                )}
                {specs.professionalMode.cameraSettings.shutterSpeed && (
                  <div className="bg-muted/30 rounded p-2">
                    <span className="text-xs text-muted-foreground block">Shutter Speed</span>
                    <span className="font-mono font-medium">{specs.professionalMode.cameraSettings.shutterSpeed}</span>
                  </div>
                )}
                {specs.professionalMode.cameraSettings.iso && (
                  <div className="bg-muted/30 rounded p-2">
                    <span className="text-xs text-muted-foreground block">ISO</span>
                    <span className="font-mono font-medium">{specs.professionalMode.cameraSettings.iso}</span>
                  </div>
                )}
                {specs.professionalMode.cameraSettings.whiteBalance && (
                  <div className="bg-muted/30 rounded p-2">
                    <span className="text-xs text-muted-foreground block">White Balance</span>
                    <span className="font-mono font-medium">{specs.professionalMode.cameraSettings.whiteBalance}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {specs.professionalMode.lighting && specs.professionalMode.lighting.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Lighting Setup
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {specs.professionalMode.lighting.map((light, idx) => (
                  <li key={idx}>{light}</li>
                ))}
              </ul>
            </div>
          )}

          {specs.professionalMode.lensRecommendations && specs.professionalMode.lensRecommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Lens Recommendations
              </h4>
              <div className="flex flex-wrap gap-2">
                {specs.professionalMode.lensRecommendations.map((lens, idx) => (
                  <Badge key={idx} variant="outline">{lens}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type BRollOutputType = 'fiy' | 'image' | 'video';

function BRollPanel({ items }: { items: BRollItem[] }) {
  const [selectedTypes, setSelectedTypes] = useState<Record<string, BRollOutputType>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSelectedType = (id: string): BRollOutputType => selectedTypes[id] || 'fiy';

  const setSelectedType = (id: string, type: BRollOutputType) => {
    setSelectedTypes(prev => ({ ...prev, [id]: type }));
  };

  const copyToClipboard = async (text: string, id: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      console.warn('Clipboard API not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getContent = (item: BRollItem, type: BRollOutputType): string => {
    switch (type) {
      case 'fiy':
        return item.description;
      case 'image':
        return item.imagePrompt || 'Image prompt not available for this clip.';
      case 'video':
        return item.videoPrompt || 'Video prompt not available for this clip.';
    }
  };

  const getContentLabel = (type: BRollOutputType): string => {
    switch (type) {
      case 'fiy':
        return 'Film It Yourself Instructions';
      case 'image':
        return 'Alpha Image Prompt';
      case 'video':
        return 'Omega Video Prompt';
    }
  };

  return (
    <div data-testid="panel-broll">
      <PanelHeader title="B-Roll Suggestions" count={items.length} unit="clips" />

      <div className="space-y-4 mt-6">
        {items.map((item) => {
          const currentType = getSelectedType(item.id);
          const content = getContent(item, currentType);
          const copyId = `${item.id}-${currentType}`;
          const hasPrompts = item.imagePrompt || item.videoPrompt;

          return (
            <Card key={item.id} className="p-4 border-card-border" data-testid={`broll-item-${item.id}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  {item.timestamp && (
                    <span className="text-xs font-mono text-muted-foreground block mb-1">
                      {item.timestamp}
                    </span>
                  )}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {getContentLabel(currentType)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                  <span>Source: {item.source}</span>
                </div>
              </div>

              <div className="bg-muted/30 rounded-md p-3 mb-3 relative group">
                <p className="text-sm leading-relaxed pr-8">{content}</p>
                {(currentType === 'image' || currentType === 'video') && hasPrompts && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => copyToClipboard(content, copyId)}
                    data-testid={`button-copy-${item.id}`}
                  >
                    {copiedId === copyId ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                )}
              </div>

              {item.keywords && item.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                <Button
                  size="sm"
                  variant={currentType === 'fiy' ? 'default' : 'ghost'}
                  onClick={() => setSelectedType(item.id, 'fiy')}
                  className="text-xs"
                  data-testid={`button-fiy-${item.id}`}
                >
                  <Camera className="w-3 h-3 mr-1" />
                  FIY
                </Button>
                <Button
                  size="sm"
                  variant={currentType === 'image' ? 'default' : 'ghost'}
                  onClick={() => setSelectedType(item.id, 'image')}
                  className="text-xs"
                  disabled={!item.imagePrompt}
                  data-testid={`button-image-${item.id}`}
                >
                  <ImageIcon className="w-3 h-3 mr-1" />
                  Image Prompt
                </Button>
                <Button
                  size="sm"
                  variant={currentType === 'video' ? 'default' : 'ghost'}
                  onClick={() => setSelectedType(item.id, 'video')}
                  className="text-xs"
                  disabled={!item.videoPrompt}
                  data-testid={`button-video-${item.id}`}
                >
                  <Clapperboard className="w-3 h-3 mr-1" />
                  Video Prompt
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function CaptionsPanel({ captions }: { captions: Caption[] }) {
  return (
    <div data-testid="panel-captions">
      <PanelHeader title="Captions" count={captions.length} unit="segments" />

      <div className="space-y-3 mt-6">
        {captions.map((caption) => (
          <div key={caption.id} className="flex gap-4 py-2">
            <span className="font-mono text-xs text-muted-foreground shrink-0 w-16">
              {caption.timestamp}
            </span>
            <p className="text-sm leading-snug flex-1">
              {caption.text}
            </p>
            {caption.style && (
              <Badge variant="outline" className="text-xs shrink-0">
                {caption.style}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

interface PanelHeaderProps {
  title: string;
  count?: number;
  unit?: string;
}

function PanelHeader({ title, count, unit }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-medium uppercase tracking-wide">
        {title}
      </h3>
      {count !== undefined && unit && (
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
          {count} {unit}
        </span>
      )}
    </div>
  );
}
// Add DeploymentPanel component before CaptionsPanel

function DeploymentPanel({ deployment }: { deployment: Deployment }) {
  return (
    <div data-testid="panel-deployment">
      <PanelHeader title="Deployment Strategy" />
      
      <div className="mb-6">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Distribution Strategy
        </h4>
        <p className="text-sm leading-relaxed">
          {deployment.strategy}
        </p>
      </div>
      
      <div className="space-y-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">
          Platform Posting Schedule
        </h4>
        
        {deployment.platforms.sort((a, b) => a.priority - b.priority).map((platform, idx) => (
          <Card key={idx} className="p-4 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <Badge className="bg-primary text-primary-foreground">
                Priority {platform.priority}
              </Badge>
              <h5 className="font-semibold">{platform.name}</h5>
              <span className="ml-auto text-xs text-muted-foreground font-mono">
                ðŸ“… {platform.postingTime}
              </span>
            </div>
            
            <div className="bg-muted/40 rounded-lg p-3 mb-3">
              <p className="text-sm leading-relaxed">
                {platform.caption}
              </p>
            </div>
            
            {platform.hashtags && platform.hashtags.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Hashtags</span>
                <div className="flex flex-wrap gap-1">
                  {platform.hashtags.map(tag => (
                    <Badge key={tag} variant="outline" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {platform.thumbnail && (
              <div className="mt-3 pt-3 border-t border-border">
                <span className="text-xs uppercase tracking-wide text-muted-foreground block mb-1">
                  Thumbnail Recommendation
                </span>
                <p className="text-xs text-muted-foreground italic">
                  {platform.thumbnail}
                </p>
              </div>
            )}
         </Card>
        ))}
      </div>
      
      {deployment.crossPromotion && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            ðŸ”„ Cross-Promotion Strategy
          </h5>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            {deployment.crossPromotion}
          </p>
        </div>
      )}
      
      {deployment.timing && (
        <div className="mt-4 p-4 bg-muted/30 rounded-lg">
          <h5 className="text-sm font-semibold mb-2">â° Timing Recommendations</h5>
          {deployment.timing.interval && (
            <p className="text-sm mb-1">
              <strong>Interval:</strong> {deployment.timing.interval}
            </p>
          )}
          {deployment.timing.schedule && deployment.timing.schedule.length > 0 && (
            <div className="mt-2">
              <strong className="text-sm">Schedule:</strong>
              <ul className="list-disc list-inside mt-1 text-sm space-y-0.5">
                {deployment.timing.schedule.map((time, idx) => (
                  <li key={idx}>{time}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
