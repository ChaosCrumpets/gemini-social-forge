import { Request, Response, NextFunction } from 'express';
import * as firestoreUtils from '../lib/firestore';
import type { User } from '@shared/schema';

/**
 * Middleware to ensure a Firestore user record exists for authenticated requests.
 * Auto-creates user on first login to prevent "User not found" errors.
 */
export async function ensureUserExists(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        if (!req.user?.uid) {
            next();
            return;
        }

        let user = await firestoreUtils.getUser(req.user.uid);

        if (!user) {
            console.log(`[UserProvisioning] Creating new user record for ${req.user.uid}`);
            const emailPrefix = req.user.email?.split('@')[0] || 'user';
            const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

            const newUserData: any = {
                id: req.user.uid,
                email: req.user.email || `anonymous-${req.user.uid.substring(0, 8)}@cal.app`,
                firstName,
                lastName: '',
                role: 'user',
                subscriptionTier: 'bronze',
                isPremium: false,
                scriptsGenerated: 0,
                usageCount: 0,
                lastUsageReset: new Date(),
                createdAt: new Date(),
                updatedAt: new Date()
            };

            try {
                user = await firestoreUtils.createUser(newUserData);
                console.log(`[UserProvisioning] ✅ User ${user.id} created successfully`);
            } catch (createError: any) {
                // Handle race condition: another request created the user simultaneously
                if (createError.code === 6) { // ALREADY_EXISTS
                    console.log(`[UserProvisioning] Race condition detected, fetching existing user ${req.user.uid}`);
                    user = await firestoreUtils.getUser(req.user.uid);
                } else {
                    throw createError;
                }
            }
        }

        (req as any).dbUser = user;
        next();
    } catch (error) {
        console.error('[UserProvisioning] Error:', error);
        // Allow request to proceed - will fail downstream if dbUser truly required
        next();
    }
}

/**
 * Middleware to require that dbUser exists on request object.
 * Use after ensureUserExists to guarantee user record availability.
 */
export async function requireDbUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    const dbUser = (req as any).dbUser;
    if (!dbUser) {
        res.status(500).json({
            message: 'User account setup incomplete. Please try logging out and back in.',
            code: 'USER_PROVISIONING_FAILED'
        });
        return;
    }
    next();
}
