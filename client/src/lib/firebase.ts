import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Set auth persistence to LOCAL (survives browser restarts)
setPersistence(auth, browserLocalPersistence).catch((error) => {
    console.error('Failed to set auth persistence:', error);
});

// Connect to emulators in development if configured
if (import.meta.env.VITE_USE_EMULATORS === 'true') {
    const authEmulatorHost = import.meta.env.VITE_AUTH_EMULATOR_HOST || 'localhost:9099';
    const firestoreEmulatorHost = import.meta.env.VITE_FIRESTORE_EMULATOR_HOST || 'localhost:8080';

    const [authHost, authPort] = authEmulatorHost.split(':');
    const [firestoreHost, firestorePort] = firestoreEmulatorHost.split(':');

    connectAuthEmulator(auth, `http://${authHost}:${authPort}`, { disableWarnings: true });
    connectFirestoreEmulator(db, firestoreHost, parseInt(firestorePort));

    console.log('🔧 Firebase Emulators Connected');
}
