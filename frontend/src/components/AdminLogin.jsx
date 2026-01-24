import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, User, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
    const [credentials, setCredentials] = useState({ username: 'admin', password: 'tripvenza2026' });
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        // Simple mock login for demo
        if (credentials.username === 'admin' && credentials.password === 'tripvenza2026') {
            localStorage.setItem('isAdmin', 'true');
            navigate('/admin');
        } else {
            alert('Invalid credentials');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="premium-card p-8 rounded-2xl max-w-sm w-full mx-auto"
        >
            <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">Admin Access</h2>
                <p className="text-slate-400 text-sm mt-1">Please enter your credentials</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Username"
                        required
                        value={credentials.username}
                        className="premium-input w-full p-3 pl-10 rounded-xl text-white"
                        onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                    />
                </div>
                <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="password"
                        placeholder="Password"
                        required
                        value={credentials.password}
                        className="premium-input w-full p-3 pl-10 rounded-xl text-white"
                        onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <LogIn className="w-5 h-5" /> Login
                </button>
            </form>
        </motion.div>
    );
};

export default AdminLogin;
