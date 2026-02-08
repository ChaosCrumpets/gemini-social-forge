// Sentry Error Monitoring - Production Only
// Disabled in development to avoid React version conflicts

const isProd = import.meta.env.MODE === 'production';
const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN ||
    'https://4ad64e78083428c1dd2fff80dd337b14@o4510832031367168.ingest.us.sentry.io/4510836116226048';

// Only import Sentry in production to avoid React conflicts in dev
let Sentry: typeof import('@sentry/react') | null = null;
let isInitialized = false;

/**
 * Initialize Sentry - ONLY runs in production mode
 */
export async function initSentry() {
    // Skip in development to avoid React conflicts
    if (!isProd) {
        console.log('ℹ️ Sentry disabled in development mode');
        return;
    }

    if (isInitialized) return;

    if (!SENTRY_DSN) {
        console.warn('⚠️  VITE_SENTRY_DSN not configured');
        return;
    }

    try {
        // Dynamic import to avoid loading in dev
        Sentry = await import('@sentry/react');

        Sentry.init({
            dsn: SENTRY_DSN,
            environment: 'production',
            sendDefaultPii: true,
            integrations: [
                Sentry.browserTracingIntegration(),
            ],
            tracesSampleRate: 0.2,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,
            enabled: true,
            release: import.meta.env.VITE_GIT_COMMIT || 'local-dev',
            beforeSend(event, hint) {
                const error = hint.originalException;
                if (error instanceof Error) {
                    if (error.message.includes('aborted') ||
                        error.message.includes('cancelled') ||
                        error.message.includes('NetworkError') ||
                        error.message.includes('Failed to fetch')) {
                        return null;
                    }
                }
                return event;
            },
        });

        isInitialized = true;
        console.log('✅ Sentry initialized (production)');
    } catch (error) {
        console.warn('⚠️ Sentry initialization failed:', error);
    }
}

/**
 * Capture an exception - no-op in development
 */
export function captureError(error: Error, context?: Record<string, unknown>) {
    if (!Sentry || !isInitialized) return;
    Sentry.captureException(error, {
        contexts: context ? { additional: context } : undefined,
    });
}

/**
 * Create a performance span - no-op in development
 */
export function startSpan<T>(
    name: string,
    op: string,
    callback: () => T
): T {
    if (Sentry && isInitialized) {
        return Sentry.startSpan({ name, op }, callback);
    }
    return callback();
}

/**
 * Track a custom metric - no-op in development
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
    if (!Sentry || !isInitialized) return;
    Sentry.captureMessage(`Metric: ${name}`, {
        level: 'info',
        contexts: {
            metric: { name, value, ...tags },
        },
    });
}

/**
 * Capture a message - no-op in development
 */
export function captureMessage(message: string, context?: Record<string, unknown>, level: 'info' | 'warning' | 'error' = 'info') {
    if (!Sentry || !isInitialized) return;
    Sentry.captureMessage(message, {
        level,
        contexts: context ? { additional: context } : undefined,
    });
}

// Export for direct access - may be null in dev
export { Sentry };
