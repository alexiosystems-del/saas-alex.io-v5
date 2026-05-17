// Deploy Trigger v2.1.6 - global-v8-ai deduplication rollout
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Cloud, Activity, Loader2, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Zap, ShieldCheck } from 'lucide-react';

const getSocketUrl = () => {
    if (import.meta.env.PROD) {
        if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
        if (typeof window !== 'undefined') {
            return window.location.origin;
        }
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
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

        socketRef.current.on('connect_error', (err) => {
            console.error("❌ Socket Connect Error:", err);
            addLog("Sistema", "Error de conexión en tiempo real.");
        });

        socketRef.current.on('wa_qr', (data) => {
            if (data.instance_id === instanceId || data.instanceId === instanceId) {
                setQrCode(data.qr || data.qr_code);
                setStatus('QR_READY');
                stopPolling();
            }
        });

        socketRef.current.on('wa_status', (data) => {
            if (data.instance_id === instanceId || data.instanceId === instanceId) {
                setStatus(data.status.toUpperCase());
                if (data.status === 'READY' || data.status === 'online') {
                    setQrCode(null);
                    stopPolling();
                }
            }
        });

        socketRef.current.on('wa_log', (data) => {
            if (data.instance_id === instanceId) {
                addLog(data.from || 'WA', data.body || data.message);
            }
        });

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [instanceId, addLog, stopPolling]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-900/50 rounded-[3rem] border border-white/5">
                <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Calculando Conectividad...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-900/80 rounded-2xl border border-white/5 max-w-md mx-auto">
                <button onClick={() => setMode('QR')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'QR' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Smartphone size={14} /> WhatsApp Web
                </button>
                <button onClick={() => setMode('CLOUD')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'CLOUD' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Cloud size={14} /> Cloud API
                </button>
                <button onClick={() => setMode('DIAG')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'DIAG' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                    <Activity size={14} /> Diagnóstico
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                    {mode === 'QR' ? (
                        <>
                            <AnimatePresence mode="wait">
                                {status === 'READY' || status === 'ONLINE' ? (
                                    <motion.div key="ready" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex flex-col items-center">
                                        <div className="w-32 h-32 bg-green-500/20 rounded-[2rem] flex items-center justify-center border-2 border-green-500/30 mb-6 shadow-[0_0_50px_rgba(34,197,94,0.15)]">
                                            <ShieldCheck size={64} className="text-green-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Bot Activo</h3>
                                        <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Conexión Segura Establecida</p>
                                    </motion.div>
                                ) : qrCode ? (
                                    <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                                        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl mb-8">
                                            <QRCodeSVG value={qrCode} size={220} level="H" includeMargin={false} />
                                        </div>
                                        <div className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                                            <RefreshCw className="animate-spin text-indigo-500" size={16} />
                                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Escanea para Vincular</span>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div key="disconnected" className="flex flex-col items-center">
                                        <div className="w-24 h-24 bg-slate-800 rounded-[2rem] flex items-center justify-center border border-white/5 mb-6">
                                            <QrCode size={40} className="text-slate-600" />
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setStatus('CONNECTING');
                                                api.post('/api/saas/connect', { instanceId, companyName: initialCompanyName || 'Alex Bot' })
                                                   .then(() => startPolling(instanceId))
                                                   .catch(e => pushNotice('error', e.message));
                                            }}
                                            className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all"
                                        >
                                            Generar Nuevo QR
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </>
                    ) : mode === 'CLOUD' ? (
                        <div className="w-full space-y-4">
                             <h3 className="text-center font-black text-white uppercase tracking-tighter italic mb-6">WhatsApp Cloud API</h3>
                             <StatusRow label="Estado" value={cloudStatus.configured ? 'Configurado' : 'Pendiente'} ok={cloudStatus.configured} />
                             <StatusRow label="Phone ID" value={cloudStatus.phoneNumberId || 'N/A'} ok={!!cloudStatus.phoneNumberId} />
                             <StatusRow label="WhatsApp ID" value={cloudStatus.waId || 'N/A'} ok={!!cloudStatus.waId} />
                        </div>
                    ) : (
                        <div className="w-full space-y-4">
                             <h3 className="text-center font-black text-white uppercase tracking-tighter italic mb-6">Auditoría de Salud</h3>
                             <StatusRow label="Gemini AI" value={diagnostics?.providers?.gemini ? 'Operacional' : 'Error'} ok={diagnostics?.providers?.gemini} />
                             <StatusRow label="OpenAI (Audio)" value={diagnostics?.providers?.openai ? 'Operacional' : 'Error'} ok={diagnostics?.providers?.openai} />
                             <StatusRow label="DeepSeek" value={diagnostics?.providers?.deepseek ? 'Operacional' : 'Error'} ok={diagnostics?.providers?.deepseek} />
                             <StatusRow label="Conexión WA" value={status} ok={status === 'READY' || status === 'ONLINE'} />
                             <button onClick={fetchDiagnostics} className="w-full mt-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">Refrescar Diagnóstico</button>
                        </div>
                    )}
                </div>

                <div className="bg-slate-950 border border-white/5 rounded-[2.5rem] flex flex-col h-[400px]">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-indigo-500" /> Consola de Eventos
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 font-mono text-[11px]">
                        {logs.length === 0 && <p className="text-slate-800 italic text-center py-20">Esperando tráficos...</p>}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-4 group">
                                <span className="text-slate-700 whitespace-nowrap">{new Date(log.timestamp).toLocaleTimeString([], {hour12:false})}</span>
                                <span className={`font-bold ${log.from === 'Sistema' ? 'text-indigo-500' : 'text-emerald-500'}`}>{log.from}:</span>
                                <span className="text-slate-400 group-hover:text-slate-200 transition-colors">{log.body}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

const StatusRow = ({ label, value, ok }) => (
    <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <span className={`text-[10px] font-black uppercase tracking-widest ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{value}</span>
    </div>
);

export default WhatsAppConnect;

const StatusBadge = ({ label, value, ok }) => (
    <div className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
        <span className="text-xs text-slate-500 font-bold uppercase">{label}</span>
        <span className={`text-xs font-bold ${ok ? 'text-green-400' : 'text-red-400'}`}>{value}</span>
    </div>
);

export default WhatsAppConnect;
