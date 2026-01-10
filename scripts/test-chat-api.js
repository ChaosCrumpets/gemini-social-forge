// Test script to diagnose the chat error
const https = require('https');
const http = require('http');

async function makeRequest(method, path, data, token) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function runTest() {
    try {
        console.log('1. Testing health endpoint...');
        const health = await makeRequest('GET', '/api/health');
        console.log('Health:', health);

        console.log('\n2. Creating admin user...');
        const admin = await makeRequest('GET', '/api/dev/create-admin');
        console.log('Admin:', admin.data);

        console.log('\n3. Logging in...');
        const login = await makeRequest('POST', '/api/auth/login', {
            email: 'admin@test.com',
            password: 'admin123'
        });
        console.log('Login status:', login.status);
        const token = login.data.token;

        console.log('\n4. Creating session...');
        const session = await makeRequest('POST', '/api/sessions', {}, token);
        console.log('Session:', session.data);
        const sessionId = session.data.id;

        console.log('\n5. Sending chat message...');
        const chat = await makeRequest('POST', '/api/chat', {
            sessionId: sessionId,
            message: 'Test message for diagnosis',
            inputs: {},
            messages: [],
            discoveryComplete: false
        }, token);
        console.log('Chat response status:', chat.status);
        console.log('Chat response:', JSON.stringify(chat.data, null, 2));

        console.log('\n6. Checking debug endpoint...');
        const debug = await makeRequest('GET', '/api/debug/last-error');
        console.log('Last error:', JSON.stringify(debug.data, null, 2));

    } catch (error) {
        console.error('Test failed:', error);
    }
}

runTest();
