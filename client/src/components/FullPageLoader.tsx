import { Loader2 } from 'lucide-react';

interface FullPageLoaderProps {
    message?: string;
}

export function FullPageLoader({ message = 'Loading...' }: FullPageLoaderProps) {
    return (
        <div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
            data-testid="full-page-loader"
        >
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-primary/20" />
                    <div className="absolute top-0 left-0 h-16 w-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                </div>
                <p className="text-muted-foreground text-sm animate-pulse">{message}</p>
            </div>
        </div>
    );
}

// Simple inline loader for smaller areas
export function InlineLoader({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center py-8 ${className}`}>
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
    );
}
