import 'dotenv/config';
import * as firestoreUtils from '../server/lib/firestore';

/**
 * Manually create the admin@test.com user in Firestore
 * This user exists in Firebase Auth but is missing from Firestore
 */

const ADMIN_USER = {
    uid: 'JTBOvUBhZTTcJV4dy7ZjHWFMLL23',
    email: 'admin@test.com',
    displayName: 'Admin User'
};

async function createAdminUser() {
    console.log('🔧 Creating admin user in Firestore...\n');

    try {
        // Check if user already exists
        const existing = await firestoreUtils.getUser(ADMIN_USER.uid);

        if (existing) {
            console.log('✅ User already exists in Firestore:');
            console.log(`   ID: ${existing.id}`);
            console.log(`   Email: ${existing.email}`);
            console.log(`   Tier: ${existing.subscriptionTier}`);
            console.log(`   Scripts Generated: ${existing.scriptsGenerated}`);
            console.log('\nNo action needed.\n');
            return;
        }

        // Create the user
        console.log(`Creating user: ${ADMIN_USER.email} (${ADMIN_USER.uid})`);

        const newUser = await firestoreUtils.createUser({
            id: ADMIN_USER.uid,
            email: ADMIN_USER.email,
            firstName: 'Admin',
            lastName: 'User',
            role: 'admin', // Give admin role
            subscriptionTier: 'platinum', // Give platinum tier (unlimited)
            isPremium: true,
            scriptsGenerated: 0,
            usageCount: 0,
            lastUsageReset: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        console.log('\n✅ User created successfully:');
        console.log(`   ID: ${newUser.id}`);
        console.log(`   Email: ${newUser.email}`);
        console.log(`   Role: ${newUser.role}`);
        console.log(`   Tier: ${newUser.subscriptionTier}`);
        console.log(`   Premium: ${newUser.isPremium}`);
        console.log('\n🎉 Admin user is now ready to use!\n');

    } catch (error: any) {
        console.error('\n❌ Error creating user:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

createAdminUser()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('Script failed:', error);
        process.exit(1);
    });
