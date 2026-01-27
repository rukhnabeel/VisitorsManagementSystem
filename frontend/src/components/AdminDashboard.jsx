import React, { useState, useEffect } from 'react';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, User, Mail, Phone, Building2, Search, QrCode, Download, UsersRound, Calendar, MessageSquare, RefreshCw, TrendingUp, UserCheck, UserMinus, ShieldAlert, UserRound, MessageCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const AdminDashboard = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterOffice, setFilterOffice] = useState('All');
    const [filterDate, setFilterDate] = useState(''); // Default to all history for reliability
    const [isOfficeFilterOpen, setIsOfficeFilterOpen] = useState(false);
    const [showQR, setShowQR] = useState(false);
    const [registrationUrl, setRegistrationUrl] = useState(window.location.origin);
    const [lastVisitorId, setLastVisitorId] = useState(null);
    const [newVisitorAlert, setNewVisitorAlert] = useState(null);

    const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    const requestPermission = () => {
        if ('Notification' in window) {
            Notification.requestPermission();
        }
    };

    const fetchConfig = async () => {
        try {
            const resp = await api.get('/api/config');
            // Extract the IP/Host from backend provided URL, but keep current port
            const backendUrl = new URL(resp.data.registrationUrl);
            const intelligentUrl = `${backendUrl.protocol}//${backendUrl.hostname}:${window.location.port}`;
            setRegistrationUrl(intelligentUrl);
        } catch (err) {
            console.error("Config fetch failed", err);
            // Fallback is already window.location.origin
        }
    };

    useEffect(() => {
        requestPermission();
        fetchVisitors(true);
        fetchConfig();
        const interval = setInterval(() => fetchVisitors(false), 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchVisitors = async (isInitial = false) => {
        try {
            const resp = await api.get('/api/visitors');
            const newVisitors = resp.data;

            if (!isInitial && newVisitors.length > 0) {
                const latest = newVisitors[0];
                if (lastVisitorId && latest._id !== lastVisitorId) {
                    showNotification(latest);
                }
            }

            if (newVisitors.length > 0) {
                setLastVisitorId(newVisitors[0]._id);
            }
            setVisitors(newVisitors);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (visitor) => {
        notificationSound.loop = true;
        notificationSound.play().catch(e => console.log("Audio play blocked", e));
        setNewVisitorAlert(visitor);

        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🎫 New Visitor Registered!', {
                body: `${visitor.name} is waiting for approval.`,
                icon: '/logo.jpg'
            });
        }
    };

    const stopRingtone = () => {
        notificationSound.pause();
        notificationSound.currentTime = 0;
        setNewVisitorAlert(null);
    };

    const exportToCSV = () => {
        const headers = ['Name', 'Email', 'Mobile', 'Company', 'Visiting Office', 'Purpose', 'Status', 'Requested Visit Date', 'Registration Date'];
        const data = visitors.map(v => [
            v.name, v.email, `"${v.mobile}"`, v.company || '', v.appointment_with || '', `"${v.purpose}"`, v.status,
            v.visit_date ? `${new Date(v.visit_date).toLocaleDateString('en-GB').split('/').join('-')} ${new Date(v.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'N/A',
            new Date(v.createdAt).toLocaleString('en-GB').split('/').join('-')
        ]);
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...data].map(e => e.join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `visitors_${new Date().toLocaleDateString()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const [approvalId, setApprovalId] = useState(null);
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTime, setSelectedTime] = useState('');

    useEffect(() => {
        const slots = [];
        for (let i = 10; i <= 20; i++) {
            for (let j = 0; j < 60; j += 10) {
                if (i === 20 && j > 0) break;
                slots.push(`${i.toString().padStart(2, '0')}:${j.toString().padStart(2, '0')}:00`);
            }
        }
        setTimeSlots(slots);
    }, []);

    const handleAction = async (visitor, status) => {
        const id = typeof visitor === 'string' ? visitor : visitor._id;

        if (status === 'approved') {
            setApprovalId(id);

            // If visitor has a requested date, use its time as default
            const visitorData = typeof visitor === 'object' ? visitor : visitors.find(v => v._id === id);
            if (visitorData && visitorData.visit_date) {
                const requestedDate = new Date(visitorData.visit_date);
                setSelectedTime(`${requestedDate.getHours().toString().padStart(2, '0')}:${requestedDate.getMinutes().toString().padStart(2, '0')}:00`);
            } else {
                const now = new Date();
                const remainder = 10 - (now.getMinutes() % 10);
                now.setMinutes(now.getMinutes() + remainder);
                setSelectedTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:00`);
            }
            return;
        }
        updateVisitorStatus(id, status, '');
    };

    const confirmApproval = () => {
        if (!approvalId || !selectedTime) return;
        updateVisitorStatus(approvalId, 'approved', selectedTime);
        setApprovalId(null);
    };

    const updateVisitorStatus = async (id, status, appointment_time) => {
        try {
            await api.put(`/api/visitors/${id}`, { status, appointment_time });
            fetchVisitors();
        } catch (err) {
            alert('Update failed');
        }
    };

    const handleCheckout = async (id) => {
        try {
            await api.put(`/api/visitors/${id}/checkout`);
            fetchVisitors();
        } catch (err) {
            alert('Checkout failed');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this visitor record?')) return;
        try {
            await api.delete(`/api/visitors/${id}`);
            fetchVisitors();
        } catch (err) {
            alert('Delete failed');
        }
    };

    const sendWhatsAppPass = (visitor) => {
        // Use visit_date if available, otherwise fallback to creation date to ensure it's never "--"
        const rawDate = visitor.visit_date || visitor.createdAt;
        const datePart = rawDate ? new Date(rawDate).toLocaleDateString('en-GB').split('/').join('-') : '--';
        const timePart = visitor.appointment_time || (visitor.visit_date ? new Date(visitor.visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--');

        const message = `*TripVenza Visitor Pass*%0A%0AHello *${visitor.name}*, your visit request has been approved.%0A%0A🏢 *Office:* ${visitor.appointment_with || 'General'}%0A📅 *Meeting Date:* ${datePart}%0A🕒 *Approved Time:* ${timePart}%0A🎫 *Access Link:* ${registrationUrl}%0A%0APlease show this message at the reception.`;
        const phone = visitor.mobile.replace(/\D/g, ''); // Clean non-digits
        // Using wa.me for universal compatibility
        window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    };

    const handlePrint = (visitor) => {
        const printWindow = window.open('', '_blank');
        const passHtml = `
            <html>
                <head>
                    <title>Visitor Pass - ${visitor.name}</title>
                    <style>
                        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f8fafc; }
                        .pass { width: 350px; background: white; border: 1px solid #e2e8f0; border-radius: 20px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; }
                        .logo { height: 60px; margin-bottom: 20px; object-fit: contain; }
                        .qr { margin: 25px 0; display: flex; justify-content: center; }
                        .qr img, .qr canvas { border: 10px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
                        .name { font-size: 28px; font-weight: 900; color: #0f172a; margin: 0; text-transform: uppercase; letter-spacing: -0.5px; }
                        .company { color: #64748b; font-weight: 600; text-transform: uppercase; font-size: 12px; margin-top: 5px; }
                        .time { margin-top: 20px; font-weight: 800; color: #10b981; font-size: 18px; }
                        @media print { body { background: white; } .pass { box-shadow: none; border: 1px solid #eee; } }
                    </style>
                </head>
                <body>
                    <div class="pass">
                        <img src="/logo.jpg" class="logo">
                        <div class="name">${visitor.name}</div>
                        <div class="company">${visitor.company || 'Private Visit'}</div>
                        <div style="font-size: 10px; color: #64748b; font-weight: bold; text-transform: uppercase; margin-top: 10px;">
                            Office: ${visitor.appointment_with || 'General'} | Purpose: ${visitor.purpose || 'Visit'}
                        </div>
                        <div class="qr" id="qrcode"></div>
                        <div class="time">APPROVED: ${visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString('en-GB').split('/').join('-') + ' ' + (visitor.appointment_time || '') : visitor.appointment_time}</div>
                        <p style="font-size: 10px; color: #94a3b8; margin-top: 20px;">VALID AT RECEPTION ONLY</p>
                    </div>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
                    <script>
                        const qrData = {
                            id: '${visitor._id}',
                            name: '${visitor.name}',
                            office: '${visitor.appointment_with || ''}',
                            time: '${visitor.visit_date ? new Date(visitor.visit_date).toLocaleDateString('en-GB') + ' ' + (visitor.appointment_time || '') : visitor.appointment_time}'
                        };
                        new QRCode(document.getElementById("qrcode"), {
                            text: JSON.stringify(qrData),
                            width: 150,
                            height: 150
                        });
                        setTimeout(() => { window.print(); window.close(); }, 800);
                    </script>
                </body>
            </html>
        `;
        printWindow.document.write(passHtml);
        printWindow.document.close();
    };
    const isValidDate = (d) => d instanceof Date && !isNaN(d);

    const filteredVisitors = visitors.filter(v => {
        const matchesOffice = filterOffice === 'All' || v.appointment_with === filterOffice;
        const matchesSearch = (v.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            v.mobile?.includes(searchTerm);

        // Robust date check
        let matchesDate = !filterDate;
        if (filterDate && v.createdAt) {
            const d = new Date(v.createdAt);
            if (isValidDate(d)) {
                matchesDate = d.toISOString().split('T')[0] === filterDate;
            } else {
                matchesDate = false;
            }
        }

        return matchesOffice && matchesSearch && matchesDate;
    });

    const stats = {
        total: filteredVisitors.length,
        pending: filteredVisitors.filter(v => v?.status === 'pending').length,
        approved: filteredVisitors.filter(v => v?.status === 'approved' || v?.status === 'checked-in' || v?.status === 'checked-out').length,
        rejected: filteredVisitors.filter(v => v?.status === 'rejected').length
    };

    // Grouping Logic for Date/Month/Year Records
    const groupedVisitors = filteredVisitors.reduce((groups, visitor) => {
        let date = visitor.createdAt ? new Date(visitor.createdAt) : new Date();
        if (!isValidDate(date)) date = new Date(); // Fallback to now if invalid

        const day = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
        if (!groups[day]) groups[day] = [];
        groups[day].push(visitor);
        return groups;
    }, {});

    const sortedDates = Object.keys(groupedVisitors).sort((a, b) => new Date(b) - new Date(a));


    return (
        <div className="w-full max-w-6xl mx-auto p-4 lg:p-8">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white via-emerald-100 to-slate-500 bg-clip-text text-transparent tracking-tight">Management Console</h1>
                    <p className="text-emerald-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2 flex items-center gap-2">
                        <span className="w-8 h-[1px] bg-emerald-500/30"></span>
                        Real-time Visitor Logistics
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={exportToCSV} className="premium-card p-3 rounded-xl text-cyan-400 hover:bg-cyan-500/10 flex items-center gap-2 text-xs font-black uppercase">
                        <Download className="w-4 h-4" /> Export
                    </button>
                    <button onClick={() => setShowQR(!showQR)} className="premium-card p-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-2 text-xs font-black uppercase">
                        <QrCode className="w-4 h-4" /> QR Portal
                    </button>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Filter:</span>
                        <input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} className="premium-input p-3 rounded-xl text-white text-xs bg-slate-800" />
                        {filterDate && (
                            <button onClick={() => setFilterDate('')} className="text-[10px] font-black text-rose-400 uppercase hover:text-rose-300">Clear</button>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-10">
                {/* Search and Filters */}
                <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 group-focus-within:text-emerald-400 transition-colors" />
                        <input type="text" placeholder="Search by name or mobile..." className="premium-input w-full p-4 pl-12 rounded-2xl text-white outline-none" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="relative">
                        <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 pointer-events-none" />
                        <select value={filterOffice} onChange={(e) => setFilterOffice(e.target.value)} className="premium-input w-full p-4 pl-12 rounded-2xl text-white bg-slate-800/50 appearance-none cursor-pointer">
                            <option value="All">All Offices</option>
                            <option value="ELLORA MANPOWER SERVICES">ELLORA MANPOWER SERVICES</option>
                            <option value="TRIPVENZA HOLIDAYS">TRIPVENZA HOLIDAYS</option>
                        </select>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="xl:col-span-2 flex items-center justify-end gap-4">
                    <button onClick={() => fetchVisitors(false)} className="premium-card p-4 rounded-2xl text-slate-400 hover:text-white transition-all hover:rotate-180 transform hover:bg-emerald-500/10">
                        <RefreshCw className={`w-6 h-6 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Total Visits', value: stats.total, icon: TrendingUp, color: 'from-blue-500 to-cyan-500', shadow: 'shadow-blue-500/20' },
                    { label: 'Awaiting', value: stats.pending, icon: Clock, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-500/20', animate: true },
                    { label: 'Cleared', value: stats.approved, icon: UserCheck, color: 'from-emerald-500 to-teal-500', shadow: 'shadow-emerald-500/20' },
                    { label: 'Declined', value: stats.rejected, icon: UserMinus, color: 'from-rose-500 to-pink-500', shadow: 'shadow-rose-500/20' },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5, scale: 1.02 }}
                        className={`relative p-6 rounded-3xl premium-card border-none overflow-hidden group shadow-2xl ${stat.shadow}`}
                    >
                        {/* Background Glow */}
                        <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />

                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-1">{stat.label}</p>
                                <h3 className="text-4xl font-black text-white tracking-tighter">{stat.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg shadow-black/20`}>
                                <stat.icon className={`w-6 h-6 text-white ${stat.animate ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>

                        <div className="mt-4 flex items-center gap-2">
                            <div className={`h-1 flex-1 bg-white/5 rounded-full overflow-hidden`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '70%' }}
                                    className={`h-full bg-gradient-to-r ${stat.color}`}
                                />
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Analytics Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Visitation Volume</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Last 7 Active Days</p>
                        </div>
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={Object.keys(groupedVisitors).slice(0, 7).reverse().map(date => ({
                                name: date.split(' ')[0] + ' ' + date.split(' ')[1],
                                count: groupedVisitors[date].length
                            }))}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#10b981', strokeWidth: 2 }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        fontSize: '12px',
                                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#10b981"
                                    strokeWidth={4}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    animationDuration={2000}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="premium-card p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight">Office Traffic</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Visitor distribution by company</p>
                        </div>
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                            <Building2 className="w-5 h-5 text-indigo-400" />
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                { name: 'Ellora', count: filteredVisitors.filter(v => v.appointment_with?.includes('ELLORA')).length, color: '#6366f1' },
                                { name: 'TripVenza', count: filteredVisitors.filter(v => v.appointment_with?.includes('TRIPVENZA')).length, color: '#10b981' }
                            ]}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{
                                        backgroundColor: '#0f172a',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '16px',
                                        fontSize: '12px'
                                    }}
                                />
                                <Bar dataKey="count" radius={[10, 10, 0, 0]} barSize={60}>
                                    {[
                                        { name: 'Ellora', count: 0, color: '#6366f1' },
                                        { name: 'TripVenza', count: 0, color: '#10b981' }
                                    ].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>


            <AnimatePresence>
                {showQR && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-8">
                        <div className="premium-card p-8 rounded-3xl flex flex-col items-center bg-emerald-500/5">
                            <QRCodeSVG value={registrationUrl} size={200} imageSettings={{ src: "/logo.jpg", height: 40, width: 40, excavate: true }} />
                            <p className="mt-4 text-slate-400 font-mono text-sm">{registrationUrl}</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="space-y-12">
                {sortedDates.map(dateLabel => (
                    <div key={dateLabel} className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <div className="bg-slate-800/50 backdrop-blur-md px-6 py-2 rounded-full border border-white/5 flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-emerald-400" />
                                <span className="text-white font-black text-xs uppercase tracking-[0.2em]">{dateLabel}</span>
                                <span className="bg-white/10 px-2 py-0.5 rounded text-[10px] text-slate-400 font-bold">{groupedVisitors[dateLabel].length} VISITS</span>
                            </div>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {groupedVisitors[dateLabel].map((visitor) => (
                                    <motion.div
                                        key={visitor._id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        whileHover={{ y: -8, scale: 1.02 }}
                                        className="glass-panel p-6 rounded-[2.5rem] relative group border border-white/5 hover:border-emerald-500/40 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.2)] transition-all duration-300"
                                    >
                                        <div className="flex gap-4 mb-6">
                                            <div className="w-24 h-32 rounded-2xl bg-slate-900 border border-white/10 overflow-hidden shrink-0 shadow-2xl">
                                                {visitor.photo ? <img src={visitor.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700 italic text-[10px]">No Photo</div>}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded w-fit mb-2 ${visitor.status === 'pending' ? 'bg-amber-500/20 text-amber-500' :
                                                    visitor.status === 'rejected' ? 'bg-rose-500/20 text-rose-500' :
                                                        'bg-emerald-500/20 text-emerald-500'
                                                    }`}>{visitor.status}</span>
                                                <h3 className="text-xl font-black text-white truncate">{visitor.name}</h3>
                                                <p className="text-slate-500 text-xs font-bold truncate">{visitor.company || 'Private Visit'}</p>
                                                {visitor.visit_date && (
                                                    <div className="mt-3 flex items-center gap-2 text-[11px] text-white font-black bg-emerald-500/20 px-3 py-1.5 rounded-xl border border-emerald-500/20 w-fit group-hover:bg-emerald-500 group-hover:text-white transition-all">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        <span>{new Date(visitor.visit_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                            <div className="flex flex-col gap-2 border-b border-white/5 pb-3 mb-2">
                                                <a
                                                    href={`https://wa.me/${visitor.mobile?.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors w-fit group/phone"
                                                >
                                                    <Phone className="w-3 h-3 text-cyan-400 group-hover/phone:text-emerald-400" />
                                                    <span className="text-[11px] font-bold tracking-wide">{visitor.mobile}</span>
                                                    <MessageCircle className="w-2.5 h-2.5 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
                                                </a>
                                                <div className="flex items-center gap-2 text-slate-400">
                                                    <Mail className="w-3 h-3 text-cyan-400" />
                                                    <span className="text-[11px] font-medium truncate tracking-wide">{visitor.email}</span>
                                                </div>
                                            </div>

                                            <p className="text-white text-[10px] font-black opacity-40 uppercase tracking-widest leading-none mb-1">Purpose of Visit</p>
                                            <p className="text-slate-300 text-xs leading-relaxed italic line-clamp-2">"{visitor.purpose}"</p>

                                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                                                {visitor.appointment_with && (
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={`w-1.5 h-1.5 rounded-full ${visitor.appointment_with === 'TRIPVENZA HOLIDAYS' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                                        <p className="text-white text-[9px] font-black uppercase tracking-widest">{visitor.appointment_with}</p>
                                                    </div>
                                                )}
                                                <p className="text-slate-500 text-[9px] font-bold">{visitor.createdAt ? new Date(visitor.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</p>
                                            </div>
                                        </div>
                                        {visitor.status === 'pending' && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleAction(visitor, 'approved')} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/20">Approve</button>
                                                <button onClick={() => handleAction(visitor._id, 'rejected')} className="flex-1 bg-rose-500 hover:bg-rose-400 text-white font-black py-3 rounded-xl transition-all">Reject</button>
                                            </div>
                                        )}
                                        {visitor.status === 'approved' && (
                                            <div className="space-y-2">
                                                <div className="bg-emerald-500/10 text-emerald-400 p-2 rounded-lg text-center font-black text-[10px] uppercase tracking-widest border border-emerald-500/20 flex items-center justify-center gap-2">
                                                    <Clock className="w-3 h-3" />
                                                    {visitor.visit_date ?
                                                        `${new Date(visitor.visit_date).toLocaleDateString('en-GB').split('/').join('-')} ${visitor.appointment_time || '00:00:00'}` :
                                                        visitor.appointment_time
                                                    }
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => handlePrint(visitor)} className="flex-1 bg-white/10 hover:bg-white/20 text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase">
                                                        <Download className="w-3 h-3" /> Print
                                                    </button>
                                                    <button onClick={() => sendWhatsAppPass(visitor)} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-white font-black py-3 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] uppercase">
                                                        <MessageCircle className="w-3 h-3" /> WhatsApp
                                                    </button>
                                                    <button onClick={() => handleCheckout(visitor._id)} className="flex-1 bg-slate-800 hover:bg-rose-500/10 hover:text-rose-400 text-white font-black py-3 rounded-xl transition-all text-[10px] uppercase">
                                                        Checkout
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                        {(visitor.status === 'checked-out' || visitor.status === 'rejected') && (
                                            <div className="mt-4 flex justify-between items-center text-[10px] font-black uppercase text-slate-600">
                                                <span>{visitor.status === 'checked-out' ? 'Visited' : 'Declined'} • {visitor.updatedAt ? new Date(visitor.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                                                <button onClick={() => handleDelete(visitor._id)} className="text-rose-500/50 hover:text-rose-500 transition-colors">Delete Log</button>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    </div>
                ))}
            </div>

            {/* FULL SCREEN ALERT MODAL */}
            <AnimatePresence>
                {newVisitorAlert && (
                    <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-3xl flex items-center justify-center p-6">
                        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="premium-card max-w-2xl w-full p-12 rounded-[3.5rem] border-2 border-emerald-500/40 shadow-[0_0_100px_rgba(16,185,129,0.3)] text-center relative overflow-hidden">
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <motion.div animate={{ scale: [1, 2], opacity: [0.5, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[30rem] h-[30rem] border-4 border-emerald-500 rounded-full" />
                            </div>
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-8 relative">
                                    <UsersRound className="w-12 h-12 text-emerald-400" />
                                    <div className="absolute inset-0 border-4 border-emerald-500/50 rounded-full animate-ping" />
                                </div>
                                <h1 className="text-6xl font-black text-white mb-8 tracking-tighter uppercase leading-none">New Visitor<br /><span className="text-emerald-500">Arrived</span></h1>
                                <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-8 border border-white/10 w-full mb-10 flex items-center gap-10 text-left">
                                    <div className="w-32 h-44 rounded-3xl bg-slate-900 border border-emerald-500/30 overflow-hidden shadow-2xl shrink-0">
                                        {newVisitorAlert.photo ? <img src={newVisitorAlert.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-700">No Photo</div>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-emerald-500 font-black uppercase tracking-[0.3em] text-[10px] mb-2">Gate Identity Check</p>
                                        <h3 className="text-4xl font-black text-white mb-2 leading-none">{newVisitorAlert.name || 'Anonymous Visitor'}</h3>
                                        <p className="text-slate-400 font-bold flex items-center gap-2 mb-6"><Building2 className="w-4 h-4" /> {newVisitorAlert.company || "Private visit"}</p>
                                        <div className="bg-emerald-500/10 text-emerald-400 px-6 py-2 rounded-2xl border border-emerald-500/20 font-black uppercase text-[10px] tracking-widest w-fit mb-4">Awaiting Clearance</div>
                                        {newVisitorAlert.visit_date && (
                                            <div className="flex items-center gap-2 text-white/60 font-bold bg-white/5 px-4 py-2 rounded-xl border border-white/5 w-fit">
                                                <Calendar className="w-4 h-4 text-emerald-400" />
                                                <span className="text-sm">Visit: {new Date(newVisitorAlert.visit_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full">
                                    <button onClick={() => { stopRingtone(); handleAction(newVisitorAlert, 'approved'); }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-white font-black py-6 rounded-3xl transition-all shadow-2xl shadow-emerald-500/40 text-xl uppercase">Grant Access</button>
                                    <button onClick={stopRingtone} className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-6 rounded-3xl transition-all border border-white/5 text-xl uppercase">Dismiss</button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {approvalId && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center">
                            <h3 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Security Token</h3>
                            {visitors.find(v => v._id === approvalId)?.visit_date && (
                                <div className="bg-white/5 p-3 rounded-2xl mb-4 border border-white/5">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none mb-1">Visitor Requested:</p>
                                    <p className="text-emerald-400 font-mono text-xs font-bold">
                                        {new Date(visitors.find(v => v._id === approvalId).visit_date).toLocaleString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })} @ {new Date(visitors.find(v => v._id === approvalId).visit_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            )}
                            <p className="text-slate-500 text-xs font-bold mb-4 uppercase tracking-widest">Select Access Time Window</p>
                            <div className="relative text-white mb-8">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="premium-input w-full p-4 pl-12 rounded-2xl text-white bg-slate-800 appearance-none font-bold">
                                    {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setApprovalId(null)} className="flex-1 px-4 py-4 rounded-2xl bg-slate-800 text-slate-400 font-black uppercase text-xs">Cancel</button>
                                <button onClick={confirmApproval} className="flex-1 px-4 py-4 rounded-2xl bg-emerald-500 text-white font-black uppercase text-xs shadow-lg shadow-emerald-500/30">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default AdminDashboard;
