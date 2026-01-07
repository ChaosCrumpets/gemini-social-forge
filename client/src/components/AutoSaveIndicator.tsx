import { CheckCircle2, Loader2, XCircle, AlertCircle, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error' | 'offline';

interface AutoSaveIndicatorProps {
    status: SaveStatus;
    lastSaved?: Date | null;
    onRetry?: () => void;
    onSaveNow?: () => void;
    hasUnsavedChanges?: boolean;
}

export function AutoSaveIndicator({
    status,
    lastSaved,
    onRetry,
    onSaveNow,
    hasUnsavedChanges = false
}: AutoSaveIndicatorProps) {
    // Don't show if idle and no unsaved changes
    if (status === 'idle' && !hasUnsavedChanges) return null;

    const getTimeAgo = (date: Date) => {
        const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
        if (seconds < 5) return 'just now';
        if (seconds < 60) return `${seconds}s ago`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
        return `${Math.floor(seconds / 3600)}h ago`;
    };

    // Show unsaved changes warning
    if (hasUnsavedChanges && status !== 'saving') {
        return (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300">
                <AlertCircle className="w-4 h-4" />
                <span>Unsaved changes</span>
                {onSaveNow && (
                    <button
                        onClick={onSaveNow}
                        className="ml-2 px-2 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs flex items-center gap-1"
                    >
                        <Save className="w-3 h-3" />
                        Save Now
                    </button>
                )}
            </div>
        );
    }

    return (
        <div
            className={cn(
                'fixed top-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg text-sm font-medium transition-all duration-300',
                status === 'saving' && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
                status === 'saved' && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
                status === 'error' && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
                status === 'offline' && 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
            )}
        >
            {status === 'saving' && (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving...</span>
                </>
            )}

            {status === 'saved' && (
                <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                        All changes saved {lastSaved && getTimeAgo(lastSaved)}
                    </span>
                </>
            )}

            {status === 'error' && (
                <>
                    <XCircle className="w-4 h-4" />
                    <span>Save failed</span>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="ml-2 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                        >
                            Retry
                        </button>
                    )}
                </>
            )}

            {status === 'offline' && (
                <>
                    <AlertCircle className="w-4 h-4" />
                    <span>Offline - changes will sync when online</span>
                </>
            )}
        </div>
    );
}
