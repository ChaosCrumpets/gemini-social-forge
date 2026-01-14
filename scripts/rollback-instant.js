/**
 * Instant Rollback Script
 * Disables C.A.L. Enhanced System by toggling feature flag
 * 
 * Usage: node scripts/rollback-instant.js
 * Speed: < 1 minute
 * Risk: Minimal
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const ENV_FILE = '.env';
const ENV_BACKUP = '.env.backup-rollback';
const ROLLBACK_LOG = 'rollback.log';

console.log('\n🚨 C.A.L. Enhanced System - Instant Rollback\n');
console.log('='.repeat(70));

// Step 1: Check if .env exists
if (!existsSync(ENV_FILE)) {
    console.error('\n❌ Error: .env file not found');
    console.error('   Please ensure .env file exists in project root.\n');
    process.exit(1);
}

// Step 2: Read current .env
const envContent = readFileSync(ENV_FILE, 'utf-8');
const lines = envContent.split('\n');

// Step 3: Check current status
const currentLine = lines.find(line => line.startsWith('ENHANCED_CAL='));
const currentValue = currentLine?.split('=')[1]?.trim();

console.log('\n📋 Current Status:');
console.log(`   ENHANCED_CAL = ${currentValue || 'NOT SET'}`);

if (currentValue === 'false') {
    console.log('\n✅ Enhanced mode is already disabled (legacy mode active)');
    console.log('   No rollback needed.\n');
    process.exit(0);
}

// Step 4: Confirm with user
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('\n⚠️  Proceed with instant rollback? This will disable enhanced mode. (yes/no): ', (answer) => {
    if (answer.toLowerCase() !== 'yes') {
        console.log('\n❌ Rollback cancelled by user.\n');
        rl.close();
        process.exit(0);
    }

    console.log('\n🔄 Executing instant rollback...\n');

    // Step 5: Create backup
    try {
        copyFileSync(ENV_FILE, ENV_BACKUP);
        console.log(`✅ Created backup: ${ENV_BACKUP}`);
    } catch (error) {
        console.error(`❌ Failed to create backup: ${error.message}`);
        rl.close();
        process.exit(1);
    }

    // Step 6: Update .env
    try {
        const updatedLines = lines.map(line => {
            if (line.startsWith('ENHANCED_CAL=')) {
                return 'ENHANCED_CAL=false';
            }
            return line;
        });

        // If ENHANCED_CAL not found, add it
        if (!currentLine) {
            updatedLines.push('ENHANCED_CAL=false');
        }

        writeFileSync(ENV_FILE, updatedLines.join('\n'), 'utf-8');
        console.log('✅ Updated .env: ENHANCED_CAL=false');
    } catch (error) {
        console.error(`❌ Failed to update .env: ${error.message}`);
        console.error('   Restoring from backup...');
        copyFileSync(ENV_BACKUP, ENV_FILE);
        rl.close();
        process.exit(1);
    }

    // Step 7: Verify change
    const verifyContent = readFileSync(ENV_FILE, 'utf-8');
    if (!verifyContent.includes('ENHANCED_CAL=false')) {
        console.error('❌ Verification failed! .env was not updated correctly.');
        console.error('   Restoring from backup...');
        copyFileSync(ENV_BACKUP, ENV_FILE);
        rl.close();
        process.exit(1);
    }
    console.log('✅ Verified: ENHANCED_CAL=false\n');

    // Step 8: Log rollback
    const timestamp = new Date().toISOString();
    const logEntry = `${timestamp} - INSTANT ROLLBACK - Enhanced mode disabled (was: ${currentValue})\n`;
    try {
        writeFileSync(ROLLBACK_LOG, logEntry, { flag: 'a' });
        console.log(`✅ Logged to ${ROLLBACK_LOG}`);
    } catch (error) {
        console.warn(`⚠️  Warning: Could not write to log: ${error.message}`);
    }

    // Step 9: Instructions
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ INSTANT ROLLBACK COMPLETE\n');
    console.log('Next Steps:');
    console.log('  1. Restart the server:');
    console.log('     npm run dev (or pm2 restart all)');
    console.log('  2. Verify legacy mode is active in console logs');
    console.log('  3. Monitor application for stability\n');
    console.log('📋 System Status:');
    console.log('   Mode: LEGACY (v1.0)');
    console.log('   Panels: 5 (Tech Specs instead of Cinematography)');
    console.log('   Discovery: Fixed questions');
    console.log('   Hooks: Generic templates\n');
    console.log('🔄 To Re-Enable Enhanced Mode:');
    console.log('   1. Edit .env: ENHANCED_CAL=true');
    console.log('   2. Restart server');
    console.log('   3. Verify enhanced mode active\n');
    console.log(`📦 Backup saved: ${ENV_BACKUP}\n`);

    rl.close();
    process.exit(0);
});
