import dotenv from 'dotenv';
dotenv.config();
import admin from 'firebase-admin';

console.log('=== Firebase Admin SDK Diagnosis ===\n');

// 1. Check environment variables
console.log('1. Environment Variables:');
console.log('   PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID || 'MISSING');
console.log('   CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL || 'MISSING');
console.log('   PRIVATE_KEY length:', process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length || 0);
console.log('   PRIVATE_KEY starts with:', process.env.FIREBASE_ADMIN_PRIVATE_KEY?.substring(0, 50) || 'MISSING');

// 2. Try to initialize Firebase Admin
console.log('\n2. Firebase Admin Initialization:');
try {
    const serviceAccount = {
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
    }
    console.log('   ✅ Firebase Admin initialized successfully');
    console.log('   Project:', admin.app().options.projectId);
} catch (error: any) {
    console.error('   ❌ Failed to initialize:', error.message);
    process.exit(1);
}

// 3. Test token verification with a sample decode
console.log('\n3. Testing Token Verification:');
console.log('   Instructions:');
console.log('   1. Log into your app in the browser');
console.log('   2. Open DevTools Console');
console.log('   3. Run: localStorage.getItem("firebaseAuthToken")');
console.log('   4. Copy the token and provide it when prompted');
console.log('\n   Or press Ctrl+C to skip this test');

// For now, just show what we'd test
const sampleToken = process.argv[2];
if (sampleToken) {
    admin.auth().verifyIdToken(sampleToken)
        .then((decodedToken) => {
            console.log('   ✅ Token verified successfully!');
            console.log('   User ID:', decodedToken.uid);
            console.log('   Email:', decodedToken.email);
            console.log('   Issued at:', new Date(decodedToken.iat * 1000));
            console.log('   Expires at:', new Date(decodedToken.exp * 1000));
        })
        .catch((error) => {
            console.error('   ❌ Token verification failed:', error.code);
            console.error('   Error:', error.message);
        });
} else {
    console.log('\n   Skipping token test (no token provided)');
    console.log('   Run with: npm run diagnose <token>');
}

console.log('\n4. Private Key Validation:');
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');
if (privateKey) {
    console.log('   Key format check:');
    console.log('   - Starts with BEGIN PRIVATE KEY:', privateKey.includes('BEGIN PRIVATE KEY'));
    console.log('   - Ends with END PRIVATE KEY:', privateKey.includes('END PRIVATE KEY'));
    console.log('   - Has newlines:', privateKey.includes('\n'));
    console.log('   - Character count:', privateKey.length);

    // Try to parse as credential
    try {
        admin.credential.cert({
            projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            privateKey: privateKey
        } as any);
        console.log('   ✅ Private key format is valid');
    } catch (error: any) {
        console.error('   ❌ Private key format error:', error.message);
    }
}

console.log('\n=== Diagnosis Complete ===');
