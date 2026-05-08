import React, { useEffect, useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import io from 'socket.io-client';
import api from '../services/api';
import { motion } from 'framer-motion';
import { QrCode, Cloud, Activity, Loader2 } from 'lucide-react';


const MAX_QR_TEXT_LENGTH = 2500;

function normalizeQrPayload(rawQr) {
    if (!rawQr || typeof rawQr !== 'string') return { kind: 'empty', value: null };
    const qr = rawQr.trim();

    if (qr.startsWith('data:image/')) {
        return { kind: 'image', value: qr };
    }

    if (qr.length > MAX_QR_TEXT_LENGTH) {
        return { kind: 'overflow', value: qr };
    }

    return { kind: 'text', value: qr };
}

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
    const normalizedQr = normalizeQrPayload(qrCode);
    const [status, setStatus] = useState('DISCONNECTED');
    const [cloudStatus, setCloudStatus] = useState({ configured: false });
    const [loading, setLoading] = useState(true);
    const [logs, setLogs] = useState([]);
    const [diagnostics, setDiagnostics] = useState(null);
    const socketRef = useRef(null);

    const addLog = (message, level = 'info') => {
        setLogs(prev => [{ timestamp: new Date().toISOString(), message, level }, ...prev].slice(0, 50));
    };

    useEffect(() => {
        console.log("🔌 [ALEX IO] Initializing Socket & Status hooks...");

        try {
            const socketUrl = getSocketUrl();
            console.log("🌐 Socket Target:", socketUrl);
            socketRef.current = io(socketUrl, {
                reconnection: true,
                reconnectionAttempts: 5
            });

            socketRef.current.on('connect', () => {
                console.log("✅ Socket Connected");
                addLog('Servidor de eventos conectado.', 'success');
            });
            socketRef.current.on('connect_error', (err) => {
                console.error("❌ Socket Connect Error:", err);
                addLog('Error de conexión con el servidor de eventos.', 'error');
            });

            socketRef.current.on('wa_qr', (data) => {
                if (data.instanceId === instanceId) {
                    setQrCode(data.qr);
                    setStatus('QR_READY');
                    addLog('Código QR recibido del servidor.', 'success');
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

            return () => {
                if (socketRef.current) socketRef.current.disconnect();
            };
        } catch (err) {
            console.error("❌ Error setting up Socket.io:", err);
        }
    }, []);

    const fetchDiagnostics = async () => {
        try {
            const res = await api.get('/diagnostics/ai');
            setDiagnostics(res.data);
        } catch (err) {
            console.error("❌ Error fetching diagnostics:", err);
        }
    };

    const fetchCloudStatus = async () => {
        try {
            const res = await api.get('/saas/status');
            setCloudStatus(res.data);
        } catch (err) {
            console.error("❌ Error fetching cloud status:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCloudStatus();
    }, []);

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
                                ) : qrCode ? (
                                    normalizedQr.kind === 'image' ? (
                                        <div className="bg-white p-5 rounded-3xl shadow-2xl scale-110">
                                            <img src={normalizedQr.value} alt="QR WhatsApp" className="w-[200px] h-[200px] object-contain" />
                                        </div>
                                    ) : normalizedQr.kind === 'overflow' ? (
                                        <div className="w-64 bg-red-500/10 text-red-300 border border-red-500/30 rounded-2xl p-4 text-xs text-left">
                                            <p className="font-bold mb-2">QR inválido para renderizar</p>
                                            <p>El backend devolvió un payload demasiado largo ({normalizedQr.value.length} chars). Reinicia la sesión y vuelve a generar el QR.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-5 rounded-3xl shadow-2xl scale-110">
                                            <QRCodeSVG value={normalizedQr.value} size={200} />
                                        </div>
                                    )
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
                                                // Get auth token (backend JWT or Supabase session)
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

                                                if (!authToken) {
                                                    setStatus('DISCONNECTED');
                                                    addLog('No se encontró una sesión activa.', 'error');
                                                    alert('Sesión expirada. Por favor, vuelve a iniciar sesión.');
                                                    return;
                                                }

                                                addLog('Solicitando QR al servidor...');
                                                const res = await fetch(`${window.location.origin}/api/saas/connect`, {
                                                    method: 'POST',
                                                    headers: {
                                                        'Content-Type': 'application/json',
                                                        'Authorization': `Bearer ${authToken}`
                                                    },
                                                    body: JSON.stringify({ 
                                                        instanceId: instanceId, 
                                                        companyName: initialCompanyName || 'Alex Bot' 
                                                    })
                                                });

                                                let data;
                                                const contentType = res.headers.get("content-type");
                                                if (contentType && contentType.indexOf("application/json") !== -1) {
                                                    data = await res.json();
                                                } else {
                                                    const text = await res.text();
                                                    console.error('Non-JSON response:', text);
                                                    throw new Error(`Servidor respondió con formato inválido (${res.status})`);
                                                }

                                                if (!res.ok) {
                                                    addLog(`Error del servidor: ${data.error || 'Desconocido'}`, 'error');
                                                    setStatus('DISCONNECTED');
                                                    alert(`Error: ${data.error || 'No se pudo conectar'}`);
                                                    return;
                                                }

                                                addLog('Petición aceptada. Motor inicializado en background.', 'success');
                                                if (data.qr_code) {
                                                    setQrCode(data.qr_code);
                                                    setStatus('QR_READY');
                                                    addLog('QR recibido vía HTTP.', 'success');
                                                }

                                                const poll = setInterval(async () => {
                                                    try {
                                                        const s = await fetch(`${window.location.origin}/api/saas/status/${instanceId}`, {
                                                            headers: { 'Authorization': `Bearer ${authToken}` }
                                                        });
                                                        const sData = await s.json();
                                                        if (sData.status === 'online' || sData.status === 'READY') {
                                                            setStatus('READY');
                                                            setQrCode(null);
                                                            addLog('Conexión confirmada vía polling.', 'success');
                                                            clearInterval(poll);
                                                        } else if (sData.qr_code && !qrCode) {
                                                            setQrCode(sData.qr_code);
                                                            setStatus('QR_READY');
                                                            addLog('QR recuperado vía polling.', 'info');
                                                        }
                                                    } catch (err) {
                                                        console.error("Polling error:", err.message);
                                                    }
                                                }, 5000);
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
