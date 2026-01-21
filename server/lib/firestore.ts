import { firestore, auth as firebaseAuth } from "../db";
import type {
    UserInputs,
    VisualContext,
    TextHook,
    VerbalHook,
    VisualHook,
    SelectedHooks,
    Hook,
    ContentOutput,
    Session,
    SessionMessage,
} from "@shared/schema";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

// Type for user documents in Firestore
export interface FirestoreUser {
    id: string;
    email: string;
    password?: string; // Hashed password for legacy compatibility
    firstName?: string;
    lastName?: string;
    profileImageUrl?: string;
    role: string;
    subscriptionTier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
    isPremium: boolean;
    scriptsGenerated: number;
    usageCount: number;
    lastUsageReset: Timestamp;
    subscriptionEndDate?: Timestamp;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Type for session documents in Firestore
export interface FirestoreSession {
    id: string;
    numericId: number; // Hash-based numeric ID for backward compatibility
    userId?: string;
    title: string;
    status: string;
    inputs: UserInputs;
    visualContext?: VisualContext;
    textHooks?: TextHook[];
    verbalHooks?: VerbalHook[];
    visualHooks?: VisualHook[];
    selectedHooks?: SelectedHooks;
    selectedHook?: Hook;
    output?: ContentOutput;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Type for message documents in Firestore subcollection
export interface FirestoreMessage {
    id: string;
    role: string;
    content: string;
    isEditMessage: boolean;
    timestamp: Timestamp;
}

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: Timestamp | undefined): Date | undefined => {
    return timestamp?.toDate();
};

// Helper to convert Date to Firestore Timestamp
const dateToTimestamp = (date: Date | undefined): Timestamp | undefined => {
    return date ? Timestamp.fromDate(date) : undefined;
};

// ============================================
// User Operations
// ============================================

export async function createUser(data: {
    id: string;
    email: string;
    password?: string; // Hashed password
    firstName?: string;
    lastName?: string;
}): Promise<FirestoreUser> {
    const now = Timestamp.now();
    const userDoc: FirestoreUser = {
        id: data.id,
        email: data.email,
        password: data.password, // Store hashed password
        firstName: data.firstName,
        lastName: data.lastName,
        role: "user",
        subscriptionTier: "bronze",
        isPremium: false,
        scriptsGenerated: 0,
        usageCount: 0,
        lastUsageReset: now,
        createdAt: now,
        updatedAt: now,
    };

    await firestore.collection("users").doc(data.id).set(userDoc);
    return userDoc;
}

export async function getUser(userId: string): Promise<FirestoreUser | null> {
    const doc = await firestore.collection("users").doc(userId).get();
    if (!doc.exists) return null;
    return doc.data() as FirestoreUser;
}

export async function getUserByEmail(email: string): Promise<FirestoreUser | null> {
    const snapshot = await firestore.collection("users").where("email", "==", email).limit(1).get();
    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as FirestoreUser;
}

export async function updateUser(
    userId: string,
    updates: Partial<Omit<FirestoreUser, "id" | "createdAt">>
): Promise<FirestoreUser | null> {
    const userRef = firestore.collection("users").doc(userId);
    await userRef.update({
        ...updates,
        updatedAt: Timestamp.now(),
    });
    return getUser(userId);
}

export async function getAllUsers(): Promise<FirestoreUser[]> {
    const snapshot = await firestore.collection("users").get();
    return snapshot.docs.map((doc) => doc.data() as FirestoreUser);
}

export async function getUserByStripeCustomerId(customerId: string): Promise<FirestoreUser | null> {
    const snapshot = await firestore
        .collection("users")
        .where("stripeCustomerId", "==", customerId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    return snapshot.docs[0].data() as FirestoreUser;
}

// ============================================
// Session Operations
// ============================================

export async function createSession(userId: string): Promise<Session & { firestoreId: string }> {
    // Enforce userId requirement for production-ready architecture
    if (!userId) {
        throw new Error('userId is required to create a session');
    }

    const now = Timestamp.now();
    const sessionRef = firestore.collection("sessions").doc();

    // Use a simple hash for the numeric ID based on the Firestore doc ID
    const numericId = hashStringToNumber(sessionRef.id);

    const sessionDoc: Partial<FirestoreSession> = {
        id: sessionRef.id,
        numericId, // STORE IT IN THE DOCUMENT
        userId, // ALWAYS required - no optional logic
        title: "New Script",
        status: "inputting",
        inputs: {},
        createdAt: now,
        updatedAt: now,
    };

    await sessionRef.set(sessionDoc);

    // Store the mapping in a separate collection for reverse lookup (kept for backward compat)
    await firestore.collection("sessionIdMap").doc(numericId.toString()).set({
        firestoreId: sessionRef.id,
        createdAt: now
    });

    // Convert to Session type for return
    return {
        id: numericId,
        firestoreId: sessionRef.id, // Include firestoreId for direct operations
        userId: sessionDoc.userId || null,
        title: sessionDoc.title!,
        status: sessionDoc.status!,
        inputs: sessionDoc.inputs!,
        visualContext: sessionDoc.visualContext || null,
        textHooks: sessionDoc.textHooks || null,
        verbalHooks: sessionDoc.verbalHooks || null,
        visualHooks: sessionDoc.visualHooks || null,
        selectedHooks: sessionDoc.selectedHooks || null,
        selectedHook: sessionDoc.selectedHook || null,
        output: sessionDoc.output || null,
        createdAt: sessionDoc.createdAt!.toDate(),
        updatedAt: sessionDoc.updatedAt!.toDate(),
    };
}

// Helper to convert numeric ID back to Firestore ID
export async function getFirestoreIdFromNumeric(numericId: number): Promise<string | null> {
    // First, try the mapping collection (fast lookup)
    const doc = await firestore.collection("sessionIdMap").doc(numericId.toString()).get();
    if (doc.exists) {
        return (doc.data() as { firestoreId: string }).firestoreId;
    }

    // Fallback: Query sessions collection by numericId (handles race condition)
    console.log(`[Firestore] ID mapping not found for ${numericId}, querying sessions collection...`);
    const sessionsQuery = await firestore.collection("sessions")
        .where("numericId", "==", numericId)
        .limit(1)
        .get();

    if (!sessionsQuery.empty) {
        const sessionDoc = sessionsQuery.docs[0];
        console.log(`[Firestore] Found session ${sessionDoc.id} for numericId ${numericId}`);
        return sessionDoc.id;
    }

    console.error(`[Firestore] No session found for numericId ${numericId}`);
    return null;
}

// Simple hash function to create stable numeric IDs
function hashStringToNumber(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
}

export async function getSession(id: string): Promise<FirestoreSession | null> {
    const doc = await firestore.collection("sessions").doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as FirestoreSession;
}

export async function listSessions(userId?: string): Promise<FirestoreSession[]> {
    console.log('[Firestore] listSessions called with userId:', userId);

    let query = firestore.collection("sessions");

    if (userId) {
        console.log('[Firestore] Filtering by userId:', userId);
        query = query.where("userId", "==", userId) as any;
    } else {
        console.log('[Firestore] No userId filter - fetching ALL sessions');
    }

    // REMOVED: Firestore orderBy (requires index that may not be ready)
    // Instead, sort in memory after fetching

    const snapshot = await query.get();
    console.log('[Firestore] Query returned', snapshot.size, 'documents');

    const sessions = snapshot.docs.map((doc) => {
        const data = doc.data() as FirestoreSession;
        console.log('[Firestore] Session doc:', doc.id, 'hasUserId:', !!data.userId, 'hasNumericId:', !!data.numericId);
        return data;
    });

    // Sort by updatedAt in MEMORY (works without index)
    sessions.sort((a, b) => {
        // Use updatedAt if available (activity based), fallback to createdAt (creation based)
        const aTime = (a.updatedAt || a.createdAt)?.toMillis?.() || 0;
        const bTime = (b.updatedAt || b.createdAt)?.toMillis?.() || 0;

        // DEBUG: Log the comparison for the first few items
        // if (Math.random() < 0.01) console.log(`[Sort] ${a.title} (${aTime}) vs ${b.title} (${bTime})`);

        return bTime - aTime; // Descending (newest activity first)
    });

    // DEBUG: Show first 5 sessions with their timestamps
    console.log('[Firestore] Sorted Session List (Top 5):');
    sessions.slice(0, 5).forEach((s, i) => {
        const uDate = s.updatedAt?.toDate?.();
        const cDate = s.createdAt?.toDate?.();
        const effective = uDate || cDate;
        console.log(`  ${i + 1}. [${s.title}] Effective: ${effective?.toISOString()} (Updated: ${!!uDate}, Created: ${cDate?.toISOString()})`);
    });

    return sessions;
}

export async function updateSession(
    id: string,
    updates: Partial<Omit<FirestoreSession, "id" | "createdAt">>
): Promise<FirestoreSession | null> {
    try {
        const sessionRef = firestore.collection("sessions").doc(id);

        // query for existence first or use set with merge to be robust
        // We use set with merge to ensure the save ALWAYS succeeds even if update() thinks doc is missing
        await sessionRef.set({
            ...updates,
            updatedAt: Timestamp.now(),
        }, { merge: true });
        return getSession(id);
    } catch (error: any) {
        console.error(`[Firestore] Update failed for ${id}:`, error);
        // If doc not found, return null
        if (error.code === 5 || error.message.includes('NOT_FOUND')) {
            return null;
        }
        throw error;
    }
}

export async function deleteSession(id: string): Promise<boolean> {
    try {
        // Delete all messages first
        const messagesSnapshot = await firestore
            .collection("sessions")
            .doc(id)
            .collection("messages")
            .get();

        const batch = firestore.batch();
        messagesSnapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
        });
        await batch.commit();

        // Delete the session
        await firestore.collection("sessions").doc(id).delete();
        return true;
    } catch (error) {
        console.error("Error deleting session:", error);
        return false;
    }
}

export async function deleteSessionIdMapping(numericId: number): Promise<void> {
    try {
        await firestore.collection("sessionIdMap").doc(numericId.toString()).delete();
    } catch (error) {
        console.error("Error deleting session ID mapping:", error);
    }
}

// ============================================
// Message Operations
// ============================================

export async function addMessage(
    sessionId: string,
    role: string,
    content: string,
    isEditMessage: boolean = false
): Promise<FirestoreMessage> {
    const messageRef = firestore
        .collection("sessions")
        .doc(sessionId)
        .collection("messages")
        .doc();

    const messageDoc: FirestoreMessage = {
        id: messageRef.id,
        role,
        content,
        isEditMessage,
        timestamp: Timestamp.now(),
    };

    await messageRef.set(messageDoc);

    // Update parent session timestamp for "Recents" sorting
    try {
        await firestore.collection("sessions").doc(sessionId).update({
            updatedAt: Timestamp.now()
        });
    } catch (e) {
        console.warn(`[Firestore] Failed to update parent session timestamp for ${sessionId}`, e);
        // Continue - message save is more important
    }

    return messageDoc;
}

export async function getMessages(
    sessionId: string,
    includeEditMessages: boolean = false
): Promise<FirestoreMessage[]> {
    let query = firestore
        .collection("sessions")
        .doc(sessionId)
        .collection("messages")
        .orderBy("timestamp", "asc");

    if (!includeEditMessages) {
        query = query.where("isEditMessage", "==", false) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as FirestoreMessage);
}

export async function clearMessages(sessionId: string): Promise<void> {
    const messagesRef = firestore
        .collection("sessions")
        .doc(sessionId)
        .collection("messages");

    const snapshot = await messagesRef.get();
    const batch = firestore.batch();

    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });

    if (snapshot.docs.length > 0) {
        await batch.commit();
        console.log(`[Firestore] Cleared ${snapshot.docs.length} messages from session ${sessionId}`);
    }
}

// ============================================
// Version Management
// ============================================

export async function addVersion(
    sessionId: string,
    versionData: {
        versionNumber: number;
        contentOutput: any;
        changeDescription: string;
        changeType: 'auto' | 'manual' | 'ai_refinement';
        createdBy: string;
    }
) {
    const versionRef = firestore.collection("sessions").doc(sessionId).collection("versions").doc();
    const versionDoc = {
        ...versionData,
        createdAt: Timestamp.now(),
    };
    await versionRef.set(versionDoc);
    return { id: versionRef.id, ...versionDoc };
}

export async function getVersions(sessionId: string) {
    const snapshot = await firestore
        .collection("sessions")
        .doc(sessionId)
        .collection("versions")
        .orderBy("createdAt", "desc")
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: (doc.data().createdAt as Timestamp).toDate(),
        // Map other fields if necessary
    }));
}

// ============================================
// Utility Functions
// ============================================

export function generateSessionTitle(hookContent: string): string {
    const words = hookContent.trim().split(/\s+/).slice(0, 6);
    return words.join(" ") + (hookContent.split(/\s+/).length > 6 ? "..." : "");
}
