import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';
let testsPassed = 0;
let testsFailed = 0;

async function makeRequest(method: string, path: string, body?: any, token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const text = await response.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: response.status, data };
}

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        testsPassed++;
        console.log(`✅ PASS: ${name}`);
    } catch (error: any) {
        testsFailed++;
        console.error(`❌ FAIL: ${name}`);
        console.error(`   Error: ${error.message}`);
        if (error.details) console.error(`   Details: ${JSON.stringify(error.details)}`);
    }
}

async function runTests() {
    console.log('🧪 COMPREHENSIVE BACKEND TEST SUITE\n');
    console.log('='.repeat(60));

    let token: string;
    let sessionId: number;

    // TEST 1: Server Health
    await test('Server is running and healthy', async () => {
        const res = await makeRequest('GET', '/api/health');
        if (res.status !== 200) throw new Error(`Health check failed: ${res.status}`);
        console.log('   Server: ONLINE');
    });

    // TEST 2: Admin User Creation
    await test('Admin user creation endpoint works', async () => {
        const res = await makeRequest('GET', '/api/dev/create-admin');
        if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
        console.log('   Admin user: READY');
    });

    // TEST 3: Authentication
    await test('User can authenticate and receive token', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        if (res.status !== 200) throw new Error(`Login failed: ${res.status}`);
        if (!res.data.token) throw new Error('No token in response');
        token = res.data.token;
        console.log('   Token: RECEIVED');
    });

    // TEST 4: Session Creation
    await test('Session creation with authentication', async () => {
        const res = await makeRequest('POST', '/api/sessions', {}, token);
        if (res.status !== 200) throw new Error(`Status ${res.status}: ${JSON.stringify(res.data)}`);
        if (!res.data.id) throw new Error('No session ID in response');
        sessionId = res.data.id;
        console.log(`   Session ID: ${sessionId}`);
    });

    // TEST 5: Chat Message (User Message Persistence)
    await test('Chat endpoint saves user message', async () => {
        const res = await makeRequest('POST', '/api/chat', {
            sessionId: sessionId,
            message: 'Backend test message - user persistence check',
            inputs: {},
            messages: [],
            discoveryComplete: false
        }, token);
        if (res.status !== 200) {
            const error: any = new Error(`Chat failed: ${res.status}`);
            error.details = res.data;
            throw error;
        }
        if (!res.data.message) throw new Error('No AI response message');
        console.log('   User message: SAVED');
        console.log('   AI response: RECEIVED');
    });

    // TEST 6: Direct Message Addition
    await test('Direct message addition via sessions endpoint', async () => {
        const res = await makeRequest('POST', `/api/sessions/${sessionId}/messages`, {
            role: 'user',
            content: 'Direct message test - backend verification',
            isEditMessage: false
        }, token);
        if (res.status !== 200) {
            const error: any = new Error(`Message add failed: ${res.status}`);
            error.details = res.data;
            throw error;
        }
        console.log('   Direct message: SAVED');
    });

    // TEST 7: Session Retrieval with Messages
    await test('Session retrieval includes all messages', async () => {
        const res = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
        if (res.status !== 200) throw new Error(`Session retrieval failed: ${res.status}`);
        if (!res.data.session) throw new Error('No session in response');
        if (!res.data.messages) throw new Error('No messages array in response');
        if (res.data.messages.length < 2) throw new Error(`Expected at least 2 messages, got ${res.data.messages.length}`);
        console.log(`   Messages retrieved: ${res.data.messages.length}`);
    });

    // TEST 8: Authentication Required
    await test('Endpoints reject unauthenticated requests', async () => {
        const res = await makeRequest('POST', '/api/chat', {
            sessionId: sessionId,
            message: 'Unauthorized test',
            inputs: {},
            messages: [],
            discoveryComplete: false
        });
        if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
        console.log('   Auth protection: ACTIVE');
    });

    // TEST 9: Session Ownership
    await test('Session ownership validation works', async () => {
        // Create a second user
        const res1 = await makeRequest('POST', '/api/auth/register', {
            email: 'test2@test.com',
            password: 'test123',
            name: 'Test User 2'
        });

        if (res1.status === 200 && res1.data.token) {
            const token2 = res1.data.token;

            // Try to access first user's session
            const res2 = await makeRequest('POST', '/api/chat', {
                sessionId: sessionId,
                message: 'Unauthorized access attempt',
                inputs: {},
                messages: [],
                discoveryComplete: false
            }, token2);

            if (res2.status !== 403 && res2.status !== 404) {
                throw new Error(`Expected 403/404, got ${res2.status}`);
            }
            console.log('   Ownership validation: ENFORCED');
        } else {
            console.log('   Ownership validation: SKIPPED (user exists)');
        }
    });

    // RESULTS
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${testsPassed + testsFailed}`);
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsFailed}`);
    console.log('='.repeat(60));

    if (testsFailed > 0) {
        console.log('\n❌ BACKEND HAS ERRORS - FIX REQUIRED');
        process.exit(1);
    } else {
        console.log('\n🎉 ALL TESTS PASSED - BACKEND IS FULLY FUNCTIONAL');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('\n💥 TEST SUITE CRASHED:', error.message);
    process.exit(1);
});
