/**
 * Simple test runner that outputs results in a parseable format
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';

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

// Run all tests
const allTests = [
    ['Enhanced prompt file exists', () => {
        if (!existsSync('server/prompts/cal-enhanced-v2.ts')) throw new Error('Not found');
    }],
    ['Enhanced prompt has export', () => {
        const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
        if (!content.includes('export const CONTENT_GENERATION_PROMPT_V2')) throw new Error('Missing export');
    }],
    ['Enhanced prompt is substantial', () => {
        const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
        if (content.length / 1024 < 100) throw new Error('Too small');
    }],
    ['Backticks properly escaped', () => {
        const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
        const match = content.match(/PROMPT_V2 = `([\s\S]*)`;\s*$/);
        if (!match) throw new Error('Cannot extract');
        const unescaped = match[1].match(/(?<!\\)`/g);
        if (unescaped && unescaped.length > 0) throw new Error(`${unescaped.length} unescaped`);
    }],
    ['Enhanced prompt has subsystems', () => {
        const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8').toLowerCase();
        const required = ['subsystem 1', 'subsystem 2', 'subsystem 3', 'neurobiology', '4-level entropy'];
        for (const r of required) {
            if (!content.includes(r)) throw new Error(`Missing: ${r}`);
        }
    }],
    ['gemini.ts imports enhanced prompt', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('CONTENT_GENERATION_PROMPT_V2')) throw new Error('Missing V2');
        if (!content.includes('./prompts/cal-enhanced-v2')) throw new Error('Missing path');
    }],
    ['gemini.ts imports features', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('FEATURES')) throw new Error('Missing FEATURES');
        if (!content.includes('./lib/features')) throw new Error('Missing path');
    }],
    ['Legacy prompt renamed', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('CONTENT_GENERATION_PROMPT_LEGACY')) throw new Error('Not renamed');
    }],
    ['Selector function exists', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('export function getContentGenerationPrompt()')) throw new Error('Not found');
    }],
    ['Selector has both branches', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('CONTENT_GENERATION_PROMPT_V2')) throw new Error('Missing V2 return');
        if (!content.includes('CONTENT_GENERATION_PROMPT_LEGACY')) throw new Error('Missing legacy return');
    }],
    ['Prompt references updated', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        const calls = content.match(/getContentGenerationPrompt\(\)/g);
        if (!calls || calls.length < 2) throw new Error(`Only ${calls ? calls.length : 0} calls`);
    }],
    ['Feature flag configured', () => {
        const content = readFileSync('server/lib/features.ts', 'utf-8');
        if (!content.includes('USE_ENHANCED_CAL_PROMPT')) throw new Error('Missing flag');
    }],
    ['Feature flag defaults false', () => {
        const content = readFileSync('server/lib/features.ts', 'utf-8');
        if (!content.includes('|| false')) throw new Error('Not defaulting');
    }],
    ['Valid TypeScript syntax', () => {
        const content = readFileSync('server/prompts/cal-enhanced-v2.ts', 'utf-8');
        const backticks = (content.match(/(?<!\\)`/g) || []).length;
        if (backticks !== 2) throw new Error(`Expected 2 backticks, found ${backticks}`);
    }],
    ['Selector has correct signature', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.match(/export function getContentGenerationPrompt\(\):\s*string/)) throw new Error('Wrong sig');
    }],
    ['Legacy prompt preserved', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('Generate a complete content package')) throw new Error('Not preserved');
    }],
    ['Legacy has word count formula', () => {
        const content = readFileSync('server/gemini.ts', 'utf-8');
        if (!content.includes('2.5 words per second')) throw new Error('Missing formula');
    }]
];

allTests.forEach(([name, fn]) => test(name, fn));

const passed = results.filter(r => r.status === 'PASS').length;
const failed = results.filter(r => r.status === 'FAIL').length;

const output = {
    total: results.length,
    passed,
    failed,
    successRate: ((passed / results.length) * 100).toFixed(1) + '%',
    allPassed: failed === 0,
    results
};

writeFileSync('test-results.json', JSON.stringify(output, null, 2), 'utf-8');
console.log(JSON.stringify(output, null, 2));

process.exit(failed === 0 ? 0 : 1);
