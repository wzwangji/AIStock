function fmt(n, opts = {}) {
    if (n === null || n === undefined || Number.isNaN(n)) return '—';
    return Number(n).toLocaleString(undefined, { maximumFractionDigits: 2, ...opts });
}

function pctClass(p) {
    if (p === null || p === undefined) return 'text-slate-500';
    if (p > 0) return 'text-emerald-600';
    if (p < 0) return 'text-rose-600';
    return 'text-slate-500';
}

export default function StockQuoteCard({ data }) {
    if (!data) return null;
    const { symbol, quote, profile } = data;
    const pct = quote?.percent_change;
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        {profile?.logo ? (
                            <img src={profile.logo} alt={symbol} className="h-12 w-12 rounded-lg border border-slate-200 bg-white p-1" />
                        ) : null}
                        <div>
                            <h2 className="text-3xl font-semibold tracking-wide text-slate-950">{symbol}</h2>
                            <p className="mt-1 text-sm text-slate-500">{profile?.name || '—'}</p>
                        </div>
                    </div>
                </div>
                <div className="sm:text-right">
                    <div className="text-4xl font-semibold tracking-tight text-slate-950">{fmt(quote?.current)}</div>
                    <div className={`mt-1 text-lg font-semibold ${pctClass(pct)}`}>
                        {pct != null && pct >= 0 ? '+' : ''}
                        {fmt(quote?.change)} ({fmt(pct)}%)
                    </div>
                </div>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-slate-200 bg-slate-200 text-sm sm:grid-cols-4">
                <Cell label="开盘" value={fmt(quote?.open)} />
                <Cell label="最高" value={fmt(quote?.high)} />
                <Cell label="最低" value={fmt(quote?.low)} />
                <Cell label="昨收" value={fmt(quote?.previous_close)} />
                <Cell label="行业" value={profile?.industry || '—'} />
                <Cell label="交易所" value={profile?.exchange || '—'} />
                <Cell label="货币" value={profile?.currency || '—'} />
                <Cell label="市值(M)" value={fmt(profile?.market_cap)} />
            </dl>
        </div>
    );
}

function Cell({ label, value }) {
    return (
        <div className="bg-white px-4 py-3">
            <dt className="text-xs font-medium text-slate-500">{label}</dt>
            <dd className="mt-1 truncate text-base font-semibold text-slate-950">{value}</dd>
        </div>
    );
}
