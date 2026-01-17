
import { storage, sessionStorage } from '../server/storage';

async function verifyFix() {
    try {
        console.log('Creating test session...');
        const session = await sessionStorage.createSession('test-verify-user');
        console.log('Session created:', session.id);

        console.log('Attempting update with undefined value (Verification)...');

        // This should NO LONGER throw
        const updated = await sessionStorage.updateSession(session.id, {
            inputs: { topic: 'test-verified' },
            visualContext: undefined
        });

        if (updated && updated.inputs.topic === 'test-verified') {
            console.log('VERIFICATION SUCCESS: Session updated despite undefined value.');
        } else {
            console.log('VERIFICATION FAILED: Session not updated correctly.');
        }

    } catch (e) {
        console.error('VERIFICATION FAILED with Error:', e);
        process.exit(1);
    }
}

verifyFix();
