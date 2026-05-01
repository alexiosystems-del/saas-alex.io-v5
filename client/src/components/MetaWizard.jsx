import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Key, Smartphone, Globe as GlobeIcon, Check, ChevronRight, ShieldCheck, Zap, Copy, AlertCircle } from 'lucide-react';

const STEPS = [
  { id: 'app', title: 'Portal de Meta', icon: <GlobeIcon size={20} /> },
  { id: 'keys', title: 'Credenciales', icon: <Key size={20} /> },
  { id: 'webhook', title: 'Webhook Sync', icon: <Zap size={20} /> }
];

export default function MetaWizard({ onComplete, onCancel }) {
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState({
    accessToken: '',
    phoneNumberId: '',
    wabaId: '',
    verifyToken: 'ALEX_' + Math.random().toString(36).substr(2, 9).toUpperCase()
  });

  const next = () => setStep(s => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const webhookUrl = `${window.location.origin}/api/webhooks/meta`;

  return (
    <div className="rounded-2xl p-8 border border-white/10 bg-[#0e0e16] shadow-2xl max-w-2xl mx-auto overflow-hidden relative">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl -z-10" />
      
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Smartphone className="text-blue-500" /> Meta Cloud API
          </h2>
          <p className="text-slate-400 text-sm">Configuración de WhatsApp Enterprise</p>
        </div>
        <div className="flex gap-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className={`h-1.5 w-8 rounded-full transition-all duration-500 ${i <= step ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="step0"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-100 flex gap-3">
              <AlertCircle className="text-blue-400 shrink-0" size={20} />
              <p>Primero, crea una App de tipo <strong>Business</strong> en el portal de <a href="https://developers.facebook.com" className="underline font-bold text-white" target="_blank" rel="noreferrer">Meta for Developers</a> y añade el producto "WhatsApp".</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                    <GlobeIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Crear App en Meta</p>
                    <p className="text-xs text-slate-500">Selecciona el tipo "Business" o "Negocios"</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
               </div>
               <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10 group hover:border-blue-500/50 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
                    <Zap size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium text-sm">Activar WhatsApp</p>
                    <p className="text-xs text-slate-500">Añade el producto a tu Dashboard de Meta</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-600" />
               </div>
            </div>

            <button onClick={next} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 mt-4">
              Siguiente Paso <ChevronRight size={18} />
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div 
            key="step1"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Permanent Access Token</label>
              <div className="relative">
                <Key className="absolute left-4 top-4 text-slate-500" size={18} />
                <input 
                  type="password"
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-12 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700"
                  placeholder="EAAxxxx (Token permanente del usuario del sistema)"
                  value={data.accessToken}
                  onChange={e => setData({...data, accessToken: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Phone Number ID</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                  placeholder="109xxxx..."
                  value={data.phoneNumberId}
                  onChange={e => setData({...data, phoneNumberId: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">WABA ID</label>
                <input 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 font-mono text-sm"
                  placeholder="102xxxx..."
                  value={data.wabaId}
                  onChange={e => setData({...data, wabaId: e.target.value})}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button onClick={prev} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/5">Atrás</button>
              <button 
                onClick={next} 
                disabled={!data.accessToken || !data.phoneNumberId}
                className="flex-[2] py-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20"
              >
                Configurar Webhook
              </button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            key="step2"
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="p-5 rounded-xl bg-blue-600/5 border border-blue-500/20">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-blue-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <GlobeIcon size={14} /> Callback URL
                </h4>
                <button onClick={() => copyToClipboard(webhookUrl)} className="text-slate-500 hover:text-white transition-colors">
                  {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
              </div>
              <div className="bg-black/60 p-3 rounded-lg font-mono text-[11px] text-blue-200/70 break-all border border-white/5">
                {webhookUrl}
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Copia esta URL en el portal de Meta Developers (Webhook Setup)</p>
            </div>

            <div className="p-5 rounded-xl bg-purple-600/5 border border-purple-500/20">
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-purple-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={14} /> Verify Token
                </h4>
                <button onClick={() => copyToClipboard(data.verifyToken)} className="text-slate-500 hover:text-white transition-colors">
                  <Copy size={14} />
                </button>
              </div>
              <div className="bg-black/60 p-3 rounded-lg font-mono text-sm text-purple-300 border border-white/5 text-center tracking-widest">
                {data.verifyToken}
              </div>
            </div>

            <div className="flex gap-4 pt-2">
                <button onClick={prev} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Atrás</button>
                <button 
                onClick={() => onComplete(data)}
                className="flex-[3] py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-[1.02] active:scale-[0.98] text-white font-bold rounded-xl shadow-xl transition-all flex items-center justify-center gap-2"
                >
                🚀 Finalizar y Conectar Bot
                </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
