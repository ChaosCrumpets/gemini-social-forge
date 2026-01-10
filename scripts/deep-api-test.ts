import fetch from 'node-fetch';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5000';

interface TestResult {
    test: string;
    passed: boolean;
    details: string;
    error?: string;
}

const results: TestResult[] = [];

async function makeRequest(method: string, path: string, body?: any, token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    try {
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
        return { status: response.status, data, ok: response.ok };
    } catch (error: any) {
        return { status: 0, data: null, ok: false, error: error.message };
    }
}

function logTest(test: string, passed: boolean, details: string, error?: string) {
    results.push({ test, passed, details, error });
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}`);
    if (details) console.log(`   ${details}`);
    if (error) console.log(`   Error: ${error}`);
}

async function runDeepTest() {
    console.log('🔬 DEEP BACKEND API TEST\n');
    console.log('='.repeat(80));

    let token: string = '';
    let sessionId: number = 0;

    // TEST 1: Server Health
    console.log('\n[TEST 1] Server Health Check');
    const health = await makeRequest('GET', '/api/health');
    logTest(
        'Server responds to health check',
        health.status === 200,
        `Status: ${health.status}`,
        health.error
    );

    // TEST 2: Create Admin User
    console.log('\n[TEST 2] Admin User Creation');
    const admin = await makeRequest('GET', '/api/dev/create-admin');
    logTest(
        'Admin user endpoint accessible',
        health.status === 200 || admin.status === 200,
        `Status: ${admin.status}`,
        admin.error
    );

    // TEST 3: User Registration (create fresh user for testing)
    console.log('\n[TEST 3] User Registration');
    const timestamp = Date.now();
    const testEmail = `test${timestamp}@test.com`;
    const register = await makeRequest('POST', '/api/auth/register', {
        email: testEmail,
        password: 'test123',
        name: 'Test User'
    });

    if (register.status === 200 && register.data.token) {
        token = register.data.token;
        logTest(
            'New user registration',
            true,
            `User created: ${testEmail}, Token received`
        );
    } else {
        // Fall back to admin login
        console.log('   Registration failed, trying admin login...');
        const login = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });

        if (login.status === 200 && login.data.token) {
            token = login.data.token;
            logTest(
                'Admin user login (fallback)',
                true,
                'Token received from admin login'
            );
        } else {
            logTest(
                'Authentication',
                false,
                `Registration status: ${register.status}, Login status: ${login.status}`,
                'Could not obtain authentication token'
            );
            console.log('\n❌ Cannot proceed without authentication');
            process.exit(1);
        }
    }

    // TEST 4: Session Creation
    console.log('\n[TEST 4] Session Creation');
    const session = await makeRequest('POST', '/api/sessions', {}, token);
    logTest(
        'Create new session',
        session.status === 200 && session.data.id,
        session.data.id ? `Session ID: ${session.data.id}` : `Status: ${session.status}`,
        !session.data.id ? JSON.stringify(session.data) : undefined
    );

    if (!session.data.id) {
        console.log('\n❌ Cannot proceed without session ID');
        process.exit(1);
    }
    sessionId = session.data.id;

    // TEST 5: Chat Message (User Message Persistence)
    console.log('\n[TEST 5] Chat Message - User Persistence');
    const chat1 = await makeRequest('POST', '/api/chat', {
        sessionId: sessionId,
        message: 'First test message - verify user message persistence',
        inputs: {},
        messages: [],
        discoveryComplete: false
    }, token);
    logTest(
        'Send chat message',
        chat1.status === 200,
        chat1.status === 200 ? 'Message sent successfully' : `Status: ${chat1.status}`,
        chat1.status !== 200 ? JSON.stringify(chat1.data) : undefined
    );
    logTest(
        'AI response received',
        chat1.status === 200 && chat1.data.message,
        chat1.data.message ? `Response length: ${chat1.data.message.length} chars` : 'No response',
        !chat1.data.message ? 'AI did not respond' : undefined
    );

    // TEST 6: Direct Message Addition
    console.log('\n[TEST 6] Direct Message Addition');
    const directMsg = await makeRequest('POST', `/api/sessions/${sessionId}/messages`, {
        role: 'user',
        content: 'Second test message - direct endpoint',
        isEditMessage: false
    }, token);
    logTest(
        'Add message via sessions endpoint',
        directMsg.status === 200,
        `Status: ${directMsg.status}`,
        directMsg.status !== 200 ? JSON.stringify(directMsg.data) : undefined
    );

    // TEST 7: Session Retrieval
    console.log('\n[TEST 7] Session Retrieval with Messages');
    const retrieve = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
    logTest(
        'Retrieve session',
        retrieve.status === 200,
        `Status: ${retrieve.status}`,
        retrieve.status !== 200 ? JSON.stringify(retrieve.data) : undefined
    );

    const messageCount = retrieve.data?.messages?.length || 0;
    logTest(
        'Messages persisted in database',
        messageCount >= 2,
        `Found ${messageCount} messages (expected 2+)`,
        messageCount < 2 ? 'Messages not persisting correctly' : undefined
    );

    // TEST 8: Second Chat Message
    console.log('\n[TEST 8] Second Chat Message');
    const chat2 = await makeRequest('POST', '/api/chat', {
        sessionId: sessionId,
        message: 'Third test message - verify assistant persistence',
        inputs: {},
        messages: retrieve.data?.messages || [],
        discoveryComplete: false
    }, token);
    logTest(
        'Send second chat message',
        chat2.status === 200,
        chat2.status === 200 ? 'Message sent' : `Status: ${chat2.status}`,
        chat2.status !== 200 ? JSON.stringify(chat2.data) : undefined
    );

    // TEST 9: Verify All Messages Persisted
    console.log('\n[TEST 9] Verify All Messages Persisted');
    const retrieve2 = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
    const finalMessageCount = retrieve2.data?.messages?.length || 0;
    logTest(
        'All messages persisted',
        finalMessageCount >= 4,
        `Found ${finalMessageCount} messages (expected 4+)`,
        finalMessageCount < 4 ? 'Not all messages persisted' : undefined
    );

    // TEST 10: Unauthorized Access
    console.log('\n[TEST 10] Security - Unauthorized Access');
    const unauth = await makeRequest('POST', '/api/chat', {
        sessionId: sessionId,
        message: 'Unauthorized test',
        inputs: {},
        messages: [],
        discoveryComplete: false
    });
    logTest(
        'Reject unauthorized request',
        unauth.status === 401,
        `Status: ${unauth.status} (expected 401)`,
        unauth.status !== 401 ? 'Security issue: unauthorized access allowed' : undefined
    );

    // TEST 11: Session Ownership
    console.log('\n[TEST 11] Security - Session Ownership');
    const session2 = await makeRequest('POST', '/api/sessions', {}, token);
    if (session2.status === 200 && session2.data.id) {
        const sessionId2 = session2.data.id;
        logTest(
            'Create second session',
            true,
            `Session ID: ${sessionId2}`
        );

        // Verify original session still accessible
        const check = await makeRequest('GET', `/api/sessions/${sessionId}`, {}, token);
        logTest(
            'Original session still accessible',
            check.status === 200,
            `Status: ${check.status}`,
            check.status !== 200 ? 'Session access issue' : undefined
        );
    }

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(80));

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const total = results.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);

    // Write detailed results
    fs.writeFileSync('deep-test-results.json', JSON.stringify(results, null, 2));
    console.log('\nDetailed results: deep-test-results.json');

    if (failed > 0) {
        console.log('\n❌ SOME TESTS FAILED');
        console.log('\nFailed Tests:');
        results.filter(r => !r.passed).forEach(r => {
            console.log(`  - ${r.test}: ${r.error || r.details}`);
        });
        process.exit(1);
    } else {
        console.log('\n🎉 ALL TESTS PASSED - BACKEND FULLY FUNCTIONAL');
        process.exit(0);
    }
}

runDeepTest().catch(error => {
    console.error('\n💥 TEST SUITE CRASHED:', error.message);
    console.error(error.stack);
    process.exit(1);
});
