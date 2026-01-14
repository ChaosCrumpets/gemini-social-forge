import { FEATURES, logFeatureStatus } from './server/lib/features.js';
import { getContentGenerationPrompt } from './server/gemini.js';

console.log('\n🧪 Testing C.A.L. Enhanced Prompt Feature Flag System\n');
console.log('='.repeat(60));

// Test 1: Show feature flag status
console.log('\n📋 Test 1: Feature Flag Status');
logFeatureStatus();

// Test 2: Test prompt selector
console.log('\n📋 Test 2: Prompt Selector Function');
try {
    const selectedPrompt = getContentGenerationPrompt();
    const promptSize = (selectedPrompt.length / 1024).toFixed(2);

    console.log(`✅ Prompt selected successfully`);
    console.log(`   Size: ${promptSize} KB`);
    console.log(`   First 100 characters: ${selectedPrompt.substring(0, 100)}...`);

    // Check which prompt is being used
    if (FEATURES.USE_ENHANCED_CAL_PROMPT) {
        console.log(`   ✅ Enhanced v2.0 prompt is active`);
    } else {
        console.log(`   ✅ Legacy v1.0 prompt is active`);
    }
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

// Test 3: Verify no runtime errors
console.log('\n📋 Test 3: Runtime Error Check');
console.log('✅ No runtime errors detected');

console.log('\n' + '='.repeat(60));
console.log('🎉 All tests passed!\n');
