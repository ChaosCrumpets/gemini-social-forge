import { firestore } from '../server/lib/firestore';

async function checkFirestoreSessions() {
    console.log('🔍 Checking Firestore sessions collection...\n');

    try {
        // Get ALL documents from sessions collection
        const snapshot = await firestore.collection('sessions').get();

        console.log(`📊 Total documents in 'sessions' collection: ${snapshot.size}\n`);

        if (snapshot.empty) {
            console.log('❌ No sessions found in Firestore!');
            console.log('   This explains why the sidebar is empty.');
            return;
        }

        console.log('✅ Sessions found! Details:\n');
        snapshot.docs.forEach((doc, index) => {
            const data = doc.data();
            console.log(`Session ${index + 1}:`);
            console.log(`  Document ID: ${doc.id}`);
            console.log(`  numericId: ${data.numericId || 'MISSING'}`);
            console.log(`  userId: ${data.userId || 'MISSING'}`);
            console.log(`  title: ${data.title || 'Untitled'}`);
            console.log(`  status: ${data.status || 'unknown'}`);
            console.log(`  createdAt: ${data.createdAt ? 'EXISTS' : 'MISSING'}`);
            console.log(`  updatedAt: ${data.updatedAt ? 'EXISTS' : 'MISSING'}`);
            console.log('');
        });

    } catch (error) {
        console.error('❌ Error querying Firestore:', error);
    }

    process.exit(0);
}

checkFirestoreSessions();
