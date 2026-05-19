import { useState } from 'react';
import api from '../api/client.js';
import StockQuoteCard from '../components/StockQuoteCard.jsx';
import AnalysisCard from '../components/AnalysisCard.jsx';

const HOT_SYMBOLS = ['AAPL', 'NVDA', 'TSLA', 'MSFT'];

export default function DashboardPage() {
    const [symbol, setSymbol] = useState('AAPL');
    const [stock, setStock] = useState(null);
    const [analysis, setAnalysis] = useState(null);
    const [loadingQuote, setLoadingQuote] = useState(false);
    const [loadingAnalyze, setLoadingAnalyze] = useState(false);
    const [error, setError] = useState(null);

    const onFetchQuote = async (e) => {
        e?.preventDefault?.();
        const s = symbol.trim().toUpperCase();
        if (!s) return;
        setError(null);
        setAnalysis(null);
        setLoadingQuote(true);
        try {
            const data = await api.getStock(s);
            setStock(data);
        } catch (e2) {
            setStock(null);
            setError({ type: e2.type, typeLabel: e2.typeLabel, message: e2.message });
        } finally {
            setLoadingQuote(false);
        }
    };

    const onAnalyze = async () => {
        if (!stock?.symbol) return;
        setError(null);
        setLoadingAnalyze(true);
        try {
            const data = await api.analyze(stock.symbol);
            setAnalysis(data.analysis);
            // 把最新行情也用后端返回的覆盖，保证数据一致
            setStock({ symbol: data.symbol, quote: data.quote, profile: data.profile });
        } catch (e) {
            setError({ type: e.type, typeLabel: e.typeLabel, message: e.message });
        } finally {
            setLoadingAnalyze(false);
        }
    };

    return (
        <div className="space-y-6">
            <section className="flex flex-col gap-4 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">实时行情与智能解读</p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">股票分析工作台</h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        输入股票代码，获取最新行情、公司资料和结构化分析结论。
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {HOT_SYMBOLS.map((item) => (
                        <button
                            key={item}
                            type="button"
                            onClick={() => setSymbol(item)}
                            className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </section>

            <form
                onSubmit={onFetchQuote}
                className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center"
            >
                <input
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                    placeholder="股票代码"
                    className="min-w-[180px] flex-1 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-lg font-semibold tracking-wide text-slate-950 placeholder:text-slate-400 focus:border-slate-950 focus:bg-white focus:outline-none"
                    maxLength={10}
                />
                <button
                    type="submit"
                    disabled={loadingQuote}
                    className="rounded-md bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loadingQuote ? '加载中...' : '获取行情'}
                </button>
                <button
                    type="button"
                    onClick={onAnalyze}
                    disabled={!stock || loadingAnalyze}
                    className="rounded-md bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loadingAnalyze ? 'AI 分析中...' : 'AI 分析'}
                </button>
            </form>

            {error ? (
                <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm shadow-sm">
                    <span className="font-semibold text-rose-700">[{error.typeLabel || '服务异常'}]</span>{' '}
                    <span className="text-rose-700">{error.message}</span>
                </div>
            ) : null}

            {stock ? <StockQuoteCard data={stock} /> : null}

            {loadingAnalyze ? (
                <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                    正在调用 LLM 分析，预计 10-30 秒...
                </div>
            ) : null}

            {analysis ? <AnalysisCard analysis={analysis} /> : null}
        </div>
    );
}
