import { Request, Response, NextFunction } from "express";
import { auth } from "../db";
import * as firestoreUtils from "../lib/firestore";
import { Timestamp } from "firebase-admin/firestore";

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
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        if (!req.user) {
            console.log('[Auth] requireAuth: Injecting mock user (DISABLE_AUTH active)');
            req.user = {
                uid: 'dev-user-123',
                email: 'admin@test.com',
                name: 'Dev Admin'
            };
        }
        next();
        return;
    }

    if (!req.user || !req.user.uid) {
        res.status(401).json({ message: "Unauthorized: Authentication required" });
        return;
    }
    next();
}

// Middleware to require premium subscription
export async function requirePremium(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Development mode bypass
        if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
            console.log('[Auth] requirePremium: Bypassing premium check (DISABLE_AUTH active)');
            (req as any).dbUser = {
                id: 'dev-user-123',
                uid: 'dev-user-123',
                email: 'admin@test.com',
                isPremium: true,
                scriptsGenerated: 0,
                subscriptionTier: 'gold'
            };
            next();
            return;
        }

        if (!req.user || !req.user.uid) {
            res.status(401).json({ message: "Unauthorized: Authentication required" });
            return;
        }

        const user = await firestoreUtils.getUser(req.user.uid);
        if (!user) {
            res.status(401).json({ message: "User not found" });
            return;
        }

        // Bronze users can use 1 free script
        if (!user.isPremium && user.scriptsGenerated >= 1) {
            res.status(403).json({
                message: "Premium subscription required",
                upgradeRequired: true
            });
            return;
        }

        // Store user data on request for later use
        (req as any).dbUser = user;
        (req as any).isFreeScript = !user.isPremium && user.scriptsGenerated === 0;

        next();
    } catch (error) {
        console.error("requirePremium middleware error:", error);
        res.status(500).json({ message: "Failed to verify subscription status" });
    }
}

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
            // Convert Firestore Timestamp to JS Date for comparison
            const lastReset = user.lastUsageReset.toDate();
            const daysSinceReset = Math.floor((now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24));

            if (daysSinceReset >= 30) {
                // Reset usage count
                await firestoreUtils.updateUser(user.id, {
                    usageCount: 0,
                    // Convert JS Date to Firestore Timestamp for storage
                    lastUsageReset: Timestamp.fromDate(now)
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
            await firestoreUtils.updateUser(userId, {
                scriptsGenerated: user.scriptsGenerated + 1
            });
        }
    } catch (error) {
        console.error("incrementScriptCount error:", error);
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
