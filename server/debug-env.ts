import dotenv from "dotenv";

// Load environment variables
const result = dotenv.config();

if (result.error) {
    console.error("Error loading .env file:", result.error);
} else {
    console.log("✓ .env file loaded successfully");
}

console.log("\n=== Environment Variables Debug ===");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY length:", process.env.FIREBASE_PRIVATE_KEY?.length || 0);
console.log("GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("===================================\n");
