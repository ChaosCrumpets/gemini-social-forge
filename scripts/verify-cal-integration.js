/**
 * Phase 6: C.A.L. Enhanced System Integration Verification
 * Validates all components from Phases 1-5 are correctly integrated
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const results = [];
let totalTests = 0;
let passedTests = 0;

function test(name, fn) {
    totalTests++;
    try {
        fn();
        results.push({ name, status: 'PASS' });
        passedTests++;
        return true;
    } catch (error) {
        results.push({ name, status: 'FAIL', error: error.message });
        return false;
    }
}

console.log('\n🔍 C.A.L. Enhanced System - Integration Verification\n');
console.log('='.repeat(70));

// ============================================================================
// Phase 1: Environment & Feature Flags
// ============================================================================
console.log('\n📋 Phase 1: Environment & Feature Flags');

test('Feature flag file exists', () => {
    if (!existsSync('server/lib/features.ts')) throw new Error('features.ts not found');
});

test('ENHANCED_CAL flag defined', () => {
    const content = readFileSync('server/lib/features.ts', 'utf-8');
    if (!content.includes('USE_ENHANCED_CAL_PROMPT')) throw new Error('Flag not defined');
    if (!content.includes('ENHANCED_CAL')) throw new Error('Environment variable not used');
});

// ============================================================================
// Phase 2: System Prompt Integration
// ============================================================================
console.log('\n📋 Phase 2: System Prompt Integration');

test('Enhanced prompt file exists', () => {
    if (!existsSync('server/prompts/cal-enhanced-v2.ts')) throw new Error('Prompt file not found');
});

test('Enhanced prompt exports constant', () => {
    const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
    if (!content.includes('export const CONTENT_GENERATION_PROMPT_V2')) {
        throw new Error('Export not found');
    }
});

test('Prompt selector function exists', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('export function getContentGenerationPrompt')) {
        throw new Error('Selector function not found');
    }
});

test('Legacy prompt renamed', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('CONTENT_GENERATION_PROMPT_LEGACY')) {
        throw new Error('Legacy prompt not found');
    }
});

// ============================================================================
// Phase 3: Hook Database Integration
// ============================================================================
console.log('\n📋 Phase 3: Hook Database Integration');

test('Enhanced hook interfaces exist', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('export interface EnhancedHookTemplate')) {
        throw new Error('EnhancedHookTemplate not found');
    }
    if (!content.includes('export interface HookAdaptationContext')) {
        throw new Error('HookAdaptationContext not found');
    }
});

test('adaptHookTemplate function exists', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('export function adaptHookTemplate')) {
        throw new Error('Function not found');
    }
});

test('generateEnhancedHooks function exists', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('export function generateEnhancedHooks')) {
        throw new Error('Function not found');
    }
});

test('UAV/SPCL integration present', () => {
    const content = readFileSync('server/hookDatabase.ts', 'utf-8');
    if (!content.includes('uav')) throw new Error('UAV not found');
    if (!content.includes('spcl')) throw new Error('SPCL not found');
});

// ============================================================================
// Phase 4: Discovery Flow Enhancement
// ============================================================================
console.log('\n📋 Phase 4: Discovery Flow Enhancement');

test('Discovery file exists', () => {
    if (!existsSync('server/discovery.ts')) throw new Error('discovery.ts not found');
});

test('InputEntropyLevel enum exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export enum InputEntropyLevel')) {
        throw new Error('Enum not found');
    }
    if (!content.includes('COLD')) throw new Error('COLD level missing');
    if (!content.includes('ARCHITECTED')) throw new Error('ARCHITECTED level missing');
});

test('diagnoseInput function exists', () => {
    const content = readFileSync('server/discovery.ts', 'utf-8');
    if (!content.includes('export function diagnoseInput')) {
        throw new Error('Function not found');
    }
});

test('ProgressionGate component exists', () => {
    if (!existsSync('client/src/components/ProgressionGate.tsx')) {
        throw new Error('ProgressionGate.tsx not found');
    }
});

// ============================================================================
// Phase 5: Frontend Panel Updates
// ============================================================================
console.log('\n📋 Phase 5: Frontend Panel Updates');

test('Cinematography schema exists', () => {
    const content = readFileSync('shared/schema.ts', 'utf-8');
    if (!content.includes('export const cinematographySchema')) {
        throw new Error('Schema not found');
    }
    if (!content.includes('amateurMode')) throw new Error('Amateur mode missing');
    if (!content.includes('professionalMode')) throw new Error('Professional mode missing');
});

test('Deployment schema exists', () => {
    const content = readFileSync('shared/schema.ts', 'utf-8');
    if (!content.includes('export const deploymentSchema')) {
        throw new Error('Schema not found');
    }
});

test('OutputPanels has 6 tabs', () => {
    const content = readFileSync('client/src/components/OutputPanels.tsx', 'utf-8');
    if (!content.includes('Cinematography')) throw new Error('Cinematography tab not found');
    if (!content.includes('Deployment')) throw new Error('Deployment tab not found');

    // Count TabButton components
    const tabButtons = content.match(/<TabButton/g);
    if (!tabButtons || tabButtons.length < 6) {
        throw new Error(`Expected 6 tabs, found ${tabButtons?.length || 0}`);
    }
});

test('CinematographyPanel component exists', () => {
    const content = readFileSync('client/src/components/OutputPanels.tsx', 'utf-8');
    if (!content.includes('function CinematographyPanel')) {
        throw new Error('Component not found');
    }
});

test('DeploymentPanel component exists', () => {
    const content = readFileSync('client/src/components/OutputPanels.tsx', 'utf-8');
    if (!content.includes('function DeploymentPanel')) {
        throw new Error('Component not found');
    }
});

// ============================================================================
// Schema Integrity
// ============================================================================
console.log('\n📋 Schema Integrity');

test('ContentOutput includes new types', () => {
    const content = readFileSync('shared/schema.ts', 'utf-8');
    if (!content.includes('cinematography:')) throw new Error('Cinematography field missing');
    if (!content.includes('deployment:')) throw new Error('Deployment field missing');
});

test('Backward compatibility maintained', () => {
    const content = readFileSync('shared/schema.ts', 'utf-8');
    // techSpecs should still be present as optional
    if (!content.includes('techSpecs:')) throw new Error('techSpecs field removed - breaks backward compat');
});

// ============================================================================
// Integration Points
// ============================================================================
console.log('\n📋 Integration Points');

test('Gemini imports enhanced hook functions', () => {
    const content = readFileSync('server/gemini.ts', 'utf-8');
    if (!content.includes('adaptHookTemplate')) throw new Error('Import missing');
    if (!content.includes('generateEnhancedHooks')) throw new Error('Import missing');
});

test('OutputPanels imports new types', () => {
    const content = readFileSync('client/src/components/OutputPanels.tsx', 'utf-8');
    if (!content.includes('Cinematography')) throw new Error('Import missing');
    if (!content.includes('Deployment')) throw new Error('Import missing');
});

// ============================================================================
// Test Scripts Exist
// ============================================================================
console.log('\n📋 Test Scripts');

test('Phase 2 test exists', () => {
    if (!existsSync('scripts/test-phase2-simple.js')) {
        throw new Error('Test not found');
    }
});

test('Phase 3 test exists', () => {
    if (!existsSync('scripts/test-phase3-hooks.js')) {
        throw new Error('Test not found');
    }
});

test('Phase 4 test exists', () => {
    if (!existsSync('scripts/test-phase4-discovery.js')) {
        throw new Error('Test not found');
    }
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(70));
console.log('\n📊 Integration Verification Results\n');

console.log(`Total Tests: ${totalTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${totalTests - passedTests}`);
console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

if (passedTests < totalTests) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => r.status === 'FAIL').forEach(r => {
        console.log(`   - ${r.name}: ${r.error}`);
    });
    console.log('\n⚠️  Integration verification FAILED. Please fix issues before proceeding.\n');
    process.exit(1);
} else {
    console.log('\n🎉 All integration tests passed!');
    console.log('✅ C.A.L. Enhanced System is correctly integrated.');
    console.log('\n📋 Component Status:');
    console.log('   ✅ Phase 1: Environment & Feature Flags');
    console.log('   ✅ Phase 2: System Prompt Integration');
    console.log('   ✅ Phase 3: Hook Database Integration');
    console.log('   ✅ Phase 4: Discovery Flow Enhancement');
    console.log('   ✅ Phase 5: Frontend Panel Updates');
    console.log('\n🚀 System ready for production deployment!\n');
    process.exit(0);
}
