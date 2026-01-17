
import { storage, sessionStorage } from '../server/storage';

async function testUpdate() {
    try {
        console.log('Creating session...');
        const session = await sessionStorage.createSession('test-user');
        console.log('Session created:', session.id);

        console.log('Attempting update with undefined value...');
        // This should throw if my hypothesis is correct
        await sessionStorage.updateSession(session.id, {
            inputs: { topic: 'test' },
            visualContext: undefined
        });

        console.log('Update success!');
    } catch (e) {
        console.error('Update FAILED as expected:', e);
    }
}

testUpdate();
