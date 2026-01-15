/**
 * Post-Rollback Health Check
 * Comprehensive verification of server, API keys, and SDKs
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('\n🏥 POST-ROLLBACK HEALTH CHECK\n');
console.log('='.repeat(70));

const results = {
    passed: 0,
    failed: 0,
    warnings: 0
};

function pass(message) {
    console.log(`✅ ${message}`);
    results.passed++;
}

function fail(message) {
    console.log(`❌ ${message}`);
    results.failed++;
}

function warn(message) {
    console.log(`⚠️  ${message}`);
    results.warnings++;
}

function header(title) {
    console.log(`\n📋 ${title}`);
    console.log('-'.repeat(70));
}

// 1. Environment File Check
header('Environment Configuration');

if (existsSync('.env')) {
    pass('.env file exists');

    const envContent = readFileSync('.env', 'utf-8');

    // Check for required environment variables
    const requiredVars = [
        'GEMINI_API_KEY',
        'FIREBASE_ADMIN_PROJECT_ID',
        'FIREBASE_ADMIN_PRIVATE_KEY',
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        'VITE_FIREBASE_API_KEY',
        'VITE_FIREBASE_PROJECT_ID',
        'PORT',
        'NODE_ENV'
    ];

    requiredVars.forEach(varName => {
        if (envContent.includes(`${varName}=`)) {
            const match = envContent.match(new RegExp(`${varName}=(.+)`));
            if (match && match[1] && match[1].trim() && !match[1].includes('your_') && !match[1].includes('_here')) {
                pass(`${varName} configured`);
            } else {
                fail(`${varName} not properly set (placeholder value)`);
            }
        } else {
            fail(`${varName} missing from .env`);
        }
    });
} else {
    fail('.env file missing');
}

// 2. API Keys Validation
header('API Keys Validation');

const apiKeys = [
    { name: 'GEMINI_API_KEY', pattern: /^AIza[0-9A-Za-z_-]{35}$/ },
    { name: 'ANTHROPIC_API_KEY', pattern: /^sk-ant-api\d{2}-[A-Za-z0-9_-]{95}$/, optional: true },
    { name: 'GROQ_API_KEY', pattern: /^gsk_[A-Za-z0-9]{52}$/, optional: true },
    { name: 'OPENROUTER_API_KEY', pattern: /^sk-or-v1-[a-f0-9]{64}$/, optional: true }
];

apiKeys.forEach(({ name, pattern, optional }) => {
    const value = process.env[name];

    if (!value) {
        if (optional) {
            warn(`${name} not configured (optional)`);
        } else {
            fail(`${name} missing`);
        }
    } else if (value.includes('your_') || value.includes('_here')) {
        fail(`${name} has placeholder value`);
    } else if (pattern && !pattern.test(value)) {
        warn(`${name} format may be invalid`);
    } else {
        pass(`${name} configured correctly`);
    }
});

// 3. Firebase Admin SDK
header('Firebase Admin SDK');

const firebaseAdminVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_CLIENT_ID'
];

firebaseAdminVars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
        fail(`${varName} missing`);
    } else if (value.includes('your_')) {
        fail(`${varName} has placeholder value`);
    } else {
        // Specific validation
        if (varName === 'FIREBASE_ADMIN_PRIVATE_KEY') {
            if (value.includes('BEGIN PRIVATE KEY')) {
                pass(`${varName} appears valid (contains BEGIN PRIVATE KEY)`);
            } else {
                fail(`${varName} invalid format`);
            }
        } else if (varName === 'FIREBASE_ADMIN_CLIENT_EMAIL') {
            if (value.includes('@') && value.includes('.iam.gserviceaccount.com')) {
                pass(`${varName} format correct`);
            } else {
                fail(`${varName} invalid format`);
            }
        } else if (varName === 'FIREBASE_ADMIN_PROJECT_ID') {
            if (value && value.length > 0) {
                pass(`${varName} configured: ${value}`);
            } else {
                fail(`${varName} empty`);
            }
        } else {
            pass(`${varName} configured`);
        }
    }
});

// 4. Firebase Web SDK
header('Firebase Web SDK (Client)');

const firebaseWebVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
];

firebaseWebVars.forEach(varName => {
    const value = process.env[varName];

    if (!value) {
        fail(`${varName} missing`);
    } else if (value.includes('your_')) {
        fail(`${varName} has placeholder value`);
    } else {
        pass(`${varName} configured`);
    }
});

// 5. Server Configuration
header('Server Configuration');

const port = process.env.PORT;
const nodeEnv = process.env.NODE_ENV;

if (port) {
    if (port === '5000') {
        pass(`PORT configured: ${port}`);
    } else {
        warn(`PORT set to non-standard value: ${port} (expected 5000)`);
    }
} else {
    fail('PORT not set');
}

if (nodeEnv) {
    if (nodeEnv === 'development') {
        pass(`NODE_ENV: ${nodeEnv}`);
    } else {
        warn(`NODE_ENV: ${nodeEnv} (not development)`);
    }
} else {
    fail('NODE_ENV not set');
}

// 6. File System Check
header('Critical Files Check');

const criticalFiles = [
    'server/index.ts',
    'server/gemini.ts',
    'server/routes.ts',
    'client/src/App.tsx',
    'shared/schema.ts',
    'package.json'
];

criticalFiles.forEach(file => {
    if (existsSync(file)) {
        pass(`${file} exists`);
    } else {
        fail(`${file} missing`);
    }
});

// Summary
console.log('\n' + '='.repeat(70));
console.log('\n📊 HEALTH CHECK SUMMARY\n');
console.log(`✅ Passed:   ${results.passed}`);
console.log(`❌ Failed:   ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);

const total = results.passed + results.failed;
const percentage = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

console.log(`\n📈 Success Rate: ${percentage}%`);

if (results.failed === 0) {
    console.log('\n🎉 All critical checks passed!');
    console.log('✅ System is ready for operation\n');
    process.exit(0);
} else if (results.failed < 5) {
    console.log('\n⚠️  Some issues detected but system may still function');
    console.log('🔧 Review failed checks above\n');
    process.exit(0);
} else {
    console.log('\n❌ Multiple critical issues detected');
    console.log('🛑 System may not function correctly\n');
    process.exit(1);
}
