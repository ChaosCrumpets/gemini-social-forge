import { firestore } from './db';

async function cleanupDefaultSessions() {
    console.log('🧹 Starting aggressive cleanup of ALL default titled sessions...');

    try {
        // Get ALL sessions
        const snapshot = await firestore
            .collection('sessions')
            .get();

        console.log(`📊 Total sessions in database: ${snapshot.size}`);

        // Filter for default titles IN MEMORY
        const defaultTitles = ['New Script', 'New Project', 'Untitled Session', 'Untitled'];
        const sessionsToDelete = [];

        for (const doc of snapshot.docs) {
            const data = doc.data();
            if (defaultTitles.includes(data.title)) {
                sessionsToDelete.push(doc);
                console.log(`  ❌ Will delete: ${doc.id} - "${data.title}"`);
            }
        }

        console.log(`\n🗑️  Found ${sessionsToDelete.length} sessions with default titles`);

        if (sessionsToDelete.length === 0) {
            console.log('✅ No default-titled sessions to clean up');
            return;
        }

        // Delete in batches of 500 (Firestore limit)
        const batchSize = 500;
        let deleted = 0;

        for (let i = 0; i < sessionsToDelete.length; i += batchSize) {
            const batch = firestore.batch();
            const batchDocs = sessionsToDelete.slice(i, i + batchSize);

            for (const doc of batchDocs) {
                const data = doc.data();
                console.log(`  🗑️  Deleting: ${doc.id} - "${data.title}"`);
                batch.delete(doc.ref);

                // Also delete messages subcollection
                const messagesSnapshot = await doc.ref.collection('messages').get();
                messagesSnapshot.docs.forEach((msgDoc: any) => {
                    batch.delete(msgDoc.ref);
                });

                // Delete ID mapping if exists
                if (data.numericId) {
                    const mappingRef = firestore.collection('sessionIdMap').doc(data.numericId.toString());
                    batch.delete(mappingRef);
                }
            }

            await batch.commit();
            deleted += batchDocs.length;
            console.log(`  ✅ Batch ${Math.floor(i / batchSize) + 1} committed: ${deleted}/${sessionsToDelete.length} deleted`);
        }

        console.log(`\n🎉 Cleanup complete! Deleted ${deleted} sessions with default titles`);
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        throw error;
    }
}

// Run the cleanup
cleanupDefaultSessions()
    .then(() => {
        console.log('\n✅ Script finished successfully');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n❌ Script failed:', error);
        process.exit(1);
    });
