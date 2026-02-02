import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Building2, Mail, MessageSquare, Send, CheckCircle, Download, Share2, UsersRound, Camera, RefreshCw, Trash2, Upload, XCircle, UserRound, Calendar, Clock } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';

const VisitorForm = () => {
    const webcamRef = React.useRef(null);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        company: '',
        email: '',
        appointment_with: '',
        visit_date: new Date().toISOString().slice(0, 16), // Format: YYYY-MM-DDTHH:mm
        purpose: '',
        photo: null
    });

    const [cameraLoading, setCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState(null);
    const [isSecureContext, setIsSecureContext] = useState(true);

    React.useEffect(() => {
        // Check if camera is supported by browser and connection is secure
        if (!window.isSecureContext && window.location.hostname !== 'localhost') {
            setIsSecureContext(false);
            setCameraLoading(false);
        }
    }, []);

    const capturePhoto = React.useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            if (imageSrc) {
                setFormData(prev => ({ ...prev, photo: imageSrc }));
            } else {
                alert("Camera not ready. Please wait a moment or refresh.");
            }
        }
    }, [webcamRef]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, photo: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const [visitorId, setVisitorId] = useState(null);
    const [approvalData, setApprovalData] = useState(null);

    const [errorMessage, setErrorMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.photo) {
            alert("Please capture a live photo to proceed with registration.");
            return;
        }

        if (!formData.appointment_with) {
            alert("Please select an office to visit.");
            return;
        }

        setStatus('submitting');
        setErrorMessage('');
        try {
            const res = await api.post('/api/visitors', formData);
            setVisitorId(res.data.id);
            setStatus('success');
        } catch (err) {
            console.error('SUBMISSION ERROR:', err);
            setStatus('error');

            let detailedError = '';
            if (!err.response) {
                // Network error (server down, CORS, etc.)
                // Network error (server down, CORS, etc.)
                detailedError = `Network/Server Error. target: ${api.defaults.baseURL}`;
            } else if (err.response.status === 413) {
                detailedError = "Photo size too large. Please try again.";
            } else {
                detailedError = err.response.data?.error || `Error ${err.response.status}: ${err.response.statusText || 'Submission failed'} (Target: ${api.defaults.baseURL})`;
            }

            setErrorMessage(detailedError);
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
                const res = await api.get(`/api/visitors/${visitorId}`);
                const visitor = res.data;
                if (visitor.status === 'approved' || visitor.status === 'rejected') {
                    setApprovalData(visitor);
                    clearInterval(interval);
                }
            } catch (err) {
                console.error("Polling error", err);
            }
        }, 1000); // Check every 1 second (Faster polling)

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
                    <p className="text-slate-400 mb-2">
                        Thank you for registering. Please wait in the lounge.
                    </p>
                    {formData.visit_date && (
                        <div className="bg-white/5 border border-white/10 p-3 rounded-xl mb-6 flex items-center justify-center gap-2">
                            <Calendar className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs text-slate-300 font-bold">Planned Visit: {new Date(formData.visit_date).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    )}
                    <p className="mb-6">
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
                                    <div className="text-left w-full" id="visitor-pass-card" style={{ backgroundColor: '#020617' }}>
                                        <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
                                            <div>
                                                <h2 className="text-xl font-bold text-white">Visitor Pass</h2>
                                                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider" style={{ color: '#34d399' }}>Approved</p>
                                            </div>
                                            <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(52, 211, 153, 0.2)' }}>
                                                <CheckCircle className="w-6 h-6 text-emerald-400" style={{ color: '#34d399' }} />
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-2xl mb-6 shadow-xl text-center">
                                            <div className="flex justify-center mb-2">
                                                <QRCodeSVG
                                                    value={JSON.stringify({
                                                        id: approvalData._id,
                                                        name: approvalData.name,
                                                        company: approvalData.company,
                                                        office: approvalData.appointment_with,
                                                        time: approvalData.visit_date ? `${new Date(approvalData.visit_date).toLocaleDateString('en-GB')} ${approvalData.appointment_time || ''}` : approvalData.appointment_time
                                                    })}
                                                    size={160}
                                                />
                                            </div>
                                            <p className="text-slate-900 font-mono text-xs font-bold tracking-widest mt-1 opacity-60">SCAN AT RECEPTION</p>
                                        </div>

                                        <div className="space-y-4 mb-8">
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Visitor Name</p>
                                                <p className="text-lg text-white font-semibold" style={{ color: '#ffffff' }}>{approvalData.name}</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Time</p>
                                                    <p className="text-emerald-400 font-mono text-sm font-bold" style={{ color: '#34d399' }}>
                                                        {approvalData.visit_date ?
                                                            `${new Date(approvalData.visit_date).toLocaleDateString('en-GB').split('/').join('-')} ${approvalData.appointment_time || '00:00:00'}` :
                                                            approvalData.appointment_time || 'N/A'
                                                        }
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Company</p>
                                                    <p className="text-slate-300 font-medium truncate" style={{ color: '#cbd5e1' }}>{approvalData.company || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Office</p>
                                                    <p className="text-white font-bold truncate text-[10px]" style={{ color: '#ffffff' }}>{approvalData.appointment_with || '-'}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1" style={{ color: '#64748b' }}>Purpose</p>
                                                <p className="text-slate-300 font-medium line-clamp-2 text-[10px]" style={{ color: '#cbd5e1' }}>{approvalData.purpose || '-'}</p>
                                            </div>
                                        </div>

                                        <button
                                            onClick={async () => {
                                                const element = document.getElementById('visitor-pass-card');
                                                if (element) {
                                                    try {
                                                        const canvas = await html2canvas(element, {
                                                            backgroundColor: '#020617',
                                                            scale: 2,
                                                            useCORS: true,
                                                            allowTaint: false,
                                                            logging: false,
                                                            onclone: (clonedDoc) => {
                                                                const originalPass = document.getElementById('visitor-pass-card');
                                                                const clonedPass = clonedDoc.getElementById('visitor-pass-card');

                                                                if (originalPass && clonedPass) {
                                                                    const originals = [originalPass, ...originalPass.querySelectorAll('*')];
                                                                    const clones = [clonedPass, ...clonedPass.querySelectorAll('*')];

                                                                    originals.forEach((origEl, idx) => {
                                                                        const cloneEl = clones[idx];
                                                                        if (!cloneEl) return;

                                                                        const style = window.getComputedStyle(origEl);
                                                                        cloneEl.style.color = style.color.includes('oklch') ? '#ffffff' : style.color;
                                                                        cloneEl.style.backgroundColor = style.backgroundColor.includes('oklch') ? 'transparent' : style.backgroundColor;
                                                                        cloneEl.style.borderColor = style.borderColor.includes('oklch') ? 'transparent' : style.borderColor;
                                                                        cloneEl.style.fontSize = style.fontSize;
                                                                        cloneEl.style.fontWeight = style.fontWeight;
                                                                        cloneEl.style.borderRadius = style.borderRadius;
                                                                        cloneEl.style.padding = style.padding;
                                                                        cloneEl.style.margin = style.margin;
                                                                        cloneEl.style.display = style.display;
                                                                        cloneEl.style.flexDirection = style.flexDirection;
                                                                        cloneEl.style.alignItems = style.alignItems;
                                                                        cloneEl.style.justifyContent = style.justifyContent;
                                                                        cloneEl.style.gap = style.gap;

                                                                        if (style.backgroundImage.includes('oklch') || style.background.includes('oklch')) {
                                                                            cloneEl.style.backgroundImage = 'none';
                                                                            cloneEl.style.background = 'none';
                                                                        }
                                                                    });

                                                                    const sheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                                                                    sheets.forEach(sheet => sheet.remove());
                                                                    clonedDoc.body.style.background = '#020617';
                                                                }
                                                            }
                                                        });
                                                        const link = document.createElement('a');
                                                        link.download = `VisitorPass-${approvalData.name}.jpg`;
                                                        link.href = canvas.toDataURL("image/jpeg", 0.9);
                                                        link.click();
                                                    } catch (err) {
                                                        console.error("Download Error:", err);
                                                        alert("Technical Error: " + err.message);
                                                    }
                                                }
                                            }}
                                            className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mb-3 shadow-lg shadow-emerald-500/20 text-[10px] uppercase"
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
                <img src="/logo.jpg" alt="TripVenza Holidays Logo" className="h-16 w-auto mx-auto mb-2 object-contain rounded-lg" />
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

                {/* Office Selection */}
                <div className="relative">
                    <Building2 className="absolute left-3 top-[18px] text-slate-500 w-5 h-5 z-10" />
                    <div className="relative">
                        <button
                            type="button"
                            onClick={() => {
                                setIsDropdownOpen(!isDropdownOpen);
                            }}
                            className={`premium-input w-full p-4 pl-12 rounded-xl text-left transition-all flex items-center justify-between ${formData.appointment_with ? 'text-white' : 'text-slate-500'}`}
                        >
                            <span>{formData.appointment_with || 'Select Office *'}</span>
                            <motion.div
                                animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </motion.div>
                        </button>

                        <AnimatePresence>
                            {isDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 5, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    className="absolute top-full left-0 w-full z-50 bg-[#1e293b] border border-white/10 rounded-xl mt-2 overflow-hidden shadow-2xl"
                                >
                                    <div
                                        onClick={() => {
                                            setFormData({ ...formData, appointment_with: 'ELLORA MANPOWER SERVICES' });
                                            setIsDropdownOpen(false);
                                        }}
                                        className="p-4 hover:bg-indigo-500/10 cursor-pointer flex items-center gap-3 group border-b border-white/5"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-indigo-500 group-hover:scale-150 transition-transform" />
                                        <div>
                                            <p className="text-white font-bold group-hover:text-indigo-400 transition-colors">ELLORA MANPOWER SERVICES</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Premier Manpower Solutions</p>
                                        </div>
                                    </div>
                                    <div
                                        onClick={() => {
                                            setFormData({ ...formData, appointment_with: 'TRIPVENZA HOLIDAYS' });
                                            setIsDropdownOpen(false);
                                        }}
                                        className="p-4 hover:bg-emerald-500/10 cursor-pointer flex items-center gap-3 group"
                                    >
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:scale-150 transition-transform" />
                                        <div>
                                            <p className="text-white font-bold group-hover:text-emerald-400 transition-colors">TRIPVENZA HOLIDAYS</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">World Class Travel & Tourism</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>


                {/* Visit Date & Time */}
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5 z-10" />
                    <input
                        type="datetime-local"
                        name="visit_date"
                        value={formData.visit_date}
                        onChange={handleChange}
                        required
                        className="premium-input w-full p-4 pl-12 rounded-xl text-white appearance-none"
                        style={{ colorScheme: 'dark' }}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-bold uppercase tracking-widest pointer-events-none">
                        Visit Date & Time
                    </div>
                </div>


                <div className="relative">
                    <div className={`premium-card p-4 rounded-xl border ${formData.photo ? 'border-emerald-500/50' : 'border-white/10'} overflow-hidden`}>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <div className="flex items-center gap-2">
                                <Camera className={`w-4 h-4 ${formData.photo ? 'text-emerald-400' : 'text-slate-500'}`} />
                                <span className={`text-xs font-bold uppercase tracking-wider ${formData.photo ? 'text-emerald-400' : 'text-slate-500'}`}>
                                    {formData.photo ? 'Photo Captured' : 'Live Photo Capture *'}
                                </span>
                            </div>
                            {formData.photo && (
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, photo: null })}
                                    className="text-slate-500 hover:text-rose-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {!formData.photo ? (
                            <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
                                {!isSecureContext ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                        <XCircle className="w-12 h-12 text-rose-500 mb-4" />
                                        <p className="text-white font-bold text-sm mb-2">Browser Security Block</p>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Your browser blocks camera access on insecure connections.
                                            Please use <span className="text-emerald-400 font-mono">localhost</span> or an <span className="text-emerald-400 font-mono">https://</span> link.
                                        </p>
                                    </div>
                                ) : (
                                    <>
                                        {cameraLoading && (
                                            <div className="absolute inset-0 skeleton-shimmer flex flex-col items-center justify-center">
                                                <Camera className="w-8 h-8 text-slate-400 mb-2 animate-bounce" />
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Initializing Camera...</p>
                                            </div>
                                        )}
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            screenshotQuality={0.8}
                                            onUserMedia={() => setCameraLoading(false)}
                                            videoConstraints={{
                                                width: 1280,
                                                height: 720,
                                                facingMode: "user"
                                            }}
                                            onUserMediaError={(err) => {
                                                console.error("Camera Error:", err);
                                                setCameraLoading(false);
                                                setCameraError(err.name);
                                            }}
                                            className={`w-full h-full object-cover transition-opacity duration-700 ${cameraLoading ? 'opacity-0' : 'opacity-100'}`}
                                        />
                                        {!cameraError ? (
                                            <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col items-center justify-end p-6 transition-opacity duration-500 ${cameraLoading ? 'opacity-0' : 'opacity-100'}`}>
                                                <p className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-3 bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">Real-time Identity Verification Required</p>
                                                <button
                                                    type="button"
                                                    onClick={capturePhoto}
                                                    className="bg-emerald-500 text-white font-black px-8 py-3 rounded-full flex items-center gap-3 hover:bg-emerald-400 transition-all transform hover:scale-105 shadow-2xl shadow-emerald-500/50 animate-pulse hover:animate-none"
                                                >
                                                    <Camera className="w-5 h-5" /> TAKE PHOTO
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-slate-900/40 backdrop-blur-sm">
                                                <Camera className="w-10 h-10 text-slate-500 mb-3 opacity-20" />
                                                <p className="text-white font-bold text-[10px] uppercase tracking-widest mb-1">
                                                    {cameraError === 'NotFoundError' ? 'Hardware Disconnected' : 'Camera Busy'}
                                                </p>
                                                <p className="text-slate-400 text-[10px] leading-relaxed mb-4 px-4">
                                                    {cameraError === 'NotFoundError'
                                                        ? 'No physical camera detected. Please check your USB connection or Device Manager.'
                                                        : 'Another app is using your lens. Please close Zoom/Teams/Other tabs and try again.'}
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setCameraError(null);
                                                        setCameraLoading(true);
                                                    }}
                                                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white text-[10px] font-black px-6 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition-all font-mono"
                                                >
                                                    <RefreshCw className="w-3 h-3" /> RE-INITIALIZE LENS
                                                </button>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className="relative aspect-video rounded-lg overflow-hidden border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)] group">
                                <img src={formData.photo} alt="Visitor" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, photo: null })}
                                        className="bg-white text-slate-900 font-black px-8 py-3 rounded-full flex items-center gap-3 hover:bg-rose-500 hover:text-white transition-all transform hover:scale-105"
                                    >
                                        <RefreshCw className="w-5 h-5" /> RETAKE PHOTO
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Manual Upload Fallback */}
                        {!formData.photo && (
                            <div className="mt-4 flex flex-col items-center">
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-3 opacity-40">— OR —</p>
                                <label className="cursor-pointer group/upload">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        capture="user"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                    <div className="flex items-center gap-3 text-cyan-400 hover:text-white transition-all font-black text-xs bg-cyan-500/10 px-8 py-3 rounded-2xl border border-cyan-500/20 group-hover/upload:bg-cyan-500 group-hover/upload:shadow-[0_0_20px_rgba(6,182,212,0.4)] uppercase tracking-widest">
                                        <Upload className="w-5 h-5" />
                                        Upload Manually
                                    </div>
                                </label>
                                <p className="text-[9px] text-slate-600 mt-3 italic text-center px-8 leading-relaxed">
                                    Use this if your camera hardware is not detected (NotFoundError) <br /> or to select a photo from your gallery.
                                </p>
                            </div>
                        )}
                    </div>
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

                <AnimatePresence>
                    {errorMessage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs font-bold text-center"
                        >
                            {errorMessage}
                        </motion.div>
                    )}
                </AnimatePresence>

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
