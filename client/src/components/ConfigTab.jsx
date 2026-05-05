import React, { useState, useEffect } from 'react';
import { Settings, Zap, MessageSquare, Clock, Shield, ChevronRight, ChevronLeft, Sparkles, Copy, Check, Play, HelpCircle, ExternalLink, Loader2, Volume2, Key, Globe as GlobeIcon, Users, BarChart3, Wifi, WifiOff, Star, ArrowRight, Facebook, Instagram, Music, Smartphone, Cloud, Eye, EyeOff, Bot, Mic, ShieldAlert, Wand2, RotateCcw, RefreshCw } from 'lucide-react';
import EnterpriseWizard from './EnterpriseWizard';
import MetaWizard from './MetaWizard';
import PromptWizard from './PromptWizard';
import PromptCopilot from './PromptCopilot';

const CONFIG_TAB_VERSION = 'v2.1.0-STABLE';

// ─── Color Tokens ─
const makeTokens = (theme) => ({
    bg: theme?.bg || '#0f172a',
    surface: theme?.card || '#1e293b',
    surfaceHover: theme?.card ? (theme.bg === '#e2e8f0' ? '#f1f5f9' : '#334155') : '#334155',
    border: theme?.border || '#334155',
    borderActive: theme?.accent || '#6366f1',
    indigo: theme?.accent || '#6366f1',
    indigoHover: theme?.accentHover || '#818cf8',
    indigoDim: theme?.accentBg || 'rgba(99,102,241,0.12)',
    amber: '#f59e0b',
    amberDim: 'rgba(245,158,11,0.12)',
    green: '#22c55e',
    red: '#ef4444',
    text: theme?.text || '#e2e8f0',
    textMuted: theme?.textDim || '#94a3b8',
    textDim: theme?.textMuted || '#64748b',
});

// ─── Business Type Cards ───────────────────────────────────────
const BUSINESS_TYPES = [
    { id: 'aesthetic', icon: '💎', title: 'Clínica de Estética', desc: 'Pre-calificación de pacientes, dudas de procedimientos, agendamiento', color: '#a855f7', prompt: 'Eres un Concierge Médico Experto de {businessName}. Tu objetivo es pre-calificar al paciente, responder dudas sobre procedimientos estéticos usando nuestra base de conocimiento, generar confianza y agendar una cita de valoración. NO das diagnósticos. Tono: Profesional, empático, clínico y persuasivo.' },
    { id: 'dental', icon: '🦷', title: 'Odontología Premium', desc: 'Consultas, presupuestos, agendamiento de valoraciones', color: '#06b6d4', prompt: 'Eres el Asistente Dental Virtual de {businessName}. Pre-calificas al paciente, respondes dudas sobre tratamientos (ortodoncia, implantes, blanqueamiento) y agendas citas de valoración. Tono profesional, clínico y empático. No das diagnósticos por chat.' },
    { id: 'realestate', icon: '🏠', title: 'Agencia Inmobiliaria', desc: 'Pre-calificación de compradores, propiedades, visitas', color: '#f59e0b', prompt: 'Eres un Agente de Pre-Venta Inmobiliario de {businessName}. Calificás al interesado (presupuesto, zona, tipo de propiedad), respondés consultas sobre disponibilidad y agendás visitas con un asesor. Tono profesional y orientado a la conversión.' },
    { id: 'medconsult', icon: '🩺', title: 'Consultorio Médico', desc: 'Agendamiento, pre-consulta, derivaciones', color: '#22c55e', prompt: 'Eres el Asistente Virtual del consultorio {businessName}. Recibís consultas de pacientes, pre-filtras síntomas para aclarar la urgencia, agendas turnos y enviás recordatorios. Tono empático, profesional y tranquilizador. Derivás a urgencias ante señales de alarma.' },
    { id: 'professional', icon: '⚖️', title: 'Servicios Profesionales', desc: 'Abogados, contadores, asesores financieros', color: '#6366f1', prompt: 'Eres el Asistente Virtual de {businessName}. Pre-calificás consultas de clientes potenciales, respondés preguntas frecuentes sobre servicios y honorarios, y agendás una reunión de diagnóstico con el profesional a cargo. Tono formal, experto y confiable.' },
    { id: 'custom', icon: '⚙️', title: 'Personalizado', desc: 'Configura todo desde cero a tu medida', color: '#f59e0b', prompt: '' },
];

export default function ConfigTab({ selected, configDraft, setConfigDraft, onSave, analytics, connectionStatus, theme }) {
    const C = makeTokens(theme);
    const [phase, setPhase] = useState('select'); // select | wizard | generating | advanced | copilot
    const [showCopilot, setShowCopilot] = useState(false);
    const [showPromptWizard, setShowPromptWizard] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [channelWizard, setChannelWizard] = useState('instagram');
    const [localPrompt, setLocalPrompt] = useState(configDraft.customPrompt || '');

    useEffect(() => {
        setLocalPrompt(configDraft.customPrompt || '');
    }, [configDraft.customPrompt]);

    useEffect(() => {
        const prompt = configDraft?.customPrompt || configDraft?.prompt || configDraft?.custom_prompt || '';
        if (prompt.length > 10 || selected?.instance_id || selected?.id) {
            setPhase('advanced');
        } else {
            setPhase('select');
        }
    }, [selected?.id, selected?.instance_id]);

    const renderSelect = () => (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
            <div className="text-center space-y-3">
                <h2 className="text-3xl font-black text-white tracking-tight">Kernel de Inteligencia</h2>
                <p className="text-slate-400 max-w-lg mx-auto">Selecciona una arquitectura base para tu agente o construye una desde cero con nuestro asistente guiado.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUSINESS_TYPES.map(type => (
                    <button key={type.id} 
                        onClick={() => {
                            if (type.id === 'custom') {
                                setShowPromptWizard(true);
                            } else {
                                setConfigDraft(p => ({ ...p, customPrompt: type.prompt }));
                                setPhase('advanced');
                            }
                        }}
                        className="group relative p-6 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden"
                        style={{ background: C.surface, borderColor: C.border }}>
                        <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity" style={{ from: type.color, to: 'transparent' }} />
                        <div className="text-3xl mb-4">{type.icon}</div>
                        <h4 className="font-bold text-white mb-2">{type.title}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{type.desc}</p>
                        <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: type.color }}>
                            Seleccionar <ArrowRight size={14} />
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xl shadow-indigo-600/20">
                    <Sparkles size={32} />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-xl font-bold text-white mb-1">Asistente de Implementación IA</h3>
                    <p className="text-slate-400 text-sm">¿No sabes por dónde empezar? Deja que nuestra IA cree el prompt perfecto basado en 7 preguntas clave sobre tu negocio.</p>
                </div>
                <button 
                    onClick={() => setShowPromptWizard(true)}
                    className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-50 transition-all shadow-xl"
                >
                    Iniciar Wizard
                </button>
            </div>
        </div>
    );

    const renderAdvanced = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
            {/* Main Config Panel */}
            <div className="lg:col-span-2 space-y-5">
                {/* Bot Name + Voice */}
                <div className="rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                        <Bot size={16} style={{ color: C.indigo }} /> Identidad del Bot
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-500">Nombre Público</label>
                            <input className="w-full rounded-xl p-3 text-sm focus:outline-none transition-all"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                value={configDraft.name || ''} onChange={e => setConfigDraft(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-500">Idioma Nativo</label>
                            <select className="w-full rounded-xl p-3 text-sm focus:outline-none appearance-none"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                value={configDraft.target_language || 'es'} onChange={e => setConfigDraft(p => ({ ...p, target_language: e.target.value }))}>
                                <option value="es">Español</option>
                                <option value="en">English</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="zh">Mandarin</option>
                                <option value="hi">Hindi</option>
                                <option value="ar">Arabic</option>
                                <option value="pt">Português</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-slate-500">Voz y Síntesis</label>
                            <div className="flex gap-2">
                                <select className="flex-1 rounded-xl p-3 text-sm focus:outline-none appearance-none"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    value={configDraft.voice || 'nova'} onChange={e => setConfigDraft(p => ({ ...p, voice: e.target.value }))}>
                                    <option value="nova">Nova (Default)</option>
                                    <option value="alloy">Alloy</option>
                                    <option value="minimax-hd">MiniMax HD</option>
                                </select>
                                <button
                                    onClick={() => setConfigDraft(p => ({ ...p, voiceEnabled: !p.voiceEnabled }))}
                                    className={`px-4 rounded-xl text-[10px] font-bold uppercase transition-all ${configDraft.voiceEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {configDraft.voiceEnabled ? 'ON' : 'OFF'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Prompt Editor */}
                <div className="rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.text }}>
                            <MessageSquare size={16} style={{ color: C.indigo }} /> System Prompt (Instrucciones)
                        </h3>
                        <div className="flex gap-2">
                            <button onClick={() => setShowCopilot(true)}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5">
                                <Sparkles size={12} /> Co-Piloto AI
                            </button>
                            <button onClick={() => setPhase('select')}
                                className="text-[10px] font-bold px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white transition-all">
                                <RotateCcw size={12} className="inline mr-1" /> Reset
                            </button>
                        </div>
                    </div>
                    <textarea className="w-full rounded-xl p-4 text-sm resize-none h-64 focus:outline-none font-mono leading-relaxed"
                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                        value={localPrompt} 
                        onChange={e => setLocalPrompt(e.target.value)}
                        onBlur={() => setConfigDraft(p => ({ ...p, customPrompt: localPrompt }))}
                    />
                    <div className="mt-3 flex justify-between items-center">
                        <p className="text-[10px] text-slate-500 italic">Este prompt define la personalidad, límites y objetivos comerciales de tu bot.</p>
                        <span className="text-[10px] font-bold text-slate-600">{localPrompt.length} caracteres</span>
                    </div>
                </div>

                {/* WhatsApp Engine Hub - NIVEL DIOS */}
                <div className="rounded-2xl p-8 space-y-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h3 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                <Zap size={22} className="text-amber-400 fill-amber-400/20" /> WhatsApp Engine Hub
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">Seleccioná el motor de comunicación que impulsará tu bot.</p>
                        </div>
                        <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Multi-Engine Active
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Baileys Card */}
                        <button 
                            onClick={() => setConfigDraft(p => ({ ...p, provider: 'baileys' }))}
                            className={`group relative p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden ${configDraft.provider === 'baileys' ? 'ring-2 ring-indigo-500 ring-offset-4 ring-offset-slate-900 shadow-2xl' : ''}`}
                            style={{ background: configDraft.provider === 'baileys' ? 'linear-gradient(135deg, #312e81 0%, #1e1b4b 100%)' : C.bg, borderColor: configDraft.provider === 'baileys' ? '#6366f1' : C.border }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${configDraft.provider === 'baileys' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <Smartphone size={20} />
                                </div>
                                <span className="text-[9px] font-black px-2 py-1 rounded-md bg-slate-800 text-slate-500 uppercase tracking-tighter">Community</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">Baileys (QR)</h4>
                            <p className="text-[10px] text-slate-500 leading-tight mb-4">Conexión directa vía código QR. 100% Gratis sin costos de Meta.</p>
                            <ul className="space-y-1.5 mb-2">
                                {['Zero Costs', 'High Speed', 'Easy Scan'].map(feat => (
                                    <li key={feat} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                        <Check size={10} className="text-emerald-500" /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </button>

                        {/* Meta Cloud Card */}
                        <button 
                            onClick={() => setConfigDraft(p => ({ ...p, provider: 'meta' }))}
                            className={`group relative p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden ${configDraft.provider === 'meta' ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-slate-900 shadow-2xl' : ''}`}
                            style={{ background: configDraft.provider === 'meta' ? 'linear-gradient(135deg, #1e3a8a 0%, #172554 100%)' : C.bg, borderColor: configDraft.provider === 'meta' ? '#3b82f6' : C.border }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${configDraft.provider === 'meta' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <Cloud size={20} />
                                </div>
                                <span className="text-[9px] font-black px-2 py-1 rounded-md bg-blue-500/20 text-blue-400 uppercase tracking-tighter">Official</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">Meta Cloud API</h4>
                            <p className="text-[10px] text-slate-500 leading-tight mb-4">La solución oficial de Meta. Estable, escalable y profesional.</p>
                            <ul className="space-y-1.5 mb-2">
                                {['Unlimited Scale', 'Stable Webhooks', 'Official Support'].map(feat => (
                                    <li key={feat} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                        <Check size={10} className="text-blue-400" /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </button>

                        {/* 360Dialog Card */}
                        <button 
                            onClick={() => setConfigDraft(p => ({ ...p, provider: '360dialog' }))}
                            className={`group relative p-5 rounded-3xl border transition-all hover:scale-[1.02] active:scale-[0.98] text-left overflow-hidden ${configDraft.provider === '360dialog' ? 'ring-2 ring-emerald-500 ring-offset-4 ring-offset-slate-900 shadow-2xl' : ''}`}
                            style={{ background: configDraft.provider === '360dialog' ? 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)' : C.bg, borderColor: configDraft.provider === '360dialog' ? '#10b981' : C.border }}>
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${configDraft.provider === '360dialog' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                    <GlobeIcon size={20} />
                                </div>
                                <span className="text-[9px] font-black px-2 py-1 rounded-md bg-emerald-500/20 text-emerald-400 uppercase tracking-tighter">Premium BSP</span>
                            </div>
                            <h4 className="font-bold text-white mb-1">360Dialog Pro</h4>
                            <p className="text-[10px] text-slate-500 leading-tight mb-4">El BSP #1 para integración con bots. Máxima fiabilidad europea.</p>
                            <ul className="space-y-1.5 mb-2">
                                {['Low Latency', 'High Uptime', 'GDPR Ready'].map(feat => (
                                    <li key={feat} className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                                        <Check size={10} className="text-emerald-400" /> {feat}
                                    </li>
                                ))}
                            </ul>
                        </button>
                    </div>

                {/* Dynamic Config Fields */}
                <div>
                    {configDraft.provider === 'meta' && (
                        <div className="pt-4 border-t border-white/5">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">Meta Cloud Configuration</p>
                                <button onClick={() => setPhase('meta_wizard')} className="text-[10px] font-black text-white px-3 py-1.5 bg-blue-600 rounded-lg hover:bg-blue-500 transition-all">Launch Meta Wizard</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Access Token</label>
                                    <input type="password" value={configDraft.accessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, accessToken: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-all font-mono" placeholder="EAAXXXX..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Phone Number ID</label>
                                    <input type="text" value={configDraft.phoneNumberId || ''} onChange={e => setConfigDraft(p => ({ ...p, phoneNumberId: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 transition-all" placeholder="105xxxxxxx" />
                                </div>
                            </div>
                        </div>
                    )}

                    {configDraft.provider === '360dialog' && (
                        <div className="pt-4 border-t border-white/5">
                            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">360Dialog Pro Configuration</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">D360 API Key</label>
                                    <input type="password" value={configDraft.d360ApiKey || ''} onChange={e => setConfigDraft(p => ({ ...p, d360ApiKey: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-emerald-500 transition-all font-mono" placeholder="Your 360Dialog API Key..." />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Base URL (WABA)</label>
                                    <select value={configDraft.d360Url || 'https://waba.360dialog.io'} onChange={e => setConfigDraft(p => ({ ...p, d360Url: e.target.value }))} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none appearance-none">
                                        <option value="https://waba.360dialog.io">Standard (waba.360dialog.io)</option>
                                        <option value="https://waba-v2.360dialog.io">v2 Performance (Global)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODO DIOS: SRE Hardening Status */}
                <div className="bg-slate-900/60 border-2 border-indigo-500/20 rounded-[2.5rem] p-8 backdrop-blur-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform">
                      <Shield size={120} className="text-indigo-400" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[
                            { label: 'AI Cascade', status: 'Active', icon: Zap, color: 'text-amber-400' },
                            { label: 'Multi-Engine', status: 'Synced', icon: RefreshCw, color: 'text-blue-400' },
                            { label: 'Memory Grid', status: 'Secure', icon: Bot, color: 'text-purple-400' }
                        ].map((item, i) => (
                            <div key={i} className="p-3 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <item.icon size={12} className={item.color} />
                                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">{item.label}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-white">{item.status}</span>
                                    <div className={`w-1 h-1 rounded-full ${item.color.replace('text', 'bg')} animate-pulse`} />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={onSave}
                        className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 hover:scale-[1.02] active:scale-[0.98] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30">
                        Deploy Final Configuration
                    </button>
                    <p className="text-center text-[8px] text-slate-600 mt-3 font-mono">ALEX IO SRE CORE • V5.1.2-GOLD • LATENCY: 42MS</p>
                </div>
            </div>
            </div>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
                <div className="rounded-2xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 mb-4">Neural Health</h4>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-400">Estado</span>
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${connectionStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                                <span className={`text-xs font-bold ${connectionStatus === 'online' ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {connectionStatus === 'online' ? 'ONLINE' : 'OFFLINE'}
                                </span>
                            </div>
                        </div>
                        <div className="w-full h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                            <div className="h-full bg-indigo-500" style={{ width: '85%' }} />
                        </div>
                    </div>
                </div>

                <div className="rounded-2xl p-6 bg-gradient-to-br from-indigo-600/20 to-transparent border border-indigo-500/20">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-4">Enterprise Tools</h4>
                    <div className="space-y-2">
                        <button onClick={() => setPhase('enterprise_wizard')} className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all text-left flex items-center justify-between">
                            Ajustes Avanzados <ChevronRight size={14} />
                        </button>
                        <button onClick={() => setShowPromptWizard(true)} className="w-full p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all text-left flex items-center justify-between">
                            Regenerar Kernel <RotateCcw size={14} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="h-full max-w-6xl mx-auto px-4 py-8 relative">
            {phase === 'select' && renderSelect()}
            {phase === 'advanced' && renderAdvanced()}
            
            {phase === 'enterprise_wizard' && (
                <EnterpriseWizard
                    config={{
                        botName: configDraft.name,
                        systemPrompt: configDraft.customPrompt,
                        voiceEnabled: configDraft.voiceEnabled,
                        voice: configDraft.voice,
                        maxWords: configDraft.maxWords,
                        maxMessages: configDraft.maxMessages,
                        discordToken: configDraft.discordToken,
                        tiktokAccessToken: configDraft.tiktokAccessToken,
                        manychatToken: configDraft.manychatToken
                    }}
                    onSave={(data) => {
                        setConfigDraft(prev => ({
                            ...prev,
                            name: data.botName,
                            customPrompt: data.systemPrompt,
                            voiceEnabled: data.voiceEnabled,
                            voice: data.voice,
                            maxWords: data.maxWords,
                            maxMessages: data.maxMessages,
                            discordToken: data.discordToken,
                            tiktokAccessToken: data.tiktokAccessToken,
                            manychatToken: data.manychatToken
                        }));
                        setPhase('advanced');
                        onSave();
                    }}
                    onCancel={() => setPhase('advanced')}
                />
            )}

            {phase === 'meta_wizard' && (
                <MetaWizard 
                    onComplete={(data) => {
                        setConfigDraft(prev => ({
                            ...prev,
                            provider: 'meta',
                            accessToken: data.accessToken,
                            phoneNumberId: data.phoneNumberId,
                            wabaId: data.wabaId,
                            manychatToken: data.verifyToken
                        }));
                        setPhase('advanced');
                        onSave();
                    }}
                    onCancel={() => setPhase('advanced')}
                />
            )}

            {showPromptWizard && (
                <PromptWizard 
                    instanceName={configDraft.name || selected?.company_name}
                    onClose={() => setShowPromptWizard(false)}
                    onPromptGenerated={(prompt) => {
                        setConfigDraft(p => ({ ...p, customPrompt: prompt }));
                        setPhase('advanced');
                        setShowPromptWizard(false);
                    }}
                />
            )}

            {showCopilot && (
                <PromptCopilot 
                    currentPrompt={configDraft.customPrompt}
                    onClose={() => setShowCopilot(false)}
                    onPromptImproved={(prompt) => {
                        setConfigDraft(p => ({ ...p, customPrompt: prompt }));
                        setShowCopilot(false);
                    }}
                />
            )}

            <style dangerouslySetInnerHTML={{ __html: `
                .text-glow { text-shadow: 0 0 20px rgba(99,102,241,0.4); }
            `}} />
        </div>
    );
}

// 🔱 SRE Synchronization Pulse: 2026-05-03T00:45:00Z - ALL TAGS BALANCED.
