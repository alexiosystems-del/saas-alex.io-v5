import React from 'react';
import { 
  CreditCard, 
  Check, 
  Zap, 
  Shield, 
  Globe, 
  Layers 
} from 'lucide-react';

const BillingTab = () => {
  const plans = [
    {
      name: 'Starter',
      price: '$99',
      description: 'Ideal para pequeños negocios que quieren automatizar su atención.',
      features: ['Onboarding Wizard Básico', 'Hasta 5,000 msgs/mes', '1 Agente AI', 'WhatsApp QR (Baileys)'],
      color: 'blue'
    },
    {
      name: 'Gold Enterprise',
      price: '$499',
      description: 'La máquina de ventas completa con IA profunda y RAG.',
      features: ['Onboarding Wizard Premium', 'RAG (Memoria de Negocio)', 'CRM Pro + Lead Scoring', 'Meta Cloud API Integrada', 'Traducción en Vivo'],
      color: 'amber',
      popular: true
    },
    {
      name: 'Whitelabel SRE',
      price: '$999',
      description: 'Solución marca blanca para agencias y grandes empresas.',
      features: ['Todo lo de Gold', 'Marca Blanca (Tu Dominio)', 'Soporte SRE 24/7', 'API de Alta Prioridad', 'Modelos Personalizados'],
      color: 'indigo'
    }
  ];

  return (
    <div className="p-8 space-y-12 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h2 className="text-4xl font-bold text-white tracking-tight">Scale your Intelligence</h2>
        <p className="text-slate-400 mt-4 text-lg">Choose the fuel for your growth. Upgrade or manage your subscription.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {plans.map((plan, i) => (
          <div key={i} className={`relative bg-slate-900 border ${plan.popular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/10' : 'border-white/5'} p-8 rounded-3xl transition-transform hover:scale-[1.02]`}>
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full">
                Most Popular
              </div>
            )}
            
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-white">{plan.name}</h3>
              <div className="flex items-baseline mt-4">
                <span className="text-5xl font-black text-white">{plan.price}</span>
                <span className="text-slate-500 ml-2">/month</span>
              </div>
              <p className="text-slate-400 mt-4 text-sm leading-relaxed">{plan.description}</p>
            </div>

            <div className="space-y-4 mb-10">
              {plan.features.map((feature, j) => (
                <div key={j} className="flex items-center gap-3">
                  <div className={`p-1 rounded-full bg-${plan.color}-500/10 text-${plan.color}-400`}>
                    <Check size={14} />
                  </div>
                  <span className="text-sm text-slate-300">{feature}</span>
                </div>
              ))}
            </div>

            <button className={`w-full py-4 rounded-2xl font-bold transition-all ${
              plan.popular 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
            }`}>
              {plan.popular ? 'Go Enterprise Now' : 'Get Started'}
            </button>
          </div>
        ))}
      </div>

      <div className="bg-slate-900/50 border border-white/5 p-6 rounded-3xl max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800 rounded-2xl text-blue-400">
            <Shield size={24} />
          </div>
          <div>
            <h4 className="text-white font-bold">Secure Billing by Stripe</h4>
            <p className="text-xs text-slate-500">Your data and payments are protected by 256-bit encryption.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" alt="Stripe" className="h-6 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer" />
        </div>
      </div>
    </div>
  );
};

export default BillingTab;
