import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Building2, Mail, MessageSquare, Send, CheckCircle, Download, Share2, UsersRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import axios from 'axios';

const VisitorForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        company: '',
        email: '',
        appointment_with: '',
        purpose: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const [visitorId, setVisitorId] = useState(null);
    const [approvalData, setApprovalData] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const res = await axios.post('http://localhost:5000/api/visitors', formData);
            setVisitorId(res.data.id);
            setStatus('success');
        } catch (err) {
            console.error(err);
            setStatus('error');
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Poll for status updates when waiting
    React.useEffect(() => {
        if (status !== 'success' || !visitorId) return;

        const interval = setInterval(async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/visitors/${visitorId}`);
                const visitor = res.data;
                if (visitor.status === 'approved' || visitor.status === 'rejected') {
                    setApprovalData(visitor);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 3000); // Check every 3 seconds

        return () => clearInterval(interval);
    }, [status, visitorId]);

    if (status === 'success') {
        return (
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card p-8 rounded-2xl text-center max-w-md w-full mx-auto"
                >
                    <div className="flex justify-center mb-6">
                        <CheckCircle className="w-20 h-20 text-accent" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">Request Sent!</h2>
                    <p className="text-slate-400 mb-6">
                        Thank you for registering. Please wait in the lounge.<br />
                        <span className="text-emerald-400 font-medium animate-pulse">Waiting for admin approval...</span>
                    </p>
                    <button
                        onClick={() => { setStatus('idle'); setVisitorId(null); setApprovalData(null); }}
                        className="bg-accent hover:bg-emerald-600 text-white font-semibold py-3 px-8 rounded-xl transition-all"
                    >
                        New Registration
                    </button>
                </motion.div>

                {/* Status Popup Modal */}
                <AnimatePresence>
                    {approvalData && (
                        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-slate-900 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden"
                            >
                                <div className={`absolute top-0 left-0 w-full h-2 ${approvalData.status === 'approved' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

                                {approvalData.status === 'approved' ? (
                                    <div className="text-left w-full" id="visitor-pass-card">
                                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-white">Visitor Pass</h2>
                                                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider">Approved</p>
                                            </div>
                                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6 text-emerald-400" />
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl text-center">
                                            <div className="flex justify-center mb-2">
                                                <QRCodeSVG value={JSON.stringify({ id: approvalData._id, name: approvalData.name, time: approvalData.appointment_time })} size={140} />
                                            </div>
                                            <p className="text-slate-900 font-mono text-xs font-bold tracking-widest mt-1 opacity-60">SCAN AT RECEPTION</p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Visitor Name</p>
                                                <p className="text-lg text-white font-semibold">{approvalData.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Time</p>
                                                    <p className="text-emerald-400 font-mono text-xl font-bold">{approvalData.appointment_time}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Company</p>
                                                    <p className="text-slate-300 font-medium truncate">{approvalData.company || '-'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                import('html2canvas').then(html2canvas => {
                                                    const element = document.getElementById('visitor-pass-card');
                                                    if (element) {
                                                        html2canvas.default(element, { backgroundColor: '#1e293b' }).then(canvas => {
                                                            const link = document.createElement('a');
                                                            link.download = `VisitorPass-${approvalData.name}.png`;
                                                            link.href = canvas.toDataURL();
                                                            link.click();
                                                        });
                                                    }
                                                })
                                            }}
                                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 shadow-lg shadow-emerald-500/20"
                                        >
                                            <Download className="w-4 h-4" /> Download Pass
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center">
                                        <div className="w-20 h-20 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <div className="w-10 h-10 text-rose-500 font-bold text-4xl leading-none">×</div>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white mb-2">Request Declined</h2>
                                        <p className="text-slate-400 mb-6 text-center">We are unable to accommodate your visit at this time.</p>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setStatus('idle'); setVisitorId(null); setApprovalData(null); }}
                                    className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                    Close & Return Home
                                </button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="premium-card p-8 rounded-2xl max-w-lg w-full mx-auto"
        >
            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    TripVenza
                </h1>
                <p className="text-slate-400 mt-2 font-medium">Visitor Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        name="name"
                        placeholder="Full Name *"
                        required
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white"
                    />
                </div>

                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="tel"
                        name="mobile"
                        placeholder="Mobile Number *"
                        required
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white"
                    />
                </div>

                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="text"
                        name="company"
                        placeholder="Company (Optional)"
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white"
                    />
                </div>

                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <input
                        type="email"
                        name="email"
                        placeholder="Email Address *"
                        required
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white"
                    />
                </div>

                <div className="relative">
                    <UsersRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                    <select
                        name="appointment_with"
                        required
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white appearance-none bg-[#1e293b]"
                        value={formData.appointment_with}
                    >
                        <option value="" disabled>Select Office *</option>
                        <option value="ELLORA MANPOWER">ELLORA MANPOWER</option>
                        <option value="TRIPVENZA HOLIDAYS">TRIPVENZA HOLIDAYS</option>
                    </select>
                </div>

                <div className="relative">
                    <MessageSquare className="absolute left-3 top-4 text-slate-500 w-5 h-5" />
                    <textarea
                        name="purpose"
                        placeholder="Purpose of Visit *"
                        required
                        onChange={handleChange}
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white h-32 resize-none"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                >
                    {status === 'submitting' ? (
                        <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                        <>
                            Submit Request
                            <Send className="w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    );
};

export default VisitorForm;
