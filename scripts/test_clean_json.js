
function cleanText(text) {
    return text.replace(/```json\n?|\n?```/g, '').trim();
}

const mockResponse = "```json\n{\n  \"message\": \"Awesome concept! I'll help you...\",\n  \"extractedInputs\": {\n    \"topic\": \"AI tools\"\n  }\n}\n```";

console.log("Original:", mockResponse);
const cleaned = cleanText(mockResponse);
console.log("Cleaned:", cleaned);

try {
    const parsed = JSON.parse(cleaned);
    console.log("Parsed Message:", parsed.message);
    if (parsed.message === "Awesome concept! I'll help you...") {
        console.log("SUCCESS: Markdown stripping working correctly.");
    } else {
        console.log("FAILURE: Message mismatch.");
    }
} catch (e) {
    console.error("FAILURE: Parse error", e);
}
