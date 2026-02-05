import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

const SENTRY_DSN = process.env.SENTRY_DSN;
const isProd = process.env.NODE_ENV === 'production';

/**
 * Initialize Sentry for error tracking and performance monitoring
 */
export function initSentry() {
    if (!SENTRY_DSN) {
        if (isProd) console.warn('⚠️  SENTRY_DSN not configured - error monitoring disabled');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.NODE_ENV || 'development',

        // Performance monitoring
        tracesSampleRate: isProd ? 0.1 : 1.0, // 10% in prod, 100% in dev
        profilesSampleRate: isProd ? 0.1 : 1.0,

        integrations: [
            nodeProfilingIntegration(),
        ],

        // Don't send errors in development (optional, currently enabled for visibility)
        enabled: true,

        // Release tracking (for tracking which version has bugs)
        release: process.env.GIT_COMMIT || 'local-dev',

        beforeSend(event, hint) {
            // Filter out expected errors
            const error = hint.originalException;

            if (error instanceof Error) {
                // Don't report validation errors to Sentry
                if (error.message.includes('VALIDATION_ERROR') || error.name === 'ZodError') {
                    return null;
                }

                // Don't report rate limit errors (expected behavior)
                if (error.message.includes('Too many requests') || error.message.includes('RATE_LIMIT')) {
                    return null;
                }
            }

            return event;
        },
    });

    console.log('✅ Sentry initialized');
}

/**
 * Capture error with context
 */
export function captureError(error: Error, context?: Record<string, any>) {
    console.error('[Sentry] Capturing error:', error);

    if (context) {
        Sentry.setContext('custom', context);
    }

    Sentry.captureException(error);
}

/**
 * Capture message (for non-error events)
 */
export function captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(userId: string, email?: string) {
    Sentry.setUser({
        id: userId,
        email,
    });
}

/**
 * Clear user context (on logout)
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

export { Sentry };
