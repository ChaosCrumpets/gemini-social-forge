import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

console.log("=== Firebase Initialization Test ===\n");

console.log("Environment Variables:");
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID);
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("FIREBASE_PRIVATE_KEY (first 50 chars):", process.env.FIREBASE_PRIVATE_KEY?.substring(0, 50));

const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

console.log("\nService Account Object:");
console.log("- projectId:", serviceAccount.projectId);
console.log("- clientEmail:", serviceAccount.clientEmail);
console.log("- privateKey length:", serviceAccount.privateKey?.length);
console.log("- privateKey starts with:", serviceAccount.privateKey?.substring(0, 30));

try {
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        console.log("\n✅ Firebase Admin SDK initialized successfully!");
    }
} catch (error) {
    console.error("\n❌ Firebase initialization error:");
    console.error(error);
}
