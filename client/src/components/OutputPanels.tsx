import { useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { FileText, Film, Settings, Video, MessageSquare, Camera, ImageIcon, Clapperboard, Copy, Check, Download, FileSpreadsheet, Subtitles, FileDown, Lock, Share2, Zap, Mic, Sun, Smartphone, HardDrive } from 'lucide-react';
import { FloatingRemixMenu } from './FloatingRemixMenu';
import { exportToCSV, exportToSRT, exportToPDF } from '@/lib/exports';
import { useUser } from '@/hooks/use-user';
import type { ContentOutput, ScriptLine, StoryboardFrame, TechSpecs, BRollItem, Caption, Cinematography, DeploymentStrategy } from '@shared/schema';

interface OutputPanelsProps {
  output: ContentOutput;
  onOutputUpdate?: (updatedOutput: ContentOutput) => void;
  projectTitle?: string;
}

export function OutputPanels({ output, onOutputUpdate, projectTitle = 'Script' }: OutputPanelsProps) {
  const [localOutput, setLocalOutput] = useState(output);
  const scriptRef = useRef<HTMLDivElement>(null);
  const { user, isLoading: isUserLoading } = useUser();

  const canExport = !isUserLoading && user?.subscriptionTier && user.subscriptionTier !== 'bronze';

  // BACKWARD COMPATIBILITY: Transform legacy schema to new format
  // Old sessions have storyboard/techSpecs as top-level fields
  // New sessions have them nested in cinematography object
  const getCinematographyData = (): Cinematography | undefined => {
    // Check if new schema exists
    if (localOutput.cinematography) {
      return localOutput.cinematography;
    }

    // Check if legacy schema exists (storyboard/techSpecs as top-level fields)
    const legacyOutput = localOutput as any;
    const hasLegacyStoryboard = legacyOutput.storyboard && Array.isArray(legacyOutput.storyboard);
    const hasLegacyTechSpecs = legacyOutput.techSpecs && typeof legacyOutput.techSpecs === 'object';

    if (hasLegacyStoryboard || hasLegacyTechSpecs) {
      // Transform legacy data to new schema format
      return {
        techSpecs: hasLegacyTechSpecs ? legacyOutput.techSpecs : undefined,
        storyboard: hasLegacyStoryboard ? legacyOutput.storyboard : undefined
      } as Cinematography;
    }

    // No cinematography data in either format
    return undefined;
  };

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

  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy', error);
    }
  };

  return (
    <Tabs defaultValue="script" className="h-full flex flex-col">
      <div className="border-b border-border px-4 shrink-0 flex items-center justify-between gap-2">
        <TabsList className="bg-transparent h-auto p-0 gap-1">
          <TabButton value="script" icon={FileText} label="Script" />
          <TabButton value="cinematography" icon={Camera} label="Cinematography" />
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

            <TabsContent value="cinematography" className="mt-0">
              <CinematographyPanel cinematography={getCinematographyData()} />
            </TabsContent>

            <TabsContent value="broll" className="mt-0">
              <BRollPanel items={localOutput.bRoll || []} />
            </TabsContent>

            <TabsContent value="captions" className="mt-0">
              <CaptionsPanel captions={localOutput.captions} />
            </TabsContent>

            <TabsContent value="deployment" className="mt-0">
              <DeploymentPanel strategy={localOutput.deploymentStrategy} />
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

function TechSpecsPanel({ specs }: { specs: TechSpecs }) {
  const specItems = [
    { label: 'Aspect Ratio', value: specs.aspectRatio },
    { label: 'Resolution', value: specs.resolution },
    { label: 'Frame Rate', value: specs.frameRate },
    { label: 'Duration', value: specs.duration },
    { label: 'Audio Format', value: specs.audioFormat },
    { label: 'Export Format', value: specs.exportFormat }
  ].filter(item => item.value);

  return (
    <div data-testid="panel-tech-specs">
      <PanelHeader title="Technical Specifications" />

      <div className="space-y-4 mt-6">
        {specItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">
              {item.label}
            </span>
            <span className="text-sm font-mono">
              {item.value}
            </span>
          </div>
        ))}

        {specs.platforms && specs.platforms.length > 0 && (
          <div className="pt-4">
            <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground block mb-3">
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

function CinematographyPanel({ cinematography }: { cinematography?: Cinematography }) {
  if (!cinematography) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Camera className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">Cinematography data not available</p>
        </div>
      </div>
    );
  }

  const { techSpecs, storyboard } = cinematography;

  return (
    <div data-testid="panel-cinematography">
      <PanelHeader title="Cinematography & Technical Director Notes" />

      {/* Technical Specifications - Accordion Style */}
      {techSpecs && Object.keys(techSpecs).length > 0 ? (
        <div className="mt-6">
          <Accordion type="multiple" className="space-y-2">
            {techSpecs.cameraVideo && techSpecs.cameraVideo.length > 0 && (
              <AccordionItem value="camera" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Camera & Video</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{techSpecs.cameraVideo.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.cameraVideo.map((spec: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {techSpecs.audio && techSpecs.audio.length > 0 && (
              <AccordionItem value="audio" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Mic className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Audio</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{techSpecs.audio.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.audio.map((spec: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {techSpecs.lighting && techSpecs.lighting.length > 0 && (
              <AccordionItem value="lighting" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Lighting</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{techSpecs.lighting.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.lighting.map((spec: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {techSpecs.platformOptimizations && techSpecs.platformOptimizations.length > 0 && (
              <AccordionItem value="platform" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Platform Optimizations</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{techSpecs.platformOptimizations.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.platformOptimizations.map((spec: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {techSpecs.exportSettings && techSpecs.exportSettings.length > 0 && (
              <AccordionItem value="export" className="border border-border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Export Settings</span>
                    <Badge variant="secondary" className="ml-2 text-xs">{techSpecs.exportSettings.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.exportSettings.map((spec: string, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{spec}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-6">No technical specifications available</p>
      )}

      {/* Storyboard - Card-based Grid */}
      {storyboard && storyboard.length > 0 && (
        <>
          <Separator className="my-8" />
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium uppercase tracking-wide">Storyboard</h4>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
                {storyboard.length} Frames
              </span>
            </div>

            <div className="space-y-3">
              {storyboard.map((frame: any, idx: number) => (
                <Card key={idx} className="p-4 border-card-border hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs font-mono font-semibold text-muted-foreground">
                          {(frame.frameNumber || idx + 1).toString().padStart(2, '0')}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs uppercase font-mono">
                          {frame.shotType || 'N/A'}
                        </Badge>
                        {frame.timing && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {frame.timing}
                          </span>
                        )}
                        {frame.cameraMovement && frame.cameraMovement !== 'STATIC' && (
                          <Badge variant="outline" className="text-xs">
                            {frame.cameraMovement}
                          </Badge>
                        )}
                        {frame.transition && frame.transition !== 'CUT' && (
                          <Badge className="text-xs">
                            {frame.transition}
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm leading-relaxed">
                        {frame.visualDescription || frame.description || 'No description'}
                      </p>

                      {frame.audioVO && (
                        <p className="text-xs text-muted-foreground italic">
                          🎙️ {frame.audioVO}
                        </p>
                      )}

                      {frame.notes && (
                        <p className="text-xs text-muted-foreground">
                          📝 {frame.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DeploymentPanel({ strategy }: { strategy?: DeploymentStrategy }) {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(id);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy', error);
    }
  };

  if (!strategy) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-2">
          <Share2 className="w-12 h-12 mx-auto text-muted-foreground opacity-20" />
          <p className="text-sm text-muted-foreground">Deployment strategy not available</p>
        </div>
      </div>
    );
  }

  const {
    postingSchedule = {},
    hashtagStrategy = { tier1_broad: [], tier2_niche: [], tier3_micro: [], recommended: [] },
    captionCopy = {},
    engagementTactics = { firstHour: [], first24Hours: [], ongoing: [] },
    crossPromotion = [],
    analyticsTracking = { keyMetrics: {}, successBenchmarks: {} }
  } = strategy;

  return (
    <div data-testid="panel-deployment">
      <PanelHeader title="Social Deployment Strategy" />
      <section>
        <h4 className="text-lg font-bold border-b-2 border-gray-300 pb-2 mb-4 flex items-center">
          <span className="mr-2">📅</span>Posting Schedule
        </h4>
        {Object.keys(postingSchedule).length === 0 ? (
          <p className="text-sm text-gray-500 italic">No posting schedule data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(postingSchedule).map(([platform, schedule]: [string, any]) => (
              <Card key={platform} className="p-4 hover:shadow-md transition-shadow">
                <h5 className="font-bold capitalize mb-3 text-sm text-gray-800 border-b pb-2">{platform}</h5>
                <div className="space-y-2 text-sm">
                  <div>
                    <strong className="text-gray-700">Best Times:</strong>
                    <p className="text-gray-600 mt-1">{schedule?.bestTimes?.join(', ') || 'Not specified'}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">Frequency:</strong>
                    <p className="text-gray-600 mt-1">{schedule?.frequency || 'Not specified'}</p>
                  </div>
                  <div>
                    <strong className="text-gray-700">Peak Days:</strong>
                    <p className="text-gray-600 mt-1">{schedule?.peakDays?.join(', ') || 'Not specified'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <Separator className="my-8" />

      {/* Hashtag Strategy */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Hashtag Strategy</h4>
        </div>

        <div className="space-y-3">
          <Card className="p-4 bg-card border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">Tier 1</Badge>
                  <span className="text-xs text-muted-foreground">Broad Reach (1M+ posts)</span>
                </div>
                <p className="text-sm">
                  {hashtagStrategy.tier1_broad?.length > 0 ? hashtagStrategy.tier1_broad.join(' ') : 'No broad hashtags suggested'}
                </p>
              </div>
              {hashtagStrategy.tier1_broad?.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(hashtagStrategy.tier1_broad.join(' '), 'hashtags-tier1')}
                >
                  {copiedItem === 'hashtags-tier1' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">Tier 2</Badge>
                  <span className="text-xs text-muted-foreground">Niche (100K-1M posts)</span>
                </div>
                <p className="text-sm">
                  {hashtagStrategy.tier2_niche?.length > 0 ? hashtagStrategy.tier2_niche.join(' ') : 'No niche hashtags suggested'}
                </p>
              </div>
              {hashtagStrategy.tier2_niche?.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(hashtagStrategy.tier2_niche.join(' '), 'hashtags-tier2')}
                >
                  {copiedItem === 'hashtags-tier2' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </Card>

          <Card className="p-4 bg-card border-border">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">Tier 3</Badge>
                  <span className="text-xs text-muted-foreground">Micro (10K-100K posts)</span>
                </div>
                <p className="text-sm">
                  {hashtagStrategy.tier3_micro?.length > 0 ? hashtagStrategy.tier3_micro.join(' ') : 'No micro hashtags suggested'}
                </p>
              </div>
              {hashtagStrategy.tier3_micro?.length > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(hashtagStrategy.tier3_micro.join(' '), 'hashtags-tier3')}
                >
                  {copiedItem === 'hashtags-tier3' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              )}
            </div>
          </Card>

          {hashtagStrategy.recommended?.length > 0 && (
            <Card className="p-4 bg-card border-l-4 border-l-primary">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="text-xs">Recommended</Badge>
                    <span className="text-xs text-muted-foreground">Best performing combination</span>
                  </div>
                  <p className="text-sm font-medium">
                    {hashtagStrategy.recommended.join(' ')}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(hashtagStrategy.recommended.join(' '), 'hashtags-recommended')}
                >
                  {copiedItem === 'hashtags-recommended' ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>

      <Separator className="my-8" />

      {/* Platform-Specific Captions */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Platform-Specific Captions</h4>
        </div>

        {Object.keys(captionCopy).length === 0 ? (
          <p className="text-sm text-muted-foreground">No caption copy available</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(captionCopy).map(([platform, caption]) => (
              <Card key={platform} className="p-4 bg-card border-border">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs capitalize">{platform}</Badge>
                    </div>
                    <p className="text-sm leading-relaxed">{caption as string}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(caption as string, `caption-${platform}`)}
                  >
                    {copiedItem === `caption-${platform}` ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator className="my-8" />

      {/* Engagement Tactics */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Engagement Tactics</h4>
        </div>

        <div className="space-y-3">
          <Card className="p-4 bg-card border-l-4 border-l-red-500">
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Critical</Badge>
              <span>First Hour</span>
            </h5>
            {engagementTactics.firstHour?.length > 0 ? (
              <ul className="space-y-1.5">
                {engagementTactics.firstHour.map((tactic: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span>{tactic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No tactics specified</p>
            )}
          </Card>

          <Card className="p-4 bg-card border-l-4 border-l-orange-500">
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Important</Badge>
              <span>First 24 Hours</span>
            </h5>
            {engagementTactics.first24Hours?.length > 0 ? (
              <ul className="space-y-1.5">
                {engagementTactics.first24Hours.map((tactic: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500 mt-1">•</span>
                    <span>{tactic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No tactics specified</p>
            )}
          </Card>

          <Card className="p-4 bg-card border-l-4 border-l-blue-500">
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">Ongoing</Badge>
              <span>Long-term Strategy</span>
            </h5>
            {engagementTactics.ongoing?.length > 0 ? (
              <ul className="space-y-1.5">
                {engagementTactics.ongoing.map((tactic: string, idx: number) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{tactic}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground italic">No tactics specified</p>
            )}
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Cross-Promotion */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Cross-Promotion Strategy</h4>
        </div>

        {crossPromotion?.length > 0 ? (
          <Card className="p-4 bg-card border-border">
            <ul className="space-y-2">
              {crossPromotion.map((strategyItem: string, idx: number) => (
                <li key={idx} className="text-sm flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span>{strategyItem}</span>
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground">No cross-promotion strategies</p>
        )}
      </div>

      <Separator className="my-8" />

      {/* Analytics Tracking */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Analytics Tracking</h4>
        </div>

        <div className="space-y-4">
          <Card className="p-4 bg-card border-border">
            <h5 className="font-semibold text-sm mb-3">Key Metrics by Platform</h5>
            {Object.keys(analyticsTracking.keyMetrics || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsTracking.keyMetrics).map(([platform, metrics]: [string, any]) => (
                  <div key={platform} className="flex items-start gap-3 border-l-2 border-primary pl-3">
                    <Badge variant="outline" className="text-xs capitalize shrink-0">{platform}</Badge>
                    <span className="text-sm">{metrics?.join(', ')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No metrics specified</p>
            )}
          </Card>

          <Card className="p-4 bg-card border-l-4 border-l-green-500">
            <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Badge className="text-xs">Success Benchmarks</Badge>
            </h5>
            {Object.keys(analyticsTracking.successBenchmarks || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(analyticsTracking.successBenchmarks).map(([platform, benchmark]) => (
                  <div key={platform} className="flex items-start gap-3">
                    <Badge variant="secondary" className="text-xs capitalize shrink-0">{platform}</Badge>
                    <span className="text-sm font-medium">{benchmark as string}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No benchmarks specified</p>
            )}
          </Card>
        </div>
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
