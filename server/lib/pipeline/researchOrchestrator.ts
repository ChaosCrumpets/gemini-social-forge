/**
 * Research Orchestrator
 * 
 * Stage 2 of the Enhanced Research Pipeline.
 * Executes research queries in parallel and aggregates results.
 * Features:
 * - Parallel execution with Promise.allSettled
 * - In-memory LRU caching with TTL
 * - Graceful degradation on individual query failures
 */

import { researchService, research_type } from '../research/researcher';
import type { ResearchQuery, IdeationResult } from './consolidator';

// ============================================
// Types
// ============================================

export interface ResearchResult {
    queryId: string;
    queryType: string;
    source: string;
    data: any;
    summary: string;
    cached: boolean;
    executionTimeMs: number;
}

export interface AggregatedResearch {
    results: ResearchResult[];
    successCount: number;
    failureCount: number;
    totalExecutionTimeMs: number;
    timestamp: number;

    // Structured summaries for context injection
    facts: string[];
    trends: string[];
    hooks: string[];
    vocabulary: string[];
    platformTips: string[];
}

// ============================================
// Simple LRU Cache
// ============================================

interface CacheEntry {
    data: ResearchResult;
    expiresAt: number;
}

class ResearchCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxSize: number;
    private ttlMs: number;

    constructor(maxSize: number = 100, ttlMinutes: number = 15) {
        this.maxSize = maxSize;
        this.ttlMs = ttlMinutes * 60 * 1000;
    }

    private generateKey(query: ResearchQuery): string {
        return `${query.type}:${query.query.toLowerCase().trim()}`;
    }

    get(query: ResearchQuery): ResearchResult | null {
        const key = this.generateKey(query);
        const entry = this.cache.get(key);

        if (!entry) return null;

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        // Move to end (LRU behavior)
        this.cache.delete(key);
        this.cache.set(key, entry);

        return { ...entry.data, cached: true };
    }

    set(query: ResearchQuery, result: ResearchResult): void {
        const key = this.generateKey(query);

        // Evict oldest if at capacity
        if (this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }

        this.cache.set(key, {
            data: result,
            expiresAt: Date.now() + this.ttlMs
        });
    }

    clear(): void {
        this.cache.clear();
    }

    get size(): number {
        return this.cache.size;
    }
}

// Singleton cache instance
const researchCache = new ResearchCache(100, 15);

// ============================================
// Query Type Mapping
// ============================================

function mapQueryTypeToResearchType(queryType: string): research_type {
    switch (queryType) {
        case 'fact_check':
            return 'verify_facts';
        case 'viral_hooks':
        case 'platform_trends':
        case 'vocabulary':
        case 'captions':
            return 'find_viral_trends';
        case 'composition':
            return 'deep_doc_analysis';
        default:
            return 'verify_facts';
    }
}

// ============================================
// Core Functions
// ============================================

/**
 * Executes a single research query with caching.
 */
async function executeQuery(query: ResearchQuery): Promise<ResearchResult> {
    const startTime = Date.now();

    // Check cache first
    const cached = researchCache.get(query);
    if (cached) {
        console.log(`[ResearchOrchestrator] Cache HIT for: "${query.query.substring(0, 40)}..."`);
        return cached;
    }

    try {
        const researchType = mapQueryTypeToResearchType(query.type);

        const response = await researchService.conductResearch({
            type: researchType,
            query: query.query
        });

        const result: ResearchResult = {
            queryId: query.id,
            queryType: query.type,
            source: response.source,
            data: response.data,
            summary: response.summary || '',
            cached: false,
            executionTimeMs: Date.now() - startTime
        };

        // Cache the result
        researchCache.set(query, result);

        return result;

    } catch (error: any) {
        console.error(`[ResearchOrchestrator] Query failed: "${query.query}"`, error.message);

        return {
            queryId: query.id,
            queryType: query.type,
            source: 'error',
            data: { error: error.message },
            summary: 'Research query failed',
            cached: false,
            executionTimeMs: Date.now() - startTime
        };
    }
}

/**
 * Executes all research queries in parallel using Promise.allSettled.
 * Individual failures don't affect other queries.
 */
export async function executeResearchPlan(
    ideation: IdeationResult
): Promise<AggregatedResearch> {
    console.log(`[ResearchOrchestrator] Executing ${ideation.queries.length} queries in parallel...`);

    const startTime = Date.now();

    // Execute all queries in parallel
    const promises = ideation.queries.map(query => executeQuery(query));
    const settled = await Promise.allSettled(promises);

    // Aggregate results
    const results: ResearchResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    settled.forEach((outcome, idx) => {
        if (outcome.status === 'fulfilled') {
            results.push(outcome.value);
            if (outcome.value.source !== 'error') {
                successCount++;
            } else {
                failureCount++;
            }
        } else {
            failureCount++;
            results.push({
                queryId: ideation.queries[idx]?.id || `unknown_${idx}`,
                queryType: ideation.queries[idx]?.type || 'unknown',
                source: 'error',
                data: { error: outcome.reason?.message || 'Unknown error' },
                summary: 'Query execution failed',
                cached: false,
                executionTimeMs: 0
            });
        }
    });

    // Extract structured summaries for context injection
    const facts: string[] = [];
    const trends: string[] = [];
    const hooks: string[] = [];
    const vocabulary: string[] = [];
    const platformTips: string[] = [];

    results.forEach(r => {
        if (r.source === 'error') return;

        switch (r.queryType) {
            case 'fact_check':
                if (r.summary) facts.push(r.summary);
                if (r.data?.answer) facts.push(r.data.answer);
                break;
            case 'viral_hooks':
                if (r.data?.results) {
                    r.data.results.slice(0, 3).forEach((item: any) => {
                        if (item.title) hooks.push(item.title);
                    });
                }
                break;
            case 'platform_trends':
                if (r.data?.results) {
                    r.data.results.slice(0, 3).forEach((item: any) => {
                        if (item.title) trends.push(item.title);
                    });
                }
                break;
            case 'vocabulary':
                if (r.data?.results) {
                    r.data.results.slice(0, 3).forEach((item: any) => {
                        if (item.text) vocabulary.push(item.text.substring(0, 200));
                    });
                }
                break;
            case 'composition':
            case 'captions':
                if (r.summary) platformTips.push(r.summary);
                break;
        }
    });

    const totalTime = Date.now() - startTime;
    console.log(`[ResearchOrchestrator] Completed: ${successCount}/${results.length} succeeded in ${totalTime}ms`);

    return {
        results,
        successCount,
        failureCount,
        totalExecutionTimeMs: totalTime,
        timestamp: Date.now(),
        facts,
        trends,
        hooks,
        vocabulary,
        platformTips
    };
}

/**
 * Clears the research cache (useful for testing or memory management).
 */
export function clearResearchCache(): void {
    researchCache.clear();
    console.log('[ResearchOrchestrator] Cache cleared');
}

/**
 * Gets current cache statistics.
 */
export function getCacheStats(): { size: number } {
    return { size: researchCache.size };
}
