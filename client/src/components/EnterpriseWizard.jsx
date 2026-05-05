import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Save, Info, Globe as GlobeIcon, Smartphone, Zap, Music, Cloud, MessageSquare, Loader } from 'lucide-react';

const STEPS = [
  { id: 'identity', title: 'Identidad', icon: Bot, color: '#6366f1' },
  { id: 'channels', title: 'Conectores', icon: GlobeIcon, color: '#0ea5e9' },
  { id: 'voice', title: 'Voz y Audio', icon: Mic, color: '#ec4899' },
  { id: 'limits', title: 'Límites', icon: ShieldAlert, color: '#f59e0b' },
  { id: 'summary', title: 'Manifiesto de Despliegue', icon: CheckCircle2, color: '#10b981' }
];

const VOICE_OPTIONS = [
  { id: 'nova', name: 'Nova', desc: 'Enérgica y profesional' },
  { id: 'alloy', name: 'Alloy', desc: 'Versátil y equilibrada' },
  { id: 'echo', name: 'Echo', desc: 'Profunda y autoritaria' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Clara y suave' },
  { id: 'minimax-hd', name: 'MiniMax HD', desc: 'Premium, alta fidelidad (Global)' },
  { id: 'minimax-zh', name: 'MiniMax CN', desc: 'Nativo Asiático (Ultra Realista)' },
  { id: 'onyx', name: 'Onyx', desc: 'Robusta y madura' }
];

export default function EnterpriseWizard({ config, onSave, onCancel }) {
  if (typeof onSave !== "function") {
    console.error("Critical: onSave prop is missing or not a function in EnterpriseWizard");
    return (
      <div className="p-8 text-center text-red-500 bg-red-500/10 rounded-3xl border border-red-500/20">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h3 className="font-bold text-xl">Error de Integración</h3>
        <p className="text-sm mt-2 text-slate-400">El componente no ha recibido la función de guardado (onSave).</p>
      </div>
    );
  }

  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    botName: config?.botName || config?.companyName || 'ALEX IO',
    systemPrompt: config?.systemPrompt || config?.customPrompt || '',
    voiceEnabled: config?.voiceEnabled || false,
    voice: config?.voice || 'nova',
    maxWords: config?.maxWords || 50,
    maxMessages: config?.maxMessages || 100,
    provider: config?.provider || 'baileys',
    accessToken: config?.accessToken || '',
    metaPhoneNumberId: config?.metaPhoneNumberId || '',
    d360ApiKey: config?.d360ApiKey || '',
    discordToken: config?.discordToken || '',
    discordPublicKey: config?.discordPublicKey || '',
    discordAppId: config?.discordAppId || '',
    tiktokAccessToken: config?.tiktokAccessToken || '',
    tiktokSellerId: config?.tiktokSellerId || '',
    manychatToken: config?.manychatToken || ''
  });

  const [validating, setValidating] = useState(null);
  const [validationStatus, setValidationStatus] = useState({ tiktok: null, discord: null, whatsapp: null });

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
    if (field.startsWith('tiktok')) setValidationStatus(s => ({ ...s, tiktok: null }));
    if (field.startsWith('discord')) setValidationStatus(s => ({ ...s, discord: null }));
  };

  const handleValidate = async (platform) => {
    setValidating(platform);
    try {
        const payload = platform === 'tiktok' 
            ? { tiktokAccessToken: data.tiktokAccessToken, tiktokSellerId: data.tiktokSellerId }
            : { discordToken: data.discordToken };
        
        const res = await fetch(`/api/saas/validate-credentials/${platform}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await res.json();
        setValidationStatus(s => ({ ...s, [platform]: result.success ? 'success' : 'error' }));
    } catch (e) {
        setValidationStatus(s => ({ ...s, [platform]: 'error' }));
    } finally {
        setValidating(null);
    }
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'identity':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Nombre del Negocio</label>
                <input
                  type="text"
                  value={data.businessName || ''}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Ej: Fitness Pro Max"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Industria / Nicho</label>
                <input
                  type="text"
                  value={data.industry || ''}
                  onChange={(e) => handleChange('industry', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  placeholder="Ej: Bienes Raíces, Coaching..."
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">¿Quién es tu Cliente Ideal?</label>
              <textarea
                value={data.targetCustomer || ''}
                onChange={(e) => handleChange('targetCustomer', e.target.value)}
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
                placeholder="Ej: Dueños de negocios de 30-50 años que buscan..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Tus Productos y Oferta Irresistible</label>
              <textarea
                value={data.products || ''}
                onChange={(e) => handleChange('products', e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all resize-none"
                placeholder="Lista tus 3 productos principales y sus precios o beneficios..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Estilo de Venta</label>
                <select
                  value={data.salesStyle || 'consultivo'}
                  onChange={(e) => handleChange('salesStyle', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  <option value="consultivo">Consultivo (Escucha y ayuda)</option>
                  <option value="agresivo">Cierre Rápido (Escasez y Urgencia)</option>
                  <option value="amigable">Amigable (Construye confianza)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 mb-1.5 uppercase tracking-wider">Tono de Comunicación</label>
                <select
                  value={data.tone || 'profesional'}
                  onChange={(e) => handleChange('tone', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:ring-2 focus:ring-indigo-500/50 outline-none appearance-none"
                >
                  <option value="profesional">Profesional y Serio</option>
                  <option value="divertido">Divertido y Cercano</option>
                  <option value="autoridad">Líder de Opinión / Autoridad</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'channels':
        return (
          <div className="space-y-6">
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10">
                <p className="text-[11px] text-indigo-400 font-medium">Configura las credenciales de tus canales principales y secundarios.</p>
            </div>

            {/* WhatsApp - THE CORE */}
            <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                    <MessageSquare size={12} className="text-emerald-400" /> WhatsApp Business Core
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button 
                        onClick={() => handleChange('provider', 'baileys')}
                        className={`p-4 rounded-xl border text-left transition-all ${data.provider === 'baileys' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-white/5 border-white/10 opacity-60'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Smartphone size={16} className={data.provider === 'baileys' ? 'text-indigo-400' : 'text-slate-500'} />
                            {data.provider === 'baileys' && <CheckCircle2 size={12} className="text-indigo-400" />}
                        </div>
                        <div className="text-xs font-bold text-white">Baileys</div>
                        <div className="text-[9px] text-slate-500 mt-1">Directo QR. Gratis.</div>
                    </button>
                    <button 
                        onClick={() => handleChange('provider', 'meta')}
                        className={`p-4 rounded-xl border text-left transition-all ${data.provider === 'meta' ? 'bg-blue-500/10 border-blue-500/50' : 'bg-white/5 border-white/10 opacity-60'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <Cloud size={16} className={data.provider === 'meta' ? 'text-blue-400' : 'text-slate-500'} />
                            {data.provider === 'meta' && <CheckCircle2 size={12} className="text-blue-400" />}
                        </div>
                        <div className="text-xs font-bold text-white">Meta Cloud</div>
                        <div className="text-[9px] text-slate-500 mt-1">Oficial. Escalable.</div>
                    </button>
                    <button 
                        onClick={() => handleChange('provider', '360dialog')}
                        className={`p-4 rounded-xl border text-left transition-all ${data.provider === '360dialog' ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-white/5 border-white/10 opacity-60'}`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <GlobeIcon size={16} className={data.provider === '360dialog' ? 'text-emerald-400' : 'text-slate-500'} />
                            {data.provider === '360dialog' && <CheckCircle2 size={12} className="text-emerald-400" />}
                        </div>
                        <div className="text-xs font-bold text-white">360Dialog</div>
                        <div className="text-[9px] text-slate-500 mt-1">Premium BSP.</div>
                    </button>
                </div>
                
                {data.provider === 'meta' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                         <input
                            type="text"
                            value={data.metaPhoneNumberId}
                            onChange={(e) => handleChange('metaPhoneNumberId', e.target.value)}
                            className="w-full bg-white/5 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xs"
                            placeholder="Meta Phone Number ID"
                        />
                         <input
                            type="password"
                            value={data.accessToken}
                            onChange={(e) => handleChange('accessToken', e.target.value)}
                            className="w-full bg-white/5 border border-blue-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-xs font-mono"
                            placeholder="Meta Access Token (System User)"
                        />
                    </motion.div>
                )}

                {data.provider === '360dialog' && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                         <input
                            type="password"
                            value={data.d360ApiKey}
                            onChange={(e) => handleChange('d360ApiKey', e.target.value)}
                            className="w-full bg-white/5 border border-emerald-500/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all text-xs font-mono"
                            placeholder="360Dialog API Key"
                        />
                    </motion.div>
                )}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Canales Secundarios (Omnicanalidad)</label>
                
                {/* TikTok */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <Music size={12} className="text-pink-400" /> TikTok
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                            type="text"
                            value={data.tiktokSellerId}
                            onChange={(e) => handleChange('tiktokSellerId', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-xs"
                            placeholder="Seller ID"
                        />
                        <input
                            type="password"
                            value={data.tiktokAccessToken}
                            onChange={(e) => handleChange('tiktokAccessToken', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-xs"
                            placeholder="Access Token"
                        />
                    </div>
                </div>

                {/* Discord */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <GlobeIcon size={12} className="text-indigo-400" /> Discord
                    </label>
                    <input
                        type="password"
                        value={data.discordToken}
                        onChange={(e) => handleChange('discordToken', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-xs font-mono"
                        placeholder="Bot Token"
                    />
                </div>

                {/* ManyChat */}
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={12} className="text-amber-400" /> ManyChat Integration (IG/FB)
                    </label>
                    <input
                        type="password"
                        value={data.manychatToken}
                        onChange={(e) => handleChange('manychatToken', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all text-sm font-mono"
                        placeholder="ALEX_XXXXX"
                    />
                </div>
            </div>
          </div>
        );
      case 'voice':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <div className="font-semibold text-white">Activar Respuestas de Voz</div>
                <div className="text-xs text-slate-400">El bot responderá con audio a mensajes de texto</div>
              </div>
              <button
                onClick={() => handleChange('voiceEnabled', !data.voiceEnabled)}
                className={`w-12 h-6 rounded-full transition-all relative ${data.voiceEnabled ? 'bg-pink-500' : 'bg-slate-700'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${data.voiceEnabled ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            {data.voiceEnabled && (
              <div className="grid grid-cols-2 gap-3">
                {VOICE_OPTIONS.map(v => (
                  <button
                    key={v.id}
                    onClick={() => handleChange('voice', v.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      data.voice === v.id ? 'bg-pink-500/20 border-pink-500/50 text-white' : 'bg-white/5 border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="text-sm font-bold">{v.name}</div>
                    <div className="text-[10px] opacity-70">{v.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      case 'limits':
        const wordRisk = data.maxWords > 150 ? 'high' : data.maxWords > 80 ? 'med' : 'low';
        return (
          <div className="space-y-10 py-4">
            <div className="relative">
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capacidad de Respuesta</label>
                </div>
                <span className={`text-lg font-mono font-bold ${wordRisk === 'high' ? 'text-red-400' : 'text-emerald-400'}`}>{data.maxWords} <span className="text-[10px] opacity-50 uppercase">palabras</span></span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={data.maxWords}
                onChange={(e) => handleChange('maxWords', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-mono">
                <span>CONCISO</span>
                <span>EXTENSO</span>
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Memoria de Sesión</label>
                </div>
                <span className="text-lg font-mono font-bold text-indigo-400">{data.maxMessages} <span className="text-[10px] opacity-50 uppercase">msgs</span></span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={data.maxMessages}
                onChange={(e) => handleChange('maxMessages', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        );
      case 'summary':
        const generatedPrompt = `Eres un asistente experto en ${data.industry || 'Negocios'}.
NEGOCIO: ${data.businessName || 'ALEX IO'}
CLIENTE IDEAL: ${data.targetCustomer || 'Público General'}
PRODUCTOS: ${data.products || 'Servicios Varios'}
ESTILO: ${data.salesStyle || 'Consultivo'}
TONO: ${data.tone || 'Profesional'}
OBJETIVO: ${data.goal || 'Cerrar Ventas'}

REGLAS:
- Responde claro y corto (máx 50 palabras).
- Prioriza cerrar la intención del usuario.
- Usa lenguaje natural y empático.
- Si no sabes la respuesta, deriva a un humano.
- No inventes datos técnicos o precios no mencionados.`;

        return (
          <div className="space-y-4">
            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Enterprise_Manifest_v5.0</span>
                <div className="flex gap-2">
                    <span className="text-[9px] font-mono text-emerald-500/70 border border-emerald-500/20 px-2 rounded">PROMPT_GENERATED</span>
                    <span className="text-[9px] font-mono text-blue-500/70 border border-blue-500/20 px-2 rounded">LEAD_SCORING_ON</span>
                </div>
              </div>
              <div className="p-4 space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/5">
                    <p className="text-[10px] font-mono text-slate-400 leading-relaxed italic line-clamp-4">
                        {generatedPrompt}
                    </p>
                </div>
                {[
                  { label: 'Identidad', value: data.businessName },
                  { label: 'Canal Principal', value: data.provider === 'baileys' ? 'WhatsApp (QR)' : 'WhatsApp (Meta)' },
                  { label: 'Voz IA', value: data.voiceEnabled ? data.voice.toUpperCase() : 'Desactivado' },
                  { label: 'Estrategia', value: `${data.salesStyle} / ${data.tone}` }
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between text-[10px] border-b border-white/5 pb-2">
                    <span className="text-slate-500 font-bold uppercase">{item.label}</span>
                    <span className="text-white font-mono">{item.value || 'N/A'}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
              <p className="text-[11px] text-slate-400 leading-tight">
                Cerebro optimizado. El sistema ha generado un Prompt de Ingeniería Nivel 5 basado en tus respuestas.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[var(--bg-primary)] rounded-2xl border border-[var(--border)] shadow-2xl overflow-hidden max-w-2xl w-full mx-auto my-8 animate-in zoom-in-95">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent)]/20 flex items-center justify-center border border-[var(--accent)]/30">
            <Bot size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <h2 className="text-[var(--text-primary)] font-bold leading-none mb-1">Executive Wizard</h2>
            <p className="text-[9px] text-[var(--text-secondary)] uppercase tracking-widest">Enterprise Edition</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500 shadow-[0_0_8px_#6366f1]' : 'bg-slate-700'}`}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-8 min-h-[400px]">
        <div className="flex items-center gap-4 mb-8">
          <div className="p-2 rounded-lg" style={{ background: `${STEPS[step].color}20`, color: STEPS[step].color }}>
            {React.createElement(STEPS[step].icon, { size: 20 })}
          </div>
          <h3 className="text-xl font-bold text-white">{STEPS[step].title}</h3>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="bg-slate-900/80 px-8 py-5 border-t border-white/5 flex justify-between items-center">
        <button
          onClick={step === 0 ? onCancel : prev}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          {step === 0 ? 'Cancelar' : <><ArrowLeft size={16} /> Anterior</>}
        </button>
        
        <button
          onClick={step === STEPS.length - 1 ? () => onSave(data) : next}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${
            step === STEPS.length - 1 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
          }`}
        >
          {step === STEPS.length - 1 ? <><Save size={16} /> Finalizar</> : <>Siguiente <ArrowRight size={16} /></>}
        </button>
      </div>
    </div>
  );
}

