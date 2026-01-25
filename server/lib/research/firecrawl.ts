import FirecrawlApp from '@mendable/firecrawl-js';

export class FirecrawlClient {
    private _client: FirecrawlApp | null = null;

    private get client() {
        if (!this._client) {
            const apiKey = process.env.FIRECRAWL_API_KEY;
            if (!apiKey) throw new Error('FIRECRAWL_API_KEY is missing');
            this._client = new FirecrawlApp({ apiKey });
        }
        return this._client;
    }

    /**
     * Turn a specific URL into clean Markdown
     * Good for: Reading documentation, long-form articles, terms of service
     */
    async scrapeUrl(url: string) {
        try {
            const response = await this.client.scrape(url, {
                formats: ['markdown']
            });

            // If we're here, the scrape was successful (SDK throws on error)

            return {
                markdown: response.markdown || '',
                metadata: response.metadata
            };

        } catch (error: any) {
            console.error("Firecrawl SDK Error:", error);
            throw error;
        }
    }
}

export const firecrawl = new FirecrawlClient();
