import React, { useState } from 'react';
import { QrReader } from 'react-qr-reader';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Scan, CheckCircle, XCircle, LogIn, LogOut, Loader, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ReceptionScanner = () => {
    const [scanResult, setScanResult] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, processing, success, error
    const [message, setMessage] = useState('');
    const [visitorData, setVisitorData] = useState(null);
    const [isSecureContext, setIsSecureContext] = useState(true);

    React.useEffect(() => {
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setIsSecureContext(false);
        }
    }, []);

    const handleScan = async (result, error) => {
        if (!!result && status === 'idle') {
            try {
                // Prevent multiple scans
                setStatus('processing');
                const text = result?.text;
                if (!text) return;

                const data = JSON.parse(text);
                if (!data.id) throw new Error("Invalid QR Code");

                // Fetch current status to decide Check-in vs Check-out
                // For now, we'll assume we are checking them IN if pending/approved, or OUT if checked-in?
                // Or we can just have two buttons? 
                // Let's make it smart: Get visitor -> If approved -> Check In. If Checked In -> Check Out.

                checkVisitorStatus(data.id);

            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('Invalid QR Code format');
                setTimeout(resetScanner, 3000);
            }
        }
    };

    const checkVisitorStatus = async (id) => {
        try {
            const res = await api.get(`/api/visitors/${id}`);
            const visitor = res.data;
            setVisitorData(visitor);

            // Logic for action
            if (visitor.status === 'approved') {
                await processCheckIn(id);
            } else if (visitor.status === 'checked-in') {
                await processCheckOut(id);
            } else if (visitor.status === 'checked-out') {
                setStatus('error');
                setMessage('Visitor already checked out');
                setTimeout(resetScanner, 3000);
            } else {
                setStatus('error');
                setMessage(`Visitor status is ${visitor.status}. Cannot process.`);
                setTimeout(resetScanner, 3000);
            }
        } catch (err) {
            setStatus('error');
            setMessage('Visitor not found');
            setTimeout(resetScanner, 3000);
        }
    };

    const processCheckIn = async (id) => {
        try {
            // We need a check-in endpoint or just update status
            await api.put(`/api/visitors/${id}`, { status: 'checked-in' });
            setStatus('success');
            setMessage('Check-In Successful');
            setTimeout(resetScanner, 3000);
        } catch (err) {
            setStatus('error');
            setMessage('Check-in failed');
            setTimeout(resetScanner, 3000);
        }
    };

    const processCheckOut = async (id) => {
        try {
            await api.put(`/api/visitors/${id}/checkout`);
            setStatus('success');
            setMessage('Check-Out Successful');
            setTimeout(resetScanner, 3000);
        } catch (err) {
            setStatus('error');
            setMessage('Check-out failed');
            setTimeout(resetScanner, 3000);
        }
    };

    const resetScanner = () => {
        setStatus('idle');
        setScanResult(null);
        setMessage('');
        setVisitorData(null);
    };

    return (
        <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">

            <div className="w-full max-w-md">
                <Link to="/admin" className="flex items-center text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Admin
                </Link>

                <div className="glass-panel p-1 rounded-[2rem] overflow-hidden relative shadow-2xl shadow-emerald-500/10">
                    <div className="relative z-10 p-8 bg-slate-950/40 backdrop-blur-2xl h-full flex flex-col items-center">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 relative">
                            <Scan className="w-10 h-10 text-emerald-400" />
                            <div className="absolute inset-0 border-2 border-emerald-500/30 rounded-full pulse-active" />
                        </div>
                        <h1 className="text-3xl font-black text-white mb-2 tracking-tight">Reception Access</h1>
                        <p className="text-slate-400 text-sm mb-10 text-center font-medium">Verify Identity via Security QR</p>

                        <div className="w-full aspect-square bg-slate-900 rounded-[2rem] overflow-hidden relative mb-8 border border-white/10 shadow-inner group">
                            {!isSecureContext ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/90 backdrop-blur-xl">
                                    <XCircle className="w-16 h-16 text-rose-500 mb-4" />
                                    <p className="text-white font-black text-xl mb-2 uppercase tracking-tight">Security Block</p>
                                    <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                                        Browsers block camera access on insecure connections.
                                        Please use <span className="text-emerald-400 font-mono">localhost</span> or <span className="text-emerald-400 font-mono">HTTPS</span>.
                                    </p>
                                </div>
                            ) : status === 'idle' && (
                                <>
                                    <QrReader
                                        onResult={handleScan}
                                        constraints={{
                                            video: { facingMode: 'environment' }
                                        }}
                                        scanDelay={500}
                                        onUserMediaError={(err) => {
                                            console.error("Scanner Error:", err);
                                            // Handle various camera errors specifically
                                            const errMsg = err.name === 'NotAllowedError'
                                                ? "Camera permission denied. Please allow camera access in browser settings."
                                                : "Camera not found or busy. Please check connections.";
                                            alert(errMsg);
                                        }}
                                        containerStyle={{ width: '100%', height: '100%' }}
                                        videoStyle={{ objectFit: 'cover' }}
                                    />
                                    <div className="absolute top-4 right-4 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[10px] text-emerald-400 font-black tracking-widest uppercase">Live Scanning</span>
                                    </div>
                                </>
                            )}

                            {status !== 'idle' && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md">
                                    {status === 'processing' && (
                                        <div className="flex flex-col items-center">
                                            <Loader className="w-16 h-16 text-emerald-400 animate-spin mb-4" />
                                            <p className="text-emerald-400 font-black tracking-widest uppercase text-xs">Authenticating...</p>
                                        </div>
                                    )}
                                    {status === 'success' && (
                                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                                            <CheckCircle className="w-24 h-24 text-emerald-400 mb-4" />
                                            <p className="text-emerald-400 font-black tracking-widest uppercase text-xs">Access Granted</p>
                                        </motion.div>
                                    )}
                                    {status === 'error' && (
                                        <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                                            <XCircle className="w-24 h-24 text-rose-500 mb-4" />
                                            <p className="text-rose-500 font-black tracking-widest uppercase text-xs">Access Denied</p>
                                        </motion.div>
                                    )}
                                </div>
                            )}

                            {/* Scanning Overlay Grid Effect */}
                            {status === 'idle' && (
                                <div className="absolute inset-0 pointer-events-none border-4 border-emerald-500/20 rounded-[2rem]">
                                    <motion.div
                                        className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,1)]"
                                        animate={{ top: ['0%', '100%', '0%'] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="min-h-[3rem] w-full flex items-center justify-center mb-4">
                            <AnimatePresence>
                                {message && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className={`px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest shadow-xl ${status === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
                                            status === 'error' ? 'bg-rose-500 text-white shadow-rose-500/20' :
                                                'bg-slate-800 text-slate-300'
                                            }`}
                                    >
                                        {message}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {visitorData && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="w-full bg-black/40 backdrop-blur-md p-5 rounded-3xl border border-white/5 relative overflow-hidden flex items-center gap-5"
                            >
                                <div className="absolute top-0 right-0 w-1.5 h-full bg-emerald-500" />
                                <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-emerald-500/30 overflow-hidden shadow-2xl shrink-0">
                                    {visitorData.photo ? (
                                        <img src={visitorData.photo} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-700 italic text-[8px]">NO ID</div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] text-emerald-500 uppercase font-black tracking-widest mb-1">Identity Verified</p>
                                    <p className="text-white font-black text-xl leading-none mb-1">{visitorData.name}</p>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">{visitorData.company || 'Private Visit'}</p>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[8px] text-emerald-400 font-bold uppercase">
                                            {visitorData.appointment_with}
                                        </div>
                                        {visitorData.visit_date && (
                                            <div className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[8px] text-slate-400 font-bold uppercase">
                                                Visit: {new Date(visitorData.visit_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceptionScanner;
