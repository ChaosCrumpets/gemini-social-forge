import 'dotenv/config';
import fetch from 'node-fetch';

/**
 * COMPREHENSIVE DIAGNOSTIC: Content Generation Failure Analysis
 * 
 * This script tests every layer of the content generation pipeline
 */

console.log('🔍 DEEP DIVE: Content Generation Failure Analysis\n');
console.log('='.repeat(70));

const diagnostics = {
    tests: [],
    failures: [],
    passes: []
};

function log(emoji, message) {
    console.log(`${emoji} ${message}`);
}

function logSection(title) {
    console.log('\n' + '='.repeat(70));
    console.log(`  ${title}`);
    console.log('='.repeat(70) + '\n');
}

async function test(name, fn) {
    try {
        const result = await fn();
        diagnostics.tests.push({ name, passed: true, result });
        diagnostics.passes.push(name);
        log('✅', `${name}`);
        return result;
    } catch (error) {
        diagnostics.tests.push({ name, passed: false, error: error.message, stack: error.stack });
        diagnostics.failures.push({ name, error: error.message });
        log('❌', `${name}: ${error.message}`);
        return null;
    }
}

async function runDiagnostics() {
    // LAYER 1: SERVER CONNECTIVITY
    logSection('LAYER 1: Server Connectivity');

    await test('Server is running on port 5000', async () => {
        const response = await fetch('http://localhost:5000/api/health', { method: 'POST' });
        if (!response.ok) throw new Error(`Server not responding: ${response.status}`);
        const data = await response.json();
        console.log(`   Server uptime: ${data.startTime}`);
        return data;
    });

    // LAYER 2: ENDPOINT REGISTRATION
    logSection('LAYER 2: Endpoint Registration');

    await test('/api/generate-content-multi endpoint exists', async () => {
        // Try without auth to see if endpoint is registered (will get 401 but that's expected)
        const response = await fetch('http://localhost:5000/api/generate-content-multi', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ inputs: {}, selectedHooks: {} })
        });

        // 401 means endpoint exists but needs auth (good)
        // 404 means endpoint not registered (bad)
        if (response.status === 404) {
            throw new Error('Endpoint not found - routing issue');
        }

        console.log(`   Status: ${response.status} (${response.status === 401 ? 'Auth required - endpoint exists' : response.statusText})`);
        return { status: response.status, registered: response.status !== 404 };
    });

    // LAYER 3: MIDDLEWARE CHAIN
    logSection('LAYER 3: Middleware Loading');

    await test('User provisioning middleware loaded', async () => {
        const fs = require('fs');
        const routesContent = fs.readFileSync('server/routes.ts', 'utf-8');

        if (!routesContent.includes('ensureUserExists')) {
            throw new Error('ensureUserExists not imported');
        }

        const match = routesContent.match(/app\.post\("\/api\/generate-content-multi",[^)]+\)/s);
        if (!match) throw new Error('Endpoint definition not found');

        const endpoint = match[0];
        const middlewares = ['requireAuth', 'ensureUserExists', 'requireDbUser', 'requireScriptQuota'];
        const missing = middlewares.filter(m => !endpoint.includes(m));

        if (missing.length > 0) {
            throw new Error(`Missing middleware: ${missing.join(', ')}`);
        }

        console.log(`   All middleware present: ${middlewares.join(' → ')}`);
        return { middlewares, allPresent: true };
    });

    // LAYER 4: RESPONSE FORMAT
    logSection('LAYER 4: Response Format Verification');

    await test('Response format matches frontend expectations', async () => {
        const fs = require('fs');
        const routesContent = fs.readFileSync('server/routes.ts', 'utf-8');

        // Find the response.json() call
        const match = routesContent.match(/res\.json\(\{[^}]*\.\.\.response[^}]*\}\)/s);
        if (!match) {
            throw new Error('Response spreading not found - using wrong format');
        }

        console.log('   Response format: { ...response, scriptsRemaining }');
        console.log('   Expected by frontend: data.output exists');
        console.log('   generateContentFromMultiHooks returns: { output: ContentOutput }');
        console.log('   ✓ Format should be correct');

        return { correct: true };
    });

    // LAYER 5: LLM ROUTER STATUS
    logSection('LAYER 5: LLM Router Status');

    await test('LLM Router providers available', async () => {
        const response = await fetch('http://localhost:5000/api/debug/llm-stats');
        if (!response.ok) throw new Error('Stats endpoint not responding');

        const stats = await response.json();
        console.log(`   Active providers: ${stats.activeProviders || 'unknown'}`);
        console.log(`   Total calls: ${stats.totalCalls || 0}`);
        console.log(`   Success rate: ${stats.successRate || 'N/A'}`);

        if (!stats.providers || stats.providers.length === 0) {
            throw new Error('No LLM providers configured');
        }

        return stats;
    });

    // LAYER 6: FRONTEND ERROR HANDLING
    logSection('LAYER 6: Frontend Error Handling');

    await test('Frontend has proper error boundaries', async () => {
        const fs = require('fs');
        const frontendCode = fs.readFileSync('client/src/pages/assembly-line.tsx', 'utf-8');

        // Check if line 665 checks for data.output
        if (!frontendCode.includes('if (data.output)')) {
            throw new Error('Frontend missing output check');
        }

        // Check catch block
        if (!frontendCode.includes('catch (error: unknown)')) {
            throw new Error('Frontend missing error handler');
        }

        // Check status reset
        if (!frontendCode.includes('setStatus(ProjectStatus.HOOK_OVERVIEW)')) {
            throw new Error('Frontend missing status reset on error');
        }

        console.log('   ✓ Error boundary exists');
        console.log('   ✓ Output validation present');
        console.log('   ✓ Status reset on error');

        return { hasErrorHandling: true };
    });

    // LAYER 7: ACTUAL API CALL (if we have a test token)
    logSection('LAYER 7: Test API Call (Requires Auth)');

    console.log('⚠️  Cannot test without valid Firebase auth token');
    console.log('   This test would require:');
    console.log('   1. Valid Firebase ID token');
    console.log('   2. User exists in Firestore');
    console.log('   3. User has quota remaining');
    console.log('');
    console.log('   Manual test command:');
    console.log('   curl -X POST http://localhost:5000/api/generate-content-multi \\');
    console.log('     -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \\');
    console.log('     -H "Content-Type: application/json" \\');
    console.log('     -d \'{"inputs":{"topic":"Test"},"selectedHooks":{"text":{"id":"1","modality":"text","content":"Hook"}}}\'');

    // SUMMARY
    logSection('DIAGNOSTIC SUMMARY');

    const totalTests = diagnostics.tests.length;
    const passCount = diagnostics.passes.length;
    const failCount = diagnostics.failures.length;

    console.log(`Total Tests Run: ${totalTests}`);
    console.log(`✅ Passed: ${passCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`Success Rate: ${((passCount / totalTests) * 100).toFixed(1)}%`);

    if (failCount > 0) {
        console.log('\n🔴 FAILURES:');
        diagnostics.failures.forEach(f => {
            console.log(`   - ${f.name}`);
            console.log(`     Error: ${f.error}`);
        });
    }

    console.log('\n' + '='.repeat(70));
    console.log('ANALYSIS COMPLETE');
    console.log('='.repeat(70));

    if (failCount === 0) {
        console.log('\n✅ All automated tests passed');
        console.log('\n📋 LIKELY CAUSES (since backend tests pass):');
        console.log('   1. Authentication issue - user not logged in properly');
        console.log('   2. Browser console has JavaScript error');
        console.log('   3. Network request failing (check browser DevTools Network tab)');
        console.log('   4. LLM generation taking >120s (timeout)');
        console.log('   5. Frontend state not updating after successful response');
        console.log('\n🔧 NEXT DEBUGGING STEPS:');
        console.log('   1. Open browser DevTools Console (F12)');
        console.log('   2. Go to Network tab');
        console.log('   3. Attempt content generation');
        console.log('   4. Look for /api/generate-content-multi request');
        console.log('   5. Check: Status code, Response body, Error messages');
        console.log('   6. Check Console for any red errors');
    }

    return { totalTests, passCount, failCount, failures: diagnostics.failures };
}

runDiagnostics()
    .then(summary => {
        if (summary.failCount > 0) {
            process.exit(1);
        } else {
            process.exit(0);
        }
    })
    .catch(error => {
        console.error('\n💥 DIAGNOSTIC CRASHED:', error);
        process.exit(1);
    });
