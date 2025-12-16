import { readFileSync } from 'fs';
import { join } from 'path';

export interface HookTemplate {
  template: string;
  category: string;
  exampleUrl?: string;
}

let hookDatabase: HookTemplate[] = [];
let isLoaded = false;

export function parseHookDatabase(): HookTemplate[] {
  if (isLoaded) return hookDatabase;

  try {
    const filePath = join(process.cwd(), 'server', 'hook_database.tsv');
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    let currentCategory = 'GENERAL';
    const templates: HookTemplate[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split('\t').filter(p => p.trim());
      
      if (parts.length === 1 && !trimmed.includes('(insert') && !trimmed.includes('https://')) {
        if (trimmed.includes(':')) {
          currentCategory = trimmed.replace(':', '').trim();
        } else if (/^[A-Z\s]+$/.test(trimmed) && trimmed.length < 30) {
          currentCategory = trimmed;
        }
        continue;
      }

      if (parts.length >= 1 && parts[0].includes('(insert') || parts[0].includes('If you') || parts[0].includes('Here')) {
        const template = parts[0].trim();
        const exampleUrl = parts.find(p => p.includes('https://'))?.trim();
        
        if (template && template.length > 10) {
          templates.push({
            template,
            category: currentCategory,
            exampleUrl
          });
        }
      }
    }

    hookDatabase = templates;
    isLoaded = true;
    console.log(`Loaded ${hookDatabase.length} hook templates from database`);
    return hookDatabase;
  } catch (error) {
    console.error('Failed to parse hook database:', error);
    return [];
  }
}

export function getHookTemplatesByCategory(category: string): HookTemplate[] {
  const db = parseHookDatabase();
  return db.filter(h => h.category.toLowerCase().includes(category.toLowerCase()));
}

export function getRelevantHookPatterns(niche: string, limit: number = 20): HookTemplate[] {
  const db = parseHookDatabase();
  const nicheKeywords = niche.toLowerCase().split(/\s+/);
  
  const scored = db.map(hook => {
    let score = 0;
    const templateLower = hook.template.toLowerCase();
    const categoryLower = hook.category.toLowerCase();
    
    for (const keyword of nicheKeywords) {
      if (templateLower.includes(keyword)) score += 2;
      if (categoryLower.includes(keyword)) score += 3;
    }
    
    if (templateLower.includes('dream result')) score += 1;
    if (templateLower.includes('pain point')) score += 1;
    if (templateLower.includes('target audience')) score += 1;
    
    return { hook, score };
  });
  
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => s.hook);
}

export function getHookPatternSummary(niche: string): string {
  const relevant = getRelevantHookPatterns(niche, 15);
  const categories = Array.from(new Set(relevant.map(h => h.category)));
  
  const summary = categories.map(cat => {
    const catHooks = relevant.filter(h => h.category === cat).slice(0, 3);
    return `**${cat}:**\n${catHooks.map(h => `- "${h.template}"`).join('\n')}`;
  }).join('\n\n');
  
  return summary || 'No specific patterns found for this niche.';
}

export function getAllCategories(): string[] {
  const db = parseHookDatabase();
  return Array.from(new Set(db.map(h => h.category)));
}
