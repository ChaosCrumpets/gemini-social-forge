import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { auth } from "./firebase";
import { onAuthStateChanged } from "firebase/auth";

// Promise that resolves when Firebase auth has initialized
let firebaseReadyPromise: Promise<void> | null = null;

/**
 * Wait for Firebase auth to finish initializing from localStorage.
 * This prevents the race condition where we try to get currentUser
 * before Firebase has restored the session.
 */
function waitForFirebaseReady(): Promise<void> {
  if (firebaseReadyPromise) {
    return firebaseReadyPromise;
  }

  firebaseReadyPromise = new Promise((resolve) => {
    // onAuthStateChanged fires immediately with the current state
    // or after restoring from localStorage
    const unsubscribe = onAuthStateChanged(auth, () => {
      unsubscribe();
      resolve();
    });
  });

  return firebaseReadyPromise;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  options?: { maxRetries?: number; retryDelay?: number }
): Promise<Response> {
  const maxRetries = options?.maxRetries ?? 3;
  const baseDelay = options?.retryDelay ?? 1000; // 1 second base delay

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Wait for Firebase to be ready before getting token
      await waitForFirebaseReady();

      // Get Firebase ID token if user is authenticated
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;
      console.log('[apiRequest] User:', auth.currentUser?.email, 'Has token:', !!idToken);

      const headers: Record<string, string> = {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
        ...(data ? { "Content-Type": "application/json" } : {}),
      };
      console.log('[apiRequest]', method, url, 'Headers:', Object.keys(headers));

      const res = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      // Don't retry on 4xx errors (client errors - bad request, auth, etc.)
      if (res.status >= 400 && res.status < 500) {
        await throwIfResNotOk(res);
        return res;
      }

      // If response is ok or this is the last attempt, return/throw
      if (res.ok || attempt === maxRetries) {
        await throwIfResNotOk(res);
        return res;
      }

      // 5xx error - will retry
      lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);

    } catch (error) {
      lastError = error as Error;

      // Don't retry on network errors if we've exhausted retries  
      if (attempt === maxRetries) {
        throw lastError;
      }
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = baseDelay * Math.pow(2, attempt);
    console.log(`[apiRequest] Retry ${attempt + 1}/${maxRetries} after ${delay}ms...`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  throw lastError || new Error('Request failed after retries');
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
    async ({ queryKey }) => {
      // Wait for Firebase to be ready before getting token
      await waitForFirebaseReady();

      // Get Firebase ID token if user is authenticated
      const idToken = auth.currentUser ? await auth.currentUser.getIdToken() : null;

      const headers: Record<string, string> = {
        ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
      };

      const res = await fetch(queryKey.join("/") as string, {
        headers,
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
