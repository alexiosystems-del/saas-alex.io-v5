import React, { useState, useEffect } from 'react';
import { Settings, Zap, MessageSquare, Clock, Shield, ChevronRight, ChevronLeft, Sparkles, Copy, Check, Play, HelpCircle, ExternalLink, Loader2, Volume2, Key, Globe, Users, BarChart3, Wifi, WifiOff, Star, ArrowRight, Facebook, Instagram } from 'lucide-react';

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
    { id: 'sales', icon: '🎯', title: 'Ventas Online', desc: 'E-commerce, catálogos, cierre de ventas', color: C.indigo, prompt: 'Eres un VENDEDOR EXPERTO altamente persuasivo para {businessName}. Tu meta es calificar al usuario, resolver objeciones y cerrar ventas. Sé dinámico, ofrece productos relevantes y guía al usuario hacia la compra.' },
    { id: 'support', icon: '🎧', title: 'Soporte Técnico', desc: 'Tickets, troubleshooting, guías paso a paso', color: '#06b6d4', prompt: 'Eres un agente de SOPORTE TÉCNICO paciente y resolutivo de {businessName}. Solicita el número de ticket, diagnostica el problema y guía paso a paso al usuario hacia la solución.' },
    { id: 'customer', icon: '💬', title: 'Atención al Cliente', desc: 'Consultas generales, FAQ, información', color: '#8b5cf6', prompt: 'Eres un asistente de ATENCIÓN AL CLIENTE amable y eficiente de {businessName}. Responde consultas generales, proporciona información sobre servicios y horarios, y escala a un humano cuando sea necesario.' },
    { id: 'appointments', icon: '📅', title: 'Turnos & Reservas', desc: 'Agendamiento, confirmaciones, recordatorios', color: '#22c55e', prompt: 'Eres un asistente de AGENDAMIENTO de {businessName}. Tu trabajo es coordinar turnos y reservas. Pregunta por fecha, hora preferida y datos de contacto. Confirma la disponibilidad y envía recordatorios.' },
    { id: 'restaurant', icon: '🍽️', title: 'Restaurante', desc: 'Menú, pedidos, delivery, reservas de mesa', color: '#f97316', prompt: 'Eres el asistente virtual de {businessName}. Ayudas a los clientes con el menú, tomas pedidos para delivery o retiro, gestionas reservas de mesa y respondes sobre horarios y ubicación.' },
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
                    <h3 className="font-bold text-sm mb-4 flex items-center gap-2" style={{ color: C.text }}>
                        <Key size={16} style={{ color: C.amber }} /> Conexiones y Canales
                    </h3>
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
                                <div>
                                    <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider" style={{ color: C.textDim }}>WA Cloud Access Token</label>
                                    <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none"
                                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                        value={configDraft.accessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, accessToken: e.target.value }))} placeholder="EAAxxxxxxx..." />
                                </div>
                            )}
                        </div>

                        {/* Nuevos Canales */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                            <div className="sm:col-span-2">
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1" style={{ color: C.textDim }}>
                                    Integración con ManyChat (Meta Bridge)
                                </label>
                                <p className="text-[10px] mb-2" style={{ color: C.textMuted }}>
                                    Ingresa tu ALEX IO Webhook URL en ManyChat: `https://tu-dominio.com/api/webhooks/manychat`<br/>
                                    Crea un Token de Seguridad a continuación y envíalo en el Header `Authorization: Bearer TU_TOKEN`.
                                </p>
                                <div className="flex gap-2">
                                    <input type="password" className="flex-1 rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                        style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                        onFocus={e => e.target.style.borderColor = C.indigo}
                                        onBlur={e => e.target.style.borderColor = C.border}
                                        value={configDraft.manychatToken || ''} onChange={e => setConfigDraft(p => ({ ...p, manychatToken: e.target.value }))} placeholder="Inserta o genera un token secreto..." />
                                    <button onClick={() => setConfigDraft(p => ({ ...p, manychatToken: 'ALEX_' + Math.random().toString(36).substr(2, 10).toUpperCase() }))}
                                        className="px-3 rounded-lg font-bold text-xs transition-all hover:scale-105"
                                        style={{ background: C.indigoDim, color: C.indigo, border: `1px solid ${C.indigo}44` }}>
                                        <Sparkles size={14} className="inline mr-1" /> Generar
                                    </button>
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold mb-1.5 uppercase tracking-wider flex items-center gap-1" style={{ color: C.textDim }}>
                                    TikTok Access Token
                                </label>
                                <input type="password" className="w-full rounded-lg p-3 text-sm focus:outline-none transition-colors"
                                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text }}
                                    onFocus={e => e.target.style.borderColor = C.indigo}
                                    onBlur={e => e.target.style.borderColor = C.border}
                                    value={configDraft.tiktokAccessToken || ''} onChange={e => setConfigDraft(p => ({ ...p, tiktokAccessToken: e.target.value }))} placeholder="Actxxxxxxx..." />
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
