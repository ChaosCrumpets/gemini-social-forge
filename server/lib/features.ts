// Feature Flag Configuration
// Controls experimental features and gradual rollouts

export const FEATURES = {
    // C.A.L. Enhanced System Prompt
    // Set to 'true' to use enhanced neurobiology-grounded generation
    // Set to 'false' to use legacy prompt (safe fallback)
    USE_ENHANCED_CAL_PROMPT: process.env.ENHANCED_CAL === 'true' || false,

    // Future feature flags can be added here
    // USE_ADAPTIVE_DISCOVERY: process.env.ADAPTIVE_DISCOVERY === 'true' || false,
    // USE_DUAL_MODE_CINEMATOGRAPHY: process.env.DUAL_MODE_CINE === 'true' || false,
} as const;

export type FeatureFlags = typeof FEATURES;

// Helper to check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return FEATURES[feature] === true;
}

// Log feature flag status on startup
export function logFeatureStatus(): void {
    console.log('🎛️  [FEATURE FLAGS] Configuration:');
    Object.entries(FEATURES).forEach(([key, value]) => {
        const status = value ? '✅ ENABLED' : '⚫ DISABLED';
        console.log(`   ${key}: ${status}`);
    });
}
