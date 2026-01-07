import { useState, useEffect } from 'react';
import { useAutoSave } from './useAutoSave';

/**
 * Track unsaved changes in the current project
 * Integrates with auto-save system to detect pending saves
 */
export function useUnsavedChanges(projectId: string | null) {
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const { saveStatus } = useAutoSave(projectId);

    // Track if there are pending saves
    useEffect(() => {
        if (!projectId) {
            setHasUnsavedChanges(false);
            return;
        }

        // Consider changes unsaved if currently saving
        setHasUnsavedChanges(saveStatus === 'saving');
    }, [saveStatus, projectId]);

    return {
        hasUnsavedChanges,
        saveStatus,
    };
}
