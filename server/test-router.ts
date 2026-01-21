// Test LLM Router with all providers
import { llmRouter } from './lib/llm-router.js';
import dotenv from 'dotenv';

dotenv.config();

async function testProviders() {
    console.log('🧪 Testing LLM Router Providers...\n');

    const testMessage = {
        messages: [{ role: 'user' as const, content: 'Say "Hello from [provider name]" in JSON format with a "message" field.' }],
        systemInstruction: 'You are a helpful assistant. Always respond in valid JSON.',
        category: 'logic' as const,
        responseFormat: 'json' as const
    };

    try {
        console.log('📡 Sending test request...');
        const response = await llmRouter.generate(testMessage);

        console.log('\n✅ SUCCESS!');
        console.log('Provider:', response.provider);
        console.log('Model:', response.model);
        console.log('Response:', response.text);

        if (response.tokensUsed) {
            console.log('Tokens:', response.tokensUsed);
        }

        // Get router stats
        const stats = llmRouter.getStats();
        console.log('\n📊 Router Stats:');
        console.log('Enabled Providers:', stats.enabledProviders.join(', '));
        console.log('Current Index:', stats.currentIndex);

    } catch (error: any) {
        console.error('\n❌ FAILED:', error.message);
        process.exit(1);
    }
}

testProviders().then(() => {
    console.log('\n✅ Test complete!');
    process.exit(0);
});
