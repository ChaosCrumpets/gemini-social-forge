
// Logic-only test (no imports)

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

const trickyCases = [
    `{ "message": "Simple" }`,
    `{ "message": "With nested { braces } inside string" }`,
    `{
  "message": "Real case"
}
And some output text`,
];

console.log("=== Testing JSON Parser Logic ===");
trickyCases.forEach((text, i) => {
    console.log(`\nCase ${i + 1}:`);
    const result = extractJsonBlockTest(text);
    console.log(`Extracted: ${result}`);
    try {
        if (result) {
            JSON.parse(result);
            console.log("✅ Valid JSON");
        } else {
            console.log("❌ Invalid");
        }
    } catch (e) {
        console.log("❌ Parse Error");
    }
});

console.log("\n=== Testing Sanitization Logic ===");
const updates = { bad: undefined, good: 1 };
const sanitized = JSON.parse(JSON.stringify(updates));
console.log("Result:", JSON.stringify(sanitized));
if (!('bad' in sanitized)) console.log("✅ Sanitized");
