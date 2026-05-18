import React, { useEffect, useState, useRef, useCallback } from 'react';
// Deploy Trigger v2.1.3 - hard reset and rebuild
import QRCode from 'react-qr-code';
import io from 'socket.io-client';
import api from '../services/api';
import { getPreferredApiBase } from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Cloud, Activity, Loader2, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Zap, ShieldCheck } from 'lucide-react';

const getSocketUrl = () => {
    return getPreferredApiBase() || import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const WhatsAppConnect = ({ instanceId, initialCompanyName }) => {
    console.log("🛸 [ALEX IO] WhatsAppConnect Rendering Started for:", instanceId);
    const [mode, setMode] = useState('QR');
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('DISCONNECTED'); // DISCONNECTED, CONNECTING, QR_READY, READY, FATAL
    const [cloudStatus, setCloudStatus] = useState({ configured: false });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [diagnostics, setDiagnostics] = useState(null);
    
    const socketRef = useRef(null);
    const pollIntervalRef = useRef(null);
    const autoConnectAttemptedRef = useRef(false);
    const status404CountRef = useRef(0);

    const addLog = useCallback((from, body) => {
        setLogs(prev => [{ from, body, timestamp: Date.now() }, ...prev].slice(0, 50));
    }, []);

    const stopPolling = useCallback(() => {
        if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
        }
    }, []);

    const fetchStatus = useCallback(async (id) => {
        if (!id || id === 'null') return;
        try {
            const res = await api.get(`/api/saas/status/${id}`);
            const data = res.data;
            status404CountRef.current = 0;
            
            const currentStatus = (data.status || 'DISCONNECTED').toUpperCase();
            setStatus(currentStatus);
            
            const qr = data.qr || data.qr_code;
            if (qr) setQrCode(qr);
            
            if (currentStatus === 'QR_READY' || currentStatus === 'CONNECTING' || currentStatus === 'WAITING_SCAN') {
                // Polling needed
            } else if (currentStatus === 'READY' || currentStatus === 'ONLINE') {
                setQrCode(null);
                stopPolling();
            }
            return { ok: true, data };
        } catch (e) {
            const code = e?.response?.status;
            if (code === 404) {
                status404CountRef.current += 1;
                setStatus('DISCONNECTED');
                setQrCode(null);
                stopPolling();
                return { ok: false, notFound: true };
            }
            console.warn("Could not fetch WA status:", e.message);
            return { ok: false, notFound: false };
        }
    }, [stopPolling]);

    const startPolling = useCallback((id) => {
        stopPolling();
        pollIntervalRef.current = setInterval(() => fetchStatus(id), 3000);
    }, [fetchStatus, stopPolling]);

    const fetchDiagnostics = useCallback(async () => {
        try {
            const res = await api.get('/api/diagnostics/ai');
            setDiagnostics(res.data);
        } catch (e) {
            console.warn("Could not fetch diagnostics:", e.message);
        }
    }, []);

    const fetchCloudStatus = useCallback(async (id) => {
        if (!id || id === 'null') return;
        try {
            const res = await api.get(`/api/saas/status/${id}`);
            setCloudStatus(res.data);
        } catch (e) {
            console.warn("Could not fetch Cloud API status:", e.message);
        }
    }, []);

    // Initial load and instance sync
    useEffect(() => {
        if (!instanceId || instanceId === 'null') return;
        
        const init = async () => {
            autoConnectAttemptedRef.current = false;
            status404CountRef.current = 0;
            setLoading(true);
            setQrCode(null);
            setStatus('DISCONNECTED');
            try {
                const [waStatusResult] = await Promise.all([
                    fetchStatus(instanceId),
                    fetchCloudStatus(instanceId),
                    fetchDiagnostics()
                ]);

                if (!autoConnectAttemptedRef.current && waStatusResult?.notFound) {
                    autoConnectAttemptedRef.current = true;
                    await api.post('/api/saas/connect', {
                        instanceId,
                        companyName: initialCompanyName || 'Alex Bot'
                    });
                    addLog('Sistema', 'Instancia no encontrada. Reaprovisionando conexión...');
                    setStatus('CONNECTING');
                    startPolling(instanceId);
                }
            } finally {
                setLoading(false);
            }
        };
        init();

        return () => stopPolling();
    }, [instanceId, fetchStatus, fetchCloudStatus, fetchDiagnostics, stopPolling]);

    // Socket implementation
    useEffect(() => {
        if (!instanceId || instanceId === 'null') return;

        const socketUrl = getSocketUrl();
        console.log("🌐 Socket Target:", socketUrl);
        
        socketRef.current = io(socketUrl, {
            reconnection: true,
            reconnectionAttempts: 10,
            transports: ['websocket', 'polling']
        });

        socketRef.current.on('connect', () => {
            console.log("✅ Socket Connected");
            addLog("Sistema", "Conexión en tiempo real establecida.");
        });

        socketRef.current.on('wa_qr', (data) => {
            if (data.instanceId === instanceId) {
                console.log("📱 QR Received via Socket");
                setQrCode(data.qr);
                setStatus('QR_READY');
            }
        });

        socketRef.current.on('wa_status', (data) => {
            if (data.instanceId === instanceId) {
                console.log("📡 Status Update via Socket:", data.status);
                const nextStatus = (data.status || '').toUpperCase();
                setStatus(nextStatus);
                if (nextStatus === 'READY' || nextStatus === 'ONLINE') {
                    setQrCode(null);
                    stopPolling();
                } else if (data.qr) {
                    setQrCode(data.qr);
                }
            }
        });

        socketRef.current.on('wa_log', (data) => {
            if (data.instanceId === instanceId) {
                setLogs(prev => [{
                    from: data.level || 'Log',
                    body: data.message,
                    timestamp: Date.now()
                }, ...prev].slice(0, 50));
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [instanceId, addLog, stopPolling]);

    const handleConnect = async () => {
        setStatus('CONNECTING');
        setQrCode(null);
        try {
            const res = await api.post('/api/saas/connect', { 
                instanceId: instanceId,
                companyName: initialCompanyName || 'Alex Bot' 
            });
            addLog("Sistema", "Iniciando aprovisionamiento de instancia...");
            startPolling(instanceId);
        } catch (e) {
            setStatus('DISCONNECTED');
            addLog("Error", e.message);
            alert("Error al iniciar: " + e.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-white p-6">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="mb-6"
                >
                    <Loader2 size={64} className="text-blue-500" />
                </motion.div>
                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-xl font-medium text-slate-400"
                >
                    Sincronizando con Alex IO...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="text-white p-4 md:p-0 font-sans selection:bg-blue-500/30 animate-in fade-in duration-700">
            {/* Header Mini */}
            <div className="max-w-6xl mx-auto mb-10 flex flex-col items-start">
                <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="flex items-center gap-3 mb-2"
                >
                    <div className="bg-gradient-to-br from-blue-500 to-emerald-500 p-2 rounded-xl shadow-lg shadow-blue-500/20">
                        <Zap size={20} className="text-white" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                        CANAL WHATSAPP <span className="text-blue-500 text-sm align-top ml-1">v5.2</span>
                    </h2>
                </motion.div>
                <p className="text-slate-500 font-medium tracking-wide uppercase text-[9px]">
                    ID DE INSTANCIA: {instanceId}
                </p>
            </div>

            {/* Navigation Tabs */}
            <div className="flex justify-start mb-10 bg-slate-900/40 backdrop-blur-md p-1 rounded-2xl max-w-sm border border-white/5 shadow-inner">
                {[
                    { id: 'QR', icon: QrCode, label: 'WhatsApp Web' },
                    { id: 'CLOUD', icon: Cloud, label: 'Cloud API' },
                    { id: 'DIAG', icon: Activity, label: 'Salud' }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => {
                            setMode(tab.id);
                            if (tab.id === 'DIAG') fetchDiagnostics();
                        }}
                        className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                            mode === tab.id 
                            ? 'bg-blue-600/90 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] backdrop-blur-sm' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto">
                {/* Main Control Card */}
                <div className="lg:col-span-7 flex flex-col gap-6">
                    <motion.div 
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-slate-900/40 backdrop-blur-xl p-10 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden group"
                    >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        
                        <AnimatePresence mode="wait">
                            {mode === 'QR' ? (
                                <motion.div 
                                    key="qr-view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="relative z-10 w-full flex flex-col items-center"
                                >
                                    <h2 className="text-xl font-bold mb-8 text-white flex items-center gap-2 uppercase tracking-tighter">
                                        <Smartphone size={20} className="text-blue-400" />
                                        Puerta de Enlace QR
                                    </h2>

                                    <div className="relative mb-10">
                                        {status === 'READY' || status === 'ONLINE' ? (
                                            <div className="relative">
                                                <motion.div 
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    className="w-56 h-56 bg-emerald-500/10 rounded-[3rem] flex items-center justify-center border-2 border-emerald-500/50 shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                                                >
                                                    <CheckCircle2 size={80} className="text-emerald-500" />
                                                </motion.div>
                                                <motion.div 
                                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0, 0.5] }}
                                                    transition={{ repeat: Infinity, duration: 2 }}
                                                    className="absolute inset-0 bg-emerald-500/20 rounded-[3rem] -z-10"
                                                />
                                            </div>
                                        ) : qrCode ? (
                                            <motion.div 
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="bg-white p-8 rounded-2xl shadow-[0_0_60px_rgba(255,255,255,0.1)] relative"
                                            >
                                                {qrCode.startsWith('data:image') ? (
                                                    <img src={qrCode} alt="WhatsApp QR" className="w-[220px] h-[220px] object-contain" />
                                                ) : (
                                                    <QRCode value={qrCode} size={220} level="H" />
                                                )}
                                                <div className="absolute -inset-2 border border-white/20 rounded-3xl pointer-events-none" />
                                            </motion.div>
                                        ) : status === 'CONNECTING' || status === 'RECONNECTING_CLEAN' ? (
                                            <div className="w-56 h-56 bg-slate-800/30 rounded-[3rem] flex flex-col items-center justify-center border border-white/5 border-dashed">
                                                <RefreshCw className="animate-spin text-blue-500 mb-4" size={48} />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-4">
                                                    {status === 'RECONNECTING_CLEAN' ? 'Sanando Sesión...' : 'Preparando QR...'}
                                                </span>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={handleConnect}
                                                className="group/btn w-56 h-56 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-[3rem] flex flex-col items-center justify-center border border-white/10 shadow-2xl transition-all hover:scale-105 active:scale-95"
                                            >
                                                <div className="bg-white/10 p-4 rounded-2xl mb-4 group-hover/btn:rotate-12 transition-transform">
                                                    <QrCode size={48} className="text-white" />
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Vincular Canal</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="flex gap-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${status === 'READY' || status === 'ONLINE' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
                                            {status}
                                        </div>
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                                            Engine: Baileys
                                        </div>
                                    </div>
                                </motion.div>
                            ) : mode === 'CLOUD' ? (
                                <motion.div 
                                    key="cloud-view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full"
                                >
                                    <div className="bg-blue-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 mx-auto border border-blue-500/20">
                                        <Cloud size={40} className="text-blue-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2 text-white">WhatsApp Cloud API</h2>
                                    <p className="text-sm text-slate-400 mb-8 max-w-sm mx-auto">Infraestructura oficial escalable para grandes volúmenes de tráfico.</p>
                                    
                                    <div className="grid grid-cols-1 gap-3 max-w-xs mx-auto">
                                        <StatusBadge label="Estado Cloud" value={cloudStatus.configured ? 'Configurado' : 'Pendiente'} ok={cloudStatus.configured} />
                                        <StatusBadge label="Phone Number ID" value={cloudStatus.phoneNumberId || 'No detectado'} ok={!!cloudStatus.phoneNumberId} />
                                        <button className="mt-4 py-4 px-6 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                                            Ver Documentación Meta
                                        </button>
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div 
                                    key="diag-view"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="w-full"
                                >
                                    <div className="bg-emerald-500/10 w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 mx-auto border border-emerald-500/20">
                                        <Activity size={40} className="text-emerald-500" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-8 text-white uppercase tracking-tighter">Salud del Ecosistema</h2>
                                    
                                    <div className="grid grid-cols-1 gap-3 max-w-md mx-auto text-left">
                                        {diagnostics ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <StatusBadge label="Gemini AI" value="Óptimo" ok={diagnostics.providers.gemini} />
                                                    <StatusBadge label="OpenAI" value="Activo" ok={diagnostics.providers.openai} />
                                                </div>
                                                <StatusBadge label="Base de Datos" value="Sincronizada" ok={diagnostics.providers.supabase} />
                                                <StatusBadge label="WhatsApp Core" value={status} ok={status === 'READY' || status === 'ONLINE'} />
                                                
                                                <button 
                                                    onClick={fetchDiagnostics}
                                                    className="mt-6 flex items-center justify-center gap-2 py-4 px-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-400 transition-all"
                                                >
                                                    <RefreshCw size={14} /> Refrescar Diagnóstico
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-center py-10">
                                                <Loader2 size={32} className="animate-spin text-slate-600 mx-auto mb-2" />
                                                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Consultando Neuronas...</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>

                {/* Sidebar Info */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    {/* Activity Log */}
                    <div className="bg-slate-900/40 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 flex flex-col h-full shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Neural Stream</h3>
                            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 min-h-[300px] max-h-[400px]">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-30">
                                    <Activity size={40} className="mb-4 text-slate-600" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Esperando Señales...</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <motion.div 
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        key={i} 
                                        className="text-[10px] font-medium p-4 bg-white/5 rounded-2xl border-l-2 border-blue-500/50 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex justify-between mb-1 opacity-50">
                                            <span className="font-black uppercase tracking-tighter text-blue-400">{log.from}</span>
                                            <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed font-mono">{log.body}</p>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Security Badge */}
                    <div className="bg-gradient-to-br from-blue-600/10 to-emerald-600/10 p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                        <div className="p-4 bg-white/5 rounded-2xl">
                            <ShieldCheck size={32} className="text-emerald-500" />
                        </div>
                        <div>
                            <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Cifrado de Extremo a Extremo</h4>
                            <p className="text-[10px] text-slate-500 leading-tight">Sesión protegida mediante tokens de seguridad efímeros y encriptación AES-256.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusBadge = ({ label, value, ok }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{label}</span>
        <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                {value}
            </span>
            <div className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'}`} />
        </div>
    </div>
);

export default WhatsAppConnect;
