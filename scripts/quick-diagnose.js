const fetch = require('node-fetch');

async function diagnose() {
    console.log('DIAGNOSING CHAT ERROR\n');

    // Step 1: Login
    const login = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
    });
    const loginData = await login.json();
    const token = loginData.customToken;

    if (!token) {
        console.log('❌ LOGIN FAILED');
        return;
    }
    console.log('✅ Login successful');

    // Step 2: Create session
    const session = await fetch('http://localhost:5000/api/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
    });
    const sessionData = await session.json();
    const sessionId = sessionData.id;

    console.log(`✅ Session created: ${sessionId}`);
    console.log(`   Session data:`, JSON.stringify(sessionData, null, 2));

    // Step 3: Try to retrieve session immediately
    const retrieve = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const retrieveData = await retrieve.json();

    console.log(`\n📋 Session retrieval: ${retrieve.status}`);
    console.log(`   Data:`, JSON.stringify(retrieveData, null, 2));

    // Step 4: Try chat
    const chat = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            sessionId: sessionId,
            message: 'test',
            inputs: {},
            messages: [],
            discoveryComplete: false
        })
    });

    const chatText = await chat.text();
    console.log(`\n💬 Chat request: ${chat.status}`);
    console.log(`   Response:`, chatText);

    // Step 5: Check debug endpoint
    const debug = await fetch('http://localhost:5000/api/debug/last-error');
    const debugData = await debug.json();

    if (debugData.lastError) {
        console.log(`\n🐛 Last server error:`);
        console.log(`   Message: ${debugData.lastError.message}`);
        console.log(`   Stack: ${debugData.lastError.stack}`);
    }
}

diagnose().catch(console.error);
