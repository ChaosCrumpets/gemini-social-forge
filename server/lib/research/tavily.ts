import { tavily as tavilySdk } from '@tavily/core';

// Initialize the SDK
// Note: We create a factory/wrapper because the SDK export might differ or need lazy init
let tavilyInstance: any = null;

export class TavilyClient {
    private get client() {
        if (!tavilyInstance) {
            tavilyInstance = tavilySdk({ apiKey: process.env.TAVILY_API_KEY });
        }
        return tavilyInstance;
    }

    /**
     * Search specifically for factual answers and context
     * Good for: Verification, definitions, current events
     */
    async search(query: string, options: {
        search_depth?: 'basic' | 'advanced',
        include_answer?: boolean,
        max_results?: number,
        include_domains?: string[],
        exclude_domains?: string[]
    } = {}) {
        if (!process.env.TAVILY_API_KEY) throw new Error('Tavily API key is missing');

        try {
            const response = await this.client.search(query, {
                searchDepth: options.search_depth || 'basic',
                includeAnswer: options.include_answer ?? true,
                maxResults: options.max_results || 5,
                includeDomains: options.include_domains,
                excludeDomains: options.exclude_domains
            });
            return response;
        } catch (error: any) {
            console.error("Tavily SDK Error:", error);
            throw error;
        }
    }
}

export const tavily = new TavilyClient();
