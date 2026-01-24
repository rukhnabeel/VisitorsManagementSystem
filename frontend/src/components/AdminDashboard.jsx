import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, User, Mail, Phone, Building2, Search, QrCode, Download, UsersRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const AdminDashboard = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOffice, setFilterOffice] = useState('All');
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        fetchVisitors();
        const interval = setInterval(fetchVisitors, 10000); // Polling every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchVisitors = async () => {
        try {
            const resp = await axios.get('http://localhost:5000/api/visitors');
            setVisitors(resp.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Mobile', 'Company', 'Visiting Office', 'Purpose', 'Status', 'Check-In', 'Check-Out'];
        const data = visitors.map(v => [
            v.name, v.email, `"${v.mobile}"`, v.company || '', v.appointment_with || '', `"${v.purpose.replace(/"/g, '""')}"`, v.status,
            new Date(v.createdAt).toLocaleString(),
            v.checkOutTime ? new Date(v.checkOutTime).toLocaleString() : ''
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers, ...data].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `tripvenza_visitors_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [approvalId, setApprovalId] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');

    useEffect(() => {
        // Generate 24h time slots with 10 min intervals
        // Request: 10:00 AM to 20:00 PM
        const slots = [];
        for (let i = 10; i <= 20; i++) {
            for (let j = 0; j < 60; j += 10) {
                // If it's 20:00, we generally stop there, or do we go to 20:50?
                // "TO 20:00:00 PM" usually implies 20:00 is the last slot or end.
                // Let's include 20:00 but no minutes after 20:00.
                if (i === 20 && j > 0) break;

                const h = i.toString().padStart(2, '0');
                const m = j.toString().padStart(2, '0');
                slots.push(`${h}:${m}:00`);
            }
        }
        setTimeSlots(slots);
    }, []);

    const handleAction = async (id, status) => {
        if (status === 'approved') {
            setApprovalId(id);
            // Default to next nearest 10 min slot?
            const now = new Date();
            const remainder = 10 - (now.getMinutes() % 10);
            now.setMinutes(now.getMinutes() + remainder);
            const h = now.getHours().toString().padStart(2, '0');
            const m = now.getMinutes().toString().padStart(2, '0');
            setSelectedTime(`${h}:${m}:00`);
            return;
        }

        // For reject or other statuses
        updateVisitorStatus(id, status, '');
    };

    const confirmApproval = () => {
        if (!approvalId || !selectedTime) return;
        updateVisitorStatus(approvalId, 'approved', selectedTime);
        setApprovalId(null);
    };

    const updateVisitorStatus = async (id, status, appointment_time) => {
        try {
            await axios.put(`http://localhost:5000/api/visitors/${id}`, { status, appointment_time });
            fetchVisitors();
        } catch (err) {
            alert('Failed to update status');
        }
    };

    const handleCheckout = async (id) => {
        try {
            await axios.put(`http://localhost:5000/api/visitors/${id}/checkout`);
            fetchVisitors();
        } catch (err) {
            alert('Checkout failed');
        }
    };

    const stats = {
        total: visitors.length,
        pending: visitors.filter(v => v.status === 'pending').length,
        active: visitors.filter(v => v.status === 'approved').length,
    };

    const filteredVisitors = visitors.filter(v =>
        (filterOffice === 'All' || v.appointment_with === filterOffice) &&
        (v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            v.company?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="w-full max-w-6xl mx-auto p-4 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                    <p className="text-slate-400">Manage your office visitors and appointments</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={exportToCSV}
                        className="premium-card p-3 rounded-xl text-cyan-400 hover:bg-cyan-500/10 transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        <Download className="w-5 h-5" /> Export
                    </button>
                    <button
                        onClick={() => setShowQR(!showQR)}
                        className="premium-card p-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors flex items-center gap-2 text-sm font-bold"
                    >
                        <QrCode className="w-5 h-5" /> QR Code
                    </button>
                    <div className="relative">
                        <UsersRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <select
                            value={filterOffice}
                            onChange={(e) => setFilterOffice(e.target.value)}
                            className="premium-input p-3 pl-10 rounded-xl text-white text-sm bg-slate-800 appearance-none cursor-pointer border-none outline-none focus:ring-2 focus:ring-emerald-500/50"
                        >
                            <option value="All">All Offices</option>
                            <option value="ELLORA MANPOWER">Ellora Manpower</option>
                            <option value="TRIPVENZA HOLIDAYS">TripVenza Holidays</option>
                        </select>
                    </div>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search visitors..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="premium-input w-full p-3 pl-10 rounded-xl text-white text-sm"
                        />
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {showQR && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-8"
                    >
                        <div className="premium-card p-8 rounded-2xl flex flex-col items-center justify-center bg-gradient-to-br from-emerald-500/10 to-cyan-500/10">
                            <h2 className="text-xl font-bold text-white mb-4">Scan to Register</h2>
                            <div className="bg-white p-4 rounded-xl">
                                <QRCodeSVG value={window.location.origin} size={180} />
                            </div>
                            <p className="mt-4 text-slate-400 text-sm font-medium">Link: {window.location.origin}</p>
                        </div>
                    </motion.div>
                )}

                {/* Approval Time Modal */}
                {approvalId && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-white mb-4">Select Appointment Time</h3>
                            <p className="text-slate-400 text-sm mb-4">Choose a time slot (24h format, 10 min intervals)</p>

                            <div className="space-y-4">
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="premium-input w-full p-3 pl-10 rounded-xl text-white bg-slate-800 appearance-none cursor-pointer"
                                    >
                                        {timeSlots.map(time => (
                                            <option key={time} value={time}>{time}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <button
                                        onClick={() => setApprovalId(null)}
                                        className="flex-1 px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmApproval}
                                        className="flex-1 px-4 py-2 rounded-xl bg-emerald-500 text-white hover:bg-emerald-400 font-bold transition-all"
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                {[
                    { label: 'Total Visitors', value: stats.total, color: 'text-white' },
                    { label: 'Pending Requests', value: stats.pending, color: 'text-amber-400' },
                    { label: 'In Office', value: stats.active, color: 'text-emerald-400' },
                ].map((s, i) => (
                    <div key={i} className="premium-card p-4 rounded-xl border-l-4 border-l-emerald-500/50">
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{s.label}</p>
                        <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center p-20">
                    <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence mode="popLayout">
                        {filteredVisitors.map((visitor) => (
                            <motion.div
                                key={visitor._id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="premium-card p-6 rounded-2xl relative overflow-hidden group"
                            >
                                <div className={`absolute top-0 right-0 w-2 h-full ${visitor.status === 'approved' ? 'bg-emerald-500' :
                                    visitor.status === 'rejected' ? 'bg-rose-500' :
                                        visitor.status === 'checked-out' ? 'bg-slate-500' : 'bg-amber-500'
                                    }`} />

                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                                        <User className="w-6 h-6" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${visitor.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                                        visitor.status === 'rejected' ? 'bg-rose-500/10 text-rose-500' :
                                            visitor.status === 'checked-out' ? 'bg-slate-500/10 text-slate-400' : 'bg-amber-500/10 text-amber-500'
                                        }`}>
                                        {visitor.status}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-1">{visitor.name}</h3>
                                <div className="space-y-2 text-sm text-slate-400 mb-6">
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4" />
                                        <span>{visitor.company || 'Private Visit'}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-emerald-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="truncate">{visitor.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4" />
                                        <span>{new Date(visitor.createdAt).toLocaleString()}</span>
                                    </div>
                                    <p className="mt-3 bg-slate-800/50 p-3 rounded-lg border border-white/5 text-slate-300 italic">
                                        "{visitor.purpose}"
                                    </p>
                                    {visitor.appointment_with && (
                                        <div className="flex items-center gap-2 mt-2 text-cyan-400 font-medium bg-cyan-950/30 p-2 rounded-lg border border-cyan-500/20">
                                            <UsersRound className="w-4 h-4" />
                                            <span className="text-xs uppercase tracking-wide">Visiting: {visitor.appointment_with}</span>
                                        </div>
                                    )}
                                </div>

                                {visitor.status === 'pending' && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleAction(visitor._id, 'approved')}
                                            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" /> Approve
                                        </button>
                                        <button
                                            onClick={() => handleAction(visitor._id, 'rejected')}
                                            className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <X className="w-4 h-4" /> Reject
                                        </button>
                                    </div>
                                )}

                                {visitor.status === 'approved' && (
                                    <div className="space-y-3">
                                        {visitor.appointment_time && (
                                            <div className="text-xs font-semibold text-emerald-500 bg-emerald-500/10 p-2 rounded-lg text-center">
                                                Appointment: {visitor.appointment_time}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleCheckout(visitor._id)}
                                            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 border border-white/5"
                                        >
                                            <Clock className="w-4 h-4" /> Check Out
                                        </button>
                                    </div>
                                )}

                                {visitor.status === 'checked-out' && visitor.checkOutTime && (
                                    <div className="mt-2 text-xs font-semibold text-slate-500 bg-slate-900/50 p-2 rounded-lg text-center">
                                        Checked Out: {new Date(visitor.checkOutTime).toLocaleTimeString()}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {filteredVisitors.length === 0 && !loading && (
                <div className="text-center py-20">
                    <p className="text-slate-500 text-xl font-medium">No visitors found matching your search.</p>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
