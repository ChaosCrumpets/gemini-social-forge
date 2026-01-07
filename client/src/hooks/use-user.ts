import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { apiRequest, queryClient, getQueryFn } from "@/lib/queryClient";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role: string;
  subscriptionTier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  isPremium: boolean;
}

export function useUser() {
  const [firebaseReady, setFirebaseReady] = useState(false);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (!firebaseUser) {
        // User logged out - clear cache
        queryClient.setQueryData(["/api/me"], null);
      }
      setFirebaseReady(true);
    });

    return () => unsubscribe();
  }, []);

  const { data: user, isLoading, error } = useQuery<User | null>({
    queryKey: ["/api/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: firebaseReady && !!auth.currentUser, // Only fetch if Firebase user exists
  });

  return {
    user,
    isLoading: isLoading || !firebaseReady,
    isAuthenticated: !!user,
    error
  };
}

export function useLogout() {
  const [, navigate] = useLocation();

  return useMutation({
    mutationFn: async () => {
      // Sign out from Firebase (this clears the ID token)
      await firebaseSignOut(auth);
      // Also call backend logout endpoint for cleanup
      try {
        await apiRequest("POST", "/api/logout", {});
      } catch (error) {
        // Backend logout failure is non-critical
        console.warn("Backend logout failed:", error);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      queryClient.clear();
      navigate("/");
    }
  });
}
