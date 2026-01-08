import { apiRequest } from './queryClient';
import { showSuccess, showError } from './toast-helper';

interface ApiOptions<T> {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    url: string;
    data?: unknown;
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    successMessage?: string;
    errorMessage?: string;
    showToastOnError?: boolean;
}

/**
 * Standardized API wrapper to handle requests with consistent error handling and toast notifications.
 * Wraps the existing apiRequest but adds layer for UI feedback and type safety.
 */
export async function safeApiCall<T>({
    method = 'GET',
    url,
    data,
    onSuccess,
    onError,
    successMessage,
    errorMessage = 'An error occurred. Please try again.',
    showToastOnError = true
}: ApiOptions<T>): Promise<T | null> {
    try {
        const response = await apiRequest(method, url, data);

        // apiRequest throws immediately on manually constructed error responses, 
        // but standard fetch might not if we didn't check response.ok in apiRequest (which queryClient.ts usually does).
        // Assuming apiRequest handles basic HTTP errors by throwing.

        const responseData = await response.json();

        if (successMessage) {
            showSuccess(successMessage);
        }

        onSuccess?.(responseData);
        return responseData;

    } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        console.error(`API Error (${url}):`, error);

        if (showToastOnError) {
            showError(errorMessage);
        }

        onError?.(error);
        return null;
    }
}
