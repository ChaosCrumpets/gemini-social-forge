import { useEffect, useRef, useCallback } from 'react';
import { useToast } from './use-toast';

const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds

export function useInactivityTimeout() {
    const { toast } = useToast();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const logout = useCallback(() => {
        // Clear any return path to prevent auto-redirect loop after timeout
        sessionStorage.removeItem('returnTo');

        toast({
            title: "Session Expired",
            description: "You have been logged out due to inactivity.",
            variant: "destructive",
        });

        // Give the user a moment to see the toast
        setTimeout(() => {
            window.location.href = '/auth';
        }, 1500);
    }, [toast]);

    const resetTimer = useCallback(() => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            console.log('⏱️ Inactivity timeout reached - logging out');
            logout();
        }, INACTIVITY_TIMEOUT);
    }, [logout]);

    useEffect(() => {
        // Events to track activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        // Initial timer start
        resetTimer();

        // Event handler
        const handleActivity = () => {
            resetTimer();
        };

        // Attach listeners
        events.forEach(event => {
            document.addEventListener(event, handleActivity, true);
        });

        // Cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            events.forEach(event => {
                document.removeEventListener(event, handleActivity, true);
            });
        };
    }, [resetTimer]);

    return { resetTimer };
}
