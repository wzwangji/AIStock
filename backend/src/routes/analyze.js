const express = require('express');
const stockService = require('../services/stockService');
const llmService = require('../services/llmService');
const supabase = require('../services/supabaseService');
const { analyzeLimiter } = require('../middleware/rateLimiter');
const { ValidationError, SupabaseError } = require('../utils/errors');
const logService = require('../services/logService');

const router = express.Router();

router.post('/', analyzeLimiter, async (req, res, next) => {
    try {
        const { symbol } = req.body || {};
        if (!symbol) throw new ValidationError('symbol is required in request body');

        // 1. 拉取行情
        const stockData = await stockService.getQuote(symbol);

        // 2. 调用 LLM 拿到结构化分析
        const analysis = await llmService.analyzeStock(stockData);

        // 3. 入库（失败不阻塞响应，只记录错误）
        let saved = null;
        try {
            saved = await supabase.insertAnalysis({
                symbol: stockData.symbol,
                quoteData: stockData,
                analysis,
            });
        } catch (e) {
            const supaErr = e instanceof SupabaseError ? e : new SupabaseError(e.message, { cause: e });
            logService.recordError({
                type: supaErr.type,
                message: supaErr.message,
                stack: supaErr.stack,
                context: { symbol: stockData.symbol },
            });
        }

        res.json({
            id: saved?.id || null,
            symbol: stockData.symbol,
            quote: stockData.quote,
            profile: stockData.profile,
            analysis,
            saved: !!saved,
            created_at: saved?.created_at || new Date().toISOString(),
        });
    } catch (e) {
        next(e);
    }
});

module.exports = router;
