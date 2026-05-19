const axios = require('axios');
const config = require('../config');
const { StockApiError, ValidationError } = require('../utils/errors');

const SYMBOL_REGEX = /^[A-Z][A-Z0-9.\-]{0,9}$/;

function normalizeSymbol(input) {
    if (typeof input !== 'string') {
        throw new ValidationError('symbol must be a string');
    }
    const s = input.trim().toUpperCase();
    if (!SYMBOL_REGEX.test(s)) {
        throw new ValidationError(`Invalid symbol "${input}"`);
    }
    return s;
}

async function finnhubGet(path, params) {
    if (!config.finnhub.apiKey) {
        throw new StockApiError('FINNHUB_API_KEY is not configured');
    }
    const url = `${config.finnhub.baseUrl}${path}`;
    try {
        const { data } = await axios.get(url, {
            params: { ...params, token: config.finnhub.apiKey },
            timeout: 10000,
        });
        return data;
    } catch (e) {
        const status = e.response?.status;
        const body = e.response?.data;
        throw new StockApiError(
            `Finnhub request failed (${status || 'network'}): ${e.message}`,
            { cause: { status, body } },
        );
    }
}

// Finnhub quote 接口字段含义：
// c=current, d=change, dp=percent change, h=high, l=low, o=open, pc=previous close, t=timestamp
async function getQuote(symbolRaw) {
    const symbol = normalizeSymbol(symbolRaw);
    const [quote, profile] = await Promise.all([
        finnhubGet('/quote', { symbol }),
        finnhubGet('/stock/profile2', { symbol }).catch(() => ({})),
    ]);

    if (!quote || quote.c === 0 || quote.c === null || quote.c === undefined) {
        throw new StockApiError(`No quote returned for symbol "${symbol}" — may be invalid or unsupported on Finnhub free tier`);
    }

    return {
        symbol,
        quote: {
            current: quote.c,
            change: quote.d,
            percent_change: quote.dp,
            high: quote.h,
            low: quote.l,
            open: quote.o,
            previous_close: quote.pc,
            timestamp: quote.t,
        },
        profile: {
            name: profile.name || null,
            ticker: profile.ticker || symbol,
            exchange: profile.exchange || null,
            industry: profile.finnhubIndustry || null,
            country: profile.country || null,
            currency: profile.currency || null,
            market_cap: profile.marketCapitalization || null,
            logo: profile.logo || null,
            weburl: profile.weburl || null,
            ipo: profile.ipo || null,
        },
    };
}

module.exports = { getQuote, normalizeSymbol };
