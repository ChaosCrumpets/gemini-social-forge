import Exa from 'exa-js';

// Lazy initialization wrapper
export class ExaClient {
    private _client: Exa | null = null;

    private get client() {
        if (!this._client) {
            const apiKey = process.env.EXA_API_KEY;
            if (!apiKey) throw new Error('EXA_API_KEY is missing');
            this._client = new Exa(apiKey);
        }
        return this._client;
    }

    /**
     * Neural search for stylistic or specific content types
     * Good for: "Viral hooks", "Reddit discussions", "Opinions"
     */
    async search(query: string, options: {
        numResults?: number;
        useAutoprompt?: boolean;
        type?: 'neural' | 'keyword';
        contents?: {
            text?: boolean;
            highlights?: boolean;
        }
    } = {}) {
        try {
            // Map our internal options to SDK options
            // SDK usually accepts (query, { ...options })
            const response = await this.client.searchAndContents(query, {
                numResults: options.numResults || 5,
                useAutoprompt: options.useAutoprompt,
                type: options.type as any,
                text: options.contents?.text ? true : undefined,
                highlights: options.contents?.highlights ? true : undefined
            });
            return response;
        } catch (error: any) {
            console.error("Exa SDK Error:", error);
            throw error;
        }
    }
}

export const exa = new ExaClient();
