import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Don't worry, your work is saved.</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reload App
            </button>
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Error details</summary>
              <pre className="mt-2 text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-auto">
                {this.state.error.toString()}
              </pre>
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Stage-specific error fallback component
export function StageErrorFallback({
  error,
  stageName,
  onRetry
}: {
  error: Error;
  stageName: string;
  onRetry: () => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white rounded-lg border-2 border-red-200 p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {stageName} Error
        </h3>
        <p className="text-gray-600 mb-4">
          Something went wrong while loading this stage.
        </p>
        <Button
          onClick={onRetry}
          variant="default"
          className="inline-flex items-center"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <details className="mt-4 text-left">
          <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
            Technical details
          </summary>
          <pre className="mt-2 text-xs text-gray-700 bg-gray-50 p-3 rounded border overflow-auto max-h-32">
            {error.message}
          </pre>
        </details>
      </div>
    </div>
  );
}
