/**
 * Runtime Test: Verify Feature Flag System
 * Tests the prompt selector with both legacy and enhanced modes
 */

import { FEATURES, logFeatureStatus } from '../server/lib/features.js';
import { getContentGenerationPrompt } from '../server/gemini.js';

console.log('\n🔬 Runtime Verification: Phase 2 Implementation\n');
console.log('='.repeat(60));

// Test 1: Show feature flag status
console.log('\n📋 Test 1: Feature Flag Configuration');
console.log(`   ENHANCED_CAL env var: ${process.env.ENHANCED_CAL || 'not set'}`);
console.log(`   USE_ENHANCED_CAL_PROMPT: ${FEATURES.USE_ENHANCED_CAL_PROMPT}`);

// Test 2: Verify prompt selector works
console.log('\n📋 Test 2: Prompt Selector Functionality');
try {
    const prompt = getContentGenerationPrompt();
    const sizeKB = (prompt.length / 1024).toFixed(2);
    const preview = prompt.substring(0, 100).replace(/\n/g, ' ');

    console.log(`   ✅ Prompt loaded successfully`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Preview: "${preview}..."`);

    // Determine which prompt is active
    if (FEATURES.USE_ENHANCED_CAL_PROMPT) {
        console.log(`   Mode: 🧠 Enhanced v2.0`);
        if (parseFloat(sizeKB) < 100) {
            console.log(`   ⚠️  Warning: Enhanced prompt seems small (${sizeKB}KB)`);
        }
    } else {
        console.log(`   Mode: 📝 Legacy v1.0`);
        if (parseFloat(sizeKB) > 50) {
            console.log(`   ⚠️  Warning: Legacy prompt seems large (${sizeKB}KB)`);
        }
    }
} catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    process.exit(1);
}

// Test 3: Verify no runtime errors
console.log('\n📋 Test 3: Runtime Error Check');
try {
    // Try calling the function multiple times
    for (let i = 0; i < 3; i++) {
        getContentGenerationPrompt();
    }
    console.log('   ✅ No runtime errors (3 consecutive calls)');
} catch (error) {
    console.error(`   ❌ Runtime error: ${error.message}`);
    process.exit(1);
}

console.log('\n' + '='.repeat(60));
console.log('🎉 Runtime verification passed!\n');

// Output summary
const summary = {
    timestamp: new Date().toISOString(),
    featureFlag: {
        envVar: process.env.ENHANCED_CAL || null,
        enabled: FEATURES.USE_ENHANCED_CAL_PROMPT
    },
    promptSize: (getContentGenerationPrompt().length / 1024).toFixed(2) + ' KB',
    mode: FEATURES.USE_ENHANCED_CAL_PROMPT ? 'Enhanced v2.0' : 'Legacy v1.0',
    status: 'PASS'
};

console.log('Summary:', JSON.stringify(summary, null, 2));
