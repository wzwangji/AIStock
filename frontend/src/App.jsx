import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import MonitorPage from './pages/MonitorPage.jsx';

export default function App() {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-950">
            <Navbar />
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/monitor" element={<MonitorPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
        </div>
    );
}
