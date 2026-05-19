function Card({ label, value, hint, accent = 'indigo' }) {
    const accents = {
        indigo: 'text-blue-700',
        emerald: 'text-emerald-700',
        rose: 'text-rose-700',
        amber: 'text-amber-700',
    };
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-slate-500">{label}</div>
            <div className={`mt-1 text-3xl font-bold ${accents[accent]}`}>{value}</div>
            {hint ? <div className="mt-1 text-xs text-slate-500">{hint}</div> : null}
        </div>
    );
}

export default function StatsCards({ stats }) {
    if (!stats) return null;
    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Card label="总请求数" value={stats.total ?? 0} accent="indigo" />
            <Card label="成功率" value={`${stats.success_rate ?? 0}%`} accent="emerald" hint={`${stats.success ?? 0} / ${stats.total ?? 0}`} />
            <Card label="失败率" value={`${stats.error_rate ?? 0}%`} accent="rose" hint={`${stats.failure ?? 0} / ${stats.total ?? 0}`} />
            <Card label="平均响应" value={`${stats.avg_response_ms ?? 0} ms`} accent="amber" />
        </div>
    );
}
