import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const client = axios.create({
    baseURL,
    timeout: 90_000,
    headers: { 'Content-Type': 'application/json' },
});

const TYPE_LABELS = {
    stock_api: '行情服务',
    llm: 'AI 分析服务',
    json_parse: 'AI 返回解析',
    supabase: '数据存储',
    validation: '参数校验',
    rate_limit: '访问频率',
    unknown: '服务异常',
};

function localizeMessage(err, data) {
    if (!err.response) return '无法连接后端服务，请确认服务已启动。';
    const type = data?.error?.type || 'unknown';
    if (type === 'stock_api') return '行情服务请求失败，请检查股票代码、行情接口密钥或网络连接。';
    if (type === 'llm') return 'AI 分析服务请求失败，请检查大模型接口密钥、模型配置或网络连接。';
    if (type === 'json_parse') return 'AI 返回内容解析失败，请稍后重试。';
    if (type === 'supabase') return '数据存储服务异常，请检查 Supabase 配置和数据表。';
    if (type === 'validation') return data?.error?.message || '请求参数不正确，请检查输入内容。';
    if (type === 'rate_limit') return '请求过于频繁，请稍后再试。';
    return `服务请求失败，状态码 ${err.response.status}`;
}

// 把后端的 { error: { type, message } } 包装成 throw 的 Error，前端 try/catch 一致处理
client.interceptors.response.use(
    (resp) => resp,
    (err) => {
        const data = err.response?.data;
        const friendly = localizeMessage(err, data);
        const e = new Error(friendly);
        e.type = data?.error?.type || 'unknown';
        e.typeLabel = TYPE_LABELS[e.type] || TYPE_LABELS.unknown;
        e.status = err.response?.status;
        e.original = err;
        return Promise.reject(e);
    },
);

export const api = {
    getStock: (symbol) => client.get(`/api/stock/${encodeURIComponent(symbol)}`).then((r) => r.data),
    analyze: (symbol) => client.post('/api/analyze', { symbol }).then((r) => r.data),
    listHistory: (params = {}) => client.get('/api/history', { params }).then((r) => r.data),
    getHistory: (id) => client.get(`/api/history/${id}`).then((r) => r.data),
    getStats: (window = '1h') => client.get('/api/monitor/stats', { params: { window } }).then((r) => r.data),
    getRequestLogs: (limit = 100) => client.get('/api/monitor/requests', { params: { limit } }).then((r) => r.data),
    getLLMLogs: (limit = 100) => client.get('/api/monitor/llm', { params: { limit } }).then((r) => r.data),
    getErrorLogs: (limit = 100) => client.get('/api/monitor/errors', { params: { limit } }).then((r) => r.data),
};

export default api;
