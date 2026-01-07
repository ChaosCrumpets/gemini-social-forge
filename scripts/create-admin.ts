import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import bcrypt from "bcryptjs";
import { Timestamp } from "firebase-admin/firestore";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const auth = admin.auth();
const firestore = admin.firestore();

async function createAdminUser() {
    console.log("🔧 Creating admin user...\n");

    const adminEmail = "admin@test.com";
    const adminPassword = "admin123";

    try {
        // Check if user already exists in Firebase Auth
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(adminEmail);
            console.log("✓ User already exists in Firebase Auth");
        } catch (error: any) {
            if (error.code === 'auth/user-not-found') {
                // Create user in Firebase Auth
                userRecord = await auth.createUser({
                    email: adminEmail,
                    password: adminPassword,
                    displayName: "Admin User",
                });
                console.log("✓ Created user in Firebase Auth");
            } else {
                throw error;
            }
        }

        // Hash password for Firestore
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        // Check if user exists in Firestore
        const userDoc = await firestore.collection("users").doc(userRecord.uid).get();

        if (userDoc.exists) {
            // Update existing user to admin
            await firestore.collection("users").doc(userRecord.uid).update({
                role: "admin",
                subscriptionTier: "diamond",
                isPremium: true,
                subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)), // 100 years
                updatedAt: Timestamp.now(),
            });
            console.log("✓ Updated existing user to admin with diamond tier");
        } else {
            // Create new user document in Firestore
            await firestore.collection("users").doc(userRecord.uid).set({
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
                subscriptionEndDate: Timestamp.fromDate(new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000)), // 100 years
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            });
            console.log("✓ Created user in Firestore with admin role and diamond tier");
        }

        console.log("\n✅ Admin user created successfully!");
        console.log("\n📧 Login credentials:");
        console.log("   Email:    ", adminEmail);
        console.log("   Password: ", adminPassword);
        console.log("\n🔐 Permissions:");
        console.log("   - Role: Admin (full access)");
        console.log("   - Tier: Diamond (lifetime premium)");
        console.log("   - No usage restrictions");

        process.exit(0);
    } catch (error) {
        console.error("\n❌ Error creating admin user:");
        console.error(error);
        process.exit(1);
    }
}

createAdminUser();
