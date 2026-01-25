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
import { FileText, Film, Settings, Video, MessageSquare, Camera, ImageIcon, Clapperboard, Copy, Check, Download, FileSpreadsheet, Subtitles, FileDown, Lock, Share2, Zap, Mic, Sun, Smartphone, HardDrive, Music, Palette, Aperture, Frame } from 'lucide-react';
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

  const getCinematographyData = (): Cinematography | undefined => {
    if (localOutput.cinematography) {
      return localOutput.cinematography;
    }

    const legacyOutput = localOutput as any;
    const hasLegacyStoryboard = legacyOutput.storyboard && Array.isArray(legacyOutput.storyboard);
    const hasLegacyTechSpecs = legacyOutput.techSpecs && typeof legacyOutput.techSpecs === 'object';

    if (hasLegacyStoryboard || hasLegacyTechSpecs) {
      const rawTechSpecs = legacyOutput.techSpecs || {};
      const adaptedTechSpecs = {
        cameraVideo: [
          rawTechSpecs.resolution ? `Resolution: ${rawTechSpecs.resolution}` : null,
          rawTechSpecs.frameRate ? `Frame Rate: ${rawTechSpecs.frameRate}` : null,
          rawTechSpecs.aspectRatio ? `Aspect Ratio: ${rawTechSpecs.aspectRatio}` : null
        ].filter(Boolean),
        audioSound: [], // Retrofill new field
        audio: [
          rawTechSpecs.audioFormat ? `Format: ${rawTechSpecs.audioFormat}` : null
        ].filter(Boolean),
        soundDesign: [],
        colorGrade: [],
        equipment: [],
        composition: [],
        lighting: [],
        platformOptimizations: rawTechSpecs.platforms || [],
        exportSettings: [
          rawTechSpecs.exportFormat ? `Format: ${rawTechSpecs.exportFormat}` : null,
          rawTechSpecs.duration ? `Target Duration: ${rawTechSpecs.duration}` : null
        ].filter(Boolean)
      };

      return {
        techSpecs: adaptedTechSpecs,
        storyboard: hasLegacyStoryboard ? legacyOutput.storyboard : undefined
      } as Cinematography;
    }
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
      case 'csv': exportToCSV(localOutput, projectTitle); break;
      case 'srt': exportToSRT(localOutput, projectTitle); break;
      case 'pdf': exportToPDF(localOutput, projectTitle); break;
    }
  };

  return (
    <Tabs defaultValue="script" className="h-full flex flex-col">
      <div className="border-b border-border px-4 shrink-0 flex items-center justify-between gap-2">
        <TabsList className="bg-transparent h-auto p-0 gap-1">
          <TabButton value="script" icon={FileText} label="Script" />
          <TabButton value="cinematography" icon={Camera} label="Cinematography" />
          {(!localOutput?.cinematography?.techSpecs?.cameraVideo &&
            (localOutput as any).bRoll?.length > 0) && (
              <TabButton value="broll" icon={Video} label="B-Roll" />
            )}
          <TabButton value="deployment" icon={Share2} label="Deployment" />
        </TabsList>

        {isUserLoading ? (
          <Button variant="outline" size="sm" className="gap-2 opacity-50" disabled>
            <Download className="w-4 h-4" /> Export
          </Button>
        ) : canExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}><FileSpreadsheet className="w-4 h-4 mr-2" /> CSV</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('srt')}><Subtitles className="w-4 h-4 mr-2" /> SRT</DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}><FileDown className="w-4 h-4 mr-2" /> PDF</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={-1}>
                <Button variant="outline" size="sm" className="gap-2 opacity-50 pointer-events-none" disabled>
                  <Lock className="w-4 h-4" /> Export
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent><p>Upgrade to Silver for Exports</p></TooltipContent>
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

            <TabsContent value="deployment" className="mt-0">
              <DeploymentPanel strategy={localOutput.deploymentStrategy} />
            </TabsContent>
          </div>
        </ScrollArea>
      </div>
    </Tabs>
  );
}

interface TabButtonProps { value: string; icon: typeof FileText; label: string; }
function TabButton({ value, icon: Icon, label }: TabButtonProps) {
  return (
    <TabsTrigger value={value} className="px-6 py-3 text-sm font-medium uppercase tracking-wide rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </TabsTrigger>
  );
}

function ScriptPanel({ lines }: { lines: ScriptLine[] }) {
  return (
    <div className="space-y-1">
      <PanelHeader title="Script" count={lines.length} unit="lines" />
      <div className="font-mono text-sm space-y-2 mt-6">
        {lines.map((line) => (
          <div key={line.lineNumber} className="flex gap-4 group">
            <span className="text-xs text-muted-foreground/50 w-8 shrink-0 text-right pt-0.5">{line.lineNumber.toString().padStart(2, '0')}</span>
            <div className="flex-1">
              {line.speaker && <span className="text-primary font-medium uppercase text-xs tracking-wider block mb-1">{line.speaker}</span>}
              <p className="leading-relaxed">{line.text}</p>
              {line.notes && <p className="text-xs text-muted-foreground italic mt-1">[{line.notes}]</p>}
            </div>
            {line.timing && <span className="text-xs text-muted-foreground shrink-0 font-mono">{line.timing}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

function StoryboardPanel({ frames }: { frames: StoryboardFrame[] }) {
  return (
    <div>
      <PanelHeader title="Storyboard" count={frames.length} unit="frames" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {frames.map((frame) => (
          <Card key={frame.frameNumber} className="p-4 border-card-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-mono uppercase text-muted-foreground">Frame {frame.frameNumber.toString().padStart(2, '0')}</span>
              <Badge variant="secondary" className="text-xs">{frame.shotType}</Badge>
              {frame.duration && <span className="text-xs text-muted-foreground ml-auto font-mono">{frame.duration}</span>}
            </div>
            <p className="text-sm leading-relaxed mb-2">{frame.description}</p>
            {frame.visualNotes && <p className="text-xs text-muted-foreground italic mt-2">{frame.visualNotes}</p>}
          </Card>
        ))}
      </div>
    </div>
  );
}

function TechSpecsPanel({ specs }: { specs: TechSpecs }) {
  // Kept for legacy support or alternative views
  const specItems = [
    { label: 'Aspect Ratio', value: specs.aspectRatio },
    { label: 'Resolution', value: specs.resolution },
    { label: 'Frame Rate', value: specs.frameRate }
  ].filter(item => item.value);

  return (
    <div>
      <PanelHeader title="Technical Specifications" />
      <div className="space-y-4 mt-6">
        {specItems.map((item) => (
          <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
            <span className="font-medium text-xs uppercase tracking-wide text-muted-foreground">{item.label}</span>
            <span className="text-sm font-mono">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type BRollOutputType = 'fiy' | 'image' | 'video';
function BRollPanel({ items }: { items: BRollItem[] }) {
  const [selectedTypes, setSelectedTypes] = useState<Record<string, BRollOutputType>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSelectedType = (id: string): BRollOutputType => selectedTypes[id] || 'fiy';
  const setSelectedType = (id: string, type: BRollOutputType) => setSelectedTypes(prev => ({ ...prev, [id]: type }));

  const copyToClipboard = async (text: string, id: string) => {
    if (!navigator?.clipboard) return;
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch (err) { console.error(err); }
  };

  const getContent = (item: BRollItem, type: BRollOutputType): string => {
    switch (type) {
      case 'fiy': return item.description;
      case 'image': return item.imagePrompt || 'No prompt available.';
      case 'video': return item.videoPrompt || 'No prompt available.';
    }
  };

  const getContentLabel = (type: BRollOutputType): string => {
    switch (type) {
      case 'fiy': return 'Film It Yourself Instructions';
      case 'image': return 'Alpha Image Prompt';
      case 'video': return 'Omega Video Prompt';
    }
  };

  return (
    <div>
      <PanelHeader title="B-Roll Suggestions" count={items.length} unit="clips" />
      <div className="space-y-4 mt-6">
        {items.map((item) => {
          const currentType = getSelectedType(item.id);
          const content = getContent(item, currentType);
          const copyId = `${item.id}-${currentType}`;
          const hasPrompts = item.imagePrompt || item.videoPrompt;

          return (
            <Card key={item.id} className="p-4 border-card-border">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  {item.timestamp && <span className="text-xs font-mono text-muted-foreground block mb-1">{item.timestamp}</span>}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{getContentLabel(currentType)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0"><span>Source: {item.source}</span></div>
              </div>
              <div className="bg-muted/30 rounded-md p-3 mb-3 relative group">
                <p className="text-sm leading-relaxed pr-8">{content}</p>
                {(currentType === 'image' || currentType === 'video') && hasPrompts && (
                  <Button size="icon" variant="ghost" className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyToClipboard(content, copyId)}>
                    {copiedId === copyId ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
              <div className="flex items-center justify-end gap-1 pt-2 border-t border-border">
                <Button size="sm" variant={currentType === 'fiy' ? 'default' : 'ghost'} onClick={() => setSelectedType(item.id, 'fiy')} className="text-xs"><Camera className="w-3 h-3 mr-1" /> FIY</Button>
                <Button size="sm" variant={currentType === 'image' ? 'default' : 'ghost'} onClick={() => setSelectedType(item.id, 'image')} className="text-xs" disabled={!item.imagePrompt}><ImageIcon className="w-3 h-3 mr-1" /> Image</Button>
                <Button size="sm" variant={currentType === 'video' ? 'default' : 'ghost'} onClick={() => setSelectedType(item.id, 'video')} className="text-xs" disabled={!item.videoPrompt}><Clapperboard className="w-3 h-3 mr-1" /> Video</Button>
              </div>
            </Card>
          );
        })}
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

      {/* CONSOLIDATED TECH SPECS */}
      {techSpecs ? (
        <div className="mt-6 mb-8">
          <h4 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-4">CONSOLIDATED TECH SPECS</h4>
          <Accordion type="single" collapsible className="w-full">

            {/* 1. Camera & Video (Merged) */}
            {techSpecs.cameraVideo && techSpecs.cameraVideo.length > 0 && (
              <AccordionItem value="cameraVideo" className="border border-border rounded-lg px-4 bg-card mb-2">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2"><Video className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Camera, Video & Lighting</span><Badge variant="secondary" className="ml-2 text-xs">{techSpecs.cameraVideo.length}</Badge></div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.cameraVideo.map((spec: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2"><span className="text-primary mt-1">•</span><span>{spec}</span></li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 2. Audio & Sound (Merged) */}
            {techSpecs.audioSound && techSpecs.audioSound.length > 0 && (
              <AccordionItem value="audioSound" className="border border-border rounded-lg px-4 bg-card mb-2">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2"><Music className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Audio & Sound Design</span><Badge variant="secondary" className="ml-2 text-xs">{techSpecs.audioSound.length}</Badge></div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.audioSound.map((spec: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2"><span className="text-primary mt-1">•</span><span>{spec}</span></li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 3. Export Settings */}
            {techSpecs.exportSettings && techSpecs.exportSettings.length > 0 && (
              <AccordionItem value="exportSettings" className="border border-border rounded-lg px-4 bg-card mb-2">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2"><Share2 className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Export Settings</span><Badge variant="secondary" className="ml-2 text-xs">{techSpecs.exportSettings.length}</Badge></div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.exportSettings.map((spec: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2"><span className="text-primary mt-1">•</span><span>{spec}</span></li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* 4. Equipment */}
            {techSpecs.equipment && techSpecs.equipment.length > 0 && (
              <AccordionItem value="equipment" className="border border-border rounded-lg px-4 bg-card mb-2">
                <AccordionTrigger className="hover:no-underline py-2">
                  <div className="flex items-center gap-2"><Aperture className="w-4 h-4 text-primary" /><span className="font-medium text-sm">Equipment List</span><Badge variant="secondary" className="ml-2 text-xs">{techSpecs.equipment.length}</Badge></div>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-1 mt-2">
                    {techSpecs.equipment.map((spec: any, idx: number) => (
                      <li key={idx} className="text-sm flex items-start gap-2"><span className="text-primary mt-1">•</span><span>{spec}</span></li>
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

      <Separator className="my-8" />

      {/* Storyboard */}
      {storyboard && storyboard.length > 0 && (
        <>
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium uppercase tracking-wide">Storyboard</h4>
              <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{storyboard.length} Frames</span>
            </div>
            <div className="space-y-3">
              {storyboard.map((frame: any, idx: number) => (
                <Card key={idx} className="p-4 border-card-border hover:border-primary/20 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                        <span className="text-xs font-mono font-semibold text-muted-foreground">{(frame.frameNumber || idx + 1).toString().padStart(2, '0')}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs uppercase font-mono">{frame.shotType || 'N/A'}</Badge>
                        {frame.timestamp && <span className="text-xs text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{frame.timestamp}</span>}
                        {frame.duration && <span className="text-xs text-muted-foreground font-mono">{frame.duration}s</span>}
                        {frame.transitionTo && <Badge variant="outline" className="text-xs ml-auto">{frame.transitionTo}</Badge>}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Visual</span>
                          <p className="text-sm leading-relaxed text-foreground">{frame.visual || frame.description || frame.visualDescription || 'No description'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase text-muted-foreground font-bold block mb-1">Audio/Sync</span>
                          <p className="text-sm leading-relaxed text-muted-foreground italic">{frame.audioSync || frame.audioVO || 'No audio'}</p>
                        </div>
                      </div>
                      {frame.action && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <span className="text-[10px] uppercase text-muted-foreground font-bold inline-block mr-2">Action:</span>
                          <span className="text-xs text-foreground">{frame.action}</span>
                        </div>
                      )}
                      {(frame.textOverlay || frame.visualNotes) && (
                        <div className="flex flex-wrap gap-4 mt-1">
                          {frame.textOverlay && <span className="text-xs text-blue-400">📺 GFX: {frame.textOverlay}</span>}
                          {frame.visualNotes && <span className="text-xs text-muted-foreground">📝 {frame.visualNotes}</span>}
                        </div>
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

  // Destructure with defaults
  const {
    postingSchedule = {},
    hashtagStrategy = { tier1_broad: [], tier2_niche: [], tier3_micro: [], recommended: [], platformSpecific: {} },
    engagementTactics = { firstHour: [], first24Hours: [], ongoing: [] },
    crossPlatformStrategy = {},
    captionGuidelines = {},
    alternativeCaptions = {},
    analyticsTracking = { keyMetrics: {}, successBenchmarks: {} }
  } = strategy;

  return (
    <div data-testid="panel-deployment">
      <PanelHeader title="Social Deployment Strategy" />

      {/* 1. Posting Schedule (Requested at Top) */}
      <section className="mb-8">
        <h4 className="text-sm font-medium uppercase tracking-wide border-b border-border pb-2 mb-4 flex items-center">
          <span className="mr-2">📅</span>Posting Schedule
        </h4>
        {Object.keys(postingSchedule).length === 0 ? (
          <p className="text-sm text-gray-500 italic">No posting schedule data available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(postingSchedule).map(([platform, schedule]: [string, any]) => (
              <Card key={platform} className="p-4 hover:shadow-md transition-shadow">
                <h5 className="font-bold capitalize mb-3 text-sm text-primary border-b border-border/50 pb-2">{platform.replace(/_/g, ' ')}</h5>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong className="text-muted-foreground text-xs uppercase">Best Times</strong>
                    <p className="text-foreground mt-0.5">{Array.isArray(schedule?.bestTimes) ? schedule.bestTimes.join(', ') : 'Not specified'}</p>
                  </div>
                  <div>
                    <strong className="text-muted-foreground text-xs uppercase">Frequency</strong>
                    <p className="text-foreground mt-0.5">{schedule?.frequency || 'Not specified'}</p>
                  </div>
                  <div>
                    <strong className="text-muted-foreground text-xs uppercase">Peak Days</strong>
                    <p className="text-foreground mt-0.5">{Array.isArray(schedule?.peakDays) ? schedule.peakDays.join(', ') : 'Not specified'}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 2. Caption Guidelines (NEW) */}
      {captionGuidelines && Object.keys(captionGuidelines).length > 0 && (
        <section className="mb-8">
          <h4 className="text-sm font-medium uppercase tracking-wide border-b border-border pb-2 mb-4 flex items-center">
            <span className="mr-2">✍️</span>Caption Strategy
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(captionGuidelines).map(([platform, guide]: [string, any]) => (
              <Card key={platform} className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="capitalize">{platform.replace(/_/g, ' ')}</Badge>
                  <span className="text-xs text-muted-foreground">Tone: {guide.tone || 'Standard'}</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                    <span className="text-xs uppercase text-primary font-bold block mb-1">Structure</span>
                    <p className="text-sm">{guide.structure}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase text-muted-foreground font-bold block mb-1">Example Hook</span>
                    <p className="text-sm italic text-foreground/80">"{guide.example}"</p>
                  </div>
                  {guide.cta && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs uppercase text-muted-foreground font-bold">CTA:</span>
                      <span className="text-xs font-medium text-primary">{guide.cta}</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* 3. Cross-Platform Strategy (Moved Below) */}
      <section className="mb-8">
        <h4 className="text-sm font-medium uppercase tracking-wide border-b border-border pb-2 mb-4 flex items-center">
          <span className="mr-2">🌐</span>Cross-Platform Strategy
        </h4>
        {crossPlatformStrategy && Object.keys(crossPlatformStrategy).length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {Object.entries(crossPlatformStrategy).map(([platform, strategyText]: [string, any]) => (
              <Card key={platform} className="p-4 bg-card border-card-border hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="min-w-[100px] font-bold capitalize text-sm text-primary">
                    {platform.replace(/_/g, ' ')}
                  </div>
                  <p className="text-sm leading-relaxed text-foreground/90">
                    {typeof strategyText === 'string' ? strategyText : JSON.stringify(strategyText)}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No cross-platform data available</p>
        )}
      </section>

      <Separator className="my-8" />

      {/* 4. Hashtag Strategy (Enhanced) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide">Hashtag Strategy</h4>
        </div>

        <Tabs defaultValue="broad" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="broad">Core Tags</TabsTrigger>
            <TabsTrigger value="platform">Platform Specific</TabsTrigger>
          </TabsList>

          <TabsContent value="broad" className="space-y-4">
            <Card className="p-4 bg-card border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2"><Badge variant="outline" className="text-xs">Tier 1</Badge><span className="text-xs text-muted-foreground">Broad Reach</span></div>
                  <p className="text-sm font-mono text-primary/80">{hashtagStrategy.tier1_broad?.length > 0 ? hashtagStrategy.tier1_broad.join(' ') : 'No suggestions'}</p>
                </div>
                {hashtagStrategy.tier1_broad?.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(hashtagStrategy.tier1_broad.join(' '), 'hashtags-tier1')}>
                    {copiedItem === 'hashtags-tier1' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </Card>
            <Card className="p-4 bg-card border-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2"><Badge variant="outline" className="text-xs">Tier 2</Badge><span className="text-xs text-muted-foreground">Niche</span></div>
                  <p className="text-sm font-mono text-primary/80">{hashtagStrategy.tier2_niche?.length > 0 ? hashtagStrategy.tier2_niche.join(' ') : 'No suggestions'}</p>
                </div>
                {hashtagStrategy.tier2_niche?.length > 0 && (
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(hashtagStrategy.tier2_niche.join(' '), 'hashtags-tier2')}>
                    {copiedItem === 'hashtags-tier2' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </Button>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="platform">
            {hashtagStrategy.platformSpecific && Object.keys(hashtagStrategy.platformSpecific).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(hashtagStrategy.platformSpecific).map(([platform, tags]) => (
                  <Card key={platform} className="p-4">
                    <h5 className="capitalize font-bold text-sm mb-2">{platform.replace(/_/g, ' ')}</h5>
                    <p className="text-sm font-mono text-muted-foreground">
                      {(tags as string[]).join(' ')}
                    </p>
                    <Button size="sm" variant="outline" className="w-full mt-3 h-7 text-xs" onClick={() => copyToClipboard((tags as string[]).join(' '), `hash-${platform}`)}>
                      {copiedItem === `hash-${platform}` ? <span className="text-green-600 flex items-center gap-1"><Check className="w-3 h-3" /> Copied</span> : <span className="flex items-center gap-1"><Copy className="w-3 h-3" /> Copy All</span>}
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic p-4 border border-dashed rounded-md text-center">No platform-specific hashtags generated.</p>
            )}
          </TabsContent>
        </Tabs>
      </section>

      <Separator className="my-8" />

      {/* 5. Alternative Captions (Replaces Analytics) */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium uppercase tracking-wide flex items-center gap-2">
            <span>📝</span>Alternative Captions
          </h4>
          <span className="text-xs text-muted-foreground font-mono">
            {Object.keys(alternativeCaptions).length} platforms
          </span>
        </div>

        {alternativeCaptions && Object.keys(alternativeCaptions).length > 0 ? (
          <Tabs defaultValue={Object.keys(alternativeCaptions)[0]} className="w-full">
            <TabsList className="mb-4">
              {Object.keys(alternativeCaptions).map(platform => (
                <TabsTrigger key={platform} value={platform} className="capitalize">
                  {platform.replace(/_/g, ' ')}
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(alternativeCaptions).map(([platform, captions]: [string, any[]]) => (
              <TabsContent key={platform} value={platform}>
                <div className="space-y-3">
                  {Array.isArray(captions) && captions.map((cap: any, idx: number) => (
                    <Card key={cap.id || idx} className="p-4 relative group border-card-border hover:border-primary/20 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            Caption {idx + 1}
                          </Badge>
                          {cap.estimatedEngagement && (
                            <Badge
                              variant={cap.estimatedEngagement === 'viral' ? 'default' : 'outline'}
                              className={`text-xs ${cap.estimatedEngagement === 'viral' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : ''}`}
                            >
                              {cap.estimatedEngagement}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {cap.characterCount || cap.caption?.length || 0} chars
                        </span>
                      </div>

                      <div className="bg-muted/30 rounded-md p-3 mb-3">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{cap.caption}</p>
                      </div>

                      {cap.hashtags && cap.hashtags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {cap.hashtags.map((tag: string, tagIdx: number) => (
                            <span key={tagIdx} className="text-xs text-primary font-mono">{tag}</span>
                          ))}
                        </div>
                      )}

                      {cap.researchSource && (
                        <p className="text-xs text-muted-foreground italic flex items-center gap-1">
                          <span>💡</span>{cap.researchSource}
                        </p>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => copyToClipboard(cap.caption, cap.id || `${platform}-${idx}`)}
                      >
                        {copiedItem === (cap.id || `${platform}-${idx}`) ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : Object.keys(analyticsTracking?.keyMetrics || {}).length > 0 ? (
          // Backward compat: show analytics if no captions but analytics exist
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p className="text-xs text-muted-foreground col-span-full mb-2 italic">Legacy analytics (upgrade content for captions)</p>
            {Object.entries(analyticsTracking.keyMetrics || {}).map(([metric, desc]: [string, any]) => (
              <Card key={metric} className="p-4 border-card-border">
                <strong className="text-sm capitalize block mb-1">{metric.replace(/([A-Z])/g, ' $1').trim()}</strong>
                <p className="text-sm text-muted-foreground">{Array.isArray(desc) ? desc.join(', ') : desc}</p>
              </Card>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No alternative captions generated</p>
        )}
      </section>
    </div>
  );
}

function PanelHeader({ title, count, unit }: { title: string, count?: number, unit?: string }) {
  return (
    <div className="flex items-center justify-between pb-4 border-b border-border">
      <h3 className="font-semibold text-lg tracking-tight">{title}</h3>
      {count !== undefined && (
        <Badge variant="outline" className="font-mono text-xs">
          {count} {unit}
        </Badge>
      )}
    </div>
  );
}
