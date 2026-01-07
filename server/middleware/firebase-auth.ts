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
            uid: decodedToken.uid,
            email: decodedToken.email,
            ...decodedToken,
        };

        next();
    } catch (error) {
        console.error("Firebase token verification error:", error);
        res.status(401).json({ message: "Unauthorized: Invalid token" });
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
                email: decodedToken.email,
                ...decodedToken,
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
