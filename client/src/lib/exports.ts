import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import type { ContentOutput, ScriptLine, StoryboardFrame, BRollItem } from '@shared/schema';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
  }
}

export function exportToCSV(output: ContentOutput, projectTitle: string = 'Script'): void {
  const data = output.script.map((line, index) => ({
    LineNumber: line.lineNumber || index + 1,
    Speaker: line.speaker || '',
    Text: line.text,
    Timing: line.timing || '',
    Notes: line.notes || '',
    Hashtags: generateHashtags(output, line)
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${sanitizeFilename(projectTitle)}_script.csv`);
}

function generateHashtags(output: ContentOutput, line: ScriptLine): string {
  const keywords: string[] = [];

  output.bRoll?.forEach(item => {
    if (item.keywords) {
      keywords.push(...item.keywords);
    }
  });

  const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 5);
  return uniqueKeywords.map(k => `#${k.replace(/\s+/g, '')}`).join(' ');
}

export function exportToSRT(output: ContentOutput, projectTitle: string = 'Script'): void {
  const SECONDS_PER_LINE = 3;
  let srtContent = '';
  let currentTime = 0;

  output.script.forEach((line, index) => {
    const startTime = currentTime;
    const endTime = startTime + SECONDS_PER_LINE;

    const startFormatted = formatSRTTime(startTime);
    const endFormatted = formatSRTTime(endTime);

    srtContent += `${index + 1}\n`;
    srtContent += `${startFormatted} --> ${endFormatted}\n`;
    srtContent += `${line.text}\n\n`;

    currentTime = endTime;
  });

  const blob = new Blob([srtContent.trim()], { type: 'text/plain;charset=utf-8;' });
  downloadBlob(blob, `${sanitizeFilename(projectTitle)}_subtitles.srt`);
}

function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = 0;

  return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(secs, 2)},${pad(ms, 3)}`;
}

function pad(num: number, size: number): string {
  return num.toString().padStart(size, '0');
}

export function exportToPDF(output: ContentOutput, projectTitle: string = 'Script'): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  doc.setFont('courier', 'normal');
  doc.setFontSize(18);
  doc.text('C.A.L PRODUCTION SHEET', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(14);
  doc.text(projectTitle, pageWidth / 2, 30, { align: 'center' });

  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 38, { align: 'center' });

  doc.setLineWidth(0.5);
  doc.line(margin, 42, pageWidth - margin, 42);

  const tableData: string[][] = [];

  output.storyboard.forEach((frame, index) => {
    const correspondingScript = output.script[index];
    const brollItem = output.bRoll?.[index];

    tableData.push([
      (frame.frameNumber || index + 1).toString(),
      frame.description + (brollItem ? `\n\nB-Roll: ${brollItem.description}` : ''),
      correspondingScript?.text || '',
      frame.duration || '3s'
    ]);
  });

  autoTable(doc, {
    startY: 50,
    head: [['Scene #', 'Visual / B-Roll Description', 'Audio / Script', 'Duration']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [50, 50, 50],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 4
    },
    columnStyles: {
      0: { cellWidth: 15, halign: 'center' },
      1: { cellWidth: 55 },
      2: { cellWidth: 80, font: 'courier' },
      3: { cellWidth: 20, halign: 'center' }
    },
    margin: { left: margin, right: margin },
    styles: {
      overflow: 'linebreak',
      lineWidth: 0.1
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 150;

  if (output.techSpecs) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('TECHNICAL SPECIFICATIONS', margin, finalY + 15);

    doc.setFontSize(9);
    doc.setFont('courier', 'normal');
    let specY = finalY + 25;

    const specs = [
      ['Aspect Ratio:', output.techSpecs.aspectRatio],
      ['Resolution:', output.techSpecs.resolution],
      ['Frame Rate:', output.techSpecs.frameRate],
      ['Duration:', output.techSpecs.duration],
      ['Platforms:', output.techSpecs.platforms?.join(', ')]
    ].filter(s => s[1]);

    specs.forEach(([label, value]) => {
      if (specY > doc.internal.pageSize.getHeight() - 20) {
        doc.addPage();
        specY = 20;
      }
      doc.text(`${label} ${value}`, margin, specY);
      specY += 6;
    });
  }

  doc.save(`${sanitizeFilename(projectTitle)}_shot_list.pdf`);
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
