import { useEffect, useState } from 'react';
import { SimpleModal } from './SimpleModal';

interface UnsavedChangesPromptProps {
    when: boolean;
    onSave?: () => void;
    onDiscard?: () => void;
}

/**
 * Prompts user before navigation when there are unsaved changes
 * Shows modal with options to Save or Cancel
 */
export function UnsavedChangesPrompt({
    when,
    onSave
}: UnsavedChangesPromptProps) {
    const [showPrompt, setShowPrompt] = useState(false);

    // Show modal when user has unsaved changes (not implemented for now)
    // This is a placeholder for future navigation blocking

    return (
        <SimpleModal
            isOpen={showPrompt}
            onClose={() => setShowPrompt(false)}
            onSave={onSave}
            title="Unsaved Changes"
            description="You have unsaved changes. Would you like to save them before leaving?"
        />
    );
}
