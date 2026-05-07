import React, { useEffect, useState } from 'react';
import { Bot, Zap, Shield, Target, ArrowRight, MessageSquare, Globe, Cpu, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [lang, setLang] = useState('es');
  
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'onyx');
  }, []);

  const handleEnter = () => navigate('/login');
  
  const content = {
    es: {
      nav: ['Infraestructura', 'Soluciones', 'Casos'],
      access: 'Acceso Master',
      badge: 'Sistema Operativo V5.0 — Online',
      h1: ['Infraestructura Universal de', 'Comunicación IA'],
      p: 'ALEX IO no es un bot. Es el primer sistema nervioso digital para empresas que integra Cascada Neural y Memoria Dual para automatizar ventas complejas.',
      cta: 'Iniciar Despliegue',
      doc: 'Ver Documentación',
      stats: [
        { label: 'Precisión AI', value: '98.4%', sub: 'Cascada 3.0' },
        { label: 'Uptime', value: '99.99%', sub: 'SRE Shield' },
        { label: 'Latencia', value: '1.2s', sub: 'Edge Compute' },
        { label: 'Leads Gen', value: '1M+', sub: 'Global scale' }
      ],
      features: [
        { title: 'Cascada Neural', desc: 'Orquestación inteligente entre 5 modelos (Gemini, GPT, Claude, DeepSeek, MiniMax) para máxima precisión y costo optimizado.' },
        { title: 'Compliance Shield', desc: 'Auditoría en tiempo real de cada mensaje para asegurar que tu marca nunca rompa protocolos de comunicación.' },
        { title: 'Memoria Dual', desc: 'Contexto persistente que recuerda a cada usuario a través de canales, creando experiencias hiper-personalizadas.' }
      ]
    },
    en: {
      nav: ['Infrastructure', 'Solutions', 'Cases'],
      access: 'Master Access',
      badge: 'Operating System V5.0 — Online',
      h1: ['Universal Infrastructure for', 'AI Communication'],
      p: 'ALEX IO is not a bot. It is the first digital nervous system for businesses that integrates Neural Cascade and Dual Memory to automate complex sales.',
      cta: 'Start Deployment',
      doc: 'View Docs',
      stats: [
        { label: 'AI Accuracy', value: '98.4%', sub: 'Cascade 3.0' },
        { label: 'Uptime', value: '99.99%', sub: 'SRE Shield' },
        { label: 'Latency', value: '1.2s', sub: 'Edge Compute' },
        { label: 'Leads Gen', value: '1M+', sub: 'Global scale' }
      ],
      features: [
        { title: 'Neural Cascade', desc: 'Intelligent orchestration between 5 models (Gemini, GPT, Claude, DeepSeek, MiniMax) for maximum accuracy and cost optimization.' },
        { title: 'Compliance Shield', desc: 'Real-time message auditing to ensure your brand never breaks communication protocols.' },
        { title: 'Dual Memory', desc: 'Persistent context that remembers every user across channels, creating hyper-personalized experiences.' }
      ]
    }
  };

  const t = content[lang];
  const calendlyLink = "https://calendly.com/alex-io-systems/30min";

  return (
    <div className="landing-root min-h-screen bg-[#08080D] text-white font-['Instrument_Sans'] overflow-x-hidden">
      <style>{`
        :root {
          --gold: #C5A028;
          --gold2: #D4B03A;
          --gold-glow: rgba(197, 160, 40, 0.35);
          --ff: 'Playfair Display', serif;
        }
        .hero-gradient {
          background: radial-gradient(circle at 50% 50%, rgba(197, 160, 40, 0.1) 0%, transparent 70%);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gold-text {
          background: linear-gradient(135deg, #C5A028 0%, #E8C84A 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-8 py-6 flex justify-between items-center glass-card border-t-0 border-x-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--gold)] rounded-xl flex items-center justify-center shadow-lg shadow-gold-500/20">
            <Bot size={24} className="text-[#08080D]" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic">ALEX <span className="text-[var(--gold)]">IO</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10 text-sm font-bold uppercase tracking-widest text-slate-400">
          {t.nav.map((item, i) => (
            <a key={i} href="#" className="hover:text-white transition-colors">{item}</a>
          ))}
          <button 
            onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
            className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-all"
          >
            <Languages size={14} />
            <span className="text-[10px]">{lang.toUpperCase()}</span>
          </button>
        </div>
        <button 
          onClick={handleEnter}
          className="px-8 py-3 bg-[var(--gold)] hover:bg-[#D4B03A] text-[#08080D] rounded-xl font-black uppercase tracking-widest transition-all shadow-xl shadow-gold-500/20 active:scale-95"
        >
          {t.access}
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-8 flex flex-col items-center text-center hero-gradient">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 mb-10">
          <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{t.badge}</span>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black mb-8 tracking-tighter italic max-w-5xl leading-[0.9]" style={{ fontFamily: 'var(--ff)' }}>
          {t.h1[0]} <span className="gold-text">{t.h1[1]}</span>
        </h1>
        
        <p className="text-xl text-slate-400 max-w-2xl mb-12 leading-relaxed">
          {t.p}
        </p>

        <div className="flex flex-col sm:flex-row gap-6">
          <button 
            onClick={handleEnter}
            className="px-12 py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest flex items-center gap-3 hover:bg-[var(--gold)] hover:text-white transition-all group"
          >
            {t.cta}
            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
          </button>
          <a 
            href={calendlyLink} target="_blank" rel="noopener noreferrer"
            className="px-12 py-5 glass-card rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center"
          >
            {t.doc}
          </a>
        </div>

        {/* Dashboard Preview */}
        <div className="mt-20 w-full max-w-6xl relative animate-float">
          <div className="absolute -inset-4 bg-[var(--gold)]/20 blur-3xl rounded-full opacity-30" />
          <div className="relative glass-card rounded-[3rem] p-4 overflow-hidden shadow-2xl border-white/10">
             <div className="w-full aspect-video bg-slate-900/80 rounded-[2.5rem] flex items-center justify-center border border-white/5 overflow-hidden">
                <img src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop" alt="Dashboard Preview" className="w-full h-full object-cover opacity-50 mix-blend-overlay" />
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="p-10 text-center">
                        <Cpu size={64} className="text-[var(--gold)] mb-6 mx-auto animate-pulse" />
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter">Neural Command Center</h3>
                    </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-8 max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {t.stats.map((stat, i) => (
          <div key={i} className="text-center group hover:scale-105 transition-transform">
            <div className="text-5xl font-black mb-2 italic gold-text">{stat.value}</div>
            <div className="text-xs font-black uppercase tracking-widest text-white mb-1">{stat.label}</div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">{stat.sub}</div>
          </div>
        ))}
      </section>

      {/* Features */}
      <section className="py-32 px-8 bg-white/2">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-black mb-20 tracking-tighter italic text-center uppercase">Tech <span className="gold-text">Infrastructure</span></h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {t.features.map((f, i) => (
              <div key={i} className="p-12 glass-card rounded-[3rem] hover:border-[var(--gold)]/50 transition-all group">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-[var(--gold)] mb-8 group-hover:scale-110 transition-transform">
                  {i === 0 ? <Zap size={32} /> : i === 1 ? <Shield size={32} /> : <Globe size={32} />}
                </div>
                <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter italic">{f.title}</h3>
                <p className="text-slate-400 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-white/5 text-center">
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-8 h-8 bg-[var(--gold)] rounded-lg flex items-center justify-center">
            <Bot size={20} className="text-[#08080D]" />
          </div>
          <span className="text-xl font-black tracking-tighter italic">ALEX <span className="text-[var(--gold)]">IO</span></span>
        </div>
        <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.4em]">© 2026 ALEX IO SYSTEMS — ALL RIGHTS RESERVED</p>
      </footer>
    </div>
  );
};

export default LandingPage;
