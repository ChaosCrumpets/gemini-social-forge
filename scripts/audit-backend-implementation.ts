import 'dotenv/config';
import { TIER_LIMITS } from '../server/middleware/auth-helpers.js';
import { Timestamp } from 'firebase-admin/firestore';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
    if (!condition) {
        throw new Error(message);
    }
}

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message });
        console.error(`❌ ${name}: ${error.message}`);
    }
}

async function runAudit() {
    console.log('🔍 BACKEND IMPLEMENTATION AUDIT - STARTED\n');

    // Test 1: Tier Limits Configuration
    await test('TIER_LIMITS constant exists and has correct structure', async () => {
        assert(TIER_LIMITS !== undefined, 'TIER_LIMITS is undefined');
        assert(TIER_LIMITS.bronze.scriptsPerMonth === 5, 'Bronze tier should be 5 scripts');
        assert(TIER_LIMITS.silver.scriptsPerMonth === 25, 'Silver tier should be 25 scripts');
        assert(TIER_LIMITS.gold.scriptsPerMonth === 100, 'Gold tier should be 100 scripts');
        assert(TIER_LIMITS.platinum.scriptsPerMonth === -1, 'Platinum should be unlimited');
        assert(TIER_LIMITS.diamond.scriptsPerMonth === -1, 'Diamond should be unlimited');
    });

    // Test 2: Tier Features Configuration
    await test('Tier features are correctly configured', async () => {
        assert(TIER_LIMITS.bronze.features.csvExport === true, 'Bronze should have CSV export');
        assert(TIER_LIMITS.bronze.features.srtExport === false, 'Bronze should NOT have SRT export');
        assert(TIER_LIMITS.bronze.features.pdfExport === false, 'Bronze should NOT have PDF export');

        assert(TIER_LIMITS.silver.features.srtExport === true, 'Silver should have SRT export');
        assert(TIER_LIMITS.gold.features.pdfExport === true, 'Gold should have PDF export');
    });

    // Test 3: canGenerateScript - Unlimited Tier
    await test('canGenerateScript allows unlimited for Platinum', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-platinum',
            subscriptionTier: 'platinum',
            scriptsGenerated: 9999,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === true, 'Platinum user should always be allowed');
    });

    // Test 4: canGenerateScript - Bronze Within Limit
    await test('canGenerateScript allows Bronze user with 2/5 scripts', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-bronze-2',
            subscriptionTier: 'bronze',
            scriptsGenerated: 2,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === true, 'Bronze user with 2/5 should be allowed');
        assert(result.scriptsRemaining === 3, `Should have 3 remaining, got ${result.scriptsRemaining}`);
    });

    // Test 5: canGenerateScript - Bronze At Limit
    await test('canGenerateScript blocks Bronze user at 5/5 limit', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-bronze-5',
            subscriptionTier: 'bronze',
            scriptsGenerated: 5,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === false, 'Bronze user at limit should be blocked');
        assert(result.scriptsRemaining === 0, 'Should have 0 scripts remaining');
    });

    // Test 6: Reset Date Calculation
    await test('Reset date calculation is correct', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const now = new Date();
        const mockUser = {
            id: 'test-reset',
            subscriptionTier: 'bronze',
            scriptsGenerated: 0,
            createdAt: now,
            lastUsageReset: now
        };

        const result = await canGenerateScript(mockUser);
        assert(result.resetDate !== undefined, 'Should have reset date');

        const daysDiff = (result.resetDate!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        assert(daysDiff >= 29 && daysDiff <= 31, `Reset should be ~30 days, got ${daysDiff.toFixed(1)}`);
    });

    // Test 7: Silver Tier Limits
    await test('Silver tier has correct 25-script limit', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-silver',
            subscriptionTier: 'silver',
            scriptsGenerated: 24,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === true, 'Silver at 24/25 should be allowed');
        assert(result.scriptsRemaining === 1, 'Should have 1 remaining');
    });

    // Test 8: Gold Tier Limits
    await test('Gold tier has correct 100-script limit', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-gold',
            subscriptionTier: 'gold',
            scriptsGenerated: 99,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === true, 'Gold at 99/100 should be allowed');
        assert(result.scriptsRemaining === 1, 'Should have 1 remaining');
    });

    // Test 9: Diamond Tier Unlimited
    await test('Diamond tier is unlimited', async () => {
        const { canGenerateScript } = await import('../server/middleware/auth-helpers.js');
        const mockUser = {
            id: 'test-diamond',
            subscriptionTier: 'diamond',
            scriptsGenerated: 10000,
            createdAt: new Date(),
            lastUsageReset: new Date()
        };

        const result = await canGenerateScript(mockUser);
        assert(result.allowed === true, 'Diamond should be unlimited');
    });

    // Test 10: Middleware existence
    await test('All new middleware functions exist', async () => {
        const authHelpers = await import('../server/middleware/auth-helpers.js');
        assert(typeof authHelpers.canGenerateScript === 'function', 'canGenerateScript missing');
        assert(typeof authHelpers.requireScriptQuota === 'function', 'requireScriptQuota missing');
        assert(typeof authHelpers.incrementScriptCount === 'function', 'incrementScriptCount missing');

        const userProv = await import('../server/middleware/user-provisioning.js');
        assert(typeof userProv.ensureUserExists === 'function', 'ensureUserExists missing');
        assert(typeof userProv.requireDbUser === 'function', 'requireDbUser missing');
    });

    // Test 11: Backward compatibility
    await test('requirePremium is aliased to requireScriptQuota', async () => {
        const { requirePremium, requireScriptQuota } = await import('../server/middleware/auth-helpers.js');
        assert(requirePremium === requireScriptQuota, 'Alias not set correctly');
    });

    // Test 12: File structure checks
    await test('User provisioning file exists', async () => {
        const exists = fs.existsSync('server/middleware/user-provisioning.ts');
        assert(exists, 'user-provisioning.ts not found');
    });

    // Test 13: Routes.ts imports
    await test('Routes.ts has correct imports', async () => {
        const routesContent = fs.readFileSync('server/routes.ts', 'utf-8');
        assert(routesContent.includes('ensureUserExists'), 'Missing ensureUserExists import');
        assert(routesContent.includes('requireDbUser'), 'Missing requireDbUser import');
        assert(routesContent.includes('requireScriptQuota'), 'Missing requireScriptQuota import');
        assert(routesContent.includes('canGenerateScript'), 'Missing canGenerateScript import');
    });

    // Test 14: Content endpoint updated
    await test('Content generation endpoint uses new middleware', async () => {
        const routesContent = fs.readFileSync('server/routes.ts', 'utf-8');
        const match = routesContent.match(/app\.post\("\/api\/generate-content-multi",[^)]+\)/s);
        assert(match !== null, 'Could not find endpoint');

        const endpoint = match[0];
        assert(endpoint.includes('requireAuth'), 'Missing requireAuth');
        assert(endpoint.includes('ensureUserExists'), 'Missing ensureUserExists');
        assert(endpoint.includes('requireDbUser'), 'Missing requireDbUser');
        assert(endpoint.includes('requireScriptQuota'), 'Missing requireScriptQuota');
    });

    // Test 15: Quota endpoint exists
    await test('Quota endpoint exists in routes.ts', async () => {
        const routesContent = fs.readFileSync('server/routes.ts', 'utf-8');
        assert(routesContent.includes('"/api/user/quota"'), 'Quota endpoint missing');
        assert(routesContent.includes('currentTier'), 'Quota response structure incomplete');
        assert(routesContent.includes('scriptsRemaining'), 'scriptsRemaining field missing');
    });

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('AUDIT SUMMARY');
    console.log('='.repeat(70));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log(`Total Tests: ${results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

    if (failed > 0) {
        console.log('\n🔴 FAILED TESTS:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.name}`);
            console.log(`    Error: ${r.error}`);
        });
    }

    console.log('='.repeat(70) + '\n');

    return { passed, failed, total: results.length };
}

runAudit()
    .then(summary => {
        if (summary.failed === 0) {
            console.log('🎉 ALL TESTS PASSED - BACKEND IMPLEMENTATION VERIFIED\n');
            process.exit(0);
        } else {
            console.log('⚠️  SOME TESTS FAILED - REVIEW REQUIRED\n');
            process.exit(1);
        }
    })
    .catch(error => {
        console.error('\n💥 AUDIT CRASHED:', error);
        process.exit(1);
    });
