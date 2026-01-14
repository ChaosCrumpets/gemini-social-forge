import { Button } from "./ui/button";

interface ProgressionGateProps {
    questionsAnswered: number;
    totalQuestions: number;
    onContinue: () => void;
    onGenerateNow: () => void;
}

/**
 * ProgressionGate Component
 * Displays after 3 discovery questions, allowing user to:
 * - Continue with more questions for better quality
 * - Generate hooks now with current information
 */
export function ProgressionGate({
    questionsAnswered,
    totalQuestions,
    onContinue,
    onGenerateNow
}: ProgressionGateProps) {
    const progressPercent = Math.min(100, Math.round((questionsAnswered / totalQuestions) * 100));

    return (
        <div
            className="my-6 p-5 border-2 border-blue-500 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 shadow-lg animate-in fade-in slide-in-from-bottom-3 duration-300"
            data-testid="progression-gate"
        >
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                        Discovery Progress
                    </p>
                    <span className="text-xs font-mono font-medium bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        {questionsAnswered}/{totalQuestions}
                    </span>
                </div>

                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500 ease-out shadow-sm"
                        style={{ width: `${progressPercent}%` }}
                        data-testid="progress-bar"
                    />
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                    {progressPercent}% complete
                </p>
            </div>

            <div className="space-y-3">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    You can <strong>continue answering questions</strong> to increase output quality and personalization,
                    or <strong>generate hooks now</strong> with what we have.
                </p>

                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    💡 <strong>Tip:</strong> Continuing ensures hooks are optimally tailored to your unique value proposition and audience.
                </p>
            </div>

            <div className="flex gap-3 mt-5">
                <Button
                    onClick={onContinue}
                    variant="outline"
                    className="flex-1 border-2 hover:bg-white dark:hover:bg-gray-800 transition-all"
                    data-testid="button-continue-questions"
                >
                    <span className="mr-2">📝</span>
                    Continue Questions
                </Button>
                <Button
                    onClick={onGenerateNow}
                    variant="default"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                    data-testid="button-generate-now"
                >
                    <span className="mr-2">✨</span>
                    Generate Hooks Now
                </Button>
            </div>
        </div>
    );
}
