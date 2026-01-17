
// Mock of the cleanFirestoreData function
function cleanFirestoreData(data) {
    if (data === null || data === undefined) return null;

    if (Array.isArray(data)) {
        return data.map(item => cleanFirestoreData(item)).filter(item => item !== undefined);
    }

    if (typeof data === 'object') {
        if (data instanceof Date) return data;
        return Object.fromEntries(
            Object.entries(data)
                .map(([key, value]) => [key, cleanFirestoreData(value)])
                .filter(([_, value]) => value !== undefined && value !== null)
        );
    }
    return data;
}

// Test Data for Firestore Cleaning
const badData = {
    valid: "keep me",
    nested: {
        alsoValid: 123,
        bad: undefined,
        badNull: null
    },
    array: [1, undefined, { good: "yes", bad: undefined }]
};

console.log("Testing cleanFirestoreData...");
const cleaned = cleanFirestoreData(badData);
console.log(JSON.stringify(cleaned, null, 2));

if (cleaned.nested.bad === undefined && !('bad' in cleaned.nested) && cleaned.array.length === 2) {
    console.log("✅ cleanFirestoreData PASSED");
} else {
    console.log("❌ cleanFirestoreData FAILED");
}

// Mock of the JSON Regex Logic
console.log("\nTesting JSON Regex...");
const mixedOutput = `
Here is your JSON:
{
  "message": "Hello world",
  "extractedInputs": {}
}
Hope you like it!
`;

const jsonMatch = mixedOutput.match(/\{[\s\S]*\}/);
const jsonString = jsonMatch ? jsonMatch[0] : mixedOutput;

console.log("Extracted:", jsonString);

try {
    const parsed = JSON.parse(jsonString);
    if (parsed.message === "Hello world") {
        console.log("✅ JSON Extraction PASSED");
    } else {
        console.log("❌ JSON Extraction FAILED: Message mismatch");
    }
} catch (e) {
    console.log("❌ JSON Extraction FAILED: Parse error", e);
}
