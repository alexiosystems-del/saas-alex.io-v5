import React, { useEffect, useState, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import api from '../services/api';
import { motion } from 'framer-motion';
import { QrCode, Cloud, Activity, Loader2 } from 'lucide-react';

const MAX_QR_TEXT_LENGTH = 2500;

const getBackendUrl = () => {
    if (import.meta.env.PROD) {
        return import.meta.env.VITE_API_URL || 'https://whatsapp-fullstack-ylsx.onrender.com';
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

const getSocketUrl = () => {
    if (import.meta.env.PROD) {
        return window.location.origin;
    }
    return 'http://localhost:3000';
};

const WhatsAppConnect = ({ instanceId, initialCompanyName }) => {
    console.log("🛸 [ALEX IO] WhatsAppConnect Rendering Started for:", instanceId);
    const [mode, setMode] = useState('QR');
    const [qrCode, setQrCode] = useState(null);
    const [status, setStatus] = useState('DISCONNECTED');
    const [cloudStatus, setCloudStatus] = useState({ configured: false });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [diagnostics, setDiagnostics] = useState(null);
    const socketRef = useRef(null);
    const pollIntervalRef = useRef(null);
    // 🛡️ ANTI-GRAVITY: ref para evitar doble-fetch en reconexiones rápidas
    const qrFetchingRef = useRef(false);

    const addLog = (message, level = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, level }, ...prev].slice(0, 50));
    };

    // ✅ FIX ANTI-GRAVITY: recupera el QR actual vía HTTP cuando el socket (re)conecta
    // Esto soluciona el caso donde el socket llega tarde y el evento wa_qr ya fue emitido
    const fetchQRFromHTTP = useCallback(async () => {
        if (!instanceId || instanceId === 'null') return;
        if (qrFetchingRef.current) return; // evitar fetch concurrentes
        qrFetchingRef.current = true;
        try {
            const res = await api.get(`/api/saas/status/${instanceId}`);
            const data = res.data;
            if (!data) return;

            const qr = data.qr || data.qr_code;
            const st = (data.status || '').toLowerCase();

            if ((st === 'qr_ready' || st === 'waiting_scan') && qr) {
                setQrCode(qr);
                setStatus('QR_READY');
                addLog('QR recuperado vía HTTP (anti-gravity sync).', 'success');
                // Detener polling si ya lo tenemos
                if (pollIntervalRef.current) {
                    clearInterval(pollIntervalRef.current);
                    pollIntervalRef.current = null;
                }
            } else if (st === 'ready' || st === 'online' || st === 'connected') {
                setStatus('READY');
                setQrCode(null);
                addLog('Sesión ya conectada detectada vía HTTP.', 'success');
            } else if (st === 'initializing') {
                // Todavía arrancando, el polling se encarga
                addLog('Motor inicializando, esperando QR...', 'info');
            }
        } catch (err) {
            // 404 = instancia no existe aún, silencio
            if (err?.response?.status !== 404) {
                console.warn('[AntiGravity] HTTP status fetch error:', err.message);
            }
        } finally {
            qrFetchingRef.current = false;
        }
    }, [instanceId]);

    useEffect(() => {
        console.log("🔌 [ALEX IO] Initializing Socket & Status hooks...");

        const connectSocket = () => {
            const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
            if (!token) {
                console.warn("⏳ [Socket] No token yet, deferring connection...");
                return false;
            }

            if (socketRef.current) {
                socketRef.current.disconnect();
            }

            try {
                const socketUrl = getSocketUrl();
                console.log("🌐 Socket Target:", socketUrl);

                const isProduction = import.meta.env.PROD;
                const socketConfig = {
                    reconnection: true,
                    reconnectionAttempts: 10,
                    reconnectionDelay: 1000,
                    reconnectionDelayMax: 5000,
                    timeout: 20000,
                    transports: isProduction ? ['polling'] : ['websocket', 'polling'],
                    path: '/socket.io',
                    auth: { token },
                    upgrade: !isProduction,
                    rememberUpgrade: false,
                    forceNew: false,
                    autoConnect: true
                };

                socketRef.current = io(socketUrl, socketConfig);

                socketRef.current.on('connect', () => {
                    console.log("✅ Socket Connected");
                    addLog('Servidor de eventos conectado.', 'success');
                    // 🛡️ ANTI-GRAVITY: al conectar/reconectar, recuperar el QR actual
                    // por si el evento wa_qr ya fue emitido mientras el socket estaba caído
                    fetchQRFromHTTP();
                });

                socketRef.current.on('connect_error', (err) => {
                    console.error("❌ Socket Connect Error:", err);
                    addLog('Error de conexión con el servidor de eventos.', 'error');
                });

                socketRef.current.on('wa_qr', (data) => {
                    if (data.instanceId === instanceId) {
                        setQrCode(data.qr);
                        setStatus('QR_READY');
                        addLog('Código QR recibido vía WebSocket.', 'success');
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                });

                socketRef.current.on('wa_status', (data) => {
                    if (data.instanceId === instanceId) {
                        if (data.status === 'READY') {
                            setStatus('READY');
                            setQrCode(null);
                            addLog('WhatsApp conectado exitosamente.', 'success');
                        } else {
                            addLog(`Estado de conexión: ${data.status}`, 'info');
                        }
                    }
                });

                return true;
            } catch (err) {
                console.error("❌ Error setting up Socket.io:", err);
                return false;
            }
        };

        if (!connectSocket()) {
            const retryInterval = setInterval(() => {
                if (connectSocket()) {
                    clearInterval(retryInterval);
                }
            }, 1500);
            const retryTimeout = setTimeout(() => {
                clearInterval(retryInterval);
                console.warn("⚠️ [Socket] Gave up waiting for auth token after 30s");
            }, 30000);

            return () => {
                clearInterval(retryInterval);
                clearTimeout(retryTimeout);
                if (socketRef.current) socketRef.current.disconnect();
            };
        }

        return () => {
            if (socketRef.current) socketRef.current.disconnect();
        };
    }, [fetchQRFromHTTP]);

    const fetchDiagnostics = async () => {
        try {
            const res = await api.get('/api/diagnostics/ai');
            setDiagnostics(res.data);
        } catch (err) {
            console.error("❌ Error fetching diagnostics:", err);
        }
    };

    const fetchCloudStatus = async () => {
        try {
            const isInvalidId = !instanceId || instanceId === 'null';
            const statusUrl = !isInvalidId ? `/api/saas/status/${instanceId}` : '/api/status';
            const res = await api.get(statusUrl);
            setCloudStatus(res.data);

            // 🛡️ ANTI-GRAVITY: si al cargar ya hay un QR en el status, mostrarlo de inmediato
            const data = res.data;
            const qr = data?.qr || data?.qr_code;
            const st = (data?.status || '').toLowerCase();
            if ((st === 'qr_ready' || st === 'waiting_scan') && qr) {
                setQrCode(qr);
                setStatus('QR_READY');
                addLog('QR detectado al iniciar componente.', 'success');
            } else if (st === 'ready' || st === 'online' || st === 'connected') {
                setStatus('READY');
            }
        } catch (err) {
            console.error("❌ Error fetching cloud status:", err);
            setCloudStatus({ configured: false });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCloudStatus();
    }, [instanceId]); // 🛡️ re-fetch cuando cambia el bot seleccionado

    // POLLING FALLBACK: Retrieve QR via HTTP if WebSockets fail
    useEffect(() => {
        const shouldPoll = (status === 'CONNECTING' || status === 'DISCONNECTED') && !qrCode;
        if (shouldPoll) {
            pollIntervalRef.current = setInterval(async () => {
                if (!instanceId || instanceId === 'null') return;
                try {
                    const res = await api.get(`/api/saas/status/${instanceId}`);
                    if (res.data) {
                        const qr = res.data.qr || res.data.qr_code;
                        const st = (res.data.status || '').toLowerCase();
                        if ((st === 'qr_ready' || st === 'waiting_scan') && qr && !qrCode) {
                            setQrCode(qr);
                            setStatus('QR_READY');
                            addLog('QR sincronizado vía red de respaldo HTTP.', 'success');
                            if (pollIntervalRef.current) {
                                clearInterval(pollIntervalRef.current);
                                pollIntervalRef.current = null;
                            }
                        } else if (st === 'ready' || st === 'online' || st === 'connected') {
                            setStatus('READY');
                            setQrCode(null);
                        }
                    }
                } catch (err) {
                    // Fail silently
                }
            }, 3000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, [status, instanceId, qrCode]);

    const StatusBadge = ({ label, value, ok }) => (
        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700/50">
            <span className="text-xs text-slate-400 font-medium">{label}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {value}
            </span>
        </div>
    );

    return (
        <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">WhatsApp Engine Hub</h1>
                    <p className="text-slate-400 mt-1">Gestión de canales y conectividad de grado Enterprise.</p>
                </div>
            </div>

            <div className="flex gap-2 p-1 bg-slate-900/50 rounded-2xl border border-slate-700/50 w-full max-w-lg mb-8">
                <button
                    onClick={() => setMode('QR')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'QR' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <QrCode size={18} /> WhatsApp Web
                </button>
                <button
                    onClick={() => setMode('CLOUD')}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'CLOUD' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <Cloud size={18} /> Cloud API
                </button>
                <button
                    onClick={() => { setMode('DIAG'); fetchDiagnostics(); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${mode === 'DIAG' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                    <Activity size={18} /> Diagnóstico
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                <div className="bg-slate-800 p-8 rounded-3xl border border-slate-700 flex flex-col items-center justify-center text-center shadow-2xl relative overflow-hidden">
                    {mode === 'QR' ? (
                        <>
                            <h2 className="text-xl font-bold mb-4 text-slate-300">Conexión vía QR</h2>
                            <div className="mb-6">
                                {status === 'READY' ? (
                                    <div className="w-48 h-48 bg-green-500/20 rounded-full flex items-center justify-center border-4 border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-pulse">
                                        <span className="text-5xl">✅</span>
                                    </div>
                                ) : (status === 'QR_READY' && qrCode) ? (
                                    <div className="bg-white p-5 rounded-3xl shadow-2xl scale-110">
                                        <img src={qrCode} alt="WhatsApp QR Code" className="w-[200px] h-[200px] object-contain" />
                                    </div>
                                ) : status === 'CONNECTING' ? (
                                    <div className="w-48 h-48 bg-slate-700/30 rounded-full flex flex-col items-center justify-center border-2 border-slate-600 border-dashed">
                                        <Loader2 className="animate-spin text-blue-500 mb-2" size={32} />
                                        <span className="text-xs text-slate-500">Negociando QR...</span>
                                    </div>
                                ) : (
                                    <button
                                        onClick={async () => {
                                            setStatus('CONNECTING');
                                            addLog('Iniciando proceso de conexión...');
                                            try {
                                                let authToken = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
                                                if (!authToken) {
                                                    addLog('Buscando sesión de Supabase...', 'info');
                                                    try {
                                                        const { supabase } = await import('../supabaseClient');
                                                        if (supabase) {
                                                            const { data: { session } } = await supabase.auth.getSession();
                                                            if (session?.access_token) {
                                                                authToken = session.access_token;
                                                                addLog('Sesión de Supabase recuperada.', 'success');
                                                            }
                                                        }
                                                    } catch (e) { addLog('Error al recuperar sesión: ' + e.message, 'error'); }
                                                }

                                                if (!instanceId) {
                                                    addLog('Error: No se ha seleccionado un agente.', 'error');
                                                    alert('Por favor, selecciona un agente en el selector superior antes de conectar.');
                                                    setStatus('DISCONNECTED');
                                                    return;
                                                }

                                                const apiBase = import.meta.env.VITE_API_URL || '';
                                                addLog('Solicitando QR al servidor...');
                                                
                                                // ✅ Standardized axios call
                                                const response = await api.post('/api/saas/connect', {
                                                    instanceId: instanceId,
                                                    companyName: initialCompanyName || 'Alex Bot'
                                                });

                                                const data = response.data;
                                                addLog('Petición aceptada. Motor inicializado en background.', 'success');

                                                if (data.qr_code) {
                                                    setQrCode(data.qr_code);
                                                    setStatus('QR_READY');
                                                    addLog('QR recibido vía HTTP.', 'success');
                                                } else {
                                                    // 🛡️ ANTI-GRAVITY: si no vino QR en la respuesta del connect,
                                                    // esperar 2s y hacer fetch del status para atrapar el QR
                                                    addLog('Motor arrancado. Sincronizando QR...', 'info');
                                                    setTimeout(() => fetchQRFromHTTP(), 2000);
                                                }
                                            } catch (e) {
                                                addLog('Error fatal en el proceso: ' + e.message, 'error');
                                                setStatus('DISCONNECTED');
                                            }
                                        }}
                                        className="w-48 h-48 bg-slate-700/50 rounded-full flex flex-col items-center justify-center border-2 border-slate-600 hover:border-blue-500/50 hover:bg-slate-700 transition-all group"
                                    >
                                        <QrCode className="text-slate-500 group-hover:text-blue-400 mb-2" size={48} />
                                        <span className="text-xs font-bold text-slate-400 group-hover:text-white uppercase tracking-widest">Generar QR</span>
                                    </button>
                                )}
                            </div>
                            <div className="text-sm text-slate-400 max-w-xs">
                                Escanea el código desde tu dispositivo móvil para vincular la sesión.
                            </div>
                        </>
                    ) : mode === 'CLOUD' ? (
                        <>
                            <Cloud className="text-blue-500 mb-4" size={48} />
                            <h2 className="text-xl font-bold mb-2 text-slate-300">WhatsApp Cloud API</h2>
                            <p className="text-sm text-slate-500 mb-6 max-w-xs">Configuración oficial vía Meta Business.</p>
                            <div className="flex flex-col gap-2 w-full max-w-xs">
                                <StatusBadge label="Configuración" value={cloudStatus.configured ? 'OK' : 'Faltante'} ok={cloudStatus.configured} />
                                <StatusBadge label="Phone ID" value={cloudStatus.phoneNumberId || 'No Encontrado'} ok={!!cloudStatus.phoneNumberId} />
                            </div>
                        </>
                    ) : (
                        <>
                            <Activity className="text-amber-500 mb-4" size={48} />
                            <h2 className="text-xl font-bold mb-2 text-slate-300">Salud del Sistema</h2>
                            <div className="flex flex-col gap-2 w-full max-w-xs mt-4">
                                {diagnostics ? (
                                    <>
                                        <StatusBadge label="Gemini AI" value={diagnostics.providers?.gemini ? 'OK' : 'Error'} ok={diagnostics.providers?.gemini} />
                                        <StatusBadge label="OpenAI" value={diagnostics.providers?.openai ? 'OK' : 'Error'} ok={diagnostics.providers?.openai} />
                                        <StatusBadge label="DeepSeek" value={diagnostics.providers?.deepseek ? 'OK' : 'Error'} ok={diagnostics.providers?.deepseek} />
                                        <StatusBadge label="WhatsApp" value={diagnostics.whatsapp?.status || 'Unknown'} ok={diagnostics.whatsapp?.status === 'READY'} />
                                        <div className="mt-4 pt-4 border-t border-slate-700 w-full flex justify-center">
                                            <button
                                                onClick={fetchDiagnostics}
                                                className="text-xs bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg font-bold transition-colors"
                                            >
                                                Actualizar Estado
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-slate-500 italic">Cargando diagnóstico...</p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-4">
                    <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Registro Operativo</h3>
                        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                            {logs.length === 0 ? (
                                <div className="text-xs text-slate-600 italic">Esperando eventos del sistema...</div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="text-[11px] font-mono p-2 bg-black/20 rounded-lg border-l-2 border-blue-500/50">
                                        <span className="text-slate-500 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                                        <span className="text-slate-300">{log.message}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
                        <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-2">Tip de Conexión</h4>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Si experimentas desconexiones frecuentes, asegúrate de que el dispositivo móvil tenga acceso estable a internet y no esté en modo ahorro de energía.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WhatsAppConnect;
