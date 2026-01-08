export const SkeletonCard = () => (
    <div className="bg-white rounded-lg p-4 space-y-3 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-24 bg-gray-200 rounded" />
    </div>
);

export const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600" />
        <p className="text-sm text-gray-600">{text}</p>
    </div>
);

export const GeneratingStatus = ({ stage }: { stage: 'analyzing' | 'generating' | 'scripting' | 'finalizing' }) => {
    const messages = {
        analyzing: "Understanding your brief...",
        generating: "Creating hook options...",
        scripting: "Writing your script...",
        finalizing: "Putting it all together..."
    };

    return (
        <div className="flex items-center space-x-3 bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
            <span className="text-sm font-medium text-blue-900">{messages[stage]}</span>
        </div>
    );
};
