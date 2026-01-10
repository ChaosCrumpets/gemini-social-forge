import admin from 'firebase-admin';
import bcrypt from 'bcrypt';
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

async function createProperAdminUser() {
    console.log('🔧 CREATING PROPER ADMIN USER\n');
    console.log('='.repeat(80));

    const email = 'admin@test.com';
    const password = 'admin123';

    try {
        // Step 1: Delete existing admin user if exists
        console.log('\n[STEP 1] Cleaning up existing admin user...');
        try {
            const existingUser = await auth.getUserByEmail(email);
            await auth.deleteUser(existingUser.uid);
            await db.collection('users').doc(existingUser.uid).delete();
            console.log('✅ Deleted existing admin user');
        } catch (error) {
            console.log('   No existing user to delete');
        }

        // Step 2: Create user in Firebase Auth
        console.log('\n[STEP 2] Creating user in Firebase Auth...');
        const userRecord = await auth.createUser({
            email: email,
            password: password,
            displayName: 'Admin User',
            emailVerified: true,
        });
        console.log(`✅ Created Firebase Auth user: ${userRecord.uid}`);

        // Step 3: Hash password for Firestore
        console.log('\n[STEP 3] Hashing password for Firestore...');
        const hashedPassword = await bcrypt.hash(password, 10);
        console.log('✅ Password hashed');

        // Step 4: Create user document in Firestore WITH password hash
        console.log('\n[STEP 4] Creating Firestore user document...');
        await db.collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            email: email,
            password: hashedPassword, // ✅ THIS IS CRITICAL
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            subscriptionTier: 'diamond',
            isPremium: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        console.log('✅ Created Firestore user document with password hash');

        // Step 5: Verify the user can login
        console.log('\n[STEP 5] Testing login...');
        const fetch = (await import('node-fetch')).default;

        const response = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok && data.customToken) {
            console.log('✅ Login test SUCCESSFUL');
            console.log(`   Custom token received: ${data.customToken.substring(0, 30)}...`);
        } else {
            console.log('❌ Login test FAILED');
            console.log(`   Status: ${response.status}`);
            console.log(`   Response: ${JSON.stringify(data, null, 2)}`);
        }

        // Summary
        console.log('\n' + '='.repeat(80));
        console.log('✅ ADMIN USER CREATED SUCCESSFULLY');
        console.log('='.repeat(80));
        console.log('\n📝 LOGIN CREDENTIALS:');
        console.log(`   Email:    ${email}`);
        console.log(`   Password: ${password}`);
        console.log(`   UID:      ${userRecord.uid}`);
        console.log(`   Role:     admin`);
        console.log(`   Tier:     diamond`);
        console.log('\n💡 You can now login at http://localhost:5000');
        console.log('='.repeat(80));

    } catch (error: any) {
        console.error('\n💥 ERROR:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createProperAdminUser();
