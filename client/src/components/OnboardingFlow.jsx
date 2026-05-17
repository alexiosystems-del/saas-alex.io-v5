import React, { useState } from 'react';
import { 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  Bot, 
  Zap, 
  Shield, 
  Rocket,
  Globe,
  Sparkles
} from 'lucide-react';

const OnboardingFlow = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const steps = [
    {
      id: 1,
      title: "Bienvenido al Futuro",
      subtitle: "La inteligencia artificial autónoma que transforma tu negocio.",
      icon: <Sparkles className="text-blue-400" size={48} />,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Bot size={20} />
              </div>
              <p className="text-sm text-slate-300">Crea agentes que entienden el contexto real de tus clientes.</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Globe size={20} />
              </div>
              <p className="text-sm text-slate-300">Multicanal nativo: WhatsApp, Instagram, Facebook y más.</p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Shield size={20} />
              </div>
              <p className="text-sm text-slate-300">Seguridad Enterprise con monitoreo de calidad por IA.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "Configuración Rápida",
      subtitle: "Preparamos tu entorno para la escala.",
      icon: <Zap className="text-amber-400" size={48} />,
      content: (
        <div className="space-y-6 text-center">
          <div className="p-8 bg-slate-900/50 rounded-[2rem] border border-white/5">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Rocket className="text-blue-500 animate-bounce" size={64} />
                <div className="absolute inset-0 blur-2xl bg-blue-500/20 rounded-full" />
              </div>
            </div>
            <h4 className="text-xl font-bold text-white mb-2">Instancia Neural Listas</h4>
            <p className="text-slate-400 text-sm">Tu espacio de trabajo multi-tenant ha sido provisionado. Estás a un clic de conectar tu primer canal.</p>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "Listo para el Despegue",
      subtitle: "Tu viaje comercial impulsado por IA comienza ahora.",
      icon: <CheckCircle2 className="text-emerald-400" size={48} />,
      content: (
        <div className="space-y-8 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-emerald-500/5 rounded-3xl border border-emerald-500/10 text-center">
              <p className="text-2xl font-black text-emerald-400">0%</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Error Rate</p>
            </div>
            <div className="p-6 bg-blue-500/5 rounded-3xl border border-blue-500/10 text-center">
              <p className="text-2xl font-black text-blue-400">24/7</p>
              <p className="text-[10px] uppercase font-bold text-slate-500 tracking-widest mt-1">Availability</p>
            </div>
          </div>
          <p className="text-center text-slate-400 text-sm leading-relaxed px-4">
            "El éxito no es automático, pero con ALEX IO, está automatizado." 
            <br />
            <span className="text-[10px] text-slate-600 italic">- AI Core V5</span>
          </p>
        </div>
      )
    }
  ];

  const currentStep = steps[step - 1];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-white selection:bg-blue-500/30">
      <div className="flex-1 overflow-y-auto px-8 py-12 flex flex-col items-center">
        <div className="mb-10 p-5 bg-white/5 rounded-3xl border border-white/5 shadow-2xl">
          {currentStep.icon}
        </div>
        <h2 className="text-3xl font-black text-center tracking-tight text-glow">{currentStep.title}</h2>
        <p className="text-slate-400 text-center mt-3 text-lg font-medium max-w-sm mx-auto">{currentStep.subtitle}</p>
        
        <div className="w-full mt-12 max-w-md">
          {currentStep.content}
        </div>
      </div>

      <div className="p-10 border-t border-white/5 bg-slate-900/50 backdrop-blur-xl">
        <div className="max-w-md mx-auto flex items-center justify-between gap-6">
          <button 
            onClick={() => setStep(s => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`flex items-center gap-2 font-bold transition-all ${step === 1 ? 'opacity-0' : 'text-slate-500 hover:text-white'}`}
          >
            <ChevronLeft size={20} />
            Atrás
          </button>

          <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-blue-500' : 'bg-slate-800'}`} />
            ))}
          </div>

          {step < totalSteps ? (
            <button 
              onClick={() => setStep(s => Math.min(totalSteps, s + 1))}
              className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20"
            >
              Siguiente
              <ChevronRight size={20} />
            </button>
          ) : (
            <button 
              onClick={onComplete}
              className="flex items-center gap-2 px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-emerald-600/20"
            >
              Comenzar Ahora
              <Rocket size={20} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
