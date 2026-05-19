const express = require('express');
const stockService = require('../services/stockService');
const { stockLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/:symbol', stockLimiter, async (req, res, next) => {
    try {
        const data = await stockService.getQuote(req.params.symbol);
        res.json(data);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
