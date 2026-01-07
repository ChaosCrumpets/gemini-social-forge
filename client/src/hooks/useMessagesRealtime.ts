import { useQuery } from '@tanstack/react-query';
import { ChatMessage } from '@shared/schema';

export function useMessagesRealtime(firestoreId: string | null, limitCount = 50) {
    const numericId = firestoreId && !isNaN(Number(firestoreId)) ? Number(firestoreId) : null;

    const { data: messages = [], isLoading: loading, error } = useQuery<ChatMessage[], Error>({
        queryKey: ['/api/sessions', numericId, 'messages'],
        queryFn: async () => {
            if (!numericId) return [];
            const res = await fetch(`/api/sessions/${numericId}/messages`);
            if (!res.ok) throw new Error('Failed to fetch messages');

            const msgs: ChatMessage[] = await res.json();
            // Ensure correct parsing of timestamps if needed, though JSON usually handles standard formats
            // Backend returns them as processed objects.
            // Reverse to show newest at bottom (if backend sends newest first? backend might send unsorted)
            // Let's assume backend returns array. We'll sort by timestamp.
            return msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        },
        enabled: !!numericId,
        refetchInterval: 3000, // Poll every 3 seconds to emulate fetching
    });

    return { messages, loading, error: error || null };
}
