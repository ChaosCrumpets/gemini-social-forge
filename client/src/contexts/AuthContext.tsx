import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    getAuthToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Wait for auth to initialize
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;

        // Check token expiry every 30 minutes
        const interval = setInterval(async () => {
            try {
                await user.getIdToken(true); // Force refresh
                console.log('Token refreshed');
            } catch (error) {
                console.error('Token refresh failed:', error);
            }
        }, 30 * 60 * 1000); // 30 minutes

        return () => clearInterval(interval);
    }, [user]);

    const getAuthToken = async (forceRefresh = false): Promise<string | null> => {
        if (!user) return null;

        try {
            // Use cached token by default, force refresh only when requested
            const token = await user.getIdToken(forceRefresh);
            return token;
        } catch (error) {
            console.error('Failed to get auth token:', error);
            return null;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, getAuthToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};
