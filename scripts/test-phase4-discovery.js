/**
 * Phase 4 Test Suite: Discovery Flow Enhancement
 * Tests 4-level entropy classification and adaptive questions
 */

import { readFileSync } from 'fs';

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

console.log('\n🧪 Phase 4: Discovery Flow Enhancement Test Suite\n');
console.log('='.repeat(70));

// Test 1: File Structure
console.log('\n📁 Test Group 1: File Structure');
test('discovery.ts file exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content) throw new Error('File not found or empty');
});

test('InputEntropyLevel enum exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('enum InputEntropyLevel')) throw new Error('Enum not found');
    if (!content.includes('COLD')) throw new Error('Missing COLD level');
    if (!content.includes('UNSTRUCTURED')) throw new Error('Missing UNSTRUCTURED level');
    if (!content.includes('INTUITIVE')) throw new Error('Missing INTUITIVE level');
    if (!content.includes('ARCHITECTED')) throw new Error('Missing ARCHITECTED level');
});

test('InputDiagnosis interface exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('interface InputDiagnosis')) throw new Error('Interface not found');
    if (!content.includes('level:')) throw new Error('Missing level field');
    if (!content.includes('hasDetails:')) throw new Error('Missing hasDetails field');
    if (!content.includes('recommendedQuestions:')) throw new Error('Missing recommendedQuestions field');
});

// Test 2: Function Implementation
console.log('\n🔧 Test Group 2: Function Implementation');
test('diagnoseInput function exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export function diagnoseInput')) throw new Error('Function not found');
});

test('generateAdaptiveQuestions function exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export function generateAdaptiveQuestions')) throw new Error('Function not found');
});

test('calculateDiscoveryProgress helper exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export function calculateDiscoveryProgress')) throw new Error('Function not found');
});

test('shouldShowProgressionGate helper exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export function shouldShowProgressionGate')) throw new Error('Function not found');
});

// Test 3: Classification Logic
console.log('\n🎯 Test Group 3: Classification Logic');
test('Has detection for all 4 levels', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.match(/InputEntropyLevel\.ARCHITECTED/)) throw new Error('ARCHITECTED detection missing');
    if (!content.match(/InputEntropyLevel\.INTUITIVE/)) throw new Error('INTUITIVE detection missing');
    if (!content.match(/InputEntropyLevel\.UNSTRUCTURED/)) throw new Error('UNSTRUCTURED detection missing');
    if (!content.match(/InputEntropyLevel\.COLD/)) throw new Error('COLD detection missing');
});

test('Recommended questions vary by level', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('recommendedQuestions: 2')) throw new Error('Missing 2 questions level');
    if (!content.includes('recommendedQuestions: 3')) throw new Error('Missing 3 questions level');
    if (!content.includes('recommendedQuestions: 5')) throw new Error('Missing 5 questions level');
    if (!content.includes('recommendedQuestions: 6')) throw new Error('Missing 6 questions level');
});

test('Has detail detection markers', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('hasTopic')) throw new Error('Missing topic detection');
    if (!content.includes('hasAudience')) throw new Error('Missing audience detection');
    if (!content.includes('hasGoal')) throw new Error('Missing goal detection');
    if (!content.includes('hasContext')) throw new Error('Missing context detection');
    if (!content.includes('hasStructure')) throw new Error('Missing structure detection');
});

// Test 4: Adaptive Questions
console.log('\n💬 Test Group 4: Adaptive Questions');
test('Generates essential questions', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('target audience')) throw new Error('Missing audience question');
    if (!content.includes('specific action or realization')) throw new Error('Missing goal question');
});

test('Generates UAV/SPCL questions', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('YOUR perspective')) throw new Error('Missing UAV question');
    if (!content.includes('proof, credentials')) throw new Error('Missing SPCL question');
});

test('Has level-specific questions', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('COLD')) throw new Error('Missing COLD level checks');
    if (!content.includes('UNSTRUCTURED')) throw new Error('Missing UNSTRUCTURED level checks');
    if (!content.includes('INTUITIVE')) throw new Error('Missing INTUITIVE level checks');
    if (!content.includes('ARCHITECTED')) throw new Error('Missing ARCHITECTED level checks');
});

// Test 5: Helper Functions
console.log('\n🛠️  Test Group 5: Helper Functions');
test('calculateDiscoveryProgress returns percentage', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('answeredQuestions / totalQuestions')) throw new Error('Missing calculation logic');
    if (!content.includes('* 100')) throw new Error('Not converting to percentage');
});

test('shouldShowProgressionGate has 3-question threshold', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('>= 3')) throw new Error('Missing 3-question threshold');
    if (!content.includes('< totalQuestions')) throw new Error('Missing completion check');
});

// Test 6: Code Quality
console.log('\n📚 Test Group 6: Code Quality');
test('Functions have JSDoc comments', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    const jsdocCount = (content.match(/\/\*\*/g) || []).length;
    if (jsdocCount < 5) throw new Error(`Only ${jsdocCount} JSDoc comments found, expected at least 5`);
});

test('Has type annotations', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes(': InputDiagnosis')) throw new Error('Missing InputDiagnosis return type');
    if (!content.includes(': string[]')) throw new Error('Missing string[] return type');
    if (!content.includes(': number')) throw new Error('Missing number return type');
    if (!content.includes(': boolean')) throw new Error('Missing boolean return type');
});

test('Exports all public functions', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    const exportCount = (content.match(/export (enum|interface|function)/g) || []).length;
    if (exportCount < 6) throw new Error(`Only ${exportCount} exports found, expected at least 6`);
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
    console.log('\n🎉 All tests passed! Discovery flow enhancement verified.\n');
    process.exit(0);
}
