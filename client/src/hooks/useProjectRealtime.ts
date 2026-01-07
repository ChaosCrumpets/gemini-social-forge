import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Project, Session } from '@shared/schema';

export function useProjectRealtime(projectId: number | null) {
    const [project, setProject] = useState<Session | null>(null);
    const [firestoreId, setFirestoreId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!projectId || isNaN(projectId)) {
            setLoading(false);
            return;
        }

        setLoading(true);

        // Use backend API instead of direct Firestore query to avoid permission issues
        const fetchSession = async () => {
            try {
                const response = await fetch(`/api/sessions/${projectId}`);
                if (!response.ok) {
                    throw new Error(`Failed to fetch session: ${response.statusText}`);
                }

                const data = await response.json();
                const sessionData = data.session;

                // Convert to expected format
                const processedData: Session = {
                    ...sessionData,
                    createdAt: new Date(sessionData.createdAt),
                    updatedAt: new Date(sessionData.updatedAt),
                } as Session;

                setProject(processedData);
                // For messages, we'll still use Firestore real-time
                // We need the Firestore document ID, which we can derive
                setFirestoreId(sessionData.firestoreId || String(projectId));
                setLoading(false);
            } catch (err) {
                console.error('Error fetching project:', err);
                setError(err as Error);
                setLoading(false);
            }
        };

        fetchSession();
    }, [projectId]);

    return { project, firestoreId, loading, error };
}
