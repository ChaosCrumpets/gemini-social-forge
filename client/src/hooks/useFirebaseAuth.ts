import { useState, useEffect } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface UseFirebaseAuthReturn {
    firebaseUser: FirebaseUser | null;
    loading: boolean;
    initialized: boolean;
}

/**
 * Hook that waits for Firebase auth to initialize from localStorage
 * before returning the auth state. This prevents race conditions where
 * the app redirects to /auth before Firebase has loaded the persisted session.
 */
export function useFirebaseAuth(): UseFirebaseAuthReturn {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        // onAuthStateChanged returns immediately with the current state,
        // OR waits for Firebase to restore the session from localStorage
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setFirebaseUser(user);
            setLoading(false);
            setInitialized(true);
        }, (error) => {
            console.error('Firebase auth state error:', error);
            setLoading(false);
            setInitialized(true);
        });

        return () => unsubscribe();
    }, []);

    return { firebaseUser, loading, initialized };
}
