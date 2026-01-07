import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, Copy, FileText, FileType, Check, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ContentOutput } from '@shared/schema';

interface ExportPanelProps {
    output: ContentOutput;
    title?: string;
}

export function ExportPanel({ output, title = 'Content' }: ExportPanelProps) {
    const { toast } = useToast();
    const [copying, setCopying] = useState(false);
    const [exporting, setExporting] = useState(false);

    const formatContentAsText = (): string => {
        const sections: string[] = [];

        sections.push(`=== ${title.toUpperCase()} ===\n`);

        // Script section
        if (output.script && output.script.length > 0) {
            sections.push('--- SCRIPT ---');
            output.script.forEach((line) => {
                const speaker = line.speaker ? `[${line.speaker}] ` : '';
                const timing = line.timing ? ` (${line.timing})` : '';
                sections.push(`${line.lineNumber}. ${speaker}${line.text}${timing}`);
                if (line.notes) sections.push(`   Notes: ${line.notes}`);
            });
            sections.push('');
        }

        // Storyboard section
        if (output.storyboard && output.storyboard.length > 0) {
            sections.push('--- STORYBOARD ---');
            output.storyboard.forEach((frame) => {
                sections.push(`Frame ${frame.frameNumber}: ${frame.shotType}`);
                sections.push(`  Description: ${frame.description}`);
                if (frame.visualNotes) sections.push(`  Visual Notes: ${frame.visualNotes}`);
                if (frame.duration) sections.push(`  Duration: ${frame.duration}`);
                sections.push('');
            });
        }

        // B-Roll section
        if (output.bRoll && output.bRoll.length > 0) {
            sections.push('--- B-ROLL SUGGESTIONS ---');
            output.bRoll.forEach((item, index) => {
                sections.push(`${index + 1}. ${item.description}`);
                sections.push(`   Source: ${item.source}`);
                if (item.timestamp) sections.push(`   Timestamp: ${item.timestamp}`);
                if (item.imagePrompt) sections.push(`   Image AI Prompt: ${item.imagePrompt}`);
                if (item.videoPrompt) sections.push(`   Video AI Prompt: ${item.videoPrompt}`);
            });
            sections.push('');
        }

        // Captions section
        if (output.captions && output.captions.length > 0) {
            sections.push('--- CAPTIONS ---');
            output.captions.forEach((caption) => {
                const style = caption.style ? ` [${caption.style}]` : '';
                sections.push(`${caption.timestamp}: ${caption.text}${style}`);
            });
            sections.push('');
        }

        // Tech Specs section
        if (output.techSpecs) {
            sections.push('--- TECHNICAL SPECIFICATIONS ---');
            sections.push(`  Aspect Ratio: ${output.techSpecs.aspectRatio}`);
            sections.push(`  Resolution: ${output.techSpecs.resolution}`);
            sections.push(`  Frame Rate: ${output.techSpecs.frameRate}`);
            sections.push(`  Duration: ${output.techSpecs.duration}`);
            if (output.techSpecs.audioFormat) sections.push(`  Audio Format: ${output.techSpecs.audioFormat}`);
            if (output.techSpecs.exportFormat) sections.push(`  Export Format: ${output.techSpecs.exportFormat}`);
            if (output.techSpecs.platforms && output.techSpecs.platforms.length > 0) {
                sections.push(`  Platforms: ${output.techSpecs.platforms.join(', ')}`);
            }
        }

        return sections.join('\n');
    };

    const handleCopyToClipboard = async () => {
        setCopying(true);
        try {
            const content = formatContentAsText();
            await navigator.clipboard.writeText(content);
            toast({
                title: 'Copied!',
                description: 'Content copied to clipboard.',
            });
        } catch (error) {
            toast({
                title: 'Copy Failed',
                description: 'Failed to copy content to clipboard.',
                variant: 'destructive',
            });
        } finally {
            setCopying(false);
        }
    };

    const handleExportTxt = () => {
        setExporting(true);
        try {
            const content = formatContentAsText();
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast({
                title: 'Exported!',
                description: 'Content exported as TXT file.',
            });
        } catch (error) {
            toast({
                title: 'Export Failed',
                description: 'Failed to export content.',
                variant: 'destructive',
            });
        } finally {
            setExporting(false);
        }
    };

    const handleExportPdf = async () => {
        setExporting(true);
        try {
            // Dynamic import to avoid loading jspdf unless needed
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            const content = formatContentAsText();
            const lines = doc.splitTextToSize(content, 180);

            let y = 20;
            const lineHeight = 7;
            const pageHeight = doc.internal.pageSize.height - 20;

            doc.setFontSize(12);

            for (const line of lines) {
                if (y > pageHeight) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, 15, y);
                y += lineHeight;
            }

            doc.save(`${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.pdf`);
            toast({
                title: 'Exported!',
                description: 'Content exported as PDF file.',
            });
        } catch (error) {
            toast({
                title: 'PDF Export Failed',
                description: 'Failed to generate PDF. Try TXT export instead.',
                variant: 'destructive',
            });
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={handleCopyToClipboard}
                disabled={copying}
                data-testid="button-copy-content"
            >
                {copying ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                ) : (
                    <Copy className="h-4 w-4 mr-2" />
                )}
                Copy
            </Button>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        variant="default"
                        size="sm"
                        disabled={exporting}
                        data-testid="button-export-dropdown"
                    >
                        {exporting ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        Export
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleExportTxt} data-testid="menu-item-export-txt">
                        <FileText className="h-4 w-4 mr-2" />
                        Export as TXT
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleExportPdf} data-testid="menu-item-export-pdf">
                        <FileType className="h-4 w-4 mr-2" />
                        Export as PDF
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
