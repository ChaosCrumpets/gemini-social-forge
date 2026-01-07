import dotenv from "dotenv";
dotenv.config();

console.log("Environment variables loaded:");
console.log("- FIREBASE_PROJECT_ID:", !!process.env.FIREBASE_PROJECT_ID);
console.log("- FIREBASE_CLIENT_EMAIL:", !!process.env.FIREBASE_CLIENT_EMAIL);
console.log("- FIREBASE_PRIVATE_KEY:", !!process.env.FIREBASE_PRIVATE_KEY);

try {
    console.log("\nImporting server/index.ts...");
    await import("./index.js");
} catch (error) {
    console.error("\n❌ Error starting server:");
    console.error(error);
    process.exit(1);
}
