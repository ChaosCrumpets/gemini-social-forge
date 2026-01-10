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

async function cleanupDatabase() {
    console.log('🧹 Starting database cleanup...\n');

    try {
        // Step 1: Delete all sessions
        console.log('1. Deleting all sessions...');
        const sessionsSnapshot = await db.collection('sessions').get();
        const sessionBatch = db.batch();
        let sessionCount = 0;

        for (const doc of sessionsSnapshot.docs) {
            // Delete messages subcollection
            const messagesSnapshot = await doc.ref.collection('messages').get();
            messagesSnapshot.forEach(msgDoc => sessionBatch.delete(msgDoc.ref));

            // Delete editMessages subcollection
            const editMessagesSnapshot = await doc.ref.collection('editMessages').get();
            editMessagesSnapshot.forEach(msgDoc => sessionBatch.delete(msgDoc.ref));

            // Delete session document
            sessionBatch.delete(doc.ref);
            sessionCount++;
        }

        await sessionBatch.commit();
        console.log(`   ✅ Deleted ${sessionCount} sessions`);

        // Step 2: Delete session ID mappings
        console.log('2. Deleting session ID mappings...');
        const mappingsSnapshot = await db.collection('sessionIdMap').get();
        const mappingBatch = db.batch();
        mappingsSnapshot.forEach(doc => mappingBatch.delete(doc.ref));
        await mappingBatch.commit();
        console.log(`   ✅ Deleted ${mappingsSnapshot.size} mappings`);

        // Step 3: List all Firebase Auth users
        console.log('3. Listing Firebase Auth users...');
        const listUsersResult = await auth.listUsers();
        console.log(`   Found ${listUsersResult.users.length} auth users`);

        // Step 4: Delete all Firebase Auth users
        console.log('4. Deleting all Firebase Auth users...');
        for (const user of listUsersResult.users) {
            await auth.deleteUser(user.uid);
            console.log(`   Deleted auth user: ${user.email}`);
        }

        // Step 5: Delete all Firestore users
        console.log('5. Deleting all Firestore users...');
        const usersSnapshot = await db.collection('users').get();
        const userBatch = db.batch();
        usersSnapshot.forEach(doc => userBatch.delete(doc.ref));
        await userBatch.commit();
        console.log(`   ✅ Deleted ${usersSnapshot.size} Firestore users`);

        // Step 6: Create fresh admin user
        console.log('\n6. Creating fresh admin user...');
        const adminEmail = 'admin@test.com';
        const adminPassword = 'admin123';

        // Create in Firebase Auth
        const adminUser = await auth.createUser({
            email: adminEmail,
            password: adminPassword,
            displayName: 'Admin User',
        });

        console.log(`   ✅ Created Firebase Auth user: ${adminUser.uid}`);

        // Create in Firestore
        await db.collection('users').doc(adminUser.uid).set({
            id: adminUser.uid,
            email: adminEmail,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin',
            subscriptionTier: 'diamond',
            isPremium: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
        });

        console.log(`   ✅ Created Firestore user document`);

        // Final summary
        console.log('\n' + '='.repeat(80));
        console.log('✅ DATABASE CLEANUP COMPLETE');
        console.log('='.repeat(80));
        console.log('\n📝 ADMIN LOGIN CREDENTIALS:');
        console.log('   Email:    admin@test.com');
        console.log('   Password: admin123');
        console.log('   Role:     admin');
        console.log('   Tier:     diamond (lifetime premium)');
        console.log('\n' + '='.repeat(80));

    } catch (error: any) {
        console.error('\n❌ Error during cleanup:', error.message);
        console.error(error);
        process.exit(1);
    }
}

cleanupDatabase();
