const fetch = require('node-fetch');

async function quickTest() {
    const results = [];

    try {
        // Test 1: Health
        const health = await fetch('http://localhost:5000/api/health');
        results.push({ test: 'Health', pass: health.status === 200 });

        // Test 2: Admin creation
        const admin = await fetch('http://localhost:5000/api/dev/create-admin');
        results.push({ test: 'Admin', pass: admin.status === 200 });

        // Test 3: Login
        const login = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
        });
        const loginData = await login.json();
        const token = loginData.token;
        results.push({ test: 'Login', pass: !!token });

        if (token) {
            // Test 4: Session creation
            const session = await fetch('http://localhost:5000/api/sessions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            const sessionData = await session.json();
            results.push({ test: 'Session', pass: !!sessionData.id });

            if (sessionData.id) {
                // Test 5: Chat
                const chat = await fetch('http://localhost:5000/api/chat', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: sessionData.id,
                        message: 'test',
                        inputs: {},
                        messages: [],
                        discoveryComplete: false
                    })
                });
                const chatData = await chat.json();
                results.push({ test: 'Chat', pass: chat.status === 200 && !!chatData.message });
            }
        }

        // Summary
        const passed = results.filter(r => r.pass).length;
        console.log(`RESULTS: ${passed}/${results.length} passed`);
        results.forEach(r => console.log(`${r.pass ? '✅' : '❌'} ${r.test}`));

        process.exit(passed === results.length ? 0 : 1);
    } catch (error) {
        console.error('ERROR:', error.message);
        process.exit(1);
    }
}

quickTest();
