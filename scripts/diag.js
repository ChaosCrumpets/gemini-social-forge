
import { sessionStorage } from '../server/storage';
import { extractJsonBlock, generateHooks } from '../server/gemini';

// Mock Firestore Utils to intercept calls (we can't easily mock the real server module imports without a test runner, 
// so we'll test the logic functions in isolation if possible, or hit the endpoints)

// Actually, testing the logic in isolation is safer and faster.
// I will copy the logic of extractJsonBlock here to test it.

function extractJsonBlockTest(text) {
    const startIndex = text.indexOf('{');
    if (startIndex === -1) return null;

    let braceCount = 0;
    let inString = false;
    let isEscaped = false;

    for (let i = startIndex; i < text.length; i++) {
        const char = text[i];

        if (isEscaped) {
            isEscaped = false;
            continue;
        }

        if (char === '\\') {
            isEscaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    return text.substring(startIndex, i + 1);
                }
            }
        }
    }
    return null;
}

// Test cases for JSON Parser
const trickyCases = [
    `{ "message": "Simple" }`,
    `Prefix { "message": "With prefix" }`,
    `{ "message": "With escaped \\"quote\\"" }`, // Escaped quote
    `{ "message": "With nested { braces }" }`, // Nested braces in string (should be ignored)
    `{ "key": { "nested": "object" } }`, // Real nested object
    `\`\`\`json
    {
      "message": "Markdown block"
    }
    \`\`\``,
    `{ 
       "message": "Multiline \n string"
    }`,
    // The user's case (mixed text after)
    `{
  "message": "Perfect!",
  "extractedInputs": {}
}

As we prepare...`
];

console.log("=== Testing JSON Parser ===");
trickyCases.forEach((text, i) => {
    console.log(`\nCase ${i + 1}:`);
    const result = extractJsonBlockTest(text);
    console.log(`Original Length: ${text.length}`);
    console.log(`Extracted: ${result ? result.substring(0, 50) + "..." : "NULL"}`);
    try {
        if (result) {
            JSON.parse(result);
            console.log("✅ Valid JSON");
        } else {
            console.log("❌ No JSON extracted");
        }
    } catch (e) {
        console.log("❌ Parse Error:", e.message);
    }
});

// Test Update Session Logic (Simulated)
console.log("\n=== Testing Update Logic (Sanitization) ===");
const updates = {
    valid: 123,
    bad: undefined,
    nested: {
        good: "ok",
        bad: undefined
    }
};

try {
    const sanitized = JSON.parse(JSON.stringify(updates));
    console.log("Sanitized:", JSON.stringify(sanitized, null, 2));
    if (!('bad' in sanitized) && !('bad' in sanitized.nested)) {
        console.log("✅ Sanitization works");
    } else {
        console.log("❌ Sanitization failed");
    }
} catch (e) {
    console.log("❌ Sanitization Error:", e);
}
