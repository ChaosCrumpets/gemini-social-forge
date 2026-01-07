import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";
import bcrypt from "bcryptjs";

console.log("🔧 Updating Admin Password...\n");

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
        console.error("❌ Error: Missing Firebase Admin environment variables.");
        process.exit(1);
    }

    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
    });
}

const auth = admin.auth();
const firestore = admin.firestore();

async function updateAdminPassword() {
    try {
        const adminEmail = "admin@test.com";
        const newPassword = "Tobiisthe1996!";

        console.log(`Step 1: finding user ${adminEmail}...`);
        let userRecord;
        try {
            userRecord = await auth.getUserByEmail(adminEmail);
            console.log("✓ User found in Firebase Auth:", userRecord.uid);
        } catch (error: any) {
            console.error("❌ User not found in Firebase Auth:", error.message);
            process.exit(1);
        }

        console.log("\nStep 2: Updating password in Firebase Auth...");
        await auth.updateUser(userRecord.uid, {
            password: newPassword,
        });
        console.log("✓ Password updated in Firebase Auth");

        console.log("\nStep 3: Updating hashed password in Firestore...");
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update hash in Firestore
        await firestore.collection("users").doc(userRecord.uid).update({
            password: hashedPassword,
            updatedAt: admin.firestore.Timestamp.now()
        });
        console.log("✓ Password hash updated in Firestore");

        console.log("\n═══════════════════════════════════════════════");
        console.log("✅ SUCCESS! Admin password updated.");
        console.log("═══════════════════════════════════════════════\n");
        console.log("📧 Credentials:");
        console.log("   Email:    ", adminEmail);
        console.log("   Password: ", newPassword);

        process.exit(0);

    } catch (error: any) {
        console.error("\n❌ Error updating password:", error.message || error);
        process.exit(1);
    }
}

updateAdminPassword();
