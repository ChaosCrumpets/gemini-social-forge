import 'dotenv/config';
import { providers } from "../server/lib/llm-providers";
import { llmRouter } from "../server/lib/llm-router";

async function verifyRouter() {
    console.log("🔍 Starting Mission B Router Verification...");

    // TEST 1: Configuration Integrity
    console.log("\n[TEST 1] Checking Provider Configuration...");
    const enabledProviders = providers.filter(p => p.enabled);
    console.log(`Enabled Providers: ${enabledProviders.map(p => p.name).join(', ')}`);

    // Verify Key Formats
    for (const p of enabledProviders) {
        let valid = false;
        if (p.name === 'gemini' && p.apiKey.startsWith('AIza')) valid = true;
        if (p.name === 'claude' && p.apiKey.startsWith('sk-ant')) valid = true;
        if (p.name === 'groq' && p.apiKey.startsWith('gsk_')) valid = true;
        if (p.name === 'openrouter' && p.apiKey.startsWith('sk-or')) valid = true;

        if (valid) {
            console.log(`✅ ${p.name}: Key format valid`);
        } else {
            console.warn(`⚠️  ${p.name}: Potential key format issue (starts with ${p.apiKey.substring(0, 4)}...)`);
        }
    }

    if (enabledProviders.length < 2) {
        console.warn("⚠️  WARNING: Less than 2 providers enabled. Failover will not work effectively.");
    } else {
        console.log("✅ Provider redundancy check passed.");
    }

    // TEST 2: Round Robin Logic Simulation
    console.log("\n[TEST 2] Checking Router State...");
    const stats = llmRouter.getStats();
    console.log("Initial Router Stats:", JSON.stringify(stats, null, 2));

    if (stats.enabledProviders.length !== enabledProviders.length) {
        console.error("❌ Mismatch between config and router state!");
    } else {
        console.log("✅ Router state matches configuration.");
    }

    // TEST 3: Live Connectivity Test (Happy Path)
    console.log("\n[TEST 3] Performing Live connectivity test (Logic Category)...");
    try {
        const start = Date.now();
        const response = await llmRouter.generate({
            messages: [{ role: 'user', content: 'What is 2+2? Reply with just the number.' }],
            category: 'logic',
            maxTokens: 10
        });
        const duration = Date.now() - start;

        console.log(`Response received from: ${response.provider}`);
        console.log(`Model used: ${response.model}`);
        console.log(`Text: "${response.text.trim()}"`);
        console.log(`Latency: ${duration}ms`);

        if (response.text.includes('4')) {
            console.log("✅ Live test successful: Logic Verified.");
        } else {
            console.warn("⚠️  Live test response unexpected content.");
        }
    } catch (error) {
        console.error("❌ Live test failed:", error);
    }

    console.log("\n🔍 Verification Complete.");
}

verifyRouter().catch(console.error);
