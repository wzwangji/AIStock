const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const { SupabaseError } = require('../utils/errors');

let client = null;

function getClient() {
    if (client) return client;
    if (!config.supabase.url || !config.supabase.serviceRoleKey) {
        return null;
    }
    client = createClient(config.supabase.url, config.supabase.serviceRoleKey, {
        auth: { persistSession: false },
    });
    return client;
}

async function insertAnalysis({ symbol, quoteData, analysis }) {
    const c = getClient();
    if (!c) throw new SupabaseError('Supabase client not configured');
    const { data, error } = await c
        .from('analyses')
        .insert({
            symbol,
            quote_data: quoteData,
            analysis,
            sentiment: analysis.sentiment,
            risk_level: analysis.risk_level,
        })
        .select()
        .single();
    if (error) throw new SupabaseError(`insertAnalysis failed: ${error.message}`, { cause: error });
    return data;
}

async function listAnalyses({ limit = 50, symbol } = {}) {
    const c = getClient();
    if (!c) throw new SupabaseError('Supabase client not configured');
    let q = c
        .from('analyses')
        .select('id, symbol, sentiment, risk_level, created_at')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (symbol) q = q.eq('symbol', symbol);
    const { data, error } = await q;
    if (error) throw new SupabaseError(`listAnalyses failed: ${error.message}`, { cause: error });
    return data;
}

async function getAnalysisById(id) {
    const c = getClient();
    if (!c) throw new SupabaseError('Supabase client not configured');
    const { data, error } = await c.from('analyses').select('*').eq('id', id).maybeSingle();
    if (error) throw new SupabaseError(`getAnalysisById failed: ${error.message}`, { cause: error });
    return data;
}

// 监控类查询 —— 失败时返回空数组以保证 Monitor 页面降级可读
async function listRequestLogs(limit = 100) {
    const c = getClient();
    if (!c) return [];
    const { data } = await c
        .from('request_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function listLLMLogs(limit = 100) {
    const c = getClient();
    if (!c) return [];
    const { data } = await c
        .from('llm_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function listErrorLogs(limit = 100) {
    const c = getClient();
    if (!c) return [];
    const { data } = await c
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
    return data || [];
}

async function getStats(windowSeconds = 3600) {
    const c = getClient();
    if (!c) return null;
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const { data } = await c
        .from('request_logs')
        .select('status_code, response_time_ms, path')
        .gte('created_at', since);
    return data || [];
}

// 写日志类 —— fire-and-forget，绝不抛出（避免影响业务）
function fireAndForget(task, label) {
    Promise.resolve()
        .then(task)
        .then(({ error } = {}) => {
            if (error) throw error;
        })
        .catch((e) => {
            // eslint-disable-next-line no-console
            console.error(`[supabase] ${label} write failed:`, e?.message || e);
        });
}

function writeRequestLog(row) {
    const c = getClient();
    if (!c) return;
    fireAndForget(() => c.from('request_logs').insert(row), 'request_log');
}

function writeLLMLog(row) {
    const c = getClient();
    if (!c) return;
    fireAndForget(() => c.from('llm_logs').insert(row), 'llm_log');
}

function writeErrorLog(row) {
    const c = getClient();
    if (!c) return;
    fireAndForget(() => c.from('error_logs').insert(row), 'error_log');
}

module.exports = {
    getClient,
    insertAnalysis,
    listAnalyses,
    getAnalysisById,
    listRequestLogs,
    listLLMLogs,
    listErrorLogs,
    getStats,
    writeRequestLog,
    writeLLMLog,
    writeErrorLog,
};
