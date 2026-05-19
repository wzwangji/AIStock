const { AppError } = require('../utils/errors');
const logService = require('../services/logService');

// 统一异常处理：分类 -> 写入 error_logs -> 返回安全 JSON
// 重要：参数列表必须是 4 个，Express 才会识别为错误中间件
// eslint-disable-next-line no-unused-vars
module.exports = function errorHandler(err, req, res, _next) {
    const isApp = err instanceof AppError;
    const type = isApp ? err.type : 'unknown';
    const status = isApp ? err.status : 500;
    const message = err.message || 'Internal Server Error';

    res.locals.errorType = type;

    logService.recordError({
        type,
        message,
        stack: err.stack,
        context: {
            method: req.method,
            path: req.path,
            params: req.params,
            query: req.query,
            cause: err.cause || null,
        },
    });

    res.status(status).json({
        error: {
            type,
            message,
        },
    });
};
