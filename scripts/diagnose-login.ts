import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
    });
}

const db = admin.firestore();
const auth = admin.auth();

async function diagnoseLogin() {
    console.log('🔍 COMPREHENSIVE LOGIN DIAGNOSIS\n');
    console.log('='.repeat(80));

    const email = 'admin@test.com';
    const password = 'admin123';

    try {
        // CHECK 1: Firebase Auth User Exists
        console.log('\n[CHECK 1] Firebase Auth - User Existence');
        try {
            const userRecord = await auth.getUserByEmail(email);
            console.log('✅ User exists in Firebase Auth');
            console.log(`   UID: ${userRecord.uid}`);
            console.log(`   Email: ${userRecord.email}`);
            console.log(`   Email Verified: ${userRecord.emailVerified}`);
            console.log(`   Disabled: ${userRecord.disabled}`);
            console.log(`   Created: ${userRecord.metadata.creationTime}`);
        } catch (error: any) {
            console.log('❌ User NOT found in Firebase Auth');
            console.log(`   Error: ${error.message}`);
            console.log('\n🔧 FIX: User needs to be created in Firebase Auth');
            return;
        }

        // CHECK 2: Firestore User Document
        console.log('\n[CHECK 2] Firestore - User Document');
        const userRecord = await auth.getUserByEmail(email);
        const userDoc = await db.collection('users').doc(userRecord.uid).get();

        if (userDoc.exists) {
            console.log('✅ User document exists in Firestore');
            const data = userDoc.data();
            console.log(`   Email: ${data?.email}`);
            console.log(`   Role: ${data?.role}`);
            console.log(`   Tier: ${data?.subscriptionTier}`);
        } else {
            console.log('⚠️  User document NOT found in Firestore');
            console.log('   This may cause issues but login should still work');
        }

        // CHECK 3: List All Auth Users
        console.log('\n[CHECK 3] All Firebase Auth Users');
        const listUsersResult = await auth.listUsers();
        console.log(`Total users in Firebase Auth: ${listUsersResult.users.length}`);
        listUsersResult.users.forEach(user => {
            console.log(`   - ${user.email} (${user.uid})`);
        });

        // CHECK 4: List All Firestore Users
        console.log('\n[CHECK 4] All Firestore User Documents');
        const usersSnapshot = await db.collection('users').get();
        console.log(`Total users in Firestore: ${usersSnapshot.size}`);
        usersSnapshot.forEach(doc => {
            const data = doc.data();
            console.log(`   - ${data.email} (${doc.id})`);
        });

        // CHECK 5: Test Login Endpoint
        console.log('\n[CHECK 5] Testing Login Endpoint');
        const fetch = (await import('node-fetch')).default;

        try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && (data as any).token) {
                console.log('✅ Login endpoint working');
                console.log(`   Status: ${response.status}`);
                console.log(`   Token received: ${(data as any).token.substring(0, 20)}...`);
            } else {
                console.log('❌ Login endpoint failed');
                console.log(`   Status: ${response.status}`);
                console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
            }
        } catch (error: any) {
            console.log('❌ Cannot reach login endpoint');
            console.log(`   Error: ${error.message}`);
            console.log('   Is the server running on port 5000?');
        }

        // CHECK 6: Password Reset (to verify account is accessible)
        console.log('\n[CHECK 6] Account Accessibility');
        try {
            // Try to update the user (this will fail if account is inaccessible)
            await auth.updateUser(userRecord.uid, {
                displayName: 'Admin User'
            });
            console.log('✅ Account is accessible and can be modified');
        } catch (error: any) {
            console.log('❌ Account cannot be modified');
            console.log(`   Error: ${error.message}`);
        }

        // CHECK 7: Recreate User with Known Password
        console.log('\n[CHECK 7] Password Verification');
        console.log('⚠️  Cannot verify password directly via Admin SDK');
        console.log('   Password verification only works through Firebase Auth API');
        console.log('   If login endpoint fails, password might be incorrect');

        // SUMMARY
        console.log('\n' + '='.repeat(80));
        console.log('📋 DIAGNOSIS SUMMARY');
        console.log('='.repeat(80));
        console.log('\nIf login is still failing, the most likely causes are:');
        console.log('1. Password is incorrect (Admin SDK cannot verify passwords)');
        console.log('2. Server login endpoint has an error');
        console.log('3. Client is sending request to wrong endpoint');
        console.log('4. CORS or network issue between client and server');
        console.log('\n💡 RECOMMENDED FIX:');
        console.log('Delete and recreate the admin user with a fresh password');

    } catch (error: any) {
        console.error('\n💥 DIAGNOSIS FAILED:', error.message);
        console.error(error);
    }
}

diagnoseLogin();
