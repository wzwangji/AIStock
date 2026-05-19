const logService = require('../services/logService');

// 每个请求记录方法/路径/状态/耗时；进入内存缓冲并异步写库
module.exports = function requestLogger(req, res, next) {
    const start = Date.now();
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const userAgent = req.headers['user-agent'] || '';

    res.on('finish', () => {
        // 跳过监控接口自身，避免无限增长
        if (req.path.startsWith('/api/monitor')) return;

        const errorType = res.locals.errorType || null;
        logService.recordRequest({
            method: req.method,
            path: req.path,
            status_code: res.statusCode,
            response_time_ms: Date.now() - start,
            ip,
            user_agent: userAgent,
            error_type: errorType,
        });
    });

    next();
};
