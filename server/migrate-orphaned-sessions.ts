import { firestore } from './db';

async function migrateOrphanedSessions() {
    console.log('🔍 Finding orphaned sessions (no userId)...');

    try {
        // Query for sessions without userId or with null userId
        const snapshot = await firestore
            .collection('sessions')
            .where('userId', '==', null)
            .get();

        console.log(`Found ${snapshot.size} orphaned sessions with null userId`);

        // Also check for sessions where userId field doesn't exist
        const allSessionsSnapshot = await firestore.collection('sessions').get();
        const sessionsWithoutUserId = allSessionsSnapshot.docs.filter(doc => {
            const data = doc.data();
            return !data.userId;
        });

        console.log(`Found ${sessionsWithoutUserId.length} total sessions without userId field`);

        if (sessionsWithoutUserId.length === 0) {
            console.log('✅ No orphaned sessions found');
            return;
        }

        // Log details of orphaned sessions
        console.log('\n📋 Orphaned sessions:');
        sessionsWithoutUserId.slice(0, 10).forEach(doc => {
            const data = doc.data();
            console.log(`  - ID: ${doc.id}, Title: ${data.title || 'Untitled'}, Created: ${data.createdAt?.toDate?.() || 'Unknown'}`);
        });

        if (sessionsWithoutUserId.length > 10) {
            console.log(`  ... and ${sessionsWithoutUserId.length - 10} more`);
        }

        // Confirm deletion
        console.log('\n⚠️  WARNING: This will DELETE all orphaned sessions.');
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to proceed...');

        await new Promise(resolve => setTimeout(resolve, 5000));

        // Delete orphaned sessions in batches
        console.log('\n🗑️  Deleting orphaned sessions...');

        const batchSize = 500;
        for (let i = 0; i < sessionsWithoutUserId.length; i += batchSize) {
            const batch = firestore.batch();
            const currentBatch = sessionsWithoutUserId.slice(i, i + batchSize);

            currentBatch.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            console.log(`  Deleted batch ${Math.floor(i / batchSize) + 1} (${currentBatch.length} sessions)`);
        }

        console.log(`\n✅ Successfully deleted ${sessionsWithoutUserId.length} orphaned sessions`);

    } catch (error) {
        console.error('❌ Error during migration:', error);
        throw error;
    }
}

// Run the migration
migrateOrphanedSessions()
    .then(() => {
        console.log('\n✅ Migration complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    });
