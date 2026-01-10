import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    details?: any;
}

const results: TestResult[] = [];

async function makeRequest(method: string, path: string, body?: any, token?: string) {
    const headers: any = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();
    return { status: response.status, data };
}

async function test(name: string, fn: () => Promise<void>) {
    try {
        await fn();
        results.push({ name, passed: true });
        console.log(`✅ ${name}`);
    } catch (error: any) {
        results.push({ name, passed: false, error: error.message });
        console.error(`❌ ${name}: ${error.message}`);
    }
}

async function runTests() {
    console.log('🧪 Starting Backend API Tests\n');

    let token: string;
    let sessionId: number;

    // Test 1: Health Check
    await test('Health endpoint responds', async () => {
        const res = await makeRequest('GET', '/api/health');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // Test 2: Create admin user
    await test('Create admin user', async () => {
        const res = await makeRequest('GET', '/api/dev/create-admin');
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    });

    // Test 3: Login
    await test('Login with admin credentials', async () => {
        const res = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        if (!res.data.token) throw new Error('No token in response');
        token = res.data.token;
    });

    // Test 4: Create session
    await test('Create new session', async () => {
        const res = await makeRequest('POST', '/api/sessions', {}, token);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        if (!res.data.id) throw new Error('No session ID in response');
        sessionId = res.data.id;
        console.log(`   Session ID: ${sessionId}`);
    });

    // Test 5: Send chat message
    await test('Send chat message (user message persistence)', async () => {
        const res = await makeRequest('POST', '/api/chat', {
            sessionId: sessionId,
            message: 'Test message for backend verification',
            inputs: {},
            messages: [],
            discoveryComplete: false
        }, token);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
        if (!res.data.message) throw new Error('No AI response message');
    });

    // Test 6: Add message directly via sessions endpoint
    await test('Add message via /api/sessions/:id/messages', async () => {
        const res = await makeRequest('POST', `/api/sessions/${sessionId}/messages`, {
            role: 'user',
            content: 'Direct message test',
            isEditMessage: false
        }, token);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}: ${JSON.stringify(res.data)}`);
    });

    // Test 7: Get session with messages
    await test('Retrieve session with messages', async () => {
        const res = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        if (!res.data.session) throw new Error('No session in response');
        if (!res.data.messages) throw new Error('No messages array in response');
        console.log(`   Messages count: ${res.data.messages.length}`);
    });

    // Test 8: Unauthorized access (no token)
    await test('Reject unauthorized chat request', async () => {
        const res = await makeRequest('POST', '/api/chat', {
            sessionId: sessionId,
            message: 'Unauthorized test',
            inputs: {},
            messages: [],
            discoveryComplete: false
        });
        if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    });

    // Test 9: Invalid session ID
    await test('Reject invalid session ID', async () => {
        const res = await makeRequest('POST', '/api/chat', {
            sessionId: 999999999,
            message: 'Test with invalid session',
            inputs: {},
            messages: [],
            discoveryComplete: false
        }, token);
        if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
    });

    // Summary
    console.log('\n📊 Test Summary:');
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${results.filter(r => r.passed).length}`);
    console.log(`Failed: ${results.filter(r => !r.passed).length}`);

    const failed = results.filter(r => !r.passed);
    if (failed.length > 0) {
        console.log('\n❌ Failed Tests:');
        failed.forEach(r => console.log(`  - ${r.name}: ${r.error}`));
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed!');
        process.exit(0);
    }
}

runTests().catch(error => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
