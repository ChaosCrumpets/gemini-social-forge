import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, getDocs, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { ContentOutput } from '@shared/schema';

export interface Version {
    id: string;
    versionNumber: number;
    contentOutput: ContentOutput;
    createdAt: Date;
    changeDescription: string;
    changeType: 'auto' | 'manual' | 'ai_refinement';
    createdBy: string;
}

interface UseVersionHistoryReturn {
    versions: Version[];
    isLoading: boolean;
    error: Error | null;
    createVersion: (contentOutput: ContentOutput, description: string, changeType: Version['changeType']) => Promise<void>;
    restoreVersion: (versionId: string) => Promise<void>;
    refreshVersions: () => Promise<void>;
}

export function useVersionHistory(projectId: string | null): UseVersionHistoryReturn {
    const [versions, setVersions] = useState<Version[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const loadVersions = useCallback(async () => {
        // Use numeric ID
        const numericId = projectId && !isNaN(Number(projectId)) ? projectId : null;

        if (!numericId) {
            setVersions([]);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/sessions/${numericId}/versions`);
            if (!response.ok) throw new Error('Failed to load versions');

            const loadedVersions: Version[] = await response.json();
            // Backend returns dates as strings probably, need to convert if Version interface expects Date object
            // Interface says createdAt: Date.
            // JSON.parse leaves strings.
            // We need to map it.
            const processedVersions = loadedVersions.map(v => ({
                ...v,
                createdAt: new Date(v.createdAt)
            }));

            setVersions(processedVersions);
        } catch (err) {
            console.error('Failed to load versions:', err);
            setError(err as Error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        loadVersions();
    }, [loadVersions]);

    const createVersion = useCallback(async (
        contentOutput: ContentOutput,
        description: string,
        changeType: Version['changeType']
    ) => {
        const numericId = projectId && !isNaN(Number(projectId)) ? projectId : null;
        if (!numericId) {
            throw new Error('No project ID provided or invalid ID');
        }

        try {
            const response = await fetch(`/api/sessions/${numericId}/versions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    versionNumber: (versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1),
                    contentOutput,
                    changeDescription: description,
                    changeType,
                    createdBy: 'user',
                })
            });

            if (!response.ok) throw new Error('Failed to create version');

            // Reload versions to show new one
            await loadVersions();
        } catch (err) {
            console.error('Failed to create version:', err);
            throw err;
        }
    }, [projectId, versions, loadVersions]);

    const restoreVersion = useCallback(async (versionId: string) => {
        const numericId = projectId && !isNaN(Number(projectId)) ? projectId : null;
        if (!numericId) {
            throw new Error('No project ID provided');
        }

        try {
            // Find the version to restore
            const versionToRestore = versions.find(v => v.id === versionId);
            if (!versionToRestore) {
                throw new Error('Version not found');
            }

            // Update the main project document with the restored content via PATCH
            const response = await fetch(`/api/sessions/${numericId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    output: versionToRestore.contentOutput,
                    // updatedAt: serverTimestamp() // Backend handles this
                })
            });

            if (!response.ok) throw new Error('Failed to restore session content');

            // Create a new version representing the restore action
            await createVersion(
                versionToRestore.contentOutput,
                `Restored to version ${versionToRestore.versionNumber}`,
                'manual'
            );
        } catch (err) {
            console.error('Failed to restore version:', err);
            throw err;
        }
    }, [projectId, versions, createVersion]);

    return {
        versions,
        isLoading,
        error,
        createVersion,
        restoreVersion,
        refreshVersions: loadVersions,
    };
}
