import helmet from "helmet";
import { type Request, type Response, type NextFunction } from "express";

/**
 * Enhanced Security Headers Middleware
 * Configures Content Security Policy (CSP) and other security headers.
 * strictly allowing external scripts required for the app (Stripe, Firebase, Analytics).
 */
export const securityHeaders = () => {
    return helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for some hydration scripts
                    "'unsafe-eval'",   // Sometimes needed for dev mode, consider removing in prod
                    "https://js.stripe.com",
                    "https://maps.googleapis.com", // If used
                    "https://www.googletagmanager.com",
                    "https://apis.google.com"
                ],
                styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com"],
                imgSrc: ["'self'", "data:", "https:", "blob:"], // Allow images from https sources (Firebase Storage, Google Auth profiles)
                connectSrc: [
                    "'self'",
                    "https://identitytoolkit.googleapis.com", // Firebase Auth
                    "https://securetoken.googleapis.com",
                    "https://firestore.googleapis.com",
                    "https://api.stripe.com",
                    "ws://localhost:*:*", // WebSocket support for dev
                    "wss://*.replit.dev" // Replit usage
                ],
                frameSrc: [
                    "'self'",
                    "https://js.stripe.com",
                    "https://hooks.stripe.com",
                    "https://gemini-social-forge.firebaseapp.com" // Firebase Auth redirects
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: [], // Auto-upgrade http to https
            },
            useDefaults: false // We are building custom policy
        },
        crossOriginEmbedderPolicy: false, // Often causes issues with 3rd party embeds
        crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow cross-origin for certain resources if needed
        dnsPrefetchControl: { allow: false },
        frameguard: { action: "deny" }, // Clickjacking protection (overridden by frameSrc if usually needed)
        hsts: {
            maxAge: 31536000,
            includeSubDomains: true,
            preload: true
        },
        ieNoOpen: true,
        noSniff: true,
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
        xssFilter: true // Deprecated but still good for older browsers
    });
};
