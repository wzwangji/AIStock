const SENT_STYLES = {
    Bullish: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    Bearish: 'bg-rose-50 text-rose-700 border-rose-200',
};

const RISK_STYLES = {
    Low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 border-amber-200',
    High: 'bg-rose-50 text-rose-700 border-rose-200',
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

function Badge({ value, styles, labels }) {
    const cls = styles[value] || 'bg-slate-100 text-slate-700 border-slate-200';
    return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${cls}`}>{labels[value] || '—'}</span>;
}

export default function AnalysisCard({ analysis }) {
    if (!analysis) return null;
    return (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-lg font-semibold text-slate-950">AI 分析结果</h3>
                <Badge value={analysis.sentiment} styles={SENT_STYLES} labels={SENT_LABELS} />
                <Badge value={analysis.risk_level} styles={RISK_STYLES} labels={RISK_LABELS} />
            </div>

            <section className="mt-4">
                <h4 className="text-sm font-medium text-slate-500">核心观点</h4>
                <p className="mt-1 leading-relaxed text-slate-800">{analysis.summary}</p>
            </section>

            <section className="mt-4">
                <h4 className="text-sm font-medium text-slate-500">关键因素</h4>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
                    {(analysis.key_factors || []).map((f, i) => (
                        <li key={i}>{f}</li>
                    ))}
                </ul>
            </section>

            <section className="mt-4">
                <h4 className="text-sm font-medium text-slate-500">操作提示</h4>
                <blockquote className="mt-1 border-l-4 border-slate-950 bg-slate-50 px-4 py-3 text-slate-800">
                    {analysis.suggestion}
                </blockquote>
            </section>

            <p className="mt-4 text-xs text-slate-500">本分析由 AI 生成，仅供参考，不构成投资建议。</p>
        </div>
    );
}
