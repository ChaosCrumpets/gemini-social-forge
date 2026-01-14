import { useState, useEffect, useRef, useCallback } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { apiRequest } from '@/lib/queryClient';
import type { Project } from '@shared/schema';

export function useAutoSave(firestoreId: string | null) {
    const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error' | 'offline'>('saved');
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

    // Track debounce timer for cleanup
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Monitor online/offline status
    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => {
            setIsOnline(false);
            setSaveStatus('offline');
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    const saveToFirestore = useCallback(async (id: string, data: Partial<Project>) => {
        if (!isMountedRef.current) return;
        if (!isOnline) {
            setSaveStatus('offline');
            return;
        }

        // Convert Firestore numericId if needed - here we assume id passed is numericId string
        // If it's the firestore doc ID, this will fail. We need the numeric ID.
        // The calling component 'assembly-line.tsx' passes 'firestoreId' which is now numeric ID string (from my previous edit).
        // Let's ensure it handles it correctly.

        setSaveStatus('saving');
        try {
            // Filter out undefined values to prevent errors
            const updateData: Record<string, unknown> = {};
            Object.entries(data).forEach(([key, value]) => {
                if (value !== undefined) {
                    updateData[key] = value;
                }
            });
            // updateData.updatedAt = serverTimestamp(); // Backend handles timestamps

            // Use backend API with authentication via apiRequest helper
            console.log('🔄 [AUTO-SAVE] Saving session:', id);
            const response = await apiRequest('PATCH', `/api/sessions/${id}`, updateData);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ [AUTO-SAVE] PATCH failed:', response.status, errorText);
                throw new Error('Failed to save session');
            }

            console.log('✅ [AUTO-SAVE] Session saved successfully');

            if (isMountedRef.current) {
                setSaveStatus('saved');
                setLastSaved(new Date());
            }
        } catch (err) {
            console.error('Auto-save failed:', err);
            if (isMountedRef.current) {
                setSaveStatus('error');
            }
        }
    }, [isOnline]);

    const save = useCallback((data: Partial<Project>) => {
        if (!firestoreId) return;
        if (!isOnline) {
            setSaveStatus('offline');
            return;
        }

        setSaveStatus('saving');

        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer (1 second debounce)
        debounceTimerRef.current = setTimeout(() => {
            saveToFirestore(firestoreId, data);
        }, 1000);
    }, [firestoreId, saveToFirestore, isOnline]);

    // Immediate save without debounce (for manual "Save Now" button)
    const saveNow = useCallback((data: Partial<Project>) => {
        if (!firestoreId) return;

        // Clear any pending debounced save
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Save immediately
        saveToFirestore(firestoreId, data);
    }, [firestoreId, saveToFirestore]);

    return { save, saveNow, saveStatus, lastSaved };
}
