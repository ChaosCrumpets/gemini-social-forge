import { onCLS, onINP, onFCP, onLCP, onTTFB, Metric } from 'web-vitals';
import { captureMessage } from './sentry';

/**
 * Track Web Vitals and send to Sentry
 */
export function trackWebVitals() {
    const isProd = import.meta.env.MODE === 'production';

    if (!isProd) {
        console.log('📊 Web Vitals tracking enabled (dev mode - console only)');
    }

    function sendToAnalytics(metric: Metric) {
        const { name, value, rating, delta } = metric;

        console.log(`[Web Vitals] ${name}:`, {
            value: Math.round(value),
            rating,
            delta: Math.round(delta),
        });

        // Send to Sentry in production (helper handles null check)
        if (isProd) {
            captureMessage(`Web Vital: ${name}`, {
                vitals: {
                    name,
                    value: Math.round(value),
                    rating,
                }
            }, rating === 'good' ? 'info' : rating === 'needs-improvement' ? 'warning' : 'error');
        }
    }

    // Track all Web Vitals
    onCLS(sendToAnalytics); // Cumulative Layout Shift
    onINP(sendToAnalytics); // Interaction to Next Paint (replaces FID)
    onFCP(sendToAnalytics); // First Contentful Paint
    onLCP(sendToAnalytics); // Largest Contentful Paint
    onTTFB(sendToAnalytics); // Time to First Byte
}

/**
 * Track custom performance metrics
 */
export function trackCustomMetric(name: string, value: number) {
    console.log(`[Performance] ${name}:`, value);

    if (import.meta.env.MODE === 'production') {
        captureMessage(`Custom Metric: ${name}`, {
            performance: {
                name,
                value,
            }
        }, 'info');
    }
}
