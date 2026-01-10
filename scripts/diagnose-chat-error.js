const fetch = require('node-fetch');

async function comprehensiveDiagnosis() {
    console.log('🔍 COMPREHENSIVE CHAT ERROR DIAGNOSIS\n');
    console.log('='.repeat(80));

    const results = [];

    try {
        // TEST 1: Server Health
        console.log('\n[1/7] Server Health...');
        const health = await fetch('http://localhost:5000/api/health');
        const healthOk = health.status === 200;
        results.push({ test: 'Server Health', pass: healthOk, status: health.status });
        console.log(healthOk ? '✅ PASS' : '❌ FAIL');

        // TEST 2: Create Admin
        console.log('\n[2/7] Create Admin User...');
        const admin = await fetch('http://localhost:5000/api/dev/create-admin');
        const adminData = await admin.json();
        const adminOk = admin.status === 200;
        results.push({ test: 'Admin Creation', pass: adminOk, data: adminData });
        console.log(adminOk ? '✅ PASS' : '❌ FAIL');
        if (adminData.message) console.log(`   ${adminData.message}`);

        // TEST 3: Login
        console.log('\n[3/7] Login Test...');
        const login = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@test.com', password: 'admin123' })
        });
        const loginData = await login.json();
        const loginOk = login.status === 200 && loginData.customToken;
        results.push({ test: 'Login', pass: loginOk, status: login.status });
        console.log(loginOk ? '✅ PASS' : '❌ FAIL');

        if (!loginOk) {
            console.log(`   Status: ${login.status}`);
            console.log(`   Response: ${JSON.stringify(loginData)}`);
            console.log('\n❌ CANNOT PROCEED - LOGIN FAILED');
            process.exit(1);
        }

        const token = loginData.customToken;
        console.log(`   Token: ${token.substring(0, 30)}...`);

        // TEST 4: Session Creation
        console.log('\n[4/7] Session Creation...');
        const session = await fetch('http://localhost:5000/api/sessions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const sessionData = await session.json();
        const sessionOk = session.status === 200 && sessionData.id;
        results.push({ test: 'Session Creation', pass: sessionOk, status: session.status });
        console.log(sessionOk ? '✅ PASS' : '❌ FAIL');

        if (!sessionOk) {
            console.log(`   Status: ${session.status}`);
            console.log(`   Response: ${JSON.stringify(sessionData)}`);
            console.log('\n❌ CANNOT PROCEED - SESSION CREATION FAILED');
            process.exit(1);
        }

        const sessionId = sessionData.id;
        console.log(`   Session ID: ${sessionId}`);

        // TEST 5: Chat Message
        console.log('\n[5/7] Chat Message (THE CRITICAL TEST)...');
        const chat = await fetch('http://localhost:5000/api/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sessionId: sessionId,
                message: 'Test message to diagnose chat error',
                inputs: {},
                messages: [],
                discoveryComplete: false
            })
        });

        const chatText = await chat.text();
        let chatData;
        try {
            chatData = JSON.parse(chatText);
        } catch {
            chatData = chatText;
        }

        const chatOk = chat.status === 200 && chatData.message;
        results.push({ test: 'Chat Message', pass: chatOk, status: chat.status });
        console.log(chatOk ? '✅ PASS' : '❌ FAIL');

        if (!chatOk) {
            console.log(`   Status: ${chat.status}`);
            console.log(`   Response: ${JSON.stringify(chatData, null, 2)}`);
            console.log('\n❌ CHAT ENDPOINT FAILED - THIS IS THE ISSUE');
        } else {
            console.log(`   AI Response: ${chatData.message.substring(0, 100)}...`);
        }

        // TEST 6: Message Persistence Check
        console.log('\n[6/7] Message Persistence...');
        const retrieve = await fetch(`http://localhost:5000/api/sessions/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const retrieveData = await retrieve.json();
        const messagesOk = retrieve.status === 200 && retrieveData.messages && retrieveData.messages.length > 0;
        results.push({ test: 'Message Persistence', pass: messagesOk, count: retrieveData.messages?.length || 0 });
        console.log(messagesOk ? '✅ PASS' : '❌ FAIL');
        console.log(`   Messages found: ${retrieveData.messages?.length || 0}`);

        // TEST 7: Debug Endpoint
        console.log('\n[7/7] Check Debug Endpoint...');
        const debug = await fetch('http://localhost:5000/api/debug/last-error');
        const debugData = await debug.json();
        console.log(debugData.lastError ? '⚠️  Error logged' : '✅ No errors');
        if (debugData.lastError) {
            console.log(`   Error: ${debugData.lastError.message}`);
            console.log(`   Stack: ${debugData.lastError.stack?.substring(0, 200)}...`);
        }

        // SUMMARY
        console.log('\n' + '='.repeat(80));
        console.log('📊 DIAGNOSIS SUMMARY');
        console.log('='.repeat(80));

        const passed = results.filter(r => r.pass).length;
        const failed = results.filter(r => !r.pass).length;

        console.log(`Tests Passed: ${passed}/${results.length}`);
        console.log(`Tests Failed: ${failed}/${results.length}`);

        console.log('\nResults:');
        results.forEach(r => {
            console.log(`${r.pass ? '✅' : '❌'} ${r.test}`);
        });

        if (failed > 0) {
            console.log('\n❌ ISSUES FOUND - SEE DETAILS ABOVE');
            process.exit(1);
        } else {
            console.log('\n🎉 ALL TESTS PASSED - CHAT SHOULD BE WORKING');
            process.exit(0);
        }

    } catch (error) {
        console.error('\n💥 DIAGNOSIS CRASHED:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

comprehensiveDiagnosis();
