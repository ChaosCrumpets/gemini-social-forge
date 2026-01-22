
import 'dotenv/config';
import { detectNiche } from './lib/enrichment/nicheDetector';
import { getKnowledgeBase, enrichInputs } from './lib/enrichment/knowledgeRetrieval';
import { inferMissingContext } from './lib/enrichment/intelligentInference';

async function runTest() {
    console.log("🧪 Starting Enrichment Verification Test...\n");

    const inputs = {
        topic: "Cold calling strategies for B2B SaaS",
        goal: "educate"
    };

    console.log("📝 Input:", JSON.stringify(inputs, null, 2));

    // 1. Detection
    console.log("\n🔍 1. Running Detection...");
    const detection = detectNiche(inputs);
    console.log("   -> Detected:", detection.nicheId);
    console.log("   -> Confidence:", detection.confidence);

    if (detection.confidence === 0) {
        console.error("❌ Detection failed to find a niche.");
        return;
    }

    // 2. Retrieval
    console.log("\n📚 2. Retrieving Knowledge Base...");
    const kb = await getKnowledgeBase(detection.nicheId);
    console.log("   -> Loaded KB:", kb.displayName);
    const audiencePreview = kb.audienceProfile?.primaryAudience?.substring(0, 50) + "...";
    console.log("   -> Audience Profile:", audiencePreview);

    // 3. Inference
    console.log("\n🧠 3. Running Intelligent Inference (Mock/Real)...");
    // Note: This might make a real LLM call if not mocked.
    try {
        const inferred = await inferMissingContext(inputs, detection, kb);
        console.log("   -> Inferred Data Keys:", Object.keys(inferred));
        if (Object.keys(inferred).length > 0) {
            console.log("   -> Sample Inference:", JSON.stringify(inferred, null, 2));
        } else {
            console.log("   -> No inference needed or returned empty (expected behavior for some cases).");
        }

        // 4. Enrichment
        console.log("\n✨ 4. Merging & Enriching...");
        const enriched = enrichInputs({ ...inputs, ...inferred }, kb, detection);

        if (enriched._enrichment) {
            console.log("✅ SUCCESS: '_enrichment' field present!");
            console.log("   -> Niche:", enriched._enrichment.nicheDisplayName);
            console.log("   -> Best Practices Count:", Object.keys(enriched._enrichment.nicheBestPractices || {}).length);
        } else {
            console.error("❌ FAILURE: '_enrichment' field missing.");
        }

    } catch (error) {
        console.error("❌ Error during inference:", error);
    }
}

runTest().catch(console.error);
