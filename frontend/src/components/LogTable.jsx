function fmtTime(ts) {
    if (!ts) return '—';
    try {
        return new Date(ts).toLocaleString();
    } catch {
        return String(ts);
    }
}

function statusClass(code) {
    if (code == null) return 'text-slate-500';
    if (code >= 500) return 'text-rose-600';
    if (code >= 400) return 'text-amber-600';
    if (code >= 200) return 'text-emerald-600';
    return 'text-slate-500';
}

export default function LogTable({ kind, rows }) {
    const list = Array.isArray(rows) ? rows : [];
    if (list.length === 0) {
        return <div className="rounded-lg border border-slate-200 bg-white p-6 text-center text-sm text-slate-500 shadow-sm">暂无数据</div>;
    }

    let head;
    let renderRow;
    if (kind === 'requests') {
        head = ['时间', '方法', '路径', '状态', '耗时(ms)', 'IP'];
        renderRow = (r, i) => (
            <tr key={r.id ?? i} className="border-t border-slate-200">
                <td className="px-3 py-2 text-slate-500">{fmtTime(r.created_at)}</td>
                <td className="px-3 py-2">{r.method}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.path}</td>
                <td className={`px-3 py-2 font-semibold ${statusClass(r.status_code)}`}>{r.status_code}</td>
                <td className="px-3 py-2">{r.response_time_ms}</td>
                <td className="max-w-[160px] truncate px-3 py-2 text-slate-500">{r.ip}</td>
            </tr>
        );
    } else if (kind === 'llm') {
        head = ['时间', '模型', '股票', '结果', '输入令牌', '输出令牌', '耗时(ms)', '错误'];
        renderRow = (r, i) => (
            <tr key={r.id ?? i} className="border-t border-slate-200">
                <td className="px-3 py-2 text-slate-500">{fmtTime(r.created_at)}</td>
                <td className="px-3 py-2 font-mono text-xs">{r.model}</td>
                <td className="px-3 py-2">{r.symbol || '—'}</td>
                <td className={`px-3 py-2 font-medium ${r.success ? 'text-emerald-600' : 'text-rose-600'}`}>{r.success ? '成功' : '失败'}</td>
                <td className="px-3 py-2">{r.prompt_tokens || 0}</td>
                <td className="px-3 py-2">{r.completion_tokens || 0}</td>
                <td className="px-3 py-2">{r.response_time_ms}</td>
                <td className="max-w-[200px] truncate px-3 py-2 text-rose-600">{r.error_message || '—'}</td>
            </tr>
        );
    } else {
        head = ['时间', '类型', '消息', '上下文'];
        renderRow = (r, i) => (
            <tr key={r.id ?? i} className="border-t border-slate-200 align-top">
                <td className="px-3 py-2 text-slate-500">{fmtTime(r.created_at)}</td>
                <td className="px-3 py-2"><span className="rounded-md bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700">{r.type}</span></td>
                <td className="px-3 py-2 text-rose-600">{r.message}</td>
                <td className="max-w-md truncate px-3 py-2 font-mono text-xs text-slate-500" title={JSON.stringify(r.context)}>
                    {r.context ? JSON.stringify(r.context) : '—'}
                </td>
            </tr>
        );
    }

    return (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-medium text-slate-500">
                    <tr>
                        {head.map((h) => (
                            <th key={h} className="px-3 py-2 font-medium">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>{list.map(renderRow)}</tbody>
            </table>
        </div>
    );
}
