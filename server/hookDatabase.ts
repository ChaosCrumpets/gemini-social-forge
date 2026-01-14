import { readFileSync } from 'fs';
import { join } from 'path';

export interface HookTemplate {
  template: string;
  category: string;
  exampleUrl?: string;
}

/**
 * Enhanced hook template with neural mechanism and SPCL metadata
 * Aligned with Subsystem 3: Hook Architect from enhanced prompt
 */
export interface EnhancedHookTemplate extends HookTemplate {
  // Neural mechanism this hook triggers (from neuroscience principles)
  neuralMechanism?: 'prediction_error' | 'information_gap' | 'pattern_interrupt' | 'social_relevance';

  // SPCL element this hook best showcases
  spclElement?: 'status' | 'power' | 'credibility' | 'likeness';

  // Platform optimization hints
  platformFit?: string[]; // ['tiktok', 'instagram', 'linkedin', 'youtube_shorts']

  // Estimated scroll-stop time in seconds
  scrollStopSeconds?: number;

  // Viral performance score (1-10)
  viralScore?: number;
}

/**
 * Context for adapting hook templates with user-specific content
 * Includes UAV/SPCL markers for personalization
 */
export interface HookAdaptationContext {
  topic: string;
  targetAudience?: string;
  goal?: string;
  platforms?: string[];

  // Unique Added Value markers
  uav?: {
    description: string;
    uniqueIntersection?: string; // "Developer AND marketer"
    contrarianView?: string; // "Everyone says X, but I believe Y"
    proprietaryMethod?: string; // "My C.A.L. system"
  };

  // SPCL markers (Status, Power, Credibility, Likeness)
  spcl?: {
    status?: string[]; // ["Filming from office with CN Tower view"]
    power?: string[]; // ["We spent $15K testing this"]
    credibility?: string[]; // ["Generated 43 leads at $12.50 each"]
    likeness?: string[]; // ["I completely bombed my first attempt"]
  };

  // User-provided proof points
  proofPoints?: {
    results?: string; // "Generated $X in revenue"
    credentials?: string; // "Former VP of Sales at [Company]"
    trackRecord?: string; // "Trained 500+ people"
  };
}

/**
 * Generated hook with full metadata and reasoning
 * Used for returning hooks from enhanced generation functions
 */
export interface GeneratedHook {
  id: string;
  text: string;
  type: string;
  preview: string;
  rank: number;
  isRecommended: boolean;

  // Enhanced metadata
  sourceTemplate?: string; // Original template before adaptation
  neuralMechanism?: string;
  spclIntegration?: string;
  platformOptimization?: string;
  retentionScore?: number;
  viralPotential?: string;
  reasoning?: string;
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
/**
 * Adapts a hook template by replacing placeholders with user-specific content
 * Integrates UAV/SPCL markers to personalize hooks
 * 
 * @param template - The hook template with placeholders like "(insert topic)"
 * @param context - User context including topic, audience, UAV, and SPCL markers
 * @returns Adapted hook text with placeholders replaced
 */
export function adaptHookTemplate(
    template: string,
    context: HookAdaptationContext
): string {
    let adapted = template;

    // Basic replacements
    const replacements: Record<string, string> = {
        '(insert topic)': context.topic || 'this topic',
        '(topic)': context.topic || 'this topic',
        '(target audience)': context.targetAudience || 'people',
        '(insert target audience)': context.targetAudience || 'people',
        '(audience)': context.targetAudience || 'people',
        '(dream result)': context.goal || 'achieve their goals',
        '(goal)': context.goal || 'success',
        '(pain point)': `frustration with ${context.topic}` || 'common challenges',
    };

    // UAV-based replacements
    if (context.uav) {
        if (context.uav.uniqueIntersection) {
            replacements['(unique angle)'] = context.uav.uniqueIntersection;
            replacements['(unique perspective)'] = context.uav.uniqueIntersection;
        }
        if (context.uav.contrarianView) {
            replacements['(contrarian view)'] = context.uav.contrarianView;
            replacements['(different approach)'] = context.uav.contrarianView;
        }
        if (context.uav.proprietaryMethod) {
            replacements['(method)'] = context.uav.proprietaryMethod;
            replacements['(system)'] = context.uav.proprietaryMethod;
        }
    }

    // SPCL-based enhancements
    if (context.spcl?.credibility && context.spcl.credibility.length > 0) {
        replacements['(credentials)'] = context.spcl.credibility[0];
        replacements['(proof)'] = context.spcl.credibility[0];
    }

    if (context.spcl?.power && context.spcl.power.length > 0) {
        replacements['(authority statement)'] = context.spcl.power[0];
    }

    if (context.spcl?.likeness && context.spcl.likeness.length > 0) {
        replacements['(relatable story)'] = context.spcl.likeness[0];
    }

    // Proof points
    if (context.proofPoints?.results) {
        replacements['(specific result)'] = context.proofPoints.results;
        replacements['(result)'] = context.proofPoints.results;
    }

    if (context.proofPoints?.credentials) {
        replacements['(credentials)'] = context.proofPoints.credentials;
    }

    // Apply all replacements (case-insensitive)
    for (const [placeholder, value] of Object.entries(replacements)) {
        const regex = new RegExp(placeholder.replace(/[()]/g, '\\$&'), 'gi');
        adapted = adapted.replace(regex, value);
    }

    return adapted;
}

/**
 * Generates enhanced hooks using multi-source approach:
 * 1. Hook Database (proven templates)
 * 2. Template Adaptation (user-specific personalization)
 * 3. Neuroscience Validation (biological mechanisms)
 * 
 * @param context - User context with topic, audience, UAV, and SPCL markers
 * @param count - Number of hooks to generate (default: 6)
 * @returns Array of enhanced hook templates with metadata
 */
export function generateEnhancedHooks(
    context: HookAdaptationContext,
    count: number = 6
): EnhancedHookTemplate[] {
    const db = parseHookDatabase();
    const niche = `${context.topic} ${context.targetAudience || ''} ${context.goal || ''}`.trim();

    // Get relevant templates from database (double the count for filtering)
    const relevantTemplates = getRelevantHookPatterns(niche, count * 2);

    // Adapt templates with user context
    const adapted = relevantTemplates.map(template => {
        const adaptedText = adaptHookTemplate(template.template, context);

        // Assign neural mechanism based on template pattern
        let neuralMechanism: EnhancedHookTemplate['neuralMechanism'] = 'information_gap';
        const lowerTemplate = template.template.toLowerCase();

        if (lowerTemplate.includes('wait') || lowerTemplate.includes('stop') || lowerTemplate.includes('before you')) {
            neuralMechanism = 'pattern_interrupt';
        } else if (lowerTemplate.includes('you') || lowerTemplate.includes('if you') || lowerTemplate.includes('your')) {
            neuralMechanism = 'social_relevance';
        } else if (lowerTemplate.includes('truth') || lowerTemplate.includes('secret') || lowerTemplate.includes('wrong')) {
            neuralMechanism = 'prediction_error';
        }

        // Determine SPCL element based on adapted content
        let spclElement: EnhancedHookTemplate['spclElement'] = 'likeness';
        const lowerAdapted = adaptedText.toLowerCase();

        if (lowerAdapted.includes('$') || lowerAdapted.includes('result') || lowerAdapted.includes('generated')) {
            spclElement = 'credibility';
        } else if (lowerAdapted.includes('should') || lowerAdapted.includes('must') || lowerAdapted.includes('need to')) {
            spclElement = 'power';
        } else if (lowerAdapted.includes('former') || lowerAdapted.includes('worked at') || lowerAdapted.includes('expert')) {
            spclElement = 'status';
        }

        // Determine platform fit based on hook style
        const platformFit: string[] = [];
        if (lowerTemplate.includes('pov') || lowerTemplate.includes('watch')) {
            platformFit.push('tiktok', 'instagram');
        }
        if (lowerTemplate.includes('professional') || lowerTemplate.includes('industry')) {
            platformFit.push('linkedin');
        }
        if (platformFit.length === 0) {
            platformFit.push('tiktok', 'instagram', 'youtube_shorts'); // Default: all short-form
        }

        return {
            ...template,
            template: adaptedText,
            neuralMechanism,
            spclElement,
            platformFit,
            scrollStopSeconds: neuralMechanism === 'pattern_interrupt' ? 1.2 : 1.8,
            viralScore: template.exampleUrl ? 8 : 7 // Higher score if we have proven examples
        };
    });

    // Return top N hooks
    return adapted.slice(0, count);
}
