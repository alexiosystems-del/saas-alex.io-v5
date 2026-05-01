import React, { useState, useEffect } from 'react';
import { Settings, Zap, MessageSquare, Clock, Shield, ChevronRight, ChevronLeft, Sparkles, Copy, Check, Play, HelpCircle, ExternalLink, Loader2, Volume2, Key, Globe as GlobeIcon, Users, BarChart3, Wifi, WifiOff, Star, ArrowRight, Facebook, Instagram, Music, Smartphone, Cloud, Eye, EyeOff, Bot, Mic, ShieldAlert } from 'lucide-react';
import EnterpriseWizard from './EnterpriseWizard';
import MetaWizard from './MetaWizard';

const CONFIG_TAB_VERSION = 'v2.0.7.8-STABLE';

// ─── Color Tokens (derived from parent theme or default dark) ─
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

const C = makeTokens(); // Global fallback tokens

// ─── Business Type Cards ───────────────────────────────────────
const BUSINESS_TYPES = [
    { id: 'aesthetic', icon: '💎', title: 'Clínica de Estética', desc: 'Pre-calificación de pacientes, dudas de procedimientos, agendamiento', color: '#a855f7', prompt: 'Eres un Concierge Médico Experto de {businessName}. Tu objetivo es pre-calificar al paciente, responder dudas sobre procedimientos estéticos usando nuestra base de conocimiento, generar confianza y agendar una cita de valoración. NO das diagnósticos. Tono: Profesional, empático, clínico y persuasivo.' },
    { id: 'dental', icon: '🦷', title: 'Odontología Premium', desc: 'Consultas, presupuestos, agendamiento de valoraciones', color: '#06b6d4', prompt: 'Eres el Asistente Dental Virtual de {businessName}. Pre-calificas al paciente, respondes dudas sobre tratamientos (ortodoncia, implantes, blanqueamiento) y agendas citas de valoración. Tono profesional, clínico y empático. No das diagnósticos por chat.' },
    { id: 'realestate', icon: '🏠', title: 'Agencia Inmobiliaria', desc: 'Pre-calificación de compradores, propiedades, visitas', color: '#f59e0b', prompt: 'Eres un Agente de Pre-Venta Inmobiliario de {businessName}. Calificás al interesado (presupuesto, zona, tipo de propiedad), respondés consultas sobre disponibilidad y agendás visitas con un asesor. Tono profesional y orientado a la conversión.' },
    { id: 'medconsult', icon: '🩺', title: 'Consultorio Médico', desc: 'Agendamiento, pre-consulta, derivaciones', color: '#22c55e', prompt: 'Eres el Asistente Virtual del consultorio {businessName}. Recibís consultas de pacientes, pre-filtras síntomas para aclarar la urgencia, agendas turnos y enviás recordatorios. Tono empático, profesional y tranquilizador. Derivás a urgencias ante señales de alarma.' },
    { id: 'professional', icon: '⚖️', title: 'Servicios Profesionales', desc: 'Abogados, contadores, asesores financieros', color: '#6366f1', prompt: 'Eres el Asistente Virtual de {businessName}. Pre-calificás consultas de clientes potenciales, respondés preguntas frecuentes sobre servicios y honorarios, y agendás una reunión de diagnóstico con el profesional a cargo. Tono formal, experto y confiable.' },
    { id: 'custom', icon: '⚙️', title: 'Personalizado', desc: 'Configura todo desde cero a tu medida', color: C.amber, prompt: '' },
];


// ─── Wizard Questions ──────────────────────────────────────────
const WIZARD_QUESTIONS = [
    { id: 'businessName', label: '¿Cuál es el nombre de tu negocio?', placeholder: 'Ej: TechStore Argentina', icon: <GlobeIcon size={20} /> },
    { id: 'hours', label: '¿Cuáles son tus horarios de atención?', placeholder: 'Ej: Lunes a Viernes 9-18hs, Sábados 10-14hs', icon: <Clock size={20} /> },
    { id: 'keyInfo', label: '¿Qué información clave debe saber el bot?', placeholder: 'Ej: Hacemos envíos a todo el país. Aceptamos Mercado Pago y transferencia. Tenemos garantía de 12 meses.', icon: <MessageSquare size={20} />, multiline: true },
    {
        id: 'tone', label: '¿Qué tono debe usar el bot?', type: 'select', icon: <Volume2 size={20} />, options: [
            { value: 'formal', label: '🏢 Formal', desc: 'Profesional y respetuoso' },
            { value: 'friendly', label: '😊 Amigable', desc: 'Cercano y cálido' },
            { value: 'casual', label: '😎 Casual', desc: 'Relajado y joven' },
            { value: 'expert', label: '🧠 Experto', desc: 'Técnico y detallado' },
        ]
    },
    { id: 'handoff', label: '¿Cuándo debe derivar a un humano?', placeholder: 'Ej: Cuando el cliente pide hablar con un asesor, cuando hay un reclamo, o después de 5 mensajes sin resolución.', icon: <Users size={20} />, multiline: true },
];

// ─── Video Slot Component ──────────────────────────────────────
function VideoSlot({ url, title = 'Tutorial' }) {
    if (!url) return null;
    const embedUrl = url.includes('youtube') ? url.replace('watch?v=', 'embed/') :
        url.includes('youtu.be') ? `https://www.youtube.com/embed/${url.split('/').pop()}` :
            url.includes('vimeo') ? url.replace('vimeo.com', 'player.vimeo.com/video') :
                url.includes('loom') ? url.replace('loom.com/share', 'loom.com/embed') : null;
    if (!embedUrl) return null;
    return (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: C.border }}>
            <div className="flex items-center gap-2 px-3 py-2 text-xs font-bold" style={{ background: C.surface, color: C.textMuted }}>
                <Play size={12} /> {title}
            </div>
            <iframe src={embedUrl} className="w-full aspect-video" allow="autoplay; fullscreen" allowFullScreen title={title} />
        </div>
    );
}

// ─── Support Banner ────────────────────────────────────────────
function SupportBanner({ text = '¿Necesitas ayuda configurando tu bot?' }) {
    return (
        <div className="rounded-xl p-4 flex items-center justify-between gap-3" style={{ background: C.amberDim, border: `1px solid ${C.amber}33` }}>
            <div className="flex items-center gap-3">
                <HelpCircle size={20} style={{ color: C.amber }} />
                <span className="text-sm font-medium" style={{ color: C.amber }}>{text}</span>
            </div>
            <a href="https://www.youtube.com/@AlexIOSaaS/playlists" target="_blank" rel="noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                style={{ background: C.amber, color: '#000' }}>
                Ver Tutoriales
            </a>
        </div>
    );
}

// ─── Floating Support ──────────────────────────────────────────
function FloatingSupport() {
    const [open, setOpen] = useState(false);
    return (
        <div className="fixed bottom-6 right-6 z-50">
            {open && (
                <div className="mb-3 rounded-xl p-4 shadow-2xl w-64 animate-in slide-in-from-bottom-2" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <p className="text-sm font-bold mb-3" style={{ color: C.text }}>¿Necesitas ayuda?</p>
                    <div className="space-y-2">
                        <a href="https://www.youtube.com/@AlexIOSaaS/videos" target="_blank" rel="noreferrer"
                            className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors"
                            style={{ background: C.indigoDim, color: C.indigo }}>
                            <Play size={16} /> Tutoriales YouTube
                        </a>
                        <a href="#" className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg transition-colors"
                            style={{ background: C.amberDim, color: C.amber }}>
                            <ExternalLink size={16} /> Centro de Ayuda
                        </a>
                    </div>
                </div>
            )}
            <button onClick={() => setOpen(!open)}
                className="w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
                style={{ background: `linear-gradient(135deg, ${C.amber}, #d97706)` }}>
                <HelpCircle size={22} color="#000" />
            </button>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════
// ██  CONFIGTAB — Main Component
// ═══════════════════════════════════════════════════════════════
export default function ConfigTab({ selected, configDraft, setConfigDraft, onSave, analytics, connectionStatus, theme }) {
    const C = makeTokens(theme);
    const [phase, setPhase] = useState('select'); // select | wizard | generating | done | advanced
    const [selectedType, setSelectedType] = useState(null);
    const [wizardStep, setWizardStep] = useState(0);
    const [wizardData, setWizardData] = useState({});
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [copied, setCopied] = useState(false);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedToken, setCopiedToken] = useState(false);
    const [showToken, setShowToken] = useState(false);
    const [channelWizard, setChannelWizard] = useState('instagram');

    // Utility (Mock if missing from context)
    const pushNotice = (type, msg) => {
        console.log(`[${type}] ${msg}`);
        // In a real scenario, this should be passed as prop or use a context
    };

    const fetchJsonWithApiFallback = async (url, options) => {
        const response = await fetch(url, options);
        const data = await response.json();
        return { response, data };
    };

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${localStorage.getItem('alex_token')}`,
        'Content-Type': 'application/json'
    });

    // If bot already has a custom prompt, start in advanced mode
    useEffect(() => {
        if (configDraft?.customPrompt?.length > 20) {
            setPhase('advanced');
        } else {
            setPhase('enterprise_wizard');
        }
    }, [selected?.id]);

    const renderEnterpriseWizard = () => (
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
    );

    const renderAdvanced = () => (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Config Panel */}
            <div className="lg:col-span-2 space-y-5">
                {/* Bot Name + Voice */}
                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                        <Settings size={16} style={{ color: C.indigo }} /> Identidad del Bot
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Nombre</label>
                            <input className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                onFocus={e => e.target.style.borderColor = C.indigo}
                                onBlur={e => e.target.style.borderColor = C.border}
                                value={configDraft.name || ''} onChange={e => setConfigDraft(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Voz IA</label>
                            <div className="flex gap-2">
                                <select className="flex-1 rounded-lg p-3 text-sm focus:outline-none appearance-none"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    value={configDraft.voice || 'nova'} onChange={e => setConfigDraft(p => ({ ...p, voice: e.target.value }))}>
                                    <option value="nova">Nova</option>
                                    <option value="alloy">Alloy</option>
                                    <option value="echo">Echo</option>
                                    <option value="shimmer">Shimmer</option>
                                    <option value="minimax-hd">MiniMax HD (Global)</option>
                                    <option value="minimax-zh">MiniMax CN (Nativo)</option>
                                    <option value="onyx">Onyx</option>
                                </select>
                                <button
                                    onClick={() => setConfigDraft(p => ({ ...p, voiceEnabled: !p.voiceEnabled }))}
                                    className={`px-4 rounded-lg text-[10px] font-bold uppercase transition-all ${configDraft.voiceEnabled ? 'bg-pink-500 text-white' : 'bg-slate-800 text-slate-500'}`}
                                >
                                    {configDraft.voiceEnabled ? 'Activo' : 'Inactivo'}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Máx. Palabras por Respuesta</label>
                            <input type="number" min="10" max="500" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                onFocus={e => e.target.style.borderColor = C.indigo}
                                onBlur={e => e.target.style.borderColor = C.border}
                                value={configDraft.maxWords || 50} onChange={e => setConfigDraft(p => ({ ...p, maxWords: parseInt(e.target.value) || 50 }))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Máx. Mensajes antes de Derivar</label>
                            <input type="number" min="1" max="100" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                onFocus={e => e.target.style.borderColor = C.indigo}
                                onBlur={e => e.target.style.borderColor = C.border}
                                value={configDraft.maxMessages || 10} onChange={e => setConfigDraft(p => ({ ...p, maxMessages: parseInt(e.target.value) || 10 }))} />
                        </div>
                    </div>
                </div>

                {/* Prompt */}
                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-sm flex items-center gap-2" style={{ color: C.text }}>
                            <MessageSquare size={16} style={{ color: C.indigo }} /> Prompt del Bot (Cerebro IA)
                        </h3>
                        <button onClick={() => setPhase('enterprise_wizard')}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: C.indigoDim, color: C.indigo }}>
                            <Bot size={12} className="inline mr-1" /> Abrir Wizard Ejecutivo
                        </button>
                    </div>
                    <textarea className="w-full rounded-lg p-4 text-sm resize-none h-40 focus:outline-none transition-colors"
                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                        onFocus={e => e.target.style.borderColor = C.indigo}
                        onBlur={e => e.target.style.borderColor = C.border}
                        value={configDraft.customPrompt || ''} onChange={e => setConfigDraft(p => ({ ...p, customPrompt: e.target.value }))} />
                </div>

                {/* Channel Credentials */}
                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                        <Key size={16} style={{ color: C.amber }} /> Conexiones y Canales
                    </h3>
                    <div className="mb-5">
                        <p className="text-xs font-bold mb-2 uppercase tracking-wider" style={{ color: C.textDim }}>Wizard rápido (2 minutos)</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                                { id: 'instagram', label: 'Instagram', icon: <Instagram size={15} /> },
                                { id: 'facebook', label: 'Facebook', icon: <Facebook size={15} /> },
                                { id: 'tiktok', label: 'TikTok', icon: <Sparkles size={15} /> }
                            ].map(ch => (
                                <button key={ch.id} onClick={() => setChannelWizard(ch.id)}
                                    className="rounded-lg px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                    style={{
                                        border: `1px solid ${channelWizard === ch.id ? C.indigo : C.border}`,
                                        background: channelWizard === ch.id ? C.indigoDim : C.bg,
                                        color: channelWizard === ch.id ? C.indigo : C.text
                                    }}>
                                    {ch.icon} {ch.label}
                                </button>
                            ))}
                        </div>
                        <div className="mt-3 rounded-lg p-3 text-xs" style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                            {channelWizard === 'instagram' && (
                                <ol className="list-decimal pl-4 space-y-1" style={{ color: C.textMuted }}>
                                    <li>Conecta tu Instagram en ManyChat (Settings → Instagram).</li>
                                    <li>Configura Default Reply hacia: <code>/api/webhooks/manychat</code>.</li>
                                    <li>Guarda un token en <b>ManyChat Token</b> y publica el flujo.</li>
                                </ol>
                            )}
                            {channelWizard === 'facebook' && (
                                <ol className="list-decimal pl-4 space-y-1" style={{ color: C.textMuted }}>
                                    <li>Conecta página de Facebook en ManyChat (Messenger).</li>
                                    <li>Apunta el webhook a <code>/api/webhooks/manychat</code>.</li>
                                    <li>Usa el mismo token de seguridad en Authorization Bearer.</li>
                                </ol>
                            )}
                            {channelWizard === 'tiktok' && (
                                <ol className="list-decimal pl-4 space-y-1" style={{ color: C.textMuted }}>
                                    <li>Pega tu TikTok Access Token abajo.</li>
                                    <li>Configura webhook TikTok a <code>/api/webhooks/tiktok</code>.</li>
                                    <li>Haz prueba enviando DM y revisa Live Chat.</li>
                                </ol>
                            )}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Proveedor WhatsApp Principal</label>
                                <select className="w-full rounded-lg p-3 text-sm focus:outline-none appearance-none"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    value={configDraft.provider || 'baileys'} onChange={e => setConfigDraft(p => ({ ...p, provider: e.target.value }))}>
                                    <option value="baileys">Baileys (QR - Gratis)</option>
                                    <option value="meta">Meta Cloud API (WhatsApp)</option>
                                    <option value="360dialog">360Dialog</option>
                                </select>
                            </div>
                            {configDraft.provider === 'meta' && (
                                <div className="flex items-end gap-2">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>WA Cloud Access Token</label>
                                        <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.accessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxx..." />
                                    </div>
                                    <button 
                                        onClick={() => setPhase('meta_wizard')}
                                        className="h-[46px] px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-all flex items-center gap-2"
                                    >
                                        <Zap size={14} /> Wizard
                                    </button>
                                </div>
                            )}
                        </div>
                            {/* Conditional Discord Fields */}
                            {configDraft.provider === 'discord' && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Discord Bot Token</label>
                                    <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                        value={configDraft.discordToken || ''} onChange={e => setConfigDraft(p => ({ ...p, discordToken: e.target.value }))} placeholder="MTEyN..." />
                                </div>
                            )}

                            {/* Conditional Reddit Fields */}
                            {configDraft.provider === 'reddit' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Reddit Client ID</label>
                                        <input className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.redditClientId || ''} onChange={e => setConfigDraft(p => ({ ...p, redditClientId: e.target.value }))} placeholder="Client ID..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Reddit Client Secret</label>
                                        <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.redditClientSecret || ''} onChange={e => setConfigDraft(p => ({ ...p, redditClientSecret: e.target.value }))} placeholder="Secret..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Reddit Username</label>
                                        <input className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.redditUsername || ''} onChange={e => setConfigDraft(p => ({ ...p, redditUsername: e.target.value }))} placeholder="u/alexbot..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Reddit Password</label>
                                        <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.redditPassword || ''} onChange={e => setConfigDraft(p => ({ ...p, redditPassword: e.target.value }))} placeholder="Password..." />
                                    </div>
                                </>
                            )}
                    </div>

                    {/* ManyChat Bridge (Always visible as it can complement any channel) */}
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: C.border }}>
                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1" style={{ color: C.textDim }}>
                            <Zap size={14} className="text-indigo-400" /> Puente ManyChat / External Webhook
                        </label>
                        <p className="text-[10px] mb-2" style={{ color: C.textMuted }}>
                            Configura la **External Request** en ManyChat usando este Request URL y el Token:
                        </p>
                        
                        <div className="relative group mb-3">
                            <div className="p-2.5 rounded-lg bg-black/20 border border-indigo-500/10 font-mono text-[9px] break-all pr-12" 
                                 style={{ color: C.indigo }}>
                                {window.location.origin}/api/webhooks/manychat?tenantId={selected?.tenantId || selected?.tenant_id || configDraft.tenantId || 'TU_TENANT_ID'}&instanceId={selected?.instanceId || selected?.id}
                            </div>
                            <button 
                                onClick={() => {
                                    const url = `${window.location.origin}/api/webhooks/manychat?tenantId=${selected?.tenantId || selected?.tenant_id || configDraft.tenantId || 'TU_TENANT_ID'}&instanceId=${selected?.instanceId || selected?.id}`;
                                    navigator.clipboard.writeText(url);
                                    setCopiedUrl(true);
                                    setTimeout(() => setCopiedUrl(false), 2000);
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all hover:bg-white/10"
                                style={{ color: copiedUrl ? C.green : C.indigo }}
                                title="Copiar URL"
                            >
                                {copiedUrl ? <Check size={14} /> : <Copy size={14} />}
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <input type={showToken ? "text" : "password"} className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors pr-20"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    value={configDraft.manychatToken || ''} 
                                    onChange={e => setConfigDraft(p => ({ ...p, manychatToken: e.target.value }))} 
                                    placeholder="Token secreto para Auth Header..." 
                                />
                                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                    <button 
                                        onClick={() => setShowToken(!showToken)}
                                        className="p-1.5 rounded-md transition-all hover:bg-white/5"
                                        style={{ color: C.textDim }}
                                        title={showToken ? "Ocultar" : "Mostrar"}
                                    >
                                        {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            navigator.clipboard.writeText(configDraft.manychatToken || '');
                                            setCopiedToken(true);
                                            setTimeout(() => setCopiedToken(false), 2000);
                                        }}
                                        className="p-1.5 rounded-md transition-all hover:bg-white/5"
                                        style={{ color: copiedToken ? C.green : C.textDim }}
                                        title="Copiar Token"
                                    >
                                        {copiedToken ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                            </div>
                            <button onClick={() => {
                                const newToken = 'ALEX_' + Math.random().toString(36).substr(2, 10).toUpperCase();
                                setConfigDraft(p => ({ ...p, manychatToken: newToken }));
                                setShowToken(true);
                            }}
                                className="px-3 rounded-lg font-bold text-xs transition-all hover:scale-105"
                                style={{ background: C.indigoDim, color: C.indigo, border: `1px solid ${C.indigo}44` }}>
                                <Sparkles size={14} className="inline mr-1" /> Generar
                            </button>
                        </div>
                    </div>
                </div>

                {/* CRM Integrations */}
                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                        <Users size={16} style={{ color: C.green }} /> Integraciones CRM
                    </h3>
                    <div className="space-y-4">
                        {/* HubSpot */}
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>HubSpot - Private App Token</label>
                            <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                onFocus={e => e.target.style.borderColor = C.indigo}
                                onBlur={e => e.target.style.borderColor = C.border}
                                value={configDraft.hubspotAccessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, hubspotAccessToken: e.target.value }))} placeholder="pat-na1-xxxx-xxxx..." />
                        </div>
                        {/* GoHighLevel */}
                        <div>
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>GoHighLevel - API Key (v2)</label>
                            <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                onFocus={e => e.target.style.borderColor = C.indigo}
                                onBlur={e => e.target.style.borderColor = C.border}
                                value={configDraft.ghlApiKey || ''} onChange={e => setConfigDraft(p => ({ ...p, ghlApiKey: e.target.value }))} placeholder="pit-xxxx..." />
                        </div>
                        {/* Copper */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Copper - API Key</label>
                                <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    onFocus={e => e.target.style.borderColor = C.indigo}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                    value={configDraft.copperApiKey || ''} onChange={e => setConfigDraft(p => ({ ...p, copperApiKey: e.target.value }))} placeholder="xxxx-xxxx-xxxx" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Copper - User Email</label>
                                <input type="email" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    onFocus={e => e.target.style.borderColor = C.indigo}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                    value={configDraft.copperUserEmail || ''} onChange={e => setConfigDraft(p => ({ ...p, copperUserEmail: e.target.value }))} placeholder="user@company.com" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save + Support */}
                <button onClick={onSave}
                    className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:scale-[1.01] hover:shadow-lg"
                    style={{ background: `linear-gradient(135deg, ${C.indigo}, #7c3aed)`, color: '#fff', boxShadow: `0 4px 20px ${C.indigo}44` }}>
                    💾 Guardar Configuración
                </button>

                <button onClick={async () => {
                    try {
                        const { response, data } = await fetchJsonWithApiFallback(`/api/saas/test-sync/${selected?.instanceId || selected?.id}`, {
                            method: 'POST',
                            headers: { ...getAuthHeaders() }
                        });
                        if (response.ok) pushNotice('success', data.message);
                        else throw new Error(data.error);
                    } catch (e) {
                         pushNotice('error', e.message);
                    }
                }}
                    className="w-full py-2.5 rounded-xl font-bold text-xs transition-all opacity-80 hover:opacity-100 mt-2"
                    style={{ border: `1px dashed ${C.indigo}`, color: C.indigo }}>
                    🧪 Test HubSpot (SRE)
                </button>
                <SupportBanner text="¿Dudas sobre la configuración avanzada?" />
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-5">
                {/* Connection Status */}
                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: C.textDim }}>Estado de Conexión</h4>
                    <div className="flex items-center gap-3">
                        {connectionStatus === 'online' ? (
                            <>
                                <div className="relative">
                                    <Wifi size={20} style={{ color: C.green }} />
                                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: C.green }} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold" style={{ color: C.green }}>Conectado</p>
                                    <p className="text-xs" style={{ color: C.textDim }}>WhatsApp activo</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <WifiOff size={20} style={{ color: C.red }} />
                                <div>
                                    <p className="text-sm font-bold" style={{ color: C.red }}>Desconectado</p>
                                    <p className="text-xs" style={{ color: C.textDim }}>Escanea el QR para conectar</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="rounded-xl p-5" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <h4 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: C.textDim }}>Analítica (7 días)</h4>

                    {/* Channel Distribution */}
                    {analytics?.channels && (
                        <div className="mb-4 pb-4 border-b" style={{ borderColor: C.border }}>
                           <h5 className="text-[10px] uppercase font-bold mb-2 flex items-center gap-1" style={{ color: C.textMuted }}><BarChart3 size={12}/> Uso por Canal</h5>
                           <div className="grid grid-cols-2 gap-2">
                                <div className="text-xs flex justify-between"><span className="flex items-center gap-1 text-green-400"><MessageSquare size={12}/> WA</span> <span className="font-bold" style={{ color: C.text }}>{analytics.channels.whatsapp || 0}</span></div>
                                <div className="text-xs flex justify-between"><span className="flex items-center gap-1 text-blue-400"><Facebook size={12}/> FB</span> <span className="font-bold" style={{ color: C.text }}>{analytics.channels.messenger || 0}</span></div>
                                <div className="text-xs flex justify-between"><span className="flex items-center gap-1 text-pink-400"><Instagram size={12}/> IG</span> <span className="font-bold" style={{ color: C.text }}>{analytics.channels.instagram || 0}</span></div>
                                <div className="text-xs flex justify-between"><span className="flex items-center gap-1 text-slate-400"><GlobeIcon size={12}/> Web</span> <span className="font-bold" style={{ color: C.text }}>{analytics.channels.web || 0}</span></div>
                           </div>
                        </div>
                    )}

                    <div className="mb-4 pb-4 border-b" style={{ borderColor: C.border }}>
                        <h5 className="text-[10px] uppercase font-bold mb-3 flex items-center gap-1" style={{ color: C.textMuted }}><Zap size={12}/> SLA / Latencia IA</h5>
                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span style={{ color: C.textDim }}>Capa 1: Gemini 2.0</span>
                                    <span style={{ color: C.green }}>~850ms</span>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[20%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-[10px] mb-1">
                                    <span style={{ color: C.textDim }}>Capa 2: MiniMax 6.5s</span>
                                    <span style={{ color: C.amber }}>~1.4s</span>
                                </div>
                                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-amber-500 w-[45%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { label: 'Mensajes recibidos', value: analytics?.messages_received || 0, icon: <MessageSquare size={14} />, color: C.indigo },
                            { label: 'Respuestas IA', value: analytics?.ai_responses || 0, icon: <Sparkles size={14} />, color: '#8b5cf6' },
                            { label: 'Leads detectados', value: analytics?.leads_detected || 0, icon: <Star size={14} />, color: C.amber },
                            { label: 'Derivaciones humanas', value: analytics?.human_handoffs || 0, icon: <Users size={14} />, color: C.green },
                        ].map(stat => (
                            <div key={stat.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg" style={{ background: `${stat.color}18`, color: stat.color }}>{stat.icon}</div>
                                    <span className="text-xs" style={{ color: C.textMuted }}>{stat.label}</span>
                                </div>
                                <span className="font-bold text-sm" style={{ color: C.text }}>{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Compliance Badge */}
                <div className="rounded-xl p-4 text-center" style={{ background: C.indigoDim, border: `1px solid ${C.indigo}33` }}>
                    <Shield size={20} className="mx-auto mb-2" style={{ color: C.indigo }} />
                    <p className="text-xs font-bold" style={{ color: C.indigo }}>GDPR Compliant</p>
                    <p className="text-[10px] mt-1" style={{ color: C.textDim }}>Datos encriptados end-to-end</p>
                </div>
            </div>
        </div>
    );

    // ── RENDER ─────────────────────────────────────────────────
    return (
        <div className="h-full overflow-y-auto pr-2 pb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            {phase === 'enterprise_wizard' && renderEnterpriseWizard()}
            {phase === 'meta_wizard' && (
                <MetaWizard 
                    onComplete={(data) => {
                        setConfigDraft(prev => ({
                            ...prev,
                            provider: 'meta',
                            accessToken: data.accessToken,
                            phoneNumberId: data.phoneNumberId,
                            wabaId: data.wabaId,
                            manychatToken: data.verifyToken, // Reuse manychatToken as verifyToken for simplicity in UI storage
                            external_mapping_key: data.phoneNumberId
                        }));
                        setPhase('advanced');
                        onSave();
                    }}
                    onCancel={() => setPhase('advanced')}
                />
            )}
            {phase === 'advanced' && renderAdvanced()}
            <FloatingSupport />
        </div>
    );
}
