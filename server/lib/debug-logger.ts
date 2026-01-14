// server/lib/debug-logger.ts
export const debugLog = (stage: string, data: any) => {
    const timestamp = new Date().toISOString();
    console.log(`\n${'='.repeat(80)}`);
    console.log(`[${timestamp}] 🔵 ${stage}`);
    console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(80));
};

export const debugError = (stage: string, error: any) => {
    const timestamp = new Date().toISOString();
    console.error(`\n${'!'.repeat(80)}`);
    console.error(`[${timestamp}] 🔴 ERROR at ${stage}`);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Full error:', error);
    console.error('!'.repeat(80));
};
