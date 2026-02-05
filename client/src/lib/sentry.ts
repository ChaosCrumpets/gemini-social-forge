import * as Sentry from '@sentry/react';

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;
const isProd = import.meta.env.MODE === 'production';

/**
 * Initialize Sentry for React
 */
export function initSentry() {
    if (!SENTRY_DSN) {
        if (isProd) console.warn('⚠️  VITE_SENTRY_DSN not configured - error monitoring disabled');
        return;
    }

    Sentry.init({
        dsn: SENTRY_DSN,
        environment: import.meta.env.MODE,

        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({
                maskAllText: true, // Privacy: mask user text
                blockAllMedia: true, // Privacy: block images/videos
            }),
        ],

        // Performance monitoring
        tracesSampleRate: isProd ? 0.1 : 1.0,

        // Session replay (helps debug issues)
        replaysSessionSampleRate: isProd ? 0.1 : 1.0,
        replaysOnErrorSampleRate: 1.0, // Always capture on error

        enabled: true, // Enabled for dev visibility as well

        release: import.meta.env.VITE_GIT_COMMIT || 'local-dev',

        beforeSend(event, hint) {
            // Filter out expected errors
            const error = hint.originalException;

            if (error instanceof Error) {
                // Don't report cancelled requests
                if (error.message.includes('aborted') || error.message.includes('cancelled')) {
                    return null;
                }

                // Don't report network errors (could be user's internet)
                if (error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                    return null;
                }
            }

            return event;
        },
    });

    console.log('✅ Sentry initialized (client)');
}

export { Sentry };
