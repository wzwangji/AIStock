const express = require('express');
const logService = require('../services/logService');
const supabase = require('../services/supabaseService');

const router = express.Router();

// 时间窗：1h | 24h，默认 1h；从 Supabase 拉数据，无配置时降级用内存缓冲
router.get('/stats', async (req, res, next) => {
    try {
        const window = req.query.window === '24h' ? 86_400 : 3_600;
        const rows = await supabase.getStats(window);

        let total = 0;
        let success = 0;
        let failure = 0;
        let totalMs = 0;
        const byEndpoint = {};
        const byStatus = {};

        if (Array.isArray(rows) && rows.length > 0) {
            for (const r of rows) {
                total++;
                if (r.status_code >= 200 && r.status_code < 400) success++;
                else failure++;
                totalMs += r.response_time_ms || 0;
                byEndpoint[r.path] = (byEndpoint[r.path] || 0) + 1;
                const sKey = String(r.status_code);
                byStatus[sKey] = (byStatus[sKey] || 0) + 1;
            }
            res.json({
                window_seconds: window,
                source: 'supabase',
                total,
                success,
                failure,
                success_rate: total ? Math.round((success / total) * 1000) / 10 : 0,
                error_rate: total ? Math.round((failure / total) * 1000) / 10 : 0,
                avg_response_ms: total ? Math.round(totalMs / total) : 0,
                by_endpoint: byEndpoint,
                by_status: byStatus,
            });
        } else {
            const mem = logService.computeStats(window);
            res.json({ window_seconds: window, source: 'memory', ...mem });
        }
    } catch (e) {
        next(e);
    }
});

router.get('/requests', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
        const rows = await supabase.listRequestLogs(limit);
        // 数据库无记录时回退到内存
        res.json(rows.length > 0 ? rows : logService.getRecentRequests(limit));
    } catch (e) {
        next(e);
    }
});

router.get('/llm', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
        const rows = await supabase.listLLMLogs(limit);
        res.json(rows.length > 0 ? rows : logService.getRecentLLM(limit));
    } catch (e) {
        next(e);
    }
});

router.get('/errors', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
        const rows = await supabase.listErrorLogs(limit);
        res.json(rows.length > 0 ? rows : logService.getRecentErrors(limit));
    } catch (e) {
        next(e);
    }
});

module.exports = router;
