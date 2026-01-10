import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

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

async function listUsers() {
    try {
        console.log('Fetching all users from Firestore...\n');

        const usersSnapshot = await db.collection('users').get();

        if (usersSnapshot.empty) {
            console.log('No users found in database.');
            return;
        }

        console.log(`Found ${usersSnapshot.size} user(s):\n`);
        console.log('='.repeat(80));

        usersSnapshot.forEach((doc) => {
            const user = doc.data();
            console.log(`\nEmail: ${user.email}`);
            console.log(`Name: ${user.firstName || 'N/A'} ${user.lastName || ''}`);
            console.log(`Role: ${user.role || 'user'}`);
            console.log(`Tier: ${user.subscriptionTier || 'bronze'}`);
            console.log(`Premium: ${user.isPremium ? 'Yes' : 'No'}`);
            console.log(`User ID: ${doc.id}`);
            console.log('-'.repeat(80));
        });

        console.log('\n📝 Note: Passwords are hashed and cannot be retrieved.');
        console.log('Known test credentials:');
        console.log('  - admin@test.com / admin123');
        console.log('  - Any user created via /api/dev/create-admin');

    } catch (error) {
        console.error('Error fetching users:', error);
    }
}

listUsers();
