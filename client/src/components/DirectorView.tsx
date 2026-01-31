import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Check, Circle, Eye, FileText, Film, Settings, Video, MessageSquare } from 'lucide-react';
import type { AgentStatus, ContentOutput, ScriptLine, StoryboardFrame, TechSpecs, BRollItem, Caption } from '@shared/schema';

interface DirectorViewProps {
  agents: AgentStatus[];
  title?: string;
  partialOutput?: Partial<ContentOutput>;
}

const agentToSection: Record<string, keyof ContentOutput> = {
  'Script Architect': 'script',
  'Visual Director': 'storyboard',
  'Tech Specialist': 'techSpecs',
  'B-Roll Scout': 'bRoll',
  'Caption Writer': 'captions'
};

const sectionIcons: Record<keyof ContentOutput, typeof FileText> = {
  script: FileText,
  storyboard: Film,
  techSpecs: Settings,
  bRoll: Video,
  captions: MessageSquare
};

const sectionLabels: Record<keyof ContentOutput, string> = {
  script: 'Script',
  storyboard: 'Storyboard',
  techSpecs: 'Tech Specs',
  bRoll: 'B-Roll',
  captions: 'Captions'
};

export function DirectorView({ agents, title = 'Assembling Content', partialOutput }: DirectorViewProps) {
  const [expandedSections, setExpandedSections] = useState<Set<keyof ContentOutput>>(new Set());
  const completedCount = agents.filter(a => a.status === 'complete').length;
  const progress = agents.length > 0 ? (completedCount / agents.length) * 100 : 0;

  const toggleSection = (section: keyof ContentOutput) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const getAgentSection = (agentName: string): keyof ContentOutput | undefined => {
    return agentToSection[agentName];
  };

  const isSectionReady = (section: keyof ContentOutput): boolean => {
    if (!partialOutput) return false;
    const data = partialOutput[section];
    if (data === undefined || data === null) return false;
    if (Array.isArray(data)) return data.length > 0;
    if (typeof data === 'object') return Object.keys(data).length > 0;
    return false;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto p-6">
      <div className="flex-1 min-w-0">
        <div className="flex flex-col items-center justify-center py-8">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-full border-2 border-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
            <div
              className="absolute inset-0 rounded-full border-2 border-primary transition-all duration-500"
              style={{
                clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`
              }}
            />
          </div>

          <h2 className="text-xl font-semibold tracking-tight mb-2 text-center">
            {title}
          </h2>

          <p className="text-muted-foreground text-sm mb-6 text-center">
            Watch your content come together in real-time
          </p>

          <div className="w-full space-y-3" data-testid="director-agent-list">
            {agents.map((agent) => {
              const section = getAgentSection(agent.name);
              const hasPreview = section && isSectionReady(section);

              return (
                <AgentRow
                  key={agent.name}
                  agent={agent}
                  hasPreview={hasPreview}
                  onPreviewClick={hasPreview && section ? () => toggleSection(section) : undefined}
                />
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              {completedCount} / {agents.length} Complete
            </span>
          </div>
        </div>
      </div>

      <div className="lg:w-80 shrink-0">
        <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">
          Preview Panels
        </h3>
        <div className="space-y-2">
          {Object.entries(sectionLabels).map(([key, label]) => {
            const section = key as keyof ContentOutput;
            const Icon = sectionIcons[section];
            const isReady = isSectionReady(section);
            const isExpanded = expandedSections.has(section);

            return (
              <Card
                key={section}
                className={`
                  p-3 transition-all duration-300
                  ${isReady ? 'cursor-pointer hover-elevate' : 'opacity-50'}
                  ${isExpanded ? 'ring-2 ring-primary' : ''}
                `}
                onClick={isReady ? () => toggleSection(section) : undefined}
                data-testid={`preview-panel-${section}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-8 h-8 rounded-md flex items-center justify-center
                    ${isReady ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}
                  `}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium">{label}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isReady ? (
                        <Badge variant="default" className="text-[10px]">Ready</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Pending</Badge>
                      )}
                    </div>
                  </div>
                  {isReady && (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>

                {isExpanded && partialOutput && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <SectionPreview section={section} data={partialOutput[section]} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface AgentRowProps {
  agent: AgentStatus;
  hasPreview?: boolean;
  onPreviewClick?: () => void;
}

function AgentRow({ agent, hasPreview, onPreviewClick }: AgentRowProps) {
  const description = agent.task || 'Processing...';

  return (
    <div
      className={`
        flex items-center gap-3 p-3 rounded-lg bg-card/50
        ${hasPreview ? 'cursor-pointer hover-elevate' : ''}
      `}
      onClick={onPreviewClick}
      data-testid={`director-agent-${agent.name.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <StatusIndicator status={agent.status} />

      <div className="flex-1 min-w-0">
        <span className="font-mono text-xs uppercase tracking-widest block">
          {agent.name}
        </span>
        <span className="text-sm text-muted-foreground truncate block">
          {description}
        </span>
      </div>

      {hasPreview && (
        <Badge variant="secondary" className="shrink-0">
          <Eye className="w-3 h-3 mr-1" />
          Preview
        </Badge>
      )}
    </div>
  );
}

function StatusIndicator({ status }: { status: AgentStatus['status'] }) {
  switch (status) {
    case 'working':
      return (
        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
      );
    case 'complete':
      return (
        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
          <Check className="w-3 h-3 text-primary" />
        </div>
      );
    default:
      return (
        <Circle className="w-2 h-2 text-muted-foreground/50" />
      );
  }
}

interface SectionPreviewProps {
  section: keyof ContentOutput;
  data: ScriptLine[] | StoryboardFrame[] | TechSpecs | BRollItem[] | Caption[] | undefined;
}

function SectionPreview({ section, data }: SectionPreviewProps) {
  if (!data) return null;

  switch (section) {
    case 'script':
      const scriptLines = data as ScriptLine[];
      return (
        <ScrollArea className="h-24">
          <div className="space-y-1 text-xs text-muted-foreground">
            {scriptLines.slice(0, 3).map((line, i) => (
              <p key={i} className="truncate">
                <span className="font-mono text-[10px] text-primary mr-1">[{line.timing || line.lineNumber}]</span>
                {line.text}
              </p>
            ))}
            {scriptLines.length > 3 && (
              <p className="text-primary/70">+{scriptLines.length - 3} more lines...</p>
            )}
          </div>
        </ScrollArea>
      );

    case 'storyboard':
      const frames = data as StoryboardFrame[];
      return (
        <div className="text-xs text-muted-foreground">
          <p>{frames.length} frames ready</p>
          {frames[0] && (
            <p className="truncate mt-1">
              <span className="text-primary">Shot 1:</span> {frames[0].shotType}
            </p>
          )}
        </div>
      );

    case 'techSpecs':
      const specs = data as TechSpecs;
      return (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>Platforms: <span className="text-foreground">{specs.platforms?.join(', ') || 'N/A'}</span></p>
          <p>Duration: <span className="text-foreground">{specs.duration}</span></p>
          <p>Resolution: <span className="text-foreground">{specs.resolution}</span></p>
        </div>
      );

    case 'bRoll':
      const broll = data as BRollItem[];
      return (
        <div className="text-xs text-muted-foreground">
          <p>{broll.length} B-roll items</p>
          {broll[0] && (
            <p className="truncate mt-1">{broll[0].description}</p>
          )}
        </div>
      );

    case 'captions':
      const captions = data as Caption[];
      return (
        <div className="text-xs text-muted-foreground">
          <p>{captions.length} captions generated</p>
        </div>
      );

    default:
      return null;
  }
}
