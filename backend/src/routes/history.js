const express = require('express');
const supabase = require('../services/supabaseService');
const { ValidationError } = require('../utils/errors');

const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
        const symbol = req.query.symbol ? String(req.query.symbol).toUpperCase() : undefined;
        const rows = await supabase.listAnalyses({ limit, symbol });
        res.json(rows);
    } catch (e) {
        next(e);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        if (!id) throw new ValidationError('id is required');
        const row = await supabase.getAnalysisById(id);
        if (!row) return res.status(404).json({ error: { type: 'not_found', message: 'Record not found' } });
        res.json(row);
    } catch (e) {
        next(e);
    }
});

module.exports = router;
