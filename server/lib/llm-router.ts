/**
 * Multi-LLM Router
 * 
 * Routes LLM requests across multiple providers with:
 * - Round-robin selection
 * - Automatic failover on provider failure
 * - Rate limit tracking per provider
 * - Task-specific model selection (logic vs content)
 */

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { providers, type LLMProvider } from './llm-providers';
import { log } from '../utils/logger';

export type TaskCategory = 'logic' | 'content';

export interface LLMRequest {
    messages: Array<{ role: 'user' | 'model' | 'assistant' | 'system'; content: string }>;
    systemInstruction?: string;
    category: TaskCategory;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: 'json' | 'text';
}

export interface LLMResponse {
    text: string;
    provider: string;
    model: string;
    tokensUsed?: number;
}

class LLMRouter {
    private currentIndex = 0;
    private requestCounts = new Map<string, number[]>();

    // Initialize clients
    private geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY || ''
    });

    private anthropicClient = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY || ''
    });

    private groqClient = new Groq({
        apiKey: process.env.GROQ_API_KEY || ''
    });

    private deepseekClient = new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseURL: 'https://api.deepseek.com'
    });

    private openrouterClient = new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseURL: 'https://openrouter.ai/api/v1'
    });

    /**
     * Round-robin provider selection with rate limit awareness
     */
    private getNextProvider(category: TaskCategory): LLMProvider | null {
        const enabledProviders = providers.filter(p => p.enabled);

        if (enabledProviders.length === 0) {
            throw new Error('No LLM providers configured. Please add at least one API key to .env');
        }

        // Try round-robin selection
        for (let i = 0; i < enabledProviders.length; i++) {
            const provider = enabledProviders[this.currentIndex % enabledProviders.length];
            this.currentIndex++;

            // Check rate limit
            if (!this.isRateLimited(provider)) {
                return provider;
            }
        }

        // All providers rate-limited, return highest priority
        return enabledProviders.sort((a, b) => a.priority - b.priority)[0];
    }

    /**
     * Track requests per minute for rate limiting
     */
    private isRateLimited(provider: LLMProvider): boolean {
        const now = Date.now();
        const requests = this.requestCounts.get(provider.name) || [];

        // Remove requests older than 1 minute
        const recentRequests = requests.filter(time => now - time < 60000);
        this.requestCounts.set(provider.name, recentRequests);

        return recentRequests.length >= provider.rpm;
    }

    /**
     * Record a request for rate limiting
     */
    private recordRequest(providerName: string): void {
        const requests = this.requestCounts.get(providerName) || [];
        requests.push(Date.now());
        this.requestCounts.set(providerName, requests);
    }

    /**
     * Main routing function with automatic failover
     */
    async generate(request: LLMRequest): Promise<LLMResponse> {
        const enabledProviders = providers.filter(p => p.enabled);
        let lastError: Error | null = null;

        // Try each provider in round-robin order
        for (let attempt = 0; attempt < enabledProviders.length; attempt++) {
            const provider = this.getNextProvider(request.category);

            if (!provider) {
                throw new Error('No available LLM providers');
            }

            try {
                log.router(`Attempting ${provider.name} for ${request.category} task`);

                this.recordRequest(provider.name);

                const response = await this.callProvider(provider, request);

                log.success(`[LLM Router] Success with ${provider.name} (${request.category})`);
                return response;

            } catch (error: any) {
                log.error(`[LLM Router] ${provider.name} failed:`, error.message);
                lastError = error;

                // If rate limited, mark and try next
                if (error.message?.includes('rate limit') || error.status === 429) {
                    log.router(`Rate limit hit for ${provider.name}, trying next provider`);
                    continue;
                }

                // If quota exceeded, disable provider temporarily
                if (error.message?.includes('quota') || error.status === 403) {
                    log.router(`Quota exceeded for ${provider.name}, trying next provider`);
                    continue;
                }

                //For other errors, try next provider
                continue;
            }
        }

        // All providers failed
        throw new Error(`All LLM providers failed. Last error: ${lastError?.message}`);
    }

    /**
     * Call specific provider
     */
    private async callProvider(
        provider: LLMProvider,
        request: LLMRequest
    ): Promise<LLMResponse> {
        const model = request.category === 'logic'
            ? provider.logicModel
            : provider.contentModel;

        switch (provider.name) {
            case 'gemini':
                return await this.callGemini(model, request);
            case 'claude':
                return await this.callClaude(model, request);
            case 'deepseek':
                return await this.callDeepSeek(model, request);
            case 'groq':
                return await this.callGroq(model, request);
            case 'openrouter':
                return await this.callOpenRouter(model, request);
            default:
                throw new Error(`Unknown provider: ${provider.name}`);
        }
    }

    private async callGemini(model: string, request: LLMRequest): Promise<LLMResponse> {
        // Convert messages to Gemini format
        const contents = request.messages.map(msg => ({
            role: msg.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: msg.content }]
        }));

        const response = await this.geminiClient.models.generateContent({
            model,
            config: {
                systemInstruction: request.systemInstruction,
                responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain',
                temperature: request.temperature,
                maxOutputTokens: request.maxTokens || 4096
            },
            contents
        });

        return {
            text: response.text || '',
            provider: 'gemini',
            model
        };
    }

    private async callClaude(model: string, request: LLMRequest): Promise<LLMResponse> {
        // Convert messages to Claude format (filter out system messages)
        const messages = request.messages
            .filter(msg => msg.role !== 'system')
            .map(msg => ({
                role: msg.role === 'user' ? 'user' as const : 'assistant' as const,
                content: msg.content
            }));

        const response = await this.anthropicClient.messages.create({
            model,
            max_tokens: request.maxTokens || 4096,
            temperature: request.temperature,
            system: request.systemInstruction,
            messages
        });

        const text = response.content[0].type === 'text'
            ? response.content[0].text
            : '';

        return {
            text,
            provider: 'claude',
            model,
            tokensUsed: response.usage.input_tokens + response.usage.output_tokens
        };
    }

    private async callDeepSeek(model: string, request: LLMRequest): Promise<LLMResponse> {
        const messages = [
            ...(request.systemInstruction ? [{ role: 'system' as const, content: request.systemInstruction }] : []),
            ...request.messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
                content: msg.content
            }))
        ];

        const response = await this.deepseekClient.chat.completions.create({
            model,
            messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
        });

        return {
            text: response.choices[0]?.message?.content || '',
            provider: 'deepseek',
            model,
            tokensUsed: response.usage?.total_tokens
        };
    }

    private async callGroq(model: string, request: LLMRequest): Promise<LLMResponse> {
        const messages = [
            ...(request.systemInstruction ? [{ role: 'system' as const, content: request.systemInstruction }] : []),
            ...request.messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
                content: msg.content
            }))
        ];

        const response = await this.groqClient.chat.completions.create({
            model,
            messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
        });

        return {
            text: response.choices[0]?.message?.content || '',
            provider: 'groq',
            model,
            tokensUsed: response.usage?.total_tokens
        };
    }

    private async callOpenRouter(model: string, request: LLMRequest): Promise<LLMResponse> {
        const messages = [
            ...(request.systemInstruction ? [{ role: 'system' as const, content: request.systemInstruction }] : []),
            ...request.messages.map(msg => ({
                role: msg.role === 'assistant' ? 'assistant' as const : 'user' as const,
                content: msg.content
            }))
        ];

        const response = await this.openrouterClient.chat.completions.create({
            model,
            messages,
            temperature: request.temperature,
            max_tokens: request.maxTokens,
            response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined
        });

        return {
            text: response.choices[0]?.message?.content || '',
            provider: 'openrouter',
            model,
            tokensUsed: response.usage?.total_tokens
        };
    }

    /**
     * Get router statistics
     */
    getStats() {
        return {
            enabledProviders: providers.filter(p => p.enabled).map(p => p.name),
            currentIndex: this.currentIndex,
            requestCounts: Object.fromEntries(this.requestCounts)
        };
    }
}

export const llmRouter = new LLMRouter();
