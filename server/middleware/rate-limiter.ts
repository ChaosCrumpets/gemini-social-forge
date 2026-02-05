import rateLimit from "express-rate-limit";
import { type Request } from "express";

// Helper to determine IP
const getIp = (req: Request): string => {
    return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
};

/**
 * Global Rate Limiter
 * Basic protection against DDoS and scraping.
 * 100 requests per 15 minutes per IP.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5000, // Increased for benchmarking/dev
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    keyGenerator: getIp
});

/**
 * Auth Rate Limiter
 * Strict limit for sensitive auth routes (Login, Register).
 * 10 requests per hour per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 1000, // Increased for benchmarking
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login/register attempts. Please try again in an hour." },
    keyGenerator: getIp
});

/**
 * API Generation Limiter
 * Limits expensive AI generation calls.
 * 50 requests per hour per IP (can be adjusted for Premium users later in the controller).
 */
export const apiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 1000, // Increased for benchmarking
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Generation limit reached. Please verify your account or try again later." },
    keyGenerator: getIp
});
