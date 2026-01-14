#!/usr/bin/env node
/**
 * Extract C.A.L. Enhanced Prompt from Meta-Prompt Markdown Files
 * This script reads 3 markdown files containing the system prompt in TypeScript code blocks
 * and combines them into a single exportable TypeScript module.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Input files containing the prompt segments
const inputFiles = [
    join(projectRoot, 'systemprompt_instructions/CAL_MetaPrompt1_Part1_SystemPrompt.md'),
    join(projectRoot, 'systemprompt_instructions/CAL_MetaPrompt1_Part2_SystemPrompt.md'),
    join(projectRoot, 'systemprompt_instructions/CAL_MetaPrompt1_Part3_FINAL.md')
];

// Output file
const outputFile = join(projectRoot, 'server/prompts/cal-enhanced-v2.ts');

console.log('🎬 Starting C.A.L. Enhanced Prompt Extraction...\n');

// Extract content from each markdown file
let extractedPrompt = '';

for (let i = 0; i < inputFiles.length; i++) {
    const filePath = inputFiles[i];
    console.log(`📄 Reading ${filePath.split('\\').pop()}...`);

    try {
        const content = readFileSync(filePath, 'utf-8');

        // Find the TypeScript code block
        const codeBlockRegex = /```typescript\n([\s\S]*?)```/g;
        const matches = [...content.matchAll(codeBlockRegex)];

        if (matches.length === 0) {
            console.warn(`⚠️  No TypeScript code block found in ${filePath}`);
            continue;
        }

        // For Part 1, extract everything including the opening
        // For Part 2 and 3, skip the continuation comment and continue from where it left off
        for (const match of matches) {
            let codeContent = match[1];

            if (i === 0) {
                // Part 1: Extract the entire prompt starting
                extractedPrompt += codeContent;
            } else {
                // Part 2+: Remove the continuation comment and add the rest
                codeContent = codeContent
                    .replace(/^\/\/ \.\.\. continuing CONTENT_GENERATION_PROMPT from Part \d+ \.\.\.\n\n/, '')
                    .trim();

                // Don't add the closing backtick and const declaration again
                extractedPrompt += '\n' + codeContent;
            }
        }

        console.log(`✅ Extracted ${matches.length} code block(s) from Part ${i + 1}`);
    } catch (error) {
        console.error(`❌ Error reading ${filePath}:`, error.message);
        process.exit(1);
    }
}

// Clean up the extracted prompt
// Remove any closing parts from the middle of the content
extractedPrompt = extractedPrompt
    .replace(/\`;\s*$/g, '') // Remove trailing `;` if present in the last part
    .trim();

// Create the final TypeScript module
const outputContent = `/**
 * C.A.L. Enhanced System Prompt v2.0
 * 
 * This enhanced prompt includes:
 * - 4-level entropy classification for input diagnosis
 * - Adaptive discovery protocol (2-6+ questions)
 * - Neurobiology-grounded script generation
 * - Hook database integration
 * - Dual-mode cinematography guidance
 * - 6-panel output structure
 * 
 * Total size: ~133KB
 * Extracted from: CAL_MetaPrompt1_Part1-3_SystemPrompt.md files
 * Date: ${new Date().toISOString().split('T')[0]}
 */

export const CONTENT_GENERATION_PROMPT_V2 = \`${extractedPrompt}\`;
`;

// Write to output file
try {
    writeFileSync(outputFile, outputContent, 'utf-8');
    console.log(`\n✅ Successfully created: ${outputFile}`);
    console.log(`📊 Prompt size: ${(Buffer.byteLength(extractedPrompt, 'utf-8') / 1024).toFixed(2)} KB`);
    console.log(`📝 Total output size: ${(Buffer.byteLength(outputContent, 'utf-8') / 1024).toFixed(2)} KB`);
    console.log('\n🎉 Extraction complete!');
} catch (error) {
    console.error(`❌ Error writing to ${outputFile}:`, error.message);
    process.exit(1);
}
