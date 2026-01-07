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

export async function createSession(userId?: string): Promise<Session & { firestoreId: string }> {
    const now = Timestamp.now();
    const sessionRef = firestore.collection("sessions").doc();

    // Use a simple hash for the numeric ID based on the Firestore doc ID
    const numericId = hashStringToNumber(sessionRef.id);

    const sessionDoc: Partial<FirestoreSession> = {
        id: sessionRef.id,
        numericId, // STORE IT IN THE DOCUMENT
        title: "New Script",
        status: "inputting",
        inputs: {},
        createdAt: now,
        updatedAt: now,
    };

    // Only add userId if provided (prevents permission issues)
    if (userId) {
        sessionDoc.userId = userId;
    }

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
    const doc = await firestore.collection("sessionIdMap").doc(numericId.toString()).get();
    if (!doc.exists) return null;
    return (doc.data() as { firestoreId: string }).firestoreId;
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
    let query = firestore.collection("sessions").orderBy("createdAt", "desc");

    if (userId) {
        query = query.where("userId", "==", userId) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => doc.data() as FirestoreSession);
}

export async function updateSession(
    id: string,
    updates: Partial<Omit<FirestoreSession, "id" | "createdAt">>
): Promise<FirestoreSession | null> {
    const sessionRef = firestore.collection("sessions").doc(id);
    await sessionRef.update({
        ...updates,
        updatedAt: Timestamp.now(),
    });
    return getSession(id);
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
