// Diagnostic script for LLM providers
require('dotenv').config();

console.log('🔍 LLM Provider Diagnostic\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n📋 Environment Variables:');
console.log('GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? `SET (${process.env.GEMINI_API_KEY.substring(0, 10)}...)` : 'NOT SET ❌');
console.log('ANTHROPIC_API_KEY:', process.env.ANTHROPIC_API_KEY ? `SET (${process.env.ANTHROPIC_API_KEY.substring(0, 10)}...)` : 'NOT SET ❌');
console.log('DEEPSEEK_API_KEY:', process.env.DEEPSEEK_API_KEY ? 'SET ✅' : 'NOT SET ⚠️');
console.log('GROQ_API_KEY:', process.env.GROQ_API_KEY ? `SET (${process.env.GROQ_API_KEY.substring(0, 10)}...)` : 'NOT SET ❌');
console.log('OPENROUTER_API_KEY:', process.env.OPENROUTER_API_KEY ? `SET (${process.env.OPENROUTER_API_KEY.substring(0, 10)}...)` : 'NOT SET ❌');

// Load providers config
console.log('\n📊 Provider Configuration:');
try {
    const { providers } = require('./lib/llm-providers.ts');

    providers.forEach((provider, index) => {
        const status = provider.enabled ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`\n${index + 1}. ${provider.name.toUpperCase()} ${status}`);
        console.log(`   Priority: ${provider.priority}`);
        console.log(`   Logic Model: ${provider.logicModel}`);
        console.log(`   Content Model: ${provider.contentModel}`);
        console.log(`   RPM Limit: ${provider.rpm}`);
        console.log(`   API Key: ${provider.apiKey ? provider.apiKey.substring(0, 10) + '...' : 'MISSING'}`);
    });

    const enabled = providers.filter(p => p.enabled);
    console.log('\n' + '='.repeat(60));
    console.log(`\n✅ ENABLED PROVIDERS: ${enabled.length} / ${providers.length}`);
    console.log(`   ${enabled.map(p => p.name).join(', ')}`);

    if (enabled.length === 0) {
        console.log('\n⚠️  WARNING: No providers enabled! Add at least one API key to .env');
    } else if (enabled.length === 1) {
        console.log('\n⚠️  NOTICE: Only 1 provider enabled. Consider adding backups for reliability.');
    } else {
        console.log('\n✅ GOOD: Multiple providers configured for automatic failover!');
    }

} catch (error) {
    console.error('\n❌ Error loading providers:', error.message);
}

console.log('\n' + '='.repeat(60) + '\n');
