import * as dotenv from 'dotenv';
dotenv.config();

import { researchService } from '../server/lib/research/researcher';

async function finalHealthCheck() {
    console.log('🏥 Starting FINAL Research System Health Check...\n');

    let passed = 0;
    let total = 3;

    // 1. TAVILY
    try {
        process.stdout.write('1️⃣  Tavily (Fact Check)... ');
        const res = await researchService.conductResearch({ type: 'verify_facts', query: 'Paris' });
        if (res.data?.answer || res.summary) {
            console.log('✅ ONLINE');
            passed++;
        } else {
            console.log('⚠️  Unexpected Response');
        }
    } catch (e) {
        console.log('❌ OFFLINE');
        console.error(e);
    }

    // 2. EXA
    try {
        process.stdout.write('2️⃣  Exa (Trend Search)... ');
        const res = await researchService.conductResearch({ type: 'find_viral_trends', query: 'AI' });
        if (res.data?.results?.length > 0) {
            console.log('✅ ONLINE');
            passed++;
        } else {
            console.log('⚠️  No Results');
        }
    } catch (e) {
        console.log('❌ OFFLINE');
        console.error(e);
    }

    // 3. FIRECRAWL
    try {
        process.stdout.write('3️⃣  Firecrawl (Scraper)... ');
        const res = await researchService.conductResearch({ type: 'deep_doc_analysis', query: 'ignore', url: 'https://example.com' });
        if (res.data?.markdown) {
            console.log('✅ ONLINE');
            passed++;
        } else {
            console.log('⚠️  No Markdown');
        }
    } catch (e) {
        console.log('❌ OFFLINE');
        console.error(e);
    }

    console.log(`\n🎉 DIAGNOSTIC COMPLETE: ${passed}/${total} Services Operational.`);
}

finalHealthCheck();
