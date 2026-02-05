/**
 * Artillery processor for custom logic
 */

module.exports = {
    setAuthToken,
    generateRandomContent,
    logResults,
};

function setAuthToken(context, events, done) {
    // Store token for subsequent requests
    if (context.vars.authToken) {
        context.vars.headers = {
            Authorization: `Bearer ${context.vars.authToken}`,
        };
    }
    return done();
}

function generateRandomContent(context, events, done) {
    const topics = [
        'AI productivity hacks',
        'Morning routine tips',
        'Fitness motivation',
        'Coding tutorials',
        'Business growth strategies',
    ];

    const audiences = [
        'Entrepreneurs',
        'Students',
        'Developers',
        'Fitness enthusiasts',
        'Content creators',
    ];

    context.vars.topic = topics[Math.floor(Math.random() * topics.length)];
    context.vars.audience = audiences[Math.floor(Math.random() * audiences.length)];

    return done();
}

function logResults(context, events, done) {
    console.log(`[LoadTest] Session ${context.vars.sessionId} created`);
    return done();
}
