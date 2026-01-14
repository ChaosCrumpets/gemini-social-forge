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
        const authHeader = req.headers.authorization;
        console.log(`[Auth] Verifying token. Header present: ${!!authHeader}`);

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("[Auth] No Bearer token found in header - continuing without user");
            // Don't block the request - let requireAuth handle if auth is needed
            next();
            return;
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            console.log("[Auth] Token is empty - continuing without user");
            // Don't block the request - let requireAuth handle if auth is needed
            next();
            return;
        }

        // Verify the Firebase ID token
        const decodedToken = await auth.verifyIdToken(token);
        console.log(`[Auth] Token verified for UID: ${decodedToken.uid}`);

        // Attach user information to request
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email
        };

        next();
    } catch (error) {
        console.error("Firebase token verification error:", error);
        // Don't block the request with 401 - let requireAuth middleware handle it
        // This allows routes to decide if authentication is required
        next();
    }
}

/**
 * Optional authentication middleware - allows both authenticated and anonymous requests
 * If token is present and valid, attaches user to req.user
 * If no token or invalid token, continues without user
 */
export async function optionalFirebaseAuth(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            // No token, continue without user
            next();
            return;
        }

        const token = authHeader.split("Bearer ")[1];

        if (!token) {
            next();
            return;
        }

        // Try to verify the token
        try {
            const decodedToken = await auth.verifyIdToken(token);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email
            };
        } catch {
            // Invalid token, but continue anyway
        }

        next();
    } catch (error) {
        // Any error, just continue without user
        next();
    }
}
