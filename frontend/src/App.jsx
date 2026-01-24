import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import VisitorForm from './components/VisitorForm';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { LayoutDashboard, UserPlus } from 'lucide-react';

const AdminGuard = ({ children }) => {
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    return isAdmin ? children : <AdminLogin />;
};

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-[#0f172a] text-slate-200">
                <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to="/" className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent flex items-center gap-2">
                            <img src="/tripvenza_logo.png" alt="Logo" className="w-8 h-8 object-contain" />
                            TripVenza
                        </Link>
                        <div className="flex gap-4">
                            <Link to="/" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium">
                                <UserPlus className="w-4 h-4" /> Register
                            </Link>
                            <Link to="/admin" className="flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium text-emerald-400">
                                <LayoutDashboard className="w-4 h-4" /> Admin
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
