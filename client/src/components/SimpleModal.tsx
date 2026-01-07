import { useEffect, useState } from 'react';

interface SimpleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave?: () => void;
    title: string;
    description: string;
}

/**
 * Simple modal dialog without shadcn/ui dependencies
 * Used for unsaved changes warnings
 */
export function SimpleModal({ isOpen, onClose, onSave, title, description }: SimpleModalProps) {
    // Browser beforeunload handler
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isOpen) {
                e.preventDefault();
                e.returnValue = '';
                return '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{title}</h2>
                <p className="mb-6 text-gray-600 dark:text-gray-300">{description}</p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                        Cancel
                    </button>
                    {onSave && (
                        <button
                            onClick={() => {
                                onSave();
                                onClose();
                            }}
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Save Changes
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
