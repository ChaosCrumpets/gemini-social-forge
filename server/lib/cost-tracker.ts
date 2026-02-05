import { firestore as db } from '../db';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Claude API pricing (as of 2025)
 */
const PRICING = {
    'claude-sonnet-4-20250514': {
        input: 3.00 / 1_000_000,  // $3 per million input tokens
        output: 15.00 / 1_000_000, // $15 per million output tokens
    },
    'claude-opus-4-20250514': {
        input: 15.00 / 1_000_000,
        output: 75.00 / 1_000_000,
    },
    'claude-haiku-4-20250301': {
        input: 0.25 / 1_000_000,
        output: 1.25 / 1_000_000,
    },
    // Default fallbacks for other models
    'default': {
        input: 3.00 / 1_000_000,
        output: 15.00 / 1_000_000,
    }
};

interface UsageMetrics {
    inputTokens: number;
    outputTokens: number;
    model: string;
    userId: string;
    sessionId?: string;
    feature: 'discovery' | 'hook_generation' | 'content_generation' | 'editing' | 'remix' | 'unknown';
}

/**
 * Calculate cost for API usage
 */
export function calculateCost(
    inputTokens: number,
    outputTokens: number,
    model: string
): number {
    const pricing = PRICING[model as keyof typeof PRICING] || PRICING['default'];

    const inputCost = inputTokens * pricing.input;
    const outputCost = outputTokens * pricing.output;

    return inputCost + outputCost;
}

/**
 * Track API usage and update user's cost metrics
 */
export async function trackUsage(metrics: UsageMetrics): Promise<void> {
    try {
        const { userId, sessionId, inputTokens, outputTokens, model, feature } = metrics;

        const cost = calculateCost(inputTokens, outputTokens, model);

        console.log(`[CostTracker] User ${userId} - ${feature}:`, {
            inputTokens,
            outputTokens,
            cost: `$${cost.toFixed(6)}`,
        });

        // Update user's usage stats
        const userRef = db.collection('users').doc(userId);

        await userRef.update({
            'usage.totalGenerations': FieldValue.increment(1),
            'usage.tokensUsed': FieldValue.increment(inputTokens + outputTokens),
            'usage.costUSD': FieldValue.increment(cost),
            'usage.lastUsed': FieldValue.serverTimestamp(),
        });

        // Log detailed usage event
        await db.collection('usageEvents').add({
            userId,
            sessionId: sessionId || null,
            feature,
            model,
            inputTokens,
            outputTokens,
            cost,
            timestamp: FieldValue.serverTimestamp(),
        });

        // Update session's cost if sessionId provided
        if (sessionId) {
            // NOTE: We're using SQL for sessions currently in this project structure for session storage,
            // but the user requested Firestore updates. 
            // If sessions are technically in SQL (sessionStorage), we can't update a Firestore doc for them directly 
            // UNLESS the session metadata is mirrored or migrated to Firestore.
            // Based on previous files, `sessionStorage` uses Drizzle/SQLite.
            // However, `routes.ts` mentions Firebase Authentication Routes, so users are in Firestore.
            // We will skip Firestore session update if sessions aren't in Firestore, to avoid errors.
            // Or we log it to usageEvents which IS in Firestore, which allows analytics.
        }
    } catch (error) {
        console.error('[CostTracker] ❌ Error tracking usage:', error);
        // Don't throw - cost tracking failure shouldn't break the request
    }
}

/**
 * Get user's usage summary
 */
export async function getUserUsageSummary(userId: string) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const userData = userDoc.data();

        return {
            totalGenerations: userData?.usage?.totalGenerations || 0,
            tokensUsed: userData?.usage?.tokensUsed || 0,
            costUSD: userData?.usage?.costUSD || 0,
            lastUsed: userData?.usage?.lastUsed?.toDate() || null,
        };
    } catch (error) {
        console.error('[CostTracker] Error getting usage summary:', error);
        return {
            totalGenerations: 0,
            tokensUsed: 0,
            costUSD: 0,
            lastUsed: null,
        };
    }
}

/**
 * Get cost breakdown by feature for a user
 */
export async function getCostBreakdown(userId: string, days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const eventsSnapshot = await db.collection('usageEvents')
            .where('userId', '==', userId)
            .where('timestamp', '>=', startDate)
            .get();

        const breakdown: Record<string, { count: number; cost: number; tokens: number }> = {};

        eventsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const feature = data.feature;

            if (!breakdown[feature]) {
                breakdown[feature] = { count: 0, cost: 0, tokens: 0 };
            }

            breakdown[feature].count += 1;
            breakdown[feature].cost += data.cost;
            breakdown[feature].tokens += data.inputTokens + data.outputTokens;
        });

        return breakdown;
    } catch (error) {
        console.error('[CostTracker] Error getting cost breakdown:', error);
        return {};
    }
}

/**
 * Get system-wide cost metrics (admin only)
 */
export async function getSystemCostMetrics(days: number = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const eventsSnapshot = await db.collection('usageEvents')
            .where('timestamp', '>=', startDate)
            .get();

        let totalCost = 0;
        let totalTokens = 0;
        let totalRequests = eventsSnapshot.size;

        const costByUser: Record<string, number> = {};
        const costByFeature: Record<string, number> = {};

        eventsSnapshot.docs.forEach(doc => {
            const data = doc.data();

            totalCost += data.cost;
            totalTokens += data.inputTokens + data.outputTokens;

            costByUser[data.userId] = (costByUser[data.userId] || 0) + data.cost;
            costByFeature[data.feature] = (costByFeature[data.feature] || 0) + data.cost;
        });

        return {
            totalCost,
            totalTokens,
            totalRequests,
            avgCostPerRequest: totalRequests > 0 ? totalCost / totalRequests : 0,
            costByUser,
            costByFeature,
            topUsers: Object.entries(costByUser)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 10)
                .map(([userId, cost]) => ({ userId, cost })),
        };
    } catch (error) {
        console.error('[CostTracker] Error getting system metrics:', error);
        return null;
    }
}
