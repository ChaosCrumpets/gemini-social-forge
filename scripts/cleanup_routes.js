import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Go up one level from scripts to root, then into server
const filePath = path.join(__dirname, '..', 'server', 'routes.ts');
console.log(`Reading ${filePath}...`);

let content = fs.readFileSync(filePath, 'utf8');

// The block to remove starts around the duplicate GET /api/sessions and ends before the session messages endpoint
// Because the file might contain corrupted \r\n chars from the previous failed edit, we'll try to match by content.

// Marker 1: The broken comment or the start of the first duplicate route
// We look for the duplicated GET /api/sessions which uses verifyFirebaseToken
const startMarker = "app.get('/api/sessions', verifyFirebaseToken";
let startIndex = content.indexOf(startMarker);

// Helper to find the start of the comment block
function findCommentStart(pos) {
    if (pos === -1) return -1;
    // Look backwards for the comment start
    const comment = "// List all sessions for current user";
    // Also check for the broken comment
    const brokenComment = "// [DISABLED - DUPLICATE]";

    let p1 = content.lastIndexOf(comment, pos);
    let p2 = content.lastIndexOf(brokenComment, pos);

    // Return the larger valid index (closest to startMarker) that is within reasonable distance (e.g. 200 chars)
    if (p1 !== -1 && (pos - p1 < 200)) return p1;
    if (p2 !== -1 && (pos - p2 < 200)) {
        // If broken comment, check if it has weird headers before it
        // The broken comment itself is the start
        return p2;
    }
    return pos; // Just cut from the app.get line if no comment found close by
}

if (startIndex === -1) {
    console.error("Could not find start marker: " + startMarker);
    // Try finding the broken comment form from the PS script which might be the only thing left if app.get match failed (unlikely)
    const brokenMarker = "[DISABLED - DUPLICATE]";
    const brokenIndex = content.indexOf(brokenMarker);
    if (brokenIndex === -1) {
        console.error("Could not find broken marker either. File might be different than expected.");
        process.exit(1);
    }
    console.log("Found broken marker at index " + brokenIndex);
    // Back up to the start of the line or just use brokenIndex
    const p = content.lastIndexOf('\n', brokenIndex);
    removeBlock(content, p + 1);
} else {
    // Determine cutoff point
    const cutStart = findCommentStart(startIndex);
    console.log(`Found duplicate route at ${startIndex}, cutting from ${cutStart}`);
    removeBlock(content, cutStart);
}

function removeBlock(fullContent, startPos) {
    // Find end of block
    const endMarker1 = 'app.post(\n    "/api/sessions/:id/messages"';
    const endMarker2 = 'app.post("/api/sessions/:id/messages"';
    const endMarker3 = '// Session Messages Endpoint';

    let endPos = fullContent.indexOf(endMarker1, startPos);
    if (endPos === -1) endPos = fullContent.indexOf(endMarker2, startPos);
    if (endPos === -1) endPos = fullContent.indexOf(endMarker3, startPos);

    if (endPos === -1) {
        console.error("Could not find end of block!");
        process.exit(1);
    }

    // Find the "============================================" line before it potentially
    if (fullContent.substring(endPos).startsWith('// Session Messages Endpoint')) {
        const headerStart = fullContent.lastIndexOf('// ============================================', endPos);
        if (headerStart !== -1 && headerStart > startPos) {
            endPos = headerStart;
        }
    }

    console.log(`Removing content from index ${startPos} to ${endPos}`);

    const newContent = fullContent.substring(0, startPos) +
        "\n  // [REMOVED DUPLICATE FIRESTORE ROUTES]\n  // This section previously contained duplicate routes for /api/sessions\n  // that conflicted with the main implementation using optionalAuth.\n  \n" +
        fullContent.substring(endPos);

    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log("Successfully removed duplicate routes.");
}
