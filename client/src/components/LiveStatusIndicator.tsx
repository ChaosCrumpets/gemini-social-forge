import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

/**
 * Live server status indicator
 * Shows connection health and updates every 5 seconds
 */
export function LiveStatusIndicator() {
    const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
    const [lastUpdate, setLastUpdate] = useState<string>('');

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch('/api/health', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStatus('online');
                    setLastUpdate(new Date(data.timestamp).toLocaleTimeString());
                    console.log('✅ Server health check:', data);
                } else {
                    setStatus('offline');
                }
            } catch (error) {
                console.error('❌ Server health check failed:', error);
                setStatus('offline');
            }
        };

        // Initial check
        checkHealth();

        // Check every 5 seconds
        const interval = setInterval(checkHealth, 5000);

        return () => clearInterval(interval);
    }, []);

    const getStatusColor = () => {
        switch (status) {
            case 'online': return 'bg-green-600';
            case 'offline': return 'bg-red-600';
            default: return 'bg-yellow-600';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'online': return `✅ Live - ${lastUpdate}`;
            case 'offline': return '❌ Server down';
            default: return '🔄 Checking...';
        }
    };

    return (
        <div className={`fixed bottom-4 right-4 ${getStatusColor()} text-white px-3 py-2 rounded-lg text-sm font-mono flex items-center gap-2 shadow-lg z-50`}>
            <Activity className="w-4 h-4 animate-pulse" />
            {getStatusText()}
        </div>
    );
}
