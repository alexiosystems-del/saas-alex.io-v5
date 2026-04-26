import React, { useState, useEffect } from 'react';
import { Settings, Zap, MessageSquare, Clock, Shield, ChevronRight, ChevronLeft, Sparkles, Copy, Check, Play, HelpCircle, ExternalLink, Loader2, Volume2, Key, Globe, Users, BarChart3, Wifi, WifiOff, Star, ArrowRight, Facebook, Instagram, Music, Smartphone, Cloud, Eye, EyeOff } from 'lucide-react';

const CONFIG_TAB_VERSION = 'v2.0.7.8-STABLE';

// ─── Color Tokens (derived from parent theme or default dark) ─
const makeTokens = (theme) => ({
    bg: theme?.bg || '#0e0e16',
    surface: theme?.card || '#16161e',
    surfaceHover: theme?.card ? (theme.bg === '#f8fafc' ? '#f1f5f9' : '#1e1e2a') : '#1e1e2a',
    border: theme?.border || '#2a2a3a',
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
    { id: 'businessName', label: '¿Cuál es el nombre de tu negocio?', placeholder: 'Ej: TechStore Argentina', icon: <Globe size={20} /> },
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

    // If bot already has a custom prompt, start in advanced mode
    useEffect(() => {
        if (configDraft?.customPrompt?.length > 20) {
            setPhase('advanced');
        } else {
            setPhase('select');
        }
    }, [selected?.id]);

    // ── Phase: SELECT ──────────────────────────────────────────
    const renderSelect = () => (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>¿Qué tipo de negocio tenés?</h2>
                <p style={{ color: C.textMuted }} className="text-sm">Elegí una plantilla y te guiaremos para crear el prompt perfecto para tu bot.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {BUSINESS_TYPES.map(bt => (
                    <button key={bt.id} onClick={() => { setSelectedType(bt); setPhase('wizard'); setWizardStep(0); setWizardData({}); }}
                        className="group text-left p-5 rounded-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                        style={{
                            background: C.surface,
                            border: `1px solid ${C.border}`,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = bt.color; e.currentTarget.style.boxShadow = `0 0 20px ${bt.color}22`; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                        <div className="text-3xl mb-3">{bt.icon}</div>
                        <h3 className="font-bold text-base mb-1" style={{ color: C.text }}>{bt.title}</h3>
                        <p className="text-xs" style={{ color: C.textDim }}>{bt.desc}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: bt.color }}>
                            Configurar <ArrowRight size={14} />
                        </div>
                    </button>
                ))}
            </div>
            <SupportBanner />
        </div>
    );

    // ── Phase: WIZARD ──────────────────────────────────────────
    const renderWizard = () => {
        const q = WIZARD_QUESTIONS[wizardStep];
        const progress = ((wizardStep + 1) / WIZARD_QUESTIONS.length) * 100;
        return (
            <div className="max-w-lg mx-auto space-y-6">
                {/* Progress */}
                <div className="flex items-center gap-3">
                    <button onClick={() => wizardStep > 0 ? setWizardStep(s => s - 1) : setPhase('select')}
                        className="p-2 rounded-lg transition-colors" style={{ background: C.surface, color: C.textMuted }}>
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex-1 rounded-full h-1.5 overflow-hidden" style={{ background: C.border }}>
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${C.indigo}, ${C.amber})` }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: C.textDim }}>{wizardStep + 1}/{WIZARD_QUESTIONS.length}</span>
                </div>

                {/* Question Card */}
                <div className="rounded-xl p-6" style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg" style={{ background: C.indigoDim, color: C.indigo }}>{q.icon}</div>
                        <h3 className="font-bold text-lg" style={{ color: C.text }}>{q.label}</h3>
                    </div>

                    {q.type === 'select' ? (
                        <div className="grid grid-cols-2 gap-3">
                            {q.options.map(opt => (
                                <button key={opt.value} onClick={() => setWizardData(d => ({ ...d, [q.id]: opt.value }))}
                                    className="text-left p-4 rounded-xl transition-all"
                                    style={{
                                        background: wizardData[q.id] === opt.value ? C.indigoDim : C.bg,
                                        border: `2px solid ${wizardData[q.id] === opt.value ? C.indigo : C.border}`,
                                    }}>
                                    <div className="font-bold text-sm mb-0.5" style={{ color: C.text }}>{opt.label}</div>
                                    <div className="text-xs" style={{ color: C.textDim }}>{opt.desc}</div>
                                </button>
                            ))}
                        </div>
                    ) : q.multiline ? (
                        <textarea
                            className="w-full rounded-xl p-4 text-sm resize-none h-28 focus:outline-none transition-colors"
                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                            onFocus={e => e.target.style.borderColor = C.indigo}
                            onBlur={e => e.target.style.borderColor = C.border}
                            placeholder={q.placeholder}
                            value={wizardData[q.id] || ''}
                            onChange={e => setWizardData(d => ({ ...d, [q.id]: e.target.value }))}
                        />
                    ) : (
                        <input
                            className="w-full rounded-xl p-4 text-sm focus:outline-none transition-colors"
                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                            onFocus={e => e.target.style.borderColor = C.indigo}
                            onBlur={e => e.target.style.borderColor = C.border}
                            placeholder={q.placeholder}
                            value={wizardData[q.id] || ''}
                            onChange={e => setWizardData(d => ({ ...d, [q.id]: e.target.value }))}
                            autoFocus
                        />
                    )}
                </div>

                {/* Navigation */}
                <div className="flex justify-end">
                    <button onClick={() => {
                        if (wizardStep < WIZARD_QUESTIONS.length - 1) {
                            setWizardStep(s => s + 1);
                        } else {
                            // Generate prompt
                            setPhase('generating');
                            setTimeout(() => {
                                const toneMap = { formal: 'profesional y respetuoso', friendly: 'cercano y cálido', casual: 'relajado y joven', expert: 'técnico y detallado' };
                                const base = selectedType.prompt.replace('{businessName}', wizardData.businessName || 'el negocio');
                                const extra = [
                                    wizardData.hours ? `\nHorarios de atención: ${wizardData.hours}.` : '',
                                    wizardData.keyInfo ? `\nInformación importante: ${wizardData.keyInfo}` : '',
                                    wizardData.tone ? `\nUsa siempre un tono ${toneMap[wizardData.tone] || 'amigable'}.` : '',
                                    wizardData.handoff ? `\nDeriva a un agente humano cuando: ${wizardData.handoff}` : '',
                                    '\nREGLA: Sé conciso (máximo 50 palabras por respuesta). Responde siempre en el idioma del usuario.',
                                ].join('');
                                setGeneratedPrompt(base + extra);
                                setPhase('done');
                            }, 2000);
                        }
                    }}
                        className="px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${C.indigo}, #7c3aed)`, color: '#fff' }}>
                        {wizardStep < WIZARD_QUESTIONS.length - 1 ? <><span>Siguiente</span><ChevronRight size={16} /></> : <><Sparkles size={16} /><span>Generar Prompt con IA</span></>}
                    </button>
                </div>
            </div>
        );
    };

    // ── Phase: GENERATING ──────────────────────────────────────
    const renderGenerating = () => (
        <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: C.indigoDim }}>
                    <Sparkles size={36} style={{ color: C.indigo }} />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full animate-ping" style={{ background: C.indigo }} />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-bold mb-2" style={{ color: C.text }}>Generando tu prompt personalizado...</h3>
                <p className="text-sm" style={{ color: C.textMuted }}>La IA está construyendo las instrucciones perfectas para tu bot.</p>
            </div>
            <Loader2 size={24} className="animate-spin" style={{ color: C.indigo }} />
        </div>
    );

    // ── Phase: DONE ────────────────────────────────────────────
    const renderDone = () => (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="text-center mb-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-3" style={{ background: 'rgba(34,197,94,0.12)', color: C.green }}>
                    <Check size={16} /> ¡Prompt generado con éxito!
                </div>
                <h2 className="text-2xl font-bold" style={{ color: C.text }}>Revisá y ajustá el resultado</h2>
                <p className="text-sm mt-1" style={{ color: C.textMuted }}>Podés editar el texto antes de aplicarlo a tu bot.</p>
            </div>

            <div className="rounded-xl p-1" style={{ background: `linear-gradient(135deg, ${C.indigo}44, ${C.amber}44)` }}>
                <textarea
                    className="w-full rounded-lg p-5 text-sm resize-none h-56 focus:outline-none"
                    style={{ background: C.bg, color: C.text }}
                    value={generatedPrompt}
                    onChange={e => setGeneratedPrompt(e.target.value)}
                />
            </div>

            <div className="flex gap-3">
                <button onClick={() => { navigator.clipboard.writeText(generatedPrompt); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }}>
                    {copied ? <><Check size={16} /> Copiado!</> : <><Copy size={16} /> Copiar</>}
                </button>
                <button onClick={() => {
                    setConfigDraft(prev => ({ ...prev, customPrompt: generatedPrompt }));
                    setPhase('advanced');
                }}
                    className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02]"
                    style={{ background: `linear-gradient(135deg, ${C.indigo}, #7c3aed)`, color: '#fff' }}>
                    <Zap size={16} /> Usar este Prompt
                </button>
            </div>

            <button onClick={() => { setPhase('select'); setSelectedType(null); }}
                className="w-full text-center text-xs py-2 transition-colors" style={{ color: C.textDim }}>
                ← Volver a elegir tipo de negocio
            </button>
        </div>
    );

    // ── Phase: ADVANCED ────────────────────────────────────────
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
                            <select className="w-full rounded-lg p-3 text-sm focus:outline-none appearance-none"
                                style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                value={configDraft.voice || 'nova'} onChange={e => setConfigDraft(p => ({ ...p, voice: e.target.value }))}>
                                <option value="nova">Nova (Femenina - Natural)</option>
                                <option value="onyx">Onyx (Masculina - Profunda)</option>
                                <option value="fable">Fable (Masculina - Animada)</option>
                                <option value="alloy">Alloy (Andrógina - Directa)</option>
                                <option value="echo">Echo (Masculina - Suave)</option>
                                <option value="shimmer">Shimmer (Femenina - Clara)</option>
                            </select>
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
                        <button onClick={() => { setPhase('select'); setSelectedType(null); }}
                            className="text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                            style={{ background: C.amberDim, color: C.amber }}>
                            <Sparkles size={12} className="inline mr-1" /> Regenerar con Wizard
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
                    <h3 className="font-bold text-sm mb-4 flex items-center justify-between gap-2" style={{ color: C.text }}>
                        <div className="flex items-center gap-2">
                            <Key size={16} style={{ color: C.amber }} /> Conexiones y Canales
                        </div>
                        <span className="text-[10px] opacity-30 font-mono">{CONFIG_TAB_VERSION}</span>
                    </h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider text-center" style={{ color: C.textDim }}>Selecciona tu Canal de Conexión</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { id: 'baileys', name: 'WhatsApp', sub: 'Baileys', icon: <Smartphone size={20} />, color: '#25D366' },
                                    { id: 'meta', name: 'WhatsApp', sub: 'Cloud API', icon: <Cloud size={20} />, color: '#0080FF' },
                                    { id: 'discord', name: 'Discord', sub: 'Bot API', icon: <MessageSquare size={20} />, color: '#5865F2' },
                                    { id: 'tiktok', name: 'TikTok', sub: 'Business', icon: <Music size={20} />, color: '#000000' },
                                    { id: 'messenger', name: 'Messenger', sub: 'Facebook', icon: <Facebook size={20} />, color: '#0695FF' },
                                    { id: 'instagram', name: 'Instagram', sub: 'Direct', icon: <Instagram size={20} />, color: '#E4405F' },
                                    { id: '360dialog', name: '360Dialog', sub: 'WhatsApp', icon: <Globe size={20} />, color: '#6366f1' },
                                ].map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setConfigDraft(prev => ({ ...prev, provider: p.id }))}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all hover:scale-105 ${configDraft.provider === p.id ? 'shadow-lg border-indigo-500' : 'opacity-70 grayscale hover:grayscale-0'}`}
                                        style={{ 
                                            background: configDraft.provider === p.id ? `${C.indigo}15` : C.bg,
                                            borderColor: configDraft.provider === p.id ? C.indigo : C.border,
                                        }}
                                    >
                                        <div className="mb-2 p-2 rounded-lg" style={{ background: `${p.color}15`, color: p.color }}>{p.icon}</div>
                                        <span className="text-[11px] font-bold" style={{ color: C.text }}>{p.name}</span>
                                        <span className="text-[9px] uppercase opacity-50 font-bold tracking-wider">{p.sub}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                            
                            {/* Conditional Meta/WA Fields */}
                            {configDraft.provider === 'meta' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>WA Phone Number ID</label>
                                        <input className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.phoneNumberId || ''} onChange={e => setConfigDraft(p => ({ ...p, phoneNumberId: e.target.value }))} placeholder="123456789..." />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>WA Cloud Access Token</label>
                                        <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.accessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxx..." />
                                    </div>
                                </>
                            )}

                            {/* Conditional Messenger/IG Fields */}
                            {(configDraft.provider === 'messenger' || configDraft.provider === 'instagram') && (
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>Page/Account Access Token</label>
                                    <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                        value={configDraft.accessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxx..." />
                                </div>
                            )}

                            {/* Conditional TikTok Fields */}
                            {configDraft.provider === 'tiktok' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>TikTok Seller ID</label>
                                        <input className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.tiktokSellerId || ''} onChange={e => setConfigDraft(p => ({ ...p, tiktokSellerId: e.target.value }))} placeholder="Seller ID..." />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>TikTok Access Token</label>
                                        <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                            value={configDraft.tiktokAccessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, tiktokAccessToken: e.target.value }))} placeholder="Actxxxxxxx..." />
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
                        const { response, data } = await fetchJsonWithApiFallback(`/api/saas/test-sync/${instanceId}`, {
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
                                <div className="text-xs flex justify-between"><span className="flex items-center gap-1 text-slate-400"><Globe size={12}/> Web</span> <span className="font-bold" style={{ color: C.text }}>{analytics.channels.web || 0}</span></div>
                           </div>
                        </div>
                    )}

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
            {phase === 'select' && renderSelect()}
            {phase === 'wizard' && renderWizard()}
            {phase === 'generating' && renderGenerating()}
            {phase === 'done' && renderDone()}
            {phase === 'advanced' && renderAdvanced()}
            <FloatingSupport />
        </div>
    );
}
