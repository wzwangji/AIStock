require('dotenv').config();

const config = {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || '*',

    finnhub: {
        apiKey: process.env.FINNHUB_API_KEY || '',
        baseUrl: 'https://finnhub.io/api/v1',
    },

    llm: {
        apiKey: process.env.DEEPSEEK_API_KEY || '',
        baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    },

    supabase: {
        url: process.env.SUPABASE_URL || '',
        serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    },
};

function warnIfMissing(name, value) {
    if (!value) {
        // eslint-disable-next-line no-console
        console.warn(`[config] ${name} is not set — related features will fail at runtime`);
    }
}

warnIfMissing('FINNHUB_API_KEY', config.finnhub.apiKey);
warnIfMissing('DEEPSEEK_API_KEY', config.llm.apiKey);
warnIfMissing('SUPABASE_URL', config.supabase.url);
warnIfMissing('SUPABASE_SERVICE_ROLE_KEY', config.supabase.serviceRoleKey);

module.exports = config;
