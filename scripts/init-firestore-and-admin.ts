import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";

console.log("🔧 Initializing Firestore and creating admin user...\n");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    console.log("📋 Firebase Config:");
    console.log("   Project ID:", serviceAccount.projectId);
    console.log("   Client Email:", serviceAccount.clientEmail);
    console.log("   Private Key:", serviceAccount.privateKey ? "✓ Loaded" : "✗ Missing");
    console.log();

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
    });
}

const auth = admin.auth();
// Get Firestore instance - should auto-detect the 'calantigrav' database as it's the only one
const firestore = admin.firestore();

async function initializeFirestoreAndCreateAdmin() {
    try {
        // Step 1: Try to initialize Firestore by creating a system collection
        console.log("Step 1: Testing Firestore connection...");

        // Create a test document to see if Firestore is accessible
        const testRef = firestore.collection("_system_test").doc("init");
        await testRef.set({
            initialized: true,
            timestamp: Timestamp.now(),
            message: "Firestore initialized successfully"
        });
        console.log("✓ Firestore is accessible and initialized!");

        // Clean up test document
        await testRef.delete();
        console.log("✓ Test document cleaned up\n");

        // Step 2: Create admin user in Firebase Auth
        console.log("Step 2: Creating admin user in Firebase Auth...");
        const adminEmail = "admin@test.com";
        const adminPassword = "admin123";

        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(adminEmail);
            console.log("✓ Admin user already exists in Firebase Auth");
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                userRecord = await auth.createUser({
                    email: adminEmail,
                    password: adminPassword,
                    displayName: "Admin User",
                });
                console.log("✓ Created admin user in Firebase Auth");
            } else {
                throw error;
            }
        }

        // Step 3: Create admin user profile in Firestore
        console.log("\nStep 3: Creating admin user profile in Firestore...");
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const userDoc = {
            id: userRecord.uid,
            email: adminEmail,
            password: hashedPassword,
            firstName: "Admin",
            lastName: "User",
            role: "admin",
            subscriptionTier: "diamond",
            isPremium: true,
            scriptsGenerated: 0,
            usageCount: 0,
            lastUsageReset: Timestamp.now(),
            subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        };

        await firestore.collection("users").doc(userRecord.uid).set(userDoc, { merge: true });
        console.log("✓ Created admin user profile in Firestore\n");

        // Success!
        console.log("═══════════════════════════════════════════════");
        console.log("✅ SUCCESS! Admin user created successfully!");
        console.log("═══════════════════════════════════════════════\n");

        console.log("📧 Login Credentials:");
        console.log("   Email:    ", adminEmail);
        console.log("   Password: ", adminPassword);
        console.log();

        console.log("🔐 Permissions:");
        console.log("   - Role: Admin (full access)");
        console.log("   - Tier: Diamond (lifetime premium)");
        console.log("   - No usage restrictions");
        console.log();

        console.log("🌐 Next Steps:");
        console.log("   1. Go to http://localhost:5000/auth");
        console.log("   2. Sign in with the credentials above");
        console.log("   3. Start creating content!");
        console.log();

        process.exit(0);
    } catch (error: any) {
        console.error("\n❌ Error:", error.message || error);

        if (error.code === 'failed-precondition' || error.code === 5) {
            console.error("\n⚠️  Firestore database needs to be enabled in Firebase Console:");
            console.error("   1. Go to: https://console.firebase.google.com/project/cal-app-d414a/firestore");
            console.error("   2. Click 'Create database'");
            console.error("   3. Choose 'Start in production mode'");
            console.error("   4. Select a location and click 'Enable'");
            console.error("   5. Run this script again");
        } else if (error.code === 'permission-denied') {
            console.error("\n⚠️  Permission denied. Check your Firebase service account permissions.");
        } else {
            console.error("\nFull error details:");
            console.error(error);
        }

        process.exit(1);
    }
}

initializeFirestoreAndCreateAdmin();
