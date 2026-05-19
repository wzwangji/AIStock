// 内存环形缓冲 + 异步写库的轻量日志层
// 设计目标：Monitor 页面热查询走内存，不阻塞业务请求；冷查询走 Supabase
const supabase = require('./supabaseService');

const MAX_BUFFER = 1000;

const buffers = {
    request: [],
    llm: [],
    error: [],
};

function push(kind, item) {
    const buf = buffers[kind];
    if (!buf) return;
    buf.push(item);
    if (buf.length > MAX_BUFFER) buf.shift();
}

function recordRequest(row) {
    const entry = { ...row, created_at: row.created_at || new Date().toISOString() };
    push('request', entry);
    supabase.writeRequestLog(entry);
}

function recordLLM(row) {
    const entry = { ...row, created_at: row.created_at || new Date().toISOString() };
    push('llm', entry);
    supabase.writeLLMLog(entry);
}

function recordError(row) {
    const entry = { ...row, created_at: row.created_at || new Date().toISOString() };
    push('error', entry);
    supabase.writeErrorLog(entry);
    // eslint-disable-next-line no-console
    console.error(`[error:${entry.type}] ${entry.message}`);
}

function getRecentRequests(limit = 100) {
    return buffers.request.slice(-limit).reverse();
}

function getRecentLLM(limit = 100) {
    return buffers.llm.slice(-limit).reverse();
}

function getRecentErrors(limit = 100) {
    return buffers.error.slice(-limit).reverse();
}

function computeStats(windowSeconds = 3600) {
    const since = Date.now() - windowSeconds * 1000;
    const items = buffers.request.filter((r) => new Date(r.created_at).getTime() >= since);
    const total = items.length;
    if (total === 0) {
        return {
            total: 0,
            success: 0,
            failure: 0,
            success_rate: 0,
            error_rate: 0,
            avg_response_ms: 0,
            by_endpoint: {},
            by_status: {},
        };
    }
    let success = 0;
    let failure = 0;
    let totalMs = 0;
    const byEndpoint = {};
    const byStatus = {};
    for (const r of items) {
        if (r.status_code >= 200 && r.status_code < 400) success++;
        else failure++;
        totalMs += r.response_time_ms || 0;
        byEndpoint[r.path] = (byEndpoint[r.path] || 0) + 1;
        const sKey = String(r.status_code);
        byStatus[sKey] = (byStatus[sKey] || 0) + 1;
    }
    return {
        total,
        success,
        failure,
        success_rate: Math.round((success / total) * 1000) / 10,
        error_rate: Math.round((failure / total) * 1000) / 10,
        avg_response_ms: Math.round(totalMs / total),
        by_endpoint: byEndpoint,
        by_status: byStatus,
    };
}

module.exports = {
    recordRequest,
    recordLLM,
    recordError,
    getRecentRequests,
    getRecentLLM,
    getRecentErrors,
    computeStats,
};
