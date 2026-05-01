import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Save, Info } from 'lucide-react';

const STEPS = [
  { id: 'identity', title: 'Identidad', icon: Bot, color: '#6366f1' },
  { id: 'channels', title: 'Conectores', icon: Globe, color: '#0ea5e9' },
  { id: 'voice', title: 'Voz y Audio', icon: Mic, color: '#ec4899' },
  { id: 'limits', title: 'Límites', icon: ShieldAlert, color: '#f59e0b' },
  { id: 'summary', title: 'Manifiesto de Despliegue', icon: CheckCircle2, color: '#10b981' }
];

const VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy', desc: 'Versátil y equilibrada' },
  { id: 'nova', name: 'Nova', desc: 'Enérgica y profesional' },
  { id: 'echo', name: 'Echo', desc: 'Profunda y autoritaria' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Clara y suave' },
  { id: 'fable', name: 'Fable', desc: 'Narrativa y expresiva' },
  { id: 'onyx', name: 'Onyx', desc: 'Robusta y madura' }
];

export default function EnterpriseWizard({ config, onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    botName: config?.botName || config?.companyName || 'ALEX IO',
    systemPrompt: config?.systemPrompt || config?.customPrompt || '',
    voiceEnabled: config?.voiceEnabled || false,
    voice: config?.voice || 'nova',
    maxWords: config?.maxWords || 50,
    maxMessages: config?.maxMessages || 100,
    discordToken: config?.discordToken || '',
    tiktokAccessToken: config?.tiktokAccessToken || '',
    manychatToken: config?.manychatToken || ''
  });

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const handleChange = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'identity':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Nombre del Agente</label>
              <input
                type="text"
                value={data.botName}
                onChange={(e) => handleChange('botName', e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                placeholder="Ej: ALEX IO"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">System Prompt (Instrucciones)</label>
              <textarea
                value={data.systemPrompt}
                onChange={(e) => handleChange('systemPrompt', e.target.value)}
                rows={6}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all resize-none text-sm leading-relaxed"
                placeholder="Define cómo debe comportarse el bot..."
              />
            </div>
          </div>
        );
      case 'channels':
        return (
          <div className="space-y-4">
            <div className="p-4 bg-indigo-500/5 rounded-xl border border-indigo-500/10 mb-4">
                <p className="text-[11px] text-indigo-400 font-medium">Configura las credenciales de tus canales externos. Si no usas alguno, déjalo vacío.</p>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2"><Smartphone size={12} className="text-pink-500" /> TikTok Business Token</label>
                    <input
                        type="password"
                        value={data.tiktokAccessToken}
                        onChange={(e) => handleChange('tiktokAccessToken', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-pink-500/50 transition-all text-sm font-mono"
                        placeholder="tt_v2_xxxxxxxxxx"
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2"><Globe size={12} className="text-indigo-400" /> Discord Bot Token</label>
                    <input
                        type="password"
                        value={data.discordToken}
                        onChange={(e) => handleChange('discordToken', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm font-mono"
                        placeholder="MTEyN..."
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-2"><Zap size={12} className="text-amber-400" /> ManyChat Integration Token (IG/FB)</label>
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
        const msgRisk = data.maxMessages > 300 ? 'high' : data.maxMessages > 150 ? 'med' : 'low';
        
        const getRiskColor = (risk) => {
          if (risk === 'high') return 'text-red-400';
          if (risk === 'med') return 'text-amber-400';
          return 'text-emerald-400';
        };

        const getSliderAccent = (risk) => {
          if (risk === 'high') return 'accent-red-500';
          if (risk === 'med') return 'accent-amber-500';
          return 'accent-emerald-500';
        };

        return (
          <div className="space-y-10 py-4">
            <div className="relative">
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Capacidad de Respuesta</label>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    wordRisk === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    wordRisk === 'med' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {wordRisk === 'high' ? 'RIESGO ALTO' : wordRisk === 'med' ? 'PRECAUCIÓN' : 'OPTIMIZADO'}
                  </span>
                </div>
                <span className={`text-lg font-mono font-bold ${getRiskColor(wordRisk)}`}>{data.maxWords} <span className="text-[10px] opacity-50 uppercase">palabras</span></span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={data.maxWords}
                onChange={(e) => handleChange('maxWords', parseInt(e.target.value))}
                className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer transition-all ${getSliderAccent(wordRisk)}`}
              />
              <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-mono">
                <span>CONCISO (10)</span>
                <span>EXTENSO (300)</span>
              </div>
              {wordRisk !== 'low' && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-start gap-2 p-3 bg-white/5 rounded-lg border border-white/5">
                  <Info size={14} className={getRiskColor(wordRisk)} />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {wordRisk === 'high' 
                      ? 'Respuestas superiores a 150 palabras pueden ser ignoradas por los usuarios y aumentar significativamente el costo de tokens.' 
                      : 'Un límite moderado permite respuestas detalladas pero controladas.'}
                  </p>
                </motion.div>
              )}
            </div>

            <div className="relative">
              <div className="flex justify-between mb-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Persistencia de Sesión</label>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                    msgRisk === 'high' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    msgRisk === 'med' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                    'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {msgRisk === 'high' ? 'RIESGO CRÍTICO' : msgRisk === 'med' ? 'ESTÁNDAR' : 'SEGURO'}
                  </span>
                </div>
                <span className={`text-lg font-mono font-bold ${getRiskColor(msgRisk)}`}>{data.maxMessages} <span className="text-[10px] opacity-50 uppercase">msgs</span></span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={data.maxMessages}
                onChange={(e) => handleChange('maxMessages', parseInt(e.target.value))}
                className={`w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer transition-all ${getSliderAccent(msgRisk)}`}
              />
              <div className="flex justify-between mt-2 text-[9px] text-slate-500 font-mono">
                <span>TRANSACCIONAL (5)</span>
                <span>SOPORTE LARGO (500)</span>
              </div>
            </div>
          </div>
        );
      case 'summary':
        const items = [
          { label: 'IDENTIDAD SISTEMA', value: data.botName, status: 'VERIFICADO', icon: <CheckCircle2 size={12} className="text-emerald-400" /> },
          { label: 'SÍNTESIS DE VOZ', value: data.voiceEnabled ? `OPENAI ${data.voice.toUpperCase()}` : 'DESACTIVADO', status: data.voiceEnabled ? 'ACTIVO' : 'IDLE', icon: <div className={`w-2 h-2 rounded-full ${data.voiceEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} /> },
          { label: 'CAPACIDAD VERBAL', value: `${data.maxWords} PALABRAS`, status: data.maxWords > 150 ? 'ADVERTENCIA' : 'OPTIMO', color: data.maxWords > 150 ? 'text-amber-400' : 'text-emerald-400' },
          { label: 'MEMORIA SESIÓN', value: `${data.maxMessages} MENSAJES`, status: 'CONFIGURADO', color: 'text-indigo-400' },
          { label: 'KERNEL CORE', value: data.systemPrompt.slice(0, 40) + '...', status: 'COMPILADO', icon: <Save size={12} className="text-slate-500" /> }
        ];

        return (
          <div className="space-y-4">
            <div className="bg-black/40 rounded-xl border border-white/10 overflow-hidden backdrop-blur-md">
              <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Enterprise_Manifest_v2.5</span>
                <span className="text-[10px] font-mono text-emerald-500/70">SECURITY: HARDENED</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/2">
                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase">Parámetro</th>
                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase">Valor Configurado</th>
                            <th className="px-4 py-2 text-[9px] font-bold text-slate-500 uppercase">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {[
                            { label: 'Core Identity', value: data.botName, status: 'Verificado', color: 'text-emerald-400' },
                            { label: 'Omni-Channels', value: [data.discordToken ? 'Discord' : '', data.tiktokAccessToken ? 'TikTok' : '', data.manychatToken ? 'Meta' : ''].filter(Boolean).join(', ') || 'WA Only', status: 'Cripto-Link', color: 'text-indigo-400' },
                            { label: 'Voice Synthesis', value: data.voiceEnabled ? data.voice.toUpperCase() : 'Inactive', status: data.voiceEnabled ? 'Always-On' : 'Disabled', color: data.voiceEnabled ? 'text-pink-400' : 'text-slate-500' },
                            { label: 'Word Limiter', value: `${data.maxWords} words`, status: wordRisk === 'high' ? 'High Risk' : 'Safe', color: wordRisk === 'high' ? 'text-red-400' : 'text-emerald-400' },
                            { label: 'Session Max', value: `${data.maxMessages} msgs`, status: 'Configured', color: 'text-emerald-400' }
                        ].map((item, idx) => (
                            <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="px-4 py-3 font-bold text-slate-400">{item.label}</td>
                                <td className="px-4 py-3 text-white font-mono">{item.value}</td>
                                <td className={`px-4 py-3 font-bold ${item.color}`}>{item.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
            </div>
            <div className="p-3 bg-indigo-500/5 rounded-lg border border-indigo-500/10 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Al confirmar, el núcleo de la IA se reiniciará con estos parámetros. Este proceso es instantáneo y no interrumpirá las sesiones activas.
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-w-2xl w-full mx-auto my-8">
      {/* Header */}
      <div className="bg-slate-800/50 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 relative">
            <Bot size={18} className="text-indigo-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse" />
          </div>
          <div>
            <h2 className="text-white font-bold leading-none mb-1 flex items-center gap-2">
              Executive Wizard 
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">V2.0</span>
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Configuración Premium</p>
              <div className="w-1 h-1 rounded-full bg-slate-700" />
              <p className="text-[9px] text-indigo-400/70 font-mono animate-pulse">SYSTEM_ONLINE</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${i <= step ? 'bg-indigo-500' : 'bg-slate-700'}`}
              style={{ boxShadow: i === step ? '0 0 10px #6366f1' : 'none' }}
            />
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-8 min-h-[360px] relative">
        <div className="flex items-center gap-4 mb-8">
          {React.createElement(STEPS[step].icon, { 
            size: 24, 
            className: "text-white", 
            style: { color: STEPS[step].color } 
          })}
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
            ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20' 
            : 'bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20'
          }`}
        >
          {step === STEPS.length - 1 ? <><Save size={16} /> Finalizar y Guardar</> : <>Siguiente <ArrowRight size={16} /></>}
        </button>
      </div>

      {/* Decorative Terminal Line */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
    </div>
  );
}
