import { performance } from 'perf_hooks';

interface BenchmarkResult {
    operation: string;
    iterations: number;
    totalTime: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    opsPerSecond: number;
}

/**
 * Benchmark a specific operation
 */
async function benchmark(
    name: string,
    operation: () => Promise<void>,
    iterations: number = 100
): Promise<BenchmarkResult> {
    const times: number[] = [];

    console.log(`\n🏃 Running benchmark: ${name} (${iterations} iterations)`);

    // Warm-up
    for (let i = 0; i < 10; i++) {
        await operation();
    }

    // Actual benchmark
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await operation();
        const end = performance.now();
        times.push(end - start);

        if ((i + 1) % 10 === 0) {
            process.stdout.write(`\r   Progress: ${i + 1}/${iterations}`);
        }
    }

    const totalTime = times.reduce((sum, t) => sum + t, 0);
    const avgTime = totalTime / iterations;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const opsPerSecond = 1000 / avgTime;

    const result: BenchmarkResult = {
        operation: name,
        iterations,
        totalTime,
        avgTime,
        minTime,
        maxTime,
        opsPerSecond,
    };

    console.log(`\n   ✅ Completed in ${totalTime.toFixed(2)}ms`);
    console.log(`   📊 Avg: ${avgTime.toFixed(2)}ms | Min: ${minTime.toFixed(2)}ms | Max: ${maxTime.toFixed(2)}ms`);
    console.log(`   ⚡ ${opsPerSecond.toFixed(2)} ops/sec\n`);

    return result;
}

/**
 * Run all benchmarks
 */
async function runBenchmarks() {
    console.log('🔬 C.A.L. Performance Benchmarks\n');
    console.log('='.repeat(60));

    const results: BenchmarkResult[] = [];

    let createdSessionId: string | undefined = process.env.TEST_SESSION_ID;

    // Benchmark 1: Session Creation
    results.push(await benchmark(
        'Session Creation',
        async () => {
            const response = await fetch('http://localhost:5001/api/sessions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
                },
                body: JSON.stringify({ name: 'Benchmark Session' }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(`Request failed: ${response.status} ${JSON.stringify(data)}`);

            // Capture ID for subsequent tests
            if (data.id) createdSessionId = String(data.id);

            await new Promise(r => setTimeout(r, 300));
        },
        20
    ));

    // Benchmark 2: Session List Retrieval
    results.push(await benchmark(
        'Get Recent Sessions',
        async () => {
            const response = await fetch('http://localhost:5001/api/sessions', {
                headers: {
                    'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
                },
            });
            const data = await response.json();
            if (!response.ok) throw new Error(`Request failed: ${response.status} ${JSON.stringify(data)}`);
            await new Promise(r => setTimeout(r, 200));
        },
        30
    ));

    // Benchmark 3: Firestore Read
    if (createdSessionId) {
        results.push(await benchmark(
            'Firestore Document Read',
            async () => {
                const response = await fetch(`http://localhost:5001/api/sessions/${createdSessionId}`, {
                    headers: {
                        'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
                    },
                });
                const data = await response.json();
                if (!response.ok) throw new Error(`Request failed: ${response.status} ${JSON.stringify(data)}`);
                await new Promise(r => setTimeout(r, 200));
            },
            30
        ));
    } else {
        console.warn('⚠️ Skipping Firestore Read benchmark (no session ID available)');
    }

    // Benchmark 4: Content Generation (most expensive)
    results.push(await benchmark(
        'Content Generation (Full Pipeline)',
        async () => {
            const response = await fetch('http://localhost:5001/api/generate-content', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.TEST_AUTH_TOKEN}`,
                },
                body: JSON.stringify({
                    inputs: {
                        topic: 'AI tips',
                        targetAudience: 'Developers',
                        platform: 'tiktok',
                    },
                    selectedHook: { id: 'mock-1', text: 'Mock Hook', type: 'Question', preview: 'Preview text' }
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                console.error(`❌ Benchmark failed: ${response.status} ${response.statusText}`, data);
                throw new Error(`Request failed with status ${response.status}`);
            }
            // Sleep to avoid rate limits
            await new Promise(r => setTimeout(r, 2000));
        },
        1 // Reduced iterations to 1 for speed
    ));

    // Print summary
    console.log('='.repeat(60));
    console.log('\n📈 BENCHMARK SUMMARY\n');

    results.forEach(result => {
        console.log(`${result.operation}:`);
        console.log(`   Average: ${result.avgTime.toFixed(2)}ms`);
        console.log(`   Throughput: ${result.opsPerSecond.toFixed(2)} ops/sec`);
        console.log('');
    });

    // Performance targets
    const targets = {
        'Session Creation': 200, // Should be under 200ms
        'Get Recent Sessions': 150,
        'Firestore Document Read': 100,
        'Content Generation (Full Pipeline)': 5000, // 5 seconds acceptable
    };

    console.log('🎯 PERFORMANCE TARGETS\n');

    let allPassed = true;
    results.forEach(result => {
        const target = targets[result.operation as keyof typeof targets];
        const passed = result.avgTime <= target;
        const status = passed ? '✅ PASS' : '❌ FAIL';

        console.log(`${status} ${result.operation}: ${result.avgTime.toFixed(2)}ms (target: ${target}ms)`);

        if (!passed) allPassed = false;
    });

    console.log('\n' + '='.repeat(60));
    console.log(allPassed ? '\n🎉 All benchmarks passed!' : '\n⚠️  Some benchmarks failed - optimization needed');
}

// Run benchmarks
runBenchmarks().catch(console.error);
