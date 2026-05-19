import { useEffect, useState } from 'react';
import api from '../api/client.js';
import AnalysisCard from '../components/AnalysisCard.jsx';
import StockQuoteCard from '../components/StockQuoteCard.jsx';

const SENT_BG = {
    Bullish: 'bg-emerald-50 text-emerald-700',
    Neutral: 'bg-slate-100 text-slate-700',
    Bearish: 'bg-rose-50 text-rose-700',
};
const RISK_BG = {
    Low: 'bg-emerald-50 text-emerald-700',
    Medium: 'bg-amber-50 text-amber-700',
    High: 'bg-rose-50 text-rose-700',
};
const SENT_LABELS = {
    Bullish: '偏多',
    Neutral: '中性',
    Bearish: '偏空',
};
const RISK_LABELS = {
    Low: '低风险',
    Medium: '中等风险',
    High: '高风险',
};

export default function HistoryPage() {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('');
    const [detail, setDetail] = useState(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.listHistory({ limit: 100, symbol: filter || undefined });
            setRows(data);
        } catch (e) {
            setError(e.message);
            setRows([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openDetail = async (id) => {
        try {
            const data = await api.getHistory(id);
            setDetail(data);
        } catch (e) {
            setError(e.message);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">分析留痕</p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-950">历史分析记录</h1>
                </div>
                <div className="flex items-center gap-2">
                    <input
                        value={filter}
                        onChange={(e) => setFilter(e.target.value.toUpperCase())}
                        placeholder="按代码过滤"
                        className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm placeholder:text-slate-400 focus:border-slate-950 focus:outline-none"
                    />
                    <button onClick={load} className="rounded-md bg-slate-950 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800">
                        刷新
                    </button>
                </div>
            </div>

            {error ? <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 shadow-sm">{error}</div> : null}

            {loading ? (
                <div className="text-sm text-slate-500">加载中...</div>
            ) : rows.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">
                    暂无历史记录，先去行情分析做一次分析吧
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                            <tr>
                                <th className="px-3 py-2 font-medium">时间</th>
                                <th className="px-3 py-2 font-medium">股票</th>
                                <th className="px-3 py-2 font-medium">情绪</th>
                                <th className="px-3 py-2 font-medium">风险</th>
                                <th className="px-3 py-2 font-medium">操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r) => (
                                <tr key={r.id} className="border-t border-slate-200">
                                    <td className="px-3 py-2 text-slate-500">{new Date(r.created_at).toLocaleString()}</td>
                                    <td className="px-3 py-2 font-semibold">{r.symbol}</td>
                                    <td className="px-3 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SENT_BG[r.sentiment] || 'bg-slate-100 text-slate-700'}`}>{SENT_LABELS[r.sentiment] || '—'}</span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${RISK_BG[r.risk_level] || 'bg-slate-100 text-slate-700'}`}>{RISK_LABELS[r.risk_level] || '—'}</span>
                                    </td>
                                    <td className="px-3 py-2">
                                        <button onClick={() => openDetail(r.id)} className="font-medium text-slate-950 hover:text-blue-700">
                                            查看详情
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {detail ? <DetailModal record={detail} onClose={() => setDetail(null)} /> : null}
        </div>
    );
}

function DetailModal({ record, onClose }) {
    return (
        <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-slate-950/60 p-4">
            <div className="w-full max-w-3xl space-y-4 rounded-lg bg-slate-50 p-4 shadow-xl">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-950">{record.symbol} · 详情</h2>
                    <button onClick={onClose} className="rounded-md bg-slate-950 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800">
                        关闭
                    </button>
                </div>
                {record.quote_data ? <StockQuoteCard data={record.quote_data} /> : null}
                {record.analysis ? <AnalysisCard analysis={record.analysis} /> : null}
            </div>
        </div>
    );
}
