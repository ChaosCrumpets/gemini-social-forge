import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: 'small' | 'medium' | 'large';
    message?: string;
    progress?: number; // 0-100 for progress bar
    className?: string;
}

const sizeMap = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
};

export function LoadingSpinner({
    size = 'medium',
    message,
    progress,
    className
}: LoadingSpinnerProps) {
    return (
        <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
            <Loader2 className={cn(sizeMap[size], 'animate-spin text-blue-600')} />

            {message && (
                <p className="text-sm text-gray-600 dark:text-gray-400 animate-pulse">
                    {message}
                </p>
            )}

            {progress !== undefined && (
                <div className="w-48 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-600 transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                </div>
            )}
        </div>
    );
}
