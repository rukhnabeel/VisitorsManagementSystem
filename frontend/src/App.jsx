import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VisitorForm from './components/VisitorForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import ReceptionScanner from './components/ReceptionScanner';
import { LayoutDashboard, UserPlus, Scan } from 'lucide-react';

const AdminGuard = ({ children }) => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <AdminLogin />;
};

const App = () => {
    return (
        <Router>
            <div className="min-h-screen bg-[#020617] text-slate-200 relative overflow-hidden">
                {/* Dynamic Background Orbs */}
                <div className="glow-orb bg-emerald-500 -top-20 -left-20 animate-[float-orb_20s_infinite]" />
                <div className="glow-orb bg-cyan-500 top-1/4 -right-20 animate-[float-orb_25s_infinite_reverse]" />
                <div className="glow-orb bg-indigo-500 -bottom-20 left-1/3 animate-[float-orb_30s_infinite]" />
                <div className="glow-orb bg-purple-500 top-1/2 right-1/4 animate-[float-orb_18s_infinite_linear]" />

                <nav className="border-b border-white/5 bg-slate-950/40 backdrop-blur-xl sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to="/" className="flex items-center gap-2">
                            <img src="/logo.jpg" alt="TripVenza Logo" className="h-10 w-auto object-contain rounded" />
                        </Link>
                        <div className="flex gap-4">
                            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">
                                <UserPlus className="w-4 h-4" /> Register
                            </Link>
                            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-emerald-400">
                                <LayoutDashboard className="w-4 h-4" /> Admin
                            </Link>
                            <Link to="/scanner" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-cyan-400">
                                <Scan className="w-4 h-4" /> Scanner
                            </Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-6xl mx-auto py-12 px-4">
                    <Routes>
                        <Route path="/" element={<VisitorForm />} />
                        <Route path="/admin" element={
                            <AdminGuard>
                                <AdminDashboard />
                            </AdminGuard>
                        } />
                        <Route path="/scanner" element={<ReceptionScanner />} />
                        <Route path="/login" element={<AdminLogin />} />
                    </Routes>
                </main>

                <footer className="py-8 text-center text-slate-500 text-sm border-t border-white/5">
                    <p>© 2026 TripVenza Holidays. All Rights Reserved.</p>
                </footer>
            </div>
        </Router>
    );
}

export default App;
