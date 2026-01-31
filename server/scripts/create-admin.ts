
import { firestore } from "../db";
import * as firestoreUtils from "../lib/firestore";

async function createAdmin(email: string) {
    try {
        console.log(`Looking up user with email: ${email}`);

        // Find user by email using our utils
        const user = await firestoreUtils.getUserByEmail(email);

        if (!user) {
            console.error('❌ User not found:', email);
            console.log('Please register the user in the app first.');
            process.exit(1);
        }

        console.log(`Found user: ${user.id} (${user.firstName || ''} ${user.lastName || ''})`);
        console.log(`Current Role: ${user.role}`);

        if (user.role === 'admin') {
            console.log('✅ User is already an admin.');
            process.exit(0);
        }

        // Update to admin
        await firestoreUtils.updateUser(user.id, {
            role: 'admin'
        });

        console.log('✅ User successfully upgraded to ADMIN role.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

// Get email from command line arg
const email = process.argv[2];

if (!email) {
    console.error('Usage: npm run script server/scripts/create-admin.ts <email>');
    process.exit(1);
}

createAdmin(email);
