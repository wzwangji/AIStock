const rateLimit = require('express-rate-limit');
const logService = require('../services/logService');

function makeLimiter({ windowMs, max, label }) {
    return rateLimit({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res /* , next, options */) => {
            res.locals.errorType = 'rate_limit';
            logService.recordError({
                type: 'rate_limit',
                message: `Rate limit exceeded on ${label}`,
                context: { path: req.path, ip: req.ip, max, windowMs },
            });
            res.status(429).json({
                error: {
                    type: 'rate_limit',
                    message: `Too many requests on ${label}. Please retry later.`,
                },
            });
        },
    });
}

const globalLimiter = makeLimiter({ windowMs: 60_000, max: 100, label: 'global' });
const analyzeLimiter = makeLimiter({ windowMs: 60_000, max: 10, label: 'analyze' });
const stockLimiter = makeLimiter({ windowMs: 60_000, max: 30, label: 'stock' });

module.exports = { globalLimiter, analyzeLimiter, stockLimiter };
