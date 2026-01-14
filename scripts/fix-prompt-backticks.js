#!/usr/bin/env node
/**
 * Fix Backtick Escaping in CAL Enhanced Prompt
 * This script escapes all backticks in the template string to prevent TypeScript parsing errors
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const promptFile = join(projectRoot, 'server/prompts/cal-enhanced-v2.ts');

console.log('🔧 Fixing backtick escaping in CAL Enhanced Prompt...\n');

try {
    // Read the file
    const content = readFileSync(promptFile, 'utf-8');

    // Find the export line and the template string content
    const exportMatch = content.match(/export const CONTENT_GENERATION_PROMPT_V2 = `([\s\S]*)`;\s*$/);

    if (!exportMatch) {
        console.error('❌ Could not find the prompt export in the file');
        process.exit(1);
    }

    const promptContent = exportMatch[1];

    // Count backticks before escaping
    const backtickCount = (promptContent.match(/`/g) || []).length;
    console.log(`📊 Found ${backtickCount} backticks to escape`);

    // Escape all backticks in the prompt content
    const escapedContent = promptContent.replace(/`/g, '\\`');

    // Reconstruct the file with header
    const header = content.substring(0, content.indexOf('export const CONTENT_GENERATION_PROMPT_V2'));
    const newContent = `${header}export const CONTENT_GENERATION_PROMPT_V2 = \`${escapedContent}\`;
`;

    // Write back to file
    writeFileSync(promptFile, newContent, 'utf-8');

    console.log('✅ Successfully escaped all backticks');
    console.log(`📝 File updated: ${promptFile}`);
    console.log(`\n🎉 TypeScript should now compile without errors!`);

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
