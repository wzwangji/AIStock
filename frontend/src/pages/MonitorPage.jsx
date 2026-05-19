import { useEffect, useState, useRef } from 'react';
import api from '../api/client.js';
import StatsCards from '../components/StatsCards.jsx';
import LogTable from '../components/LogTable.jsx';

const TABS = [
    { key: 'requests', label: '请求日志' },
    { key: 'llm', label: 'LLM 调用日志' },
    { key: 'errors', label: '异常日志' },
];

export default function MonitorPage() {
    const [window, setWindow] = useState('1h');
    const [stats, setStats] = useState(null);
    const [tab, setTab] = useState('requests');
    const [logs, setLogs] = useState({ requests: [], llm: [], errors: [] });
    const [error, setError] = useState(null);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const timerRef = useRef(null);

    const fetchAll = async () => {
        try {
            const [s, r, l, e] = await Promise.allSettled([
                api.getStats(window),
                api.getRequestLogs(100),
                api.getLLMLogs(100),
                api.getErrorLogs(100),
            ]);
            if (s.status === 'fulfilled') setStats(s.value);
            setLogs({
                requests: r.status === 'fulfilled' ? r.value : [],
                llm: l.status === 'fulfilled' ? l.value : [],
                errors: e.status === 'fulfilled' ? e.value : [],
            });
            const failed = [s, r, l, e].find((x) => x.status === 'rejected');
            setError(failed ? failed.reason?.message || '数据获取失败' : null);
        } catch (e2) {
            setError(e2.message);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [window]);

    useEffect(() => {
        if (!autoRefresh) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(fetchAll, 5000);
        return () => clearInterval(timerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoRefresh, window]);

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5">
                <div>
                    <p className="text-sm font-medium text-slate-500">服务健康状态</p>
                    <h1 className="mt-1 text-2xl font-semibold text-slate-950">运行监控</h1>
                </div>
                <div className="flex items-center gap-3 text-sm">
                    <div className="rounded-md border border-slate-200 bg-white p-1 shadow-sm">
                        {[
                            ['1h', '近 1 小时'],
                            ['24h', '近 24 小时'],
                        ].map(([w, label]) => (
                            <button
                                key={w}
                                onClick={() => setWindow(w)}
                                className={`rounded px-3 py-1 ${window === w ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                    <label className="flex items-center gap-2 text-slate-600">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="accent-slate-950"
                        />
                        自动刷新(5s)
                    </label>
                    <button onClick={fetchAll} className="rounded-md border border-slate-200 bg-white px-3 py-1 font-medium text-slate-700 shadow-sm hover:bg-slate-50">
                        立即刷新
                    </button>
                </div>
            </div>

            {error ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 shadow-sm">
                    部分数据加载失败：{error}
                </div>
            ) : null}

            <StatsCards stats={stats} />

            <div className="flex gap-1 border-b border-slate-200">
                {TABS.map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                            tab === t.key
                                ? 'border-slate-950 text-slate-950'
                                : 'border-transparent text-slate-500 hover:text-slate-950'
                        }`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            <LogTable kind={tab} rows={logs[tab]} />
        </div>
    );
}
