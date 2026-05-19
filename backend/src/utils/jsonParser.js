const { JSONParseError } = require('./errors');

const ALLOWED_SENTIMENT = ['Bullish', 'Neutral', 'Bearish'];
const ALLOWED_RISK = ['Low', 'Medium', 'High'];
const REQUIRED_FIELDS = ['summary', 'sentiment', 'risk_level', 'key_factors', 'suggestion'];

// 尝试从模型可能夹杂解释文字的输出里抠出 JSON
function extractJsonBlock(text) {
    if (typeof text !== 'string') return null;
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fence) return fence[1].trim();
    const first = text.indexOf('{');
    const last = text.lastIndexOf('}');
    if (first >= 0 && last > first) return text.slice(first, last + 1);
    return null;
}

function parseLLMJson(raw) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    } catch (_) {
        const block = extractJsonBlock(raw);
        if (!block) {
            throw new JSONParseError('LLM did not return parseable JSON', { cause: { raw } });
        }
        try {
            parsed = JSON.parse(block);
        } catch (e) {
            throw new JSONParseError('LLM JSON block could not be parsed', { cause: { raw, block, err: e.message } });
        }
    }
    return parsed;
}

function validateAnalysis(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
        throw new JSONParseError('Parsed JSON is not an object');
    }
    const missing = REQUIRED_FIELDS.filter((k) => obj[k] === undefined || obj[k] === null);
    if (missing.length > 0) {
        throw new JSONParseError(`Missing required fields: ${missing.join(', ')}`, { cause: { obj } });
    }
    if (!ALLOWED_SENTIMENT.includes(obj.sentiment)) {
        throw new JSONParseError(`Invalid sentiment "${obj.sentiment}"`, { cause: { obj } });
    }
    if (!ALLOWED_RISK.includes(obj.risk_level)) {
        throw new JSONParseError(`Invalid risk_level "${obj.risk_level}"`, { cause: { obj } });
    }
    if (!Array.isArray(obj.key_factors)) {
        throw new JSONParseError('key_factors must be an array', { cause: { obj } });
    }
    return {
        summary: String(obj.summary),
        sentiment: obj.sentiment,
        risk_level: obj.risk_level,
        key_factors: obj.key_factors.map(String),
        suggestion: String(obj.suggestion),
    };
}

module.exports = { parseLLMJson, validateAnalysis, extractJsonBlock };
