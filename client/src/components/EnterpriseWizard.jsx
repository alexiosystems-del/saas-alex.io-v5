import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Mic, ShieldAlert, CheckCircle2, ArrowRight, ArrowLeft, Save, Info } from 'lucide-react';

const STEPS = [
  { id: 'identity', title: 'Identidad', icon: Bot, color: '#6366f1' },
  { id: 'voice', title: 'Voz y Audio', icon: Mic, color: '#ec4899' },
  { id: 'limits', title: 'Límites', icon: ShieldAlert, color: '#f59e0b' },
  { id: 'summary', title: 'Resumen', icon: CheckCircle2, color: '#10b981' }
];

const VOICE_OPTIONS = [
  { id: 'alloy', name: 'Alloy', desc: 'Versátil y equilibrada' },
  { id: 'nova', name: 'Nova', desc: 'Enérgica y profesional' },
  { id: 'echo', name: 'Echo', desc: 'Profunda y autoritaria' },
  { id: 'shimmer', name: 'Shimmer', desc: 'Clara y suave' }
];

export default function EnterpriseWizard({ config, onSave, onCancel }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    botName: config?.botName || config?.companyName || 'ALEX IO',
    systemPrompt: config?.systemPrompt || config?.customPrompt || '',
    voiceEnabled: config?.voiceEnabled || false,
    voice: config?.voice || 'nova',
    maxWords: config?.maxWords || 50,
    maxMessages: config?.maxMessages || 100
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
        const wordRisk = data.maxWords > 100;
        const msgRisk = data.maxMessages > 200;
        return (
          <div className="space-y-8 py-4">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Máximo de Palabras</label>
                <span className={`text-sm font-mono ${wordRisk ? 'text-amber-400' : 'text-indigo-400'}`}>{data.maxWords}</span>
              </div>
              <input
                type="range"
                min="10"
                max="300"
                value={data.maxWords}
                onChange={(e) => handleChange('maxWords', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              {wordRisk && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-400/80 italic">
                  <ShieldAlert size={12} /> Cuidado: Respuestas muy largas pueden consumir más tokens y aburrir al cliente.
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mensajes por Sesión</label>
                <span className={`text-sm font-mono ${msgRisk ? 'text-amber-400' : 'text-indigo-400'}`}>{data.maxMessages}</span>
              </div>
              <input
                type="range"
                min="5"
                max="500"
                value={data.maxMessages}
                onChange={(e) => handleChange('maxMessages', parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              {msgRisk && (
                <div className="mt-2 flex items-center gap-2 text-[10px] text-amber-400/80 italic">
                  <ShieldAlert size={12} /> Recomendado: Mantener bajo 150 para evitar bucles de IA costosos.
                </div>
              )}
            </div>
          </div>
        );
      case 'summary':
        return (
          <div className="bg-black/20 rounded-xl border border-white/5 overflow-hidden">
            <table className="w-full text-sm text-left">
              <tbody className="divide-y divide-white/5">
                <tr>
                  <td className="px-4 py-3 text-slate-400 font-medium">Identidad</td>
                  <td className="px-4 py-3 text-white font-mono">{data.botName}</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-400 font-medium">Modo Audio</td>
                  <td className="px-4 py-3 text-white">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${data.voiceEnabled ? 'bg-pink-500/20 text-pink-400' : 'bg-slate-800 text-slate-500'}`}>
                      {data.voiceEnabled ? `Activo (${data.voice})` : 'Inactivo'}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-400 font-medium">Límites</td>
                  <td className="px-4 py-3 text-white font-mono">
                    {data.maxWords} palabras / {data.maxMessages} msgs
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-slate-400 font-medium">Prompt</td>
                  <td className="px-4 py-3 text-white truncate max-w-[200px] italic text-xs">
                    {data.systemPrompt || '(Sin instrucciones personalizadas)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-2xl border border-white/10 shadow-2xl overflow-hidden max-w-2xl w-full mx-auto my-8">
      {/* Header */}
      <div className="bg-slate-900/50 px-6 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <Bot size={18} className="text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-bold leading-none mb-1">Executive Wizard</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Configuración Premium</p>
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
