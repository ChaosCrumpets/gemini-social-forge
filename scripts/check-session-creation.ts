
import { db } from "../server/db";
import * as firestoreUtils from "../server/lib/firestore";

async function testSessionCreation() {
    try {
        console.log("Starting Session Creation Test...");

        // 1. Create a session
        console.log("Creating session...");
        const session = await firestoreUtils.createSession("test-user-id");
        console.log("Session created:", session);
        console.log("Numeric ID:", session.id);

        // 2. Verify mapping
        console.log(`Verifying mapping for ID ${session.id}...`);
        const firestoreId = await firestoreUtils.getFirestoreIdFromNumeric(session.id);
        console.log("Resolved Firestore ID:", firestoreId);

        if (!firestoreId) {
            console.error("❌ MAPPING FAILED: getFirestoreIdFromNumeric returned null");
            process.exit(1);
        }

        // 3. Verify session retrieval
        console.log("Retrieving session by numeric ID...");
        const retrievedSession = await firestoreUtils.getSession(firestoreId);

        if (!retrievedSession) {
            console.error("❌ RETRIEVAL FAILED: getSession returned null for ID " + firestoreId);
            process.exit(1);
        }

        console.log("✅ Session retrieved successfully!");
        console.log("Retrieved Title:", retrievedSession.title);

        // 4. Test Add Message
        console.log("Testing Add Message...");
        const msg = await firestoreUtils.addMessage(firestoreId, "user", "Test message content", false);
        console.log("✅ Message added:", msg);

        console.log("🎉 ALL CHECKS PASSED");
        process.exit(0);

    } catch (error) {
        console.error("❌ TEST FAILED with error:", error);
        process.exit(1);
    }
}

testSessionCreation();
