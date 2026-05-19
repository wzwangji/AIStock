import { NavLink } from 'react-router-dom';

const linkBase = 'px-3 py-2 rounded-md text-sm font-medium transition-colors';
const linkActive = 'bg-slate-950 text-white shadow-sm';
const linkIdle = 'text-slate-600 hover:bg-slate-100 hover:text-slate-950';

function classFor({ isActive }) {
    return `${linkBase} ${isActive ? linkActive : linkIdle}`;
}

export default function Navbar() {
    return (
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-slate-950 text-sm font-bold text-white">
                        AI
                    </span>
                    <span className="text-lg font-semibold tracking-wide">智能股票分析台</span>
                </div>
                <nav className="flex items-center gap-1">
                    <NavLink to="/" className={classFor} end>
                        行情分析
                    </NavLink>
                    <NavLink to="/history" className={classFor}>
                        历史记录
                    </NavLink>
                    <NavLink to="/monitor" className={classFor}>
                        运行监控
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}
