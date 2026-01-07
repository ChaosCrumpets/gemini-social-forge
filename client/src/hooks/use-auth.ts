import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  subscriptionTier: string;
  isPremium: boolean;
  customToken: string; // Firebase custom token from backend
}

export function useRegister() {
  const [, navigate] = useLocation();

  return useMutation({
    mutationFn: async (data: RegisterData) => {
      const response = await apiRequest("POST", "/api/register", data);
      const result: AuthResponse = await response.json();

      // Sign in to Firebase with custom token from backend
      await signInWithCustomToken(auth, result.customToken);

      return result;
    },
    onSuccess: (data) => {
      // Set user data immediately to avoid race conditions with /api/me fetch
      const { customToken, ...user } = data;
      queryClient.setQueryData(["/api/me"], user);
      // Redirect to intended destination or default to home
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
  });
}

export function useLogin() {
  const [, navigate] = useLocation();

  return useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/login", data);
      const result: AuthResponse = await response.json();

      // Sign in to Firebase with custom token from backend
      await signInWithCustomToken(auth, result.customToken);

      return result;
    },
    onSuccess: (data) => {
      // Set user data immediately to avoid race conditions with /api/me fetch
      const { customToken, ...user } = data;
      queryClient.setQueryData(["/api/me"], user);
      // Redirect to intended destination or default to home
      const returnTo = sessionStorage.getItem("returnTo") || "/";
      sessionStorage.removeItem("returnTo");
      navigate(returnTo);
    },
  });
}
