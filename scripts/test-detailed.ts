import fetch from 'node-fetch';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5000';
const results: any[] = [];

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

async function test(name: string, fn: () => Promise<any>) {
    console.log(`Testing: ${name}...`);
    try {
        const result = await fn();
        results.push({ name, status: 'PASS', result });
        console.log(`✅ PASS\n`);
        return result;
    } catch (error: any) {
        results.push({ name, status: 'FAIL', error: error.message, stack: error.stack });
        console.log(`❌ FAIL: ${error.message}\n`);
        throw error;
    }
}

async function runTests() {
    console.log('Starting backend tests...\n');

    try {
        // Test 1
        await test('Health check', async () => {
            const res = await makeRequest('GET', '/api/health');
            if (res.status !== 200) throw new Error(`Status: ${res.status}`);
            return res.data;
        });

        // Test 2
        await test('Create admin', async () => {
            const res = await makeRequest('GET', '/api/dev/create-admin');
            if (res.status !== 200) throw new Error(`Status: ${res.status}, Data: ${JSON.stringify(res.data)}`);
            return res.data;
        });

        // Test 3
        const token = await test('Login', async () => {
            const res = await makeRequest('POST', '/api/auth/login', {
                email: 'admin@test.com',
                password: 'admin123'
            });
            if (res.status !== 200) throw new Error(`Status: ${res.status}, Data: ${JSON.stringify(res.data)}`);
            if (!res.data.token) throw new Error('No token in response');
            return res.data.token;
        });

        // Test 4
        const sessionId = await test('Create session', async () => {
            const res = await makeRequest('POST', '/api/sessions', {}, token);
            if (res.status !== 200) throw new Error(`Status: ${res.status}, Data: ${JSON.stringify(res.data)}`);
            if (!res.data.id) throw new Error('No session ID');
            return res.data.id;
        });

        // Test 5
        await test('Send chat message', async () => {
            const res = await makeRequest('POST', '/api/chat', {
                sessionId: sessionId,
                message: 'Test message',
                inputs: {},
                messages: [],
                discoveryComplete: false
            }, token);
            if (res.status !== 200) throw new Error(`Status: ${res.status}, Data: ${JSON.stringify(res.data)}`);
            if (!res.data.message) throw new Error('No AI response');
            return res.data;
        });

        // Test 6
        await test('Add direct message', async () => {
            const res = await makeRequest('POST', `/api/sessions/${sessionId}/messages`, {
                role: 'user',
                content: 'Direct test',
                isEditMessage: false
            }, token);
            if (res.status !== 200) throw new Error(`Status: ${res.status}, Data: ${JSON.stringify(res.data)}`);
            return res.data;
        });

        // Test 7
        await test('Retrieve session', async () => {
            const res = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
            if (res.status !== 200) throw new Error(`Status: ${res.status}`);
            if (!res.data.messages || res.data.messages.length < 2) {
                throw new Error(`Expected 2+ messages, got ${res.data.messages?.length || 0}`);
            }
            return { messageCount: res.data.messages.length };
        });

        console.log('\n🎉 ALL TESTS PASSED');

    } catch (error) {
        console.log('\n❌ TEST SUITE FAILED');
    }

    // Write results to file
    fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
    console.log('\nResults written to test-results.json');

    const failed = results.filter(r => r.status === 'FAIL');
    process.exit(failed.length > 0 ? 1 : 0);
}

runTests();
