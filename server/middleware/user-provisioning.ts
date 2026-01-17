import { Request, Response, NextFunction } from "express";
import { firestore } from "../db";

/**
 * Middleware to ensure a Firestore user document exists for authenticated users
 * This runs AFTER Firebase token verification (which sets req.user)
 * Creates a user document in Firestore if one doesn't exist
 */
export async function ensureUserExists(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // Development mode bypass - inject mock DB user
        if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
            console.log('[UserProvisioning] Development mode - injecting mock DB user');
            (req as any).dbUser = {
                id: 'dev-user-123',
                uid: 'dev-user-123',
                email: 'admin@test.com',
                displayName: 'Dev Admin',
                role: 'admin',
                isAdmin: true,
                isPremium: true,
                adminPermissions: {
                    unlimitedScripts: true,
                    unlimitedExports: true,
                    bypassRateLimits: true,
                    canManageUsers: true,
                    canViewAnalytics: true
                },
                subscriptionTier: 'gold',
                scriptsGenerated: 0,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            next();
            return;
        }

        // Skip if no authenticated user (some routes are public)
        if (!req.user || !req.user.uid) {
            console.log('[UserProvisioning] No authenticated user, skipping user provisioning');
            next();
            return;
        }

        const uid = req.user.uid;
        console.log(`[UserProvisioning] Checking/creating user document for UID: ${uid}`);

        // Check if user document exists in Firestore
        const userRef = firestore.collection('users').doc(uid);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Create new user document
            console.log(`[UserProvisioning] Creating new user document for ${req.user.email}`);

            const newUser = {
                id: uid,
                uid: uid,
                email: req.user.email || '',
                displayName: req.user.name || req.user.email || 'User',
                role: 'user',
                isAdmin: false,
                isPremium: false,
                subscriptionTier: 'bronze',
                scriptsGenerated: 0,
                usageCount: 0,
                createdAt: new Date(),
                updatedAt: new Date()
            };

            await userRef.set(newUser);

            // Attach to request
            (req as any).dbUser = newUser;
            console.log(`[UserProvisioning] ✅ New user created: ${req.user.email}`);
        } else {
            // User exists, attach to request
            const userData = userDoc.data();
            (req as any).dbUser = {
                id: uid,
                ...userData
            };
            console.log(`[UserProvisioning] ✅ Existing user found: ${req.user.email}`);
        }

        next();
    } catch (error: any) {
        console.error('[UserProvisioning] Error:', error.message);
        // Don't block the request - some routes may not need DB user
        next();
    }
}

/**
 * Middleware to require that a DB user exists
 * Use this AFTER ensureUserExists for routes that need user data
 */
export async function requireDbUser(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && process.env.DISABLE_AUTH === 'true') {
        next();
        return;
    }

    const dbUser = (req as any).dbUser;

    if (!dbUser || !dbUser.id) {
        console.error('[requireDbUser] No database user found');
        res.status(401).json({ message: 'User not found' });
        return;
    }

    next();
}
