import dotenv from "dotenv";
dotenv.config();

import admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  // Check for service account JSON or individual environment variables
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    : {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();

// Configure Firestore settings
firestore.settings({
  ignoreUndefinedProperties: true,
});

export default admin;
