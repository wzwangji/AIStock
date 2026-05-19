const axios = require('axios');
const config = require('../config');
const { LLMError, JSONParseError } = require('../utils/errors');
const { parseLLMJson, validateAnalysis } = require('../utils/jsonParser');
const logService = require('./logService');

const SYSTEM_PROMPT = `You are a professional equity analyst. You will receive a JSON snapshot of a stock's market data and company profile.

Return ONLY a single JSON object — no markdown, no code fences, no commentary — that strictly matches this schema:

{
  "summary": string,            // 2-4 concise Chinese sentences summarizing the stock's current state
  "sentiment": "Bullish" | "Neutral" | "Bearish",
  "risk_level": "Low" | "Medium" | "High",
  "key_factors": string[],      // 3-5 short Chinese bullet points driving your view
  "suggestion": string          // 1-2 Chinese sentences of actionable insight (not financial advice)
}

Rules:
- Output MUST be valid JSON parseable by JSON.parse.
- Do NOT include any text outside the JSON object.
- sentiment and risk_level MUST be one of the allowed enum values exactly.
- key_factors MUST be an array of strings.
- summary, key_factors and suggestion MUST be written in Simplified Chinese.
- Disclaim that this is not financial advice inside the suggestion field if appropriate.`;

function buildUserPrompt(stockData) {
    return `Analyze the following stock and respond with the JSON object as instructed. Use Simplified Chinese for all user-facing text fields.\n\nData:\n${JSON.stringify(stockData, null, 2)}`;
}

async function callDeepSeek(messages) {
    if (!config.llm.apiKey) {
        throw new LLMError('DEEPSEEK_API_KEY is not configured');
    }
    const url = `${config.llm.baseUrl.replace(/\/$/, '')}/chat/completions`;
    try {
        const { data } = await axios.post(
            url,
            {
                model: config.llm.model,
                messages,
                response_format: { type: 'json_object' },
                temperature: 0.4,
                max_tokens: 800,
            },
            {
                headers: {
                    Authorization: `Bearer ${config.llm.apiKey}`,
                    'Content-Type': 'application/json',
                },
                timeout: 60000,
            },
        );
        return data;
    } catch (e) {
        const status = e.response?.status;
        const body = e.response?.data;
        throw new LLMError(`LLM request failed (${status || 'network'}): ${e.message}`, {
            cause: { status, body },
        });
    }
}

async function analyzeStock(stockData) {
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildUserPrompt(stockData) },
    ];

    const tryOnce = async (extra) => {
        const msgs = extra ? [...messages, { role: 'user', content: extra }] : messages;
        const t0 = Date.now();
        let resp;
        try {
            resp = await callDeepSeek(msgs);
        } catch (err) {
            logService.recordLLM({
                model: config.llm.model,
                symbol: stockData.symbol,
                response_time_ms: Date.now() - t0,
                success: false,
                error_message: err.message,
            });
            throw err;
        }
        const elapsed = Date.now() - t0;
        const content = resp?.choices?.[0]?.message?.content || '';
        const usage = resp?.usage || {};
        try {
            const parsed = parseLLMJson(content);
            const validated = validateAnalysis(parsed);
            logService.recordLLM({
                model: config.llm.model,
                symbol: stockData.symbol,
                prompt_tokens: usage.prompt_tokens || 0,
                completion_tokens: usage.completion_tokens || 0,
                response_time_ms: elapsed,
                success: true,
            });
            return validated;
        } catch (e) {
            logService.recordLLM({
                model: config.llm.model,
                symbol: stockData.symbol,
                prompt_tokens: usage.prompt_tokens || 0,
                completion_tokens: usage.completion_tokens || 0,
                response_time_ms: elapsed,
                success: false,
                error_message: e.message,
            });
            throw e;
        }
    };

    try {
        return await tryOnce();
    } catch (e) {
        if (e instanceof JSONParseError) {
            // 重试一次，强化指令
            return await tryOnce(
                'Your previous response could not be parsed as strict JSON. Respond again with ONLY a single valid JSON object that matches the required schema. No prose, no markdown.',
            );
        }
        throw e;
    }
}

module.exports = { analyzeStock };
