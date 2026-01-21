import { Request, Response, NextFunction } from "express";
import { auth } from "../db";

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: {
                uid: string;
                email?: string;
                [key: string]: any;
            };
        }
    }
}

/**
 * Middleware to verify Firebase ID token from Authorization header
 * Requires: Authorization: Bearer <token>
 */
export async function verifyFirebaseToken(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        // DISABLE_AUTH removed - always enforce authentication for production-ready security

        const authHeader = req.headers.authorization;
        console.log(`[Auth] Verifying token. Header present: ${!!authHeader}`);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("[Auth] No Bearer token found in header");
            res.status(401).json({ message: "Unauthorized: No token provided" });
            return;
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            console.log("[Auth] Token is empty");
            res.status(401).json({ message: "Unauthorized: Invalid token format" });
            return;
        }

        // Verify the Firebase ID token
        // console.log(`[Auth] Verifying token: ${token.substring(0, 10)}...`);
        const decodedToken = await auth.verifyIdToken(token);
        console.log(`[Auth] Token verified for UID: ${decodedToken.uid}`);

        // Attach user information to request
        req.user = {
            ...decodedToken,
            uid: decodedToken.uid,
            email: decodedToken.email,
        };

        next();
    } catch (error: any) {
        console.error("══════════════════════════════════════");
        console.error("Firebase token verification FAILED");
        console.error("Error code:", error.code);
        console.error("Error message:", error.message);
        console.error("══════════════════════════════════════");
        res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
}

/**
 * Optional authentication middleware - allows both authenticated and anonymous requests
 * If token is present and valid, attaches user to req.user
 * If no token or invalid token, continues without user
 * 
 * ⚠️ DEPRECATED: This middleware should gradually be replaced with verifyFirebaseToken
 * for production-ready security. It's kept for backward compatibility with routes
 * that haven't been migrated yet.
 * 
 * This middleware NEVER returns 401 - it always calls next() to allow the request through
 */
export async function optionalFirebaseAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    console.log('[OptionalAuth] START - Method:', req.method, 'URL:', req.url);

    try {
        // DISABLE_AUTH removed - always attempt proper authentication

        const authHeader = req.headers.authorization;
        console.log('[OptionalAuth] Auth header present:', !!authHeader);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // No token, continue without user (this is normal for optional auth)
            console.log('[OptionalAuth] No Bearer token - calling next() without user');
            next();
            return;
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            console.log('[OptionalAuth] Empty token - calling next() without user');
            next();
            return;
        }

        console.log('[OptionalAuth] Token found, length:', token.length);

        // Verify Firebase Admin is initialized
        if (!auth) {
            console.warn('[OptionalAuth] Firebase Admin not initialized - calling next() without user');
            next();
            return;
        }

        // Try to verify the token
        try {
            console.log('[OptionalAuth] Attempting token verification...');
            const decodedToken = await auth.verifyIdToken(token);
            req.user = {
                ...decodedToken,
                uid: decodedToken.uid,
                email: decodedToken.email,
            };
            console.log(`[OptionalAuth] ✅ Token verified for user: ${decodedToken.email || decodedToken.uid} - calling next()`);
        } catch (error: any) {
            // Invalid/expired token - log detailed error for diagnosis
            console.error("╔════════════════════════════════════════════════════════════╗");
            console.error("║ [OptionalAuth] FIREBASE TOKEN VERIFICATION FAILED         ║");
            console.error("╚════════════════════════════════════════════════════════════╝");
            console.error("🔴 Error Code:", error.code || "NO_CODE");
            console.error("🔴 Error Message:", error.message || "NO_MESSAGE");
            console.error("🔴 Firebase Project:", process.env.FIREBASE_ADMIN_PROJECT_ID);
            console.error("🔴 Client Email:", process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
            console.error("🔴 Token Length:", token?.length || 0);
            console.error("════════════════════════════════════════════════════════════");
            // Don't attach user, but don't fail the request either (optional auth)
        }

        // CRITICAL: Always call next(), never return error response
        console.log('[OptionalAuth] END - calling next()');
        next();
    } catch (error: any) {
        // Unexpected error in middleware - log and continue
        console.error(`[OptionalAuth] ❌ Unexpected error: ${error.message} - calling next() anyway`);
        // CRITICAL: Still call next() - this is OPTIONAL auth
        next();
    }
}
