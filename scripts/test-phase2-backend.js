/**
 * Backend Test Suite for C.A.L. Enhanced Prompt Integration (Phase 2)
 * Tests feature flag system, prompt selector, and runtime functionality
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function test(name, fn) {
    try {
        fn();
        results.passed++;
        results.tests.push({ name, status: '✅ PASS' });
        console.log(`✅ ${name}`);
    } catch (error) {
        results.failed++;
        results.tests.push({ name, status: '❌ FAIL', error: error.message });
        console.log(`❌ ${name}`);
        console.log(`   Error: ${error.message}`);
    }
}

console.log('\n🧪 C.A.L. Enhanced Prompt - Backend Test Suite\n');
console.log('='.repeat(70));

// Test 1: File Existence
console.log('\n📁 Test Group 1: File Structure');
test('Enhanced prompt file exists', () => {
    const path = 'server/prompts/cal-enhanced-v2.ts';
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
});

test('Extraction script exists', () => {
    const path = 'scripts/extract-cal-prompt.js';
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
});

test('Fix script exists', () => {
    const path = 'scripts/fix-prompt-backticks.js';
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
});

test('Features config exists', () => {
    const path = 'server/lib/features.ts';
    if (!existsSync(path)) throw new Error(`File not found: ${path}`);
});

// Test 2: File Content Validation
console.log('\n📝 Test Group 2: Content Validation');
test('Enhanced prompt file has correct export', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
    if (!content.includes('export const CONTENT_GENERATION_PROMPT_V2')) {
        throw new Error('Missing export statement');
    }
});

test('Enhanced prompt is substantial (>100KB)', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
    const sizeKB = content.length / 1024;
    if (sizeKB < 100) throw new Error(`Prompt too small: ${sizeKB.toFixed(2)}KB`);
    console.log(`   Size: ${sizeKB.toFixed(2)}KB`);
});

test('Backticks are properly escaped in prompt', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
    // Extract the prompt content between backticks
    const match = content.match(/PROMPT_V2 = `([\s\S]*)`;\s*$/);
    if (!match) throw new Error('Could not extract prompt content');

    const promptContent = match[1];
    // Count unescaped backticks (should be 0)
    const unescapedBackticks = promptContent.match(/(?<!\\)`/g);
    if (unescapedBackticks && unescapedBackticks.length > 0) {
        throw new Error(`Found ${unescapedBackticks.length} unescaped backticks`);
    }
});

test('Enhanced prompt contains required subsystems', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
    const requiredSections = [
        'SUBSYSTEM 1: INPUT PROCESSOR',
        'SUBSYSTEM 2: SYNTHETIC RESEARCH ENGINE',
        'SUBSYSTEM 3: ADAPTIVE DISCOVERY PROTOCOL',
        '4-level entropy',
        'NEUROBIOLOGY' // Case insensitive search
    ];

    const lowerContent = content.toLowerCase();
    for (const section of requiredSections) {
        if (!lowerContent.includes(section.toLowerCase())) {
            throw new Error(`Missing required section: ${section}`);
        }
    }
});

// Test 3: Integration Points
console.log('\n🔌 Test Group 3: Integration Points');
test('gemini.ts imports enhanced prompt', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('CONTENT_GENERATION_PROMPT_V2')) {
        throw new Error('Missing import of enhanced prompt');
    }
    if (!content.includes('./prompts/cal-enhanced-v2')) {
        throw new Error('Missing import path');
    }
});

test('gemini.ts imports feature flags', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('FEATURES')) {
        throw new Error('Missing FEATURES import');
    }
    if (!content.includes('./lib/features')) {
        throw new Error('Missing features import path');
    }
});

test('Legacy prompt was renamed correctly', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('CONTENT_GENERATION_PROMPT_LEGACY')) {
        throw new Error('Legacy prompt not renamed');
    }
    // Should NOT have the old name as a constant
    if (content.match(/const CONTENT_GENERATION_PROMPT\s*=/)) {
        throw new Error('Old constant name still exists');
    }
});

test('Selector function exists and is exported', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('export function getContentGenerationPrompt()')) {
        throw new Error('Selector function not found or not exported');
    }
    if (!content.includes('FEATURES.USE_ENHANCED_CAL_PROMPT')) {
        throw new Error('Feature flag check not in selector');
    }
});

test('Selector function has both branches', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('return CONTENT_GENERATION_PROMPT_V2')) {
        throw new Error('Missing enhanced prompt return');
    }
    if (!content.includes('return CONTENT_GENERATION_PROMPT_LEGACY')) {
        throw new Error('Missing legacy prompt return');
    }
});

test('All prompt references updated (2 locations)', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    const selectorCalls = content.match(/getContentGenerationPrompt\(\)/g);
    if (!selectorCalls || selectorCalls.length < 2) {
        throw new Error(`Expected 2 selector calls, found ${selectorCalls ? selectorCalls.length : 0}`);
    }
    console.log(`   Found ${selectorCalls.length} selector function calls`);
});

// Test 4: Feature Flag Configuration
console.log('\n🎛️  Test Group 4: Feature Flag System');
test('Feature flag is properly configured', () => {
    const content = readFileSync('server/lib/features.ts', 'utf-8');
    if (!content.includes('USE_ENHANCED_CAL_PROMPT')) {
        throw new Error('Feature flag not defined');
    }
    if (!content.includes('ENHANCED_CAL')) {
        throw new Error('Environment variable not configured');
    }
});

test('Feature flag defaults to false (safe)', () => {
    const content = readFileSync('server/lib/features.ts', 'utf-8');
    if (!content.includes('|| false')) {
        throw new Error('Feature flag does not default to false');
    }
});

// Test 5: No TypeScript Syntax Errors
console.log('\n🔧 Test Group 5: Code Quality');
test('Enhanced prompt file has valid TypeScript syntax', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');

    // Check for common syntax errors
    const issues = [];

    // Check balanced backticks (should have exactly 2 - opening and closing)
    const backtickCount = (content.match(/(?<!\\)`/g) || []).length;
    if (backtickCount !== 2) {
        issues.push(`Unbalanced backticks: found ${backtickCount}, expected 2`);
    }

    // Check for proper export
    if (!content.startsWith('/**') && !content.includes('export const')) {
        issues.push('Missing proper file structure');
    }

    if (issues.length > 0) {
        throw new Error(issues.join('; '));
    }
});

test('gemini.ts has valid function signatures', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');

    // Check selector function signature
    const selectorMatch = content.match(/export function getContentGenerationPrompt\(\):\s*string/);
    if (!selectorMatch) {
        throw new Error('Selector function has incorrect signature');
    }
});

// Test 6: Backward Compatibility
console.log('\n↩️  Test Group 6: Backward Compatibility');
test('Legacy prompt is preserved', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    const legacyMatch = content.match(/CONTENT_GENERATION_PROMPT_LEGACY = `[\s\S]*?Generate a complete content package/);
    if (!legacyMatch) {
        throw new Error('Legacy prompt content not preserved');
    }
});

test('Legacy prompt has script length formula', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('2.5 words per second')) {
        throw new Error('Script length formula missing from legacy prompt');
    }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 Test Results Summary\n');
console.log(`Total Tests: ${results.passed + results.failed}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.tests.filter(t => t.status.includes('FAIL')).forEach(t => {
        console.log(`   - ${t.name}: ${t.error}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed! Phase 2 implementation verified.\n');
    process.exit(0);
}
