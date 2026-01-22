import { format } from 'date-fns';

const DEBUG = process.env.DEBUG_LOGS === "true";

export const log = {
    info: (message: string, ...args: any[]) => {
        if (DEBUG) console.log(`[INFO] [${format(new Date(), 'HH:mm:ss')}] ${message}`, ...args);
    },

    success: (message: string, ...args: any[]) => {
        console.log(`✅ [${format(new Date(), 'HH:mm:ss')}] ${message}`, ...args);
    },

    warn: (message: string, ...args: any[]) => {
        console.warn(`⚠️  [${format(new Date(), 'HH:mm:ss')}] ${message}`, ...args);
    },

    error: (message: string, ...args: any[]) => {
        console.error(`❌ [${format(new Date(), 'HH:mm:ss')}] ${message}`, ...args);
    },

    router: (message: string, ...args: any[]) => {
        if (DEBUG) console.log(`[Router] ${message}`, ...args);
    },

    quality: (data: {
        score: number,
        model: string,
        provider: string,
        duration: number,
        passed: boolean,
        issues: string[],
        tokens?: number
    }) => {
        const { score, model, provider, duration, passed, issues, tokens } = data;
        const statusIcon = passed ? '✨' : '⚠️';
        const colorScore = score >= 90 ? '🟢' : score >= 70 ? '🟡' : '🔴';

        console.log(`\n${statusIcon} [QUALITY REPORT] ${colorScore} Score: ${score}/100`);
        console.log(`   Model: ${provider}/${model} ${tokens ? `(${tokens} tokens)` : ''}`);
        console.log(`   Speed: ${duration}ms`);

        if (issues.length > 0) {
            console.log(`   Remaining Issues: ${issues.length}`);
            if (DEBUG) {
                issues.forEach(issue => console.log(`     - ${issue}`));
            }
        }
        console.log('');
    }
};
