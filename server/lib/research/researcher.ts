import { tavily } from './tavily';
import { exa } from './exa';
import { firecrawl } from './firecrawl';

export type research_type = 'verify_facts' | 'find_viral_trends' | 'deep_doc_analysis';

interface ResearchRequest {
    type: research_type;
    query: string;
    url?: string; // For deep doc analysis
}

interface ResearchResult {
    source: 'tavily' | 'exa' | 'firecrawl';
    data: any;
    summary?: string;
}

export class ResearchService {

    async conductResearch(request: ResearchRequest): Promise<ResearchResult> {
        console.log(`[ResearchService] Starting research: ${request.type} for "${request.query}"`);

        try {
            switch (request.type) {
                case 'verify_facts':
                    // Use Tavily for fact-checking
                    const tavilyPayload = await tavily.search(request.query, {
                        search_depth: 'basic',
                        include_answer: true
                    });
                    return {
                        source: 'tavily',
                        data: tavilyPayload,
                        summary: tavilyPayload.answer
                    };

                case 'find_viral_trends':
                    // Use Exa for finding viral/trending content
                    const exaPayload = await exa.search(request.query, {
                        type: 'neural',
                        useAutoprompt: true,
                        numResults: 3
                    });
                    return {
                        source: 'exa',
                        data: exaPayload,
                        summary: `Found ${exaPayload.results.length} viral candidates.`
                    };

                case 'deep_doc_analysis':
                    // Use Firecrawl to reading a specific URL if provided, or search first
                    if (request.url) {
                        const firecrawlPayload = await firecrawl.scrapeUrl(request.url);
                        return {
                            source: 'firecrawl',
                            data: firecrawlPayload,
                            summary: 'Successfully scraped documentation.'
                        };
                    } else {
                        // Fallback to finding a URL first using Tavily then scraping it? 
                        // For now, let's just use Tavily advanced if no URL.
                        const fallback = await tavily.search(request.query, { search_depth: 'advanced' });
                        return {
                            source: 'tavily',
                            data: fallback,
                            summary: 'No URL provided for deep analysis, performed advanced search instead.'
                        };
                    }

                default:
                    throw new Error('Invalid research type');
            }
        } catch (error: any) {
            console.error(`[ResearchService] Error during research:`, error);
            // Fail gracefully so we don't crash the generation
            return {
                source: 'tavily', // default to blaming tavily or system
                data: { error: error.message },
                summary: 'Research failed.'
            };
        }
    }
}

export const researchService = new ResearchService();
