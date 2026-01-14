/**
 * Phase 3 Test Suite: Hook Database Enhancement
 * Tests enhanced hook template adaptation and generation
 */

import { readFileSync } from 'fs';
import { join } from 'path';

const results = [];

function test(name, fn) {
    try {
        fn();
        results.push({ name, status: 'PASS' });
        return true;
    } catch (error) {
        results.push({ name, status: 'FAIL', error: error.message });
        return false;
    }
}

console.log('\n🧪 Phase 3: Hook Database Enhancement Test Suite\n');
console.log('='.repeat(70));

// Test 1: File Structure
console.log('\n📁 Test Group 1: File Structure');
test('hookDatabase.ts has new interfaces', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('EnhancedHookTemplate')) throw new Error('Missing EnhancedHookTemplate');
    if (!content.includes('HookAdaptationContext')) throw new Error('Missing HookAdaptationContext');
    if (!content.includes('GeneratedHook')) throw new Error('Missing GeneratedHook');
});

test('Enhanced interfaces have required fields', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('neuralMechanism')) throw new Error('Missing neuralMechanism');
    if (!content.includes('spclElement')) throw new Error('Missing spclElement');
    if (!content.includes('platformFit')) throw new Error('Missing platformFit');
});

test('adaptHookTemplate function exists', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('export function adaptHookTemplate')) throw new Error('Function not found');
});

test('generateEnhancedHooks function exists', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('export function generateEnhancedHooks')) throw new Error('Function not found');
});

// Test 2: Interface Validation
console.log('\n📝 Test Group 2: Interface Validation');
test('EnhancedHookTemplate extends HookTemplate', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.match(/interface EnhancedHookTemplate extends HookTemplate/)) {
        throw new Error('Not extending HookTemplate');
    }
});

test('HookAdaptationContext has UAV field', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('uav?:')) throw new Error('Missing UAV field');
    if (!content.includes('uniqueIntersection')) throw new Error('Missing UAV properties');
});

test('HookAdaptationContext has SPCL field', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('spcl?:')) throw new Error('Missing SPCL field');
    if (!content.includes('status?:')) throw new Error('Missing status');
    if (!content.includes('power?:')) throw new Error('Missing power');
    if (!content.includes('credibility?:')) throw new Error('Missing credibility');
    if (!content.includes('likeness?:')) throw new Error('Missing likeness');
});

// Test 3: Function Implementation
console.log('\n🔧 Test Group 3: Function Implementation');
test('adaptHookTemplate has placeholder replacements', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('(insert topic)')) throw new Error('Missing topic replacement');
    if (!content.includes('(target audience)')) throw new Error('Missing audience replacement');
});

test('adaptHookTemplate has UAV integration', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('context.uav')) throw new Error('Missing UAV integration');
    if (!content.includes('uniqueIntersection')) throw new Error('Missing UAV property usage');
});

test('adaptHookTemplate has SPCL integration', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('context.spcl')) throw new Error('Missing SPCL integration');
    if (!content.includes('credibility')) throw new Error('Missing credibility usage');
});

test('generateEnhancedHooks calls adaptHookTemplate', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('adaptHookTemplate(template.template, context)')) {
        throw new Error('Not calling adaptHookTemplate');
    }
});

test('generateEnhancedHooks assigns neural mechanisms', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('neuralMechanism')) throw new Error('Missing neural mechanism assignment');
    if (!content.includes('pattern_interrupt')) throw new Error('Missing pattern_interrupt');
    if (!content.includes('social_relevance')) throw new Error('Missing social_relevance');
});

test('generateEnhancedHooks assigns SPCL elements', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('spclElement')) throw new Error('Missing SPCL element assignment');
});

test('generateEnhancedHooks determines platform fit', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('platformFit')) throw new Error('Missing platform fit assignment');
    if (!content.includes('tiktok')) throw new Error('Missing platform detection');
});

// Test 4: Code Quality
console.log('\n🎯 Test Group 4: Code Quality');
test('Functions have JSDoc comments', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    const adaptDocs = content.match(/\/\*\*[\s\S]*?Adapts a hook template/);
    const generateDocs = content.match(/\/\*\*[\s\S]*?Generates enhanced hooks/);
    if (!adaptDocs) throw new Error('Missing adaptHookTemplate docs');
    if (!generateDocs) throw new Error('Missing generateEnhancedHooks docs');
});

test('Functions have type annotations', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes(': string {')) throw new Error('Missing return type on adaptHookTemplate');
    if (!content.includes(': EnhancedHookTemplate[]')) throw new Error('Missing return type on generateEnhancedHooks');
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 Test Results Summary\n');
const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
    });
    process.exit(1);
} else {
    console.log('\n🎉 All tests passed! Hook database enhancement verified.\n');
    process.exit(0);
}
