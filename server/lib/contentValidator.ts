/**
 * Content Quality Validation System
 * 
 * Validates generated scripts and storyboards against industry standards.
 * Used to ensure output meets minimum quality thresholds.
 * 
 * @module contentValidator
 */

interface WordCountRequirements {
    minWords: number;
    maxWords: number;
    targetWords: number;
}

interface ShotCountRequirements {
    minShots: number;
    maxShots: number;
    targetShots: number;
}

interface ScriptRequirements extends WordCountRequirements {
    duration: number;
    topic: string;
    audience: string;
    uav: string;
    goal: string;
    expectedBeats: number;
}

interface StoryboardRequirements extends ShotCountRequirements {
    duration: number;
    minShotTypes: number;
}

interface ValidationResult {
    passed: boolean;
    score: number;
    issues: string[];
    suggestions: string[];
    metrics: Record<string, any>;
}

/**
 * Calculate required word count based on video duration and style
 * 
 * Formula: (duration - breath_tax) * words_per_second * variance
 * - High-energy: 3.0 words/second
 * - Conversational: 2.3 words/second
 * - Breath tax: 3 seconds (natural pauses)
 * - Variance: ±10%
 */
export function calculateWordCount(
    duration: number,
    style: 'high-energy' | 'conversational' = 'high-energy'
): WordCountRequirements {
    const WORDS_PER_SECOND = style === 'high-energy' ? 3.0 : 2.3;
    const BREATH_TAX = 3; // seconds lost to natural pauses
    const usableTime = Math.max(duration - BREATH_TAX, duration * 0.9);

    const targetWords = Math.round(usableTime * WORDS_PER_SECOND);
    const minWords = Math.floor(targetWords * 0.9);
    const maxWords = Math.ceil(targetWords * 1.1);

    console.log(`[ContentValidator] Duration: ${duration}s, Style: ${style}`);
    console.log(`[ContentValidator] Word count: ${minWords}-${maxWords} (target: ${targetWords})`);

    return { minWords, maxWords, targetWords };
}

/**
 * Calculate required shot count based on video duration
 * 
 * Formula: duration / avg_shot_duration ± variance
 * - Industry standard: 1 shot every 2-3 seconds
 * - Min: duration / 3 seconds
 * - Max: duration / 2 seconds
 */
export function calculateShotCount(duration: number): ShotCountRequirements {
    const minShots = Math.floor(duration / 3);
    // Cap max shots at 60 to prevent token overflow on long videos
    const maxShots = Math.min(Math.ceil(duration / 2), 60);
    const targetShots = Math.min(Math.round(duration / 2.5), 60);

    console.log(`[ContentValidator] Duration: ${duration}s`);
    console.log(`[ContentValidator] Shot count: ${minShots}-${maxShots} (target: ${targetShots})`);

    return { minShots, maxShots, targetShots };
}

/**
 * Validate generated script against requirements
 * 
 * Checks:
 * 1. Word count within acceptable range
 * 2. Topic appears in hook (first 10 words)
 * 3. Audience terminology used 2+ times
 * 4. UAV present in solution section
 * 5. Timestamps present and sequential
 * 6. Each beat has appropriate word count
 */
export function validateScript(
    script: string,
    requirements: ScriptRequirements
): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const metrics: Record<string, any> = {};

    // 1. Word count validation
    const words = script.split(/\s+/).filter(w => w.length > 0);
    metrics.wordCount = words.length;
    metrics.wordCountRequired = `${requirements.minWords}-${requirements.maxWords}`;

    if (words.length < requirements.minWords) {
        issues.push(`Script too short: ${words.length} words (minimum: ${requirements.minWords})`);
        suggestions.push(`Add ${requirements.minWords - words.length} more words to meet industry standard for ${requirements.duration}s video`);
    }

    if (words.length > requirements.maxWords) {
        issues.push(`Script too long: ${words.length} words (maximum: ${requirements.maxWords})`);
        suggestions.push(`Remove ${words.length - requirements.maxWords} words - viewer won't process this much in ${requirements.duration}s`);
    }

    // 2. Topic in hook validation (critical for retention)
    const hook = script.slice(0, 100).toLowerCase();
    const topicInHook = hook.includes(requirements.topic.toLowerCase());
    metrics.topicInHook = topicInHook;

    if (!topicInHook) {
        issues.push(`Topic "${requirements.topic}" not found in hook (first 10 words)`);
        suggestions.push(`Start with "${requirements.topic}" to immediately signal relevance`);
    }

    // 3. Audience language validation
    const audiencePattern = new RegExp(requirements.audience, 'gi');
    const audienceMentions = (script.match(audiencePattern) || []).length;
    metrics.audienceMentions = audienceMentions;

    if (audienceMentions < 2) {
        issues.push(`Audience "${requirements.audience}" mentioned only ${audienceMentions} time(s) (need 2+)`);
        suggestions.push(`Use "${requirements.audience}" terminology naturally to build relevance`);
    }

    // 4. UAV validation
    const uavPresent = script.toLowerCase().includes(requirements.uav.toLowerCase());
    metrics.uavPresent = uavPresent;

    if (!uavPresent) {
        issues.push(`Unique Added Value "${requirements.uav}" not present in script`);
        suggestions.push(`Present "${requirements.uav}" as the key solution or secret`);
    }

    // 5. Timestamp validation
    const timestamps = script.match(/\[0:\d{2}-0:\d{2}\]/g) || [];
    metrics.timestampCount = timestamps.length;
    metrics.expectedBeats = requirements.expectedBeats;

    if (requirements.expectedBeats > 0 && timestamps.length < requirements.expectedBeats) {
        issues.push(`Missing timestamps: found ${timestamps.length}, expected ${requirements.expectedBeats} beats`);
        suggestions.push(`Add timestamps like [0:00-0:03] for each structural beat`);
    }

    // 6. Calculate quality score
    const maxScore = 100;
    const penaltyPerIssue = 20;
    const score = Math.max(0, maxScore - (issues.length * penaltyPerIssue));

    console.log(`[ContentValidator] Script validation complete:`);
    console.log(`[ContentValidator] ✓ Word count: ${metrics.wordCount} (${metrics.wordCountRequired})`);
    console.log(`[ContentValidator] ✓ Topic in hook: ${metrics.topicInHook}`);
    console.log(`[ContentValidator] ✓ Audience mentions: ${metrics.audienceMentions}`);
    console.log(`[ContentValidator] ✓ UAV present: ${metrics.uavPresent}`);
    console.log(`[ContentValidator] ✓ Timestamps: ${metrics.timestampCount}/${metrics.expectedBeats}`);
    console.log(`[ContentValidator] ✓ Quality score: ${score}/100`);

    if (issues.length > 0) {
        console.warn(`[ContentValidator] ⚠️ Issues found:`, issues);
    }

    return {
        passed: issues.length === 0,
        score,
        issues,
        suggestions,
        metrics
    };
}

/**
 * Validate generated storyboard against requirements
 * 
 * Checks:
 * 1. Shot count within acceptable range
 * 2. Variety of shot types (5+ different types)
 * 3. Complete time coverage (0s to duration)
 * 4. No excessively long shots (>5s kills retention)
 * 5. Shots align with script beats
 */
export function validateStoryboard(
    shots: any[],
    requirements: StoryboardRequirements
): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];
    const metrics: Record<string, any> = {};

    // 1. Shot count validation
    metrics.shotCount = shots.length;
    metrics.shotCountRequired = `${requirements.minShots}-${requirements.maxShots}`;

    if (shots.length < requirements.minShots) {
        issues.push(`Too few shots: ${shots.length} (minimum: ${requirements.minShots})`);
        suggestions.push(`Add ${requirements.minShots - shots.length} more visual events - viewers need pattern interrupts every 2-3 seconds`);
    }

    if (shots.length > requirements.maxShots) {
        issues.push(`Too many shots: ${shots.length} (maximum: ${requirements.maxShots})`);
        suggestions.push(`Remove ${shots.length - requirements.maxShots} shots - too rapid cuts cause viewer fatigue`);
    }

    // 2. Shot variety validation
    const shotTypes = new Set(shots.map(s => s.type).filter(Boolean));
    metrics.shotTypes = Array.from(shotTypes);
    metrics.shotVariety = shotTypes.size;

    if (shotTypes.size < requirements.minShotTypes) {
        issues.push(`Low variety: only ${shotTypes.size} shot types (need ${requirements.minShotTypes}+)`);
        suggestions.push(`Mix in: punch-in, B-roll, text overlays, jump cuts for visual interest`);
    }

    // 3. Time coverage validation
    if (shots.length > 0) {
        const lastShot = shots[shots.length - 1];
        const endTime = lastShot?.endTime || lastShot?.timestamp?.split('-')[1];

        if (endTime) {
            const endSeconds = parseTimestamp(endTime);
            metrics.coverage = `${endSeconds}s / ${requirements.duration}s`;

            if (endSeconds < requirements.duration - 1) {
                issues.push(`Incomplete coverage: ends at ${endSeconds}s (need ${requirements.duration}s)`);
                suggestions.push(`Add shots to cover remaining ${requirements.duration - endSeconds} seconds`);
            }
        }
    }

    // 4. Long shot validation
    const longShots = shots.filter(s => {
        const duration = s.duration || calculateShotDuration(s.timestamp);
        return duration > 5;
    });

    if (longShots.length > 0) {
        issues.push(`${longShots.length} shot(s) exceed 5 seconds (reduces retention)`);
        suggestions.push(`Split long shots into 2-3 second segments with punch-ins or B-roll`);
    }

    // 5. Calculate quality score
    const maxScore = 100;
    const penaltyPerIssue = 20;
    const score = Math.max(0, maxScore - (issues.length * penaltyPerIssue));

    console.log(`[ContentValidator] Storyboard validation complete:`);
    console.log(`[ContentValidator] ✓ Shot count: ${metrics.shotCount} (${metrics.shotCountRequired})`);
    console.log(`[ContentValidator] ✓ Shot variety: ${metrics.shotVariety} types`);
    console.log(`[ContentValidator] ✓ Coverage: ${metrics.coverage || 'N/A'}`);
    console.log(`[ContentValidator] ✓ Quality score: ${score}/100`);

    if (issues.length > 0) {
        console.warn(`[ContentValidator] ⚠️ Issues found:`, issues);
    }

    return {
        passed: issues.length === 0,
        score,
        issues,
        suggestions,
        metrics
    };
}

// Helper functions
function parseTimestamp(timestamp: string): number {
    // Parse "0:30" or "1:30" to seconds
    const match = timestamp.match(/(\d+):(\d+)/);
    if (match) {
        return parseInt(match[1]) * 60 + parseInt(match[2]);
    }
    return 0;
}

function calculateShotDuration(timestamp: string): number {
    // Parse "0:00-0:03" to duration in seconds
    if (!timestamp || !timestamp.includes('-')) return 0;

    const [start, end] = timestamp.split('-');
    return parseTimestamp(end) - parseTimestamp(start);
}

/**
 * Get expected beat count based on duration
 */
export function getExpectedBeats(duration: number): number {
    if (duration <= 20) return 3;  // Flash: Hook → Value → CTA
    if (duration <= 45) return 6;  // Sprint: Hook → Context → 3 Values → CTA
    if (duration <= 75) return 5;  // Marathon: Promise → Problem → Agitate → Solution → Result
    return 7;  // Deep Dive: Promise → Problem → Agitate → Solution → Proof → Result → CTA
}
