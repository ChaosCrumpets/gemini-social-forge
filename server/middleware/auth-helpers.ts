import { Request, Response, NextFunction } from "express";
import { auth } from "../db";
import * as firestoreUtils from "../lib/firestore";
import type { User } from "@shared/schema";
import { debugLog, debugError } from "../lib/debug-logger";

// Tier limits configuration
export const TIER_LIMITS = {
    bronze: {
        scriptsPerMonth: 5,
        displayName: 'Bronze (Free)',
        features: { csvExport: true, srtExport: false, pdfExport: false }
    },
    silver: {
        scriptsPerMonth: 25,
        displayName: 'Silver ($10/mo)',
        features: { csvExport: true, srtExport: true, pdfExport: false }
    },
    gold: {
        scriptsPerMonth: 100,
        displayName: 'Gold ($20/mo)',
        features: { csvExport: true, srtExport: true, pdfExport: true }
    },
    platinum: {
        scriptsPerMonth: -1,
        displayName: 'Platinum ($50/mo)',
        features: { csvExport: true, srtExport: true, pdfExport: true }
    },
    diamond: {
        scriptsPerMonth: -1,
        displayName: 'Diamond (Lifetime)',
        features: { csvExport: true, srtExport: true, pdfExport: true }
    }
} as const;

// Helper to get user ID from Firebase auth token
export async function getUserFromRequest(req: Request): Promise<{ uid: string; email?: string } | null> {
    if (!req.user) return null;
    return req.user;
}

// Middleware to require authentication
export async function requireAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    if (!req.user || !req.user.uid) {
        res.status(401).json({ message: "Unauthorized: Authentication required" });
        return;
    }
    next();
}

/**
 * Check if user can generate a script based on tier limits
 */
export async function canGenerateScript(user: any): Promise<{
    allowed: boolean;
    reason?: string;
    scriptsRemaining?: number;
    resetDate?: Date;
}> {
    const tierLimits = TIER_LIMITS[user.subscriptionTier as keyof typeof TIER_LIMITS];

    // Unlimited tiers
    if (tierLimits.scriptsPerMonth === -1) {
        return { allowed: true };
    }

    const now = Date.now();
    const lastReset = user.lastUsageReset?.toDate?.() || user.lastUsageReset || user.createdAt?.toDate?.() || user.createdAt || new Date();
    const lastResetTime = lastReset instanceof Date ? lastReset.getTime() : new Date(lastReset).getTime();
    const daysSinceReset = Math.floor((now - lastResetTime) / (1000 * 60 * 60 * 24));

    let currentScriptCount = user.scriptsGenerated || 0;
    let resetDate = new Date(lastResetTime);

    // Auto-reset if 30 days have passed
    if (daysSinceReset >= 30) {
        currentScriptCount = 0;
        resetDate = new Date(now);
        // Update in database (Firestore expects Timestamp, handled by updateUser)
        await firestoreUtils.updateUser(user.id, {
            scriptsGenerated: 0,
            lastUsageReset: resetDate as any  // Will be converted to Timestamp in Firestore layer
        });
    }

    const nextReset = new Date(resetDate);
    nextReset.setDate(nextReset.getDate() + 30);

    if (currentScriptCount < tierLimits.scriptsPerMonth) {
        return {
            allowed: true,
            scriptsRemaining: tierLimits.scriptsPerMonth - currentScriptCount,
            resetDate: nextReset
        };
    }

    return {
        allowed: false,
        reason: `Monthly limit reached (${tierLimits.scriptsPerMonth} scripts). Resets on ${nextReset.toLocaleDateString()}`,
        scriptsRemaining: 0,
        resetDate: nextReset
    };
}

/**
 * Middleware to check if user has script quota remaining
 */
export async function requireScriptQuota(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    debugLog('MIDDLEWARE: requireScriptQuota - ENTER', {
        hasUser: !!req.user,
        userId: req.user?.uid,
        path: req.path
    });

    try {
        // Check 1: User authenticated?
        if (!req.user?.uid) {
            debugError('MIDDLEWARE: requireScriptQuota - NO USER', {
                headers: Object.keys(req.headers),
                hasAuthHeader: !!req.headers.authorization
            });
            res.status(401).json({ message: 'Authentication required' });
            return;
        }

        debugLog('MIDDLEWARE: requireScriptQuota - Fetching user from Firestore', {
            uid: req.user.uid
        });

        // Check 2: User exists in Firestore?
        const user = await firestoreUtils.getUser(req.user.uid);

        if (!user) {
            debugError('MIDDLEWARE: requireScriptQuota - USER NOT FOUND IN FIRESTORE', {
                uid: req.user.uid,
                email: req.user.email
            });
            res.status(401).json({ message: 'User not found' });
            return;
        }

        debugLog('MIDDLEWARE: requireScriptQuota - User found', {
            userId: user.id,
            email: user.email,
            tier: user.subscriptionTier,
            scriptsGenerated: user.scriptsGenerated,
            lastReset: user.lastUsageReset
        });

        // Check 3: Quota available?
        const quota = await canGenerateScript(user);

        debugLog('MIDDLEWARE: requireScriptQuota - Quota check result', {
            allowed: quota.allowed,
            remaining: quota.scriptsRemaining,
            reason: quota.reason
        });

        if (!quota.allowed) {
            debugLog('MIDDLEWARE: requireScriptQuota - QUOTA EXCEEDED', {
                tier: user.subscriptionTier,
                generated: user.scriptsGenerated,
                resetDate: quota.resetDate
            });
            res.status(403).json({
                message: quota.reason || 'Script generation limit reached',
                upgradeRequired: true,
                currentTier: user.subscriptionTier,
                scriptsRemaining: 0,
                resetDate: quota.resetDate?.toISOString()
            });
            return;
        }

        // Success: Attach quota to request
        (req as any).dbUser = user;
        (req as any).quota = quota;
        debugLog('MIDDLEWARE: requireScriptQuota - PASS', {
            scriptsRemaining: quota.scriptsRemaining,
            nextStep: 'Proceeding to route handler'
        });
        next();

    } catch (error: any) {
        debugError('MIDDLEWARE: requireScriptQuota - EXCEPTION', error);
        res.status(500).json({
            message: 'Error checking quota',
            error: error.message
        });
    }
}

// Alias for backward compatibility
export const requirePremium = requireScriptQuota;

// Middleware to require admin role
export async function requireAdmin(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user || !req.user.uid) {
            res.status(401).json({ message: "Unauthorized: Authentication required" });
            return;
        }

        const user = await firestoreUtils.getUser(req.user.uid);
        if (!user || user.role !== "admin") {
            res.status(403).json({ message: "Forbidden: Admin access required" });
            return;
        }

        next();
    } catch (error) {
        console.error("requireAdmin middleware error:", error);
        res.status(500).json({ message: "Failed to verify admin status" });
    }
}

// Middleware to check usage limits for non-premium features
export async function checkUsageLimit(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        if (!req.user || !req.user.uid) {
            // Allow anonymous usage with limits
            next();
            return;
        }

        const user = await firestoreUtils.getUser(req.user.uid);
        if (!user) {
            next();
            return;
        }

        const TIER_USAGE_LIMITS = {
            bronze: 10,
            silver: 100,
            gold: -1, // unlimited
            platinum: -1,
            diamond: -1
        };

        const limit = TIER_USAGE_LIMITS[user.subscriptionTier as keyof typeof TIER_USAGE_LIMITS] || 10;

        // Check if monthly limit resets needed (only for limited tiers)
        if (limit > 0 && user.lastUsageReset) {
            const now = new Date();
            const lastResetTimestamp = user.lastUsageReset?.toDate?.() || user.lastUsageReset;
            const lastReset = lastResetTimestamp instanceof Date ? lastResetTimestamp : new Date(lastResetTimestamp);
            const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceReset >= 30) {
                // Reset usage count
                await firestoreUtils.updateUser(user.id, {
                    usageCount: 0,
                    lastUsageReset: now as any  // Will be converted to Timestamp in Firestore layer
                });
                (req as any).dbUser = { ...user, usageCount: 0 };
                next();
                return;
            }
        }

        // Check if user exceeded limit
        if (limit > 0 && user.usageCount >= limit) {
            res.status(429).json({
                message: `Monthly usage limit reached (${limit} remixes per month for ${user.subscriptionTier} tier)`,
                upgradeRequired: true
            });
            return;
        }

        (req as any).dbUser = user;
        next();
    } catch (error) {
        console.error("checkUsageLimit middleware error:", error);
        next(); // Allow request to proceed on error
    }
}

// Helper to increment script count
export async function incrementScriptCount(userId: string): Promise<void> {
    try {
        const user = await firestoreUtils.getUser(userId);
        if (user) {
            console.log(`[TierLimits] Incrementing script count for ${userId}: ${user.scriptsGenerated} → ${user.scriptsGenerated + 1}`);
            await firestoreUtils.updateUser(userId, {
                scriptsGenerated: user.scriptsGenerated + 1
            });
        }
    } catch (error) {
        console.error("[TierLimits] Error incrementing script count:", error);
    }
}

// Helper to increment usage count (for remix feature)
export async function incrementUsageCount(userId: string): Promise<void> {
    try {
        const user = await firestoreUtils.getUser(userId);
        if (user) {
            await firestoreUtils.updateUser(userId, {
                usageCount: user.usageCount + 1
            });
        }
    } catch (error) {
        console.error("incrementUsageCount error:", error);
    }
}
