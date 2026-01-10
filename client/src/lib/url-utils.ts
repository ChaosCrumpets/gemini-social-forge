export const getSessionIdFromUrl = (): string | null => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('session');
};

export const setSessionIdInUrl = (sessionId: number | null, replace = false): void => {
    if (typeof window === 'undefined') return;

    const url = new URL(window.location.href);

    if (sessionId) {
        url.searchParams.set('session', sessionId.toString());
    } else {
        url.searchParams.delete('session');
    }

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({}, '', url.toString());
};

export const clearSessionFromUrl = (): void => {
    setSessionIdInUrl(null, true);
};
