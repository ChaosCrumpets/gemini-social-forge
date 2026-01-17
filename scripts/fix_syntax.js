import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, '..', 'server', 'routes.ts');
console.log(`Reading ${filePath}...`);

let content = fs.readFileSync(filePath, 'utf8');

// Target the orphan "Create new session" route block
// Corrupted line partial match:
const startPartial = "// [DISABLED - DUPLICATE] Create new session";
const startIndex = content.indexOf(startPartial);

if (startIndex === -1) {
    console.error("Could not find start marker for orphan block.");
    // Maybe it's already gone?
    process.exit(0);
}

console.log(`Found start of orphan block at ${startIndex}`);

// Find the closing }); for this block.
// It should be the first }); after the start marker.
const endMarker = "  });";
const endIndex = content.indexOf(endMarker, startIndex);

if (endIndex === -1) {
    console.error("Could not find closing }); for orphan block.");
    process.exit(1);
}

// Check if there's a closer `app.post` or something that implies we skipped too far
// The block contains `await firestore.collection('sessions')`
if (content.substring(startIndex, endIndex).length > 2000) {
    console.warn("Block seems too large (>2000 chars). Verification needed.");
    // Safety check
}

const cutEnd = endIndex + endMarker.length;
console.log(`Removing from ${startIndex} to ${cutEnd}`);

const newContent = content.substring(0, startIndex) +
    "\n  // [REMOVED ORPHAN DUPLICATE POST /api/sessions]\n  // Removed lines 273-308 to fix syntax error.\n" +
    content.substring(cutEnd);

fs.writeFileSync(filePath, newContent, 'utf8');
console.log("Successfully removed orphan duplicate route.");
