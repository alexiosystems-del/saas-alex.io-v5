import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Globe, MessageSquare, ArrowRight, 
  Moon, Sun, Play, CheckCircle, Smartphone, 
  Bot, Award, ZapOff, Sparkles, Languages
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('onyx'); // 'onyx' or 'silver'
  const [billing, setBilling] = useState('monthly');
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([
    { from: 'bot', text: 'Bienvenido a la nueva era del comercio cognitivo. Soy ALEX. ¿Cómo puedo elevar tu negocio hoy?' },
  ]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);

  // Toggle theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'onyx' ? 'silver' : 'onyx');

  const plans = [
    {
      name: 'Essential',
      price: 97,
      desc: 'El primer paso hacia la autonomía.',
      features: ['1 Agente Cognitivo', '1.000 Mensajes de alta fidelidad', '1 Canal de entrada', 'Soporte Silver'],
    },
    {
      name: 'Enterprise',
      price: 197,
      desc: 'Potencia absoluta para negocios en crecimiento.',
      features: ['5 Agentes Cognitivos', '10.000 Mensajes', 'Multicanal unificado', 'Auto-healing SRE', 'Soporte Gold 24/7'],
      highlight: true,
    },
    {
      name: 'Prestige',
      price: 397,
      desc: 'Infraestructura de ultra-lujo sin límites.',
      features: ['Agentes ilimitados', 'Cognición RAG avanzada', 'Onboarding de guante blanco', 'SLA de grado bancario'],
    },
  ];

  const sendMessage = async () => {
    if (!msg.trim()) return;
    const userMsg = { from: 'user', text: msg };
    setChat(prev => [...prev, userMsg]);
    setMsg('');
    setTyping(true);

    try {
      const response = await fetch('/api/webhooks/webchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'landing_' + Math.random().toString(36).substring(7),
          text: userMsg.text,
          metadata: { isLanding: true }
        })
      });
      const data = await response.json();
      if (data?.reply) setChat(prev => [...prev, { from: 'bot', text: data.reply }]);
    } catch (err) {
      setChat(prev => [...prev, { from: 'bot', text: 'Estoy procesando una actualización profunda. Intenta de nuevo en un momento.' }]);
    } finally {
      setTyping(false);
    }
  };

  return (
    <div className="min-h-screen transition-colors duration-700 bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-gold)] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-sidebar backdrop-blur-xl border-b border-[var(--border)] px-6 py-4 flex justify-between items-center transition-all duration-700">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-title)' }}
        >
          ALEX <span className="text-[var(--accent-gold)] italic">IO</span>
        </motion.div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-widest">
          {['Arquitectura', 'Canales', 'Elite', 'Inversión'].map(item => (
            <a key={item} href={`#${item.toLowerCase()}`} className="hover:text-[var(--accent-gold)] transition-colors duration-300">
              {item}
            </a>
          ))}
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-[var(--glass-bg-hover)] transition-all duration-500 text-[var(--accent-gold)]"
          >
            {theme === 'onyx' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-6 py-2 border border-[var(--accent-gold)] rounded-full text-[var(--accent-gold)] hover:bg-[var(--accent-gold)] hover:text-white transition-all duration-500 font-bold"
          >
            ENTRAR
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 max-w-7xl mx-auto text-center overflow-hidden">
        {/* Animated Orbs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
          <div className="absolute top-10 left-1/4 w-64 h-64 bg-[var(--accent-gold)] rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-[var(--accent-gold)] rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[var(--accent-gold)] text-[var(--accent-gold)] text-xs font-bold tracking-[0.2em] mb-8 bg-[var(--glass-bg)]">
            <Sparkles size={14} /> EL ESTÁNDAR DE ORO EN IA EMPRESARIAL
          </span>
          <h1 className="text-6xl md:text-8xl font-bold leading-[1.05] mb-8" style={{ fontFamily: 'var(--font-title)' }}>
            Tu empresa opera en el <br />
            <span className="text-[var(--accent-gold)] italic">silencio de la perfección.</span>
          </h1>
          <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto mb-12 font-light leading-relaxed">
            Arquitectura cognitiva de alta fidelidad diseñada para marcas que exigen autonomía absoluta, 
            traducción en tiempo real y una experiencia de cliente sin fricciones.
          </p>

          <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => navigate('/login')}
              className="px-10 py-5 bg-[var(--accent-gold)] text-white rounded-full font-bold text-lg hover:scale-105 transition-all duration-500 shadow-[0_0_40px_rgba(197,160,40,0.3)] flex items-center gap-3"
            >
              INICIAR ASCENSIÓN <ArrowRight size={20} />
            </button>
            <button 
              className="px-10 py-5 glass-btn-ghost rounded-full font-bold text-lg border border-[var(--border)] hover:bg-[var(--glass-bg-hover)] transition-all duration-500 flex items-center gap-3"
            >
              SOLICITAR DEMO <Play size={20} />
            </button>
          </div>
        </motion.div>
      </section>

      {/* Metrics Section */}
      <section className="py-20 px-6 border-y border-[var(--border)] bg-[var(--glass-bg)]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { value: '+60%', label: 'Conversión de Leads' },
            { value: '24/7', label: 'Operación Autónoma' },
            { value: '99.9%', label: 'Uptime Cognitivo' },
            { value: '12', label: 'Mercados Globales' },
          ].map((m, i) => (
            <motion.div 
              key={m.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="text-4xl md:text-5xl font-bold text-[var(--accent-gold)] mb-2" style={{ fontFamily: 'var(--font-title)' }}>{m.value}</div>
              <div className="text-xs font-bold tracking-widest text-[var(--text-secondary)] uppercase">{m.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-title)' }}>Insignias del Sistema</h2>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">Tecnología de vanguardia para líderes que no aceptan menos que la excelencia operativa.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            { icon: <Languages size={32} />, title: 'Cognición Políglota', desc: 'Traducción fluida en 12 idiomas con detección automática de intención y dialecto.' },
            { icon: <ZapOff size={32} />, title: 'Auto-Healing SRE', desc: 'Sistemas con resiliencia activa: si una API externa falla, ALEX se recupera sin intervención.' },
            { icon: <Shield size={32} />, title: 'Seguridad de Elite', desc: 'Encriptación de grado militar y cumplimiento de privacidad para datos sensibles de clientes.' },
            { icon: <Bot size={32} />, title: 'Agentes Multimodales', desc: 'Desde voz hasta texto y archivos, ALEX comprende y procesa cualquier flujo de información.' },
            { icon: <Globe size={32} />, title: 'Despliegue Global', desc: 'Operación en WhatsApp, TikTok, Discord y más, unificada bajo un solo centro de mando.' },
            { icon: <Award size={32} />, title: 'Calidad Premium', desc: 'Entrenamiento específico por industria para garantizar un tono de marca impecable.' },
          ].map((f, i) => (
            <div key={f.title} className="glass-card p-10 border border-[var(--border)] hover:border-[var(--accent-gold)] transition-all duration-500">
              <div className="text-[var(--accent-gold)] mb-6">{f.icon}</div>
              <h3 className="text-xl font-bold mb-4" style={{ fontFamily: 'var(--font-title)' }}>{f.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing / Investment */}
      <section id="inversión" className="py-32 px-6 bg-[var(--bg-secondary)] transition-colors duration-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6" style={{ fontFamily: 'var(--font-title)' }}>Inversión en Crecimiento</h2>
            <div className="flex justify-center items-center gap-4 text-sm font-bold tracking-widest">
              <span className={billing === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>MENSUAL</span>
              <button 
                onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                className="w-12 h-6 bg-[var(--accent-gold)] rounded-full relative p-1"
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${billing === 'annual' ? 'translate-x-6' : 'translate-x-0'}`} />
              </button>
              <span className={billing === 'annual' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}>ANUAL (SAVE 20%)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((p, i) => (
              <div key={p.name} className={`relative p-10 rounded-3xl transition-all duration-500 ${p.highlight ? 'bg-[var(--bg-primary)] shadow-2xl scale-105 border-2 border-[var(--accent-gold)]' : 'bg-[var(--glass-bg)] border border-[var(--border)]'}`}>
                {p.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[var(--accent-gold)] text-white px-4 py-1 rounded-full text-xs font-bold">MÁS ELEGIDO</div>}
                <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'var(--font-title)' }}>{p.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm mb-8 h-10">{p.desc}</p>
                <div className="text-5xl font-bold mb-8" style={{ fontFamily: 'var(--font-title)' }}>
                  ${billing === 'monthly' ? p.price : Math.round(p.price * 0.8)}
                  <span className="text-sm font-normal text-[var(--text-secondary)]">/mes</span>
                </div>
                <ul className="space-y-4 mb-12">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-3 text-sm">
                      <CheckCircle size={16} className="text-[var(--accent-gold)]" /> {f}
                    </li>
                  ))}
                </ul>
                <button className={`w-full py-4 rounded-full font-bold transition-all duration-500 ${p.highlight ? 'bg-[var(--accent-gold)] text-white hover:shadow-[0_0_20px_rgba(197,160,40,0.4)]' : 'border border-[var(--border)] hover:border-[var(--accent-gold)]'}`}>
                  SELECCIONAR
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto flex flex-col md:row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <div className="text-3xl font-bold mb-4" style={{ fontFamily: 'var(--font-title)' }}>
              ALEX <span className="text-[var(--accent-gold)] italic">IO</span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm max-w-xs">Arquitectos de negocios y ventas impulsados por inteligencia cognitiva.</p>
          </div>
          
          <div className="flex gap-12 text-xs font-bold tracking-[0.2em] text-[var(--text-secondary)]">
            <a href="#" className="hover:text-[var(--accent-gold)]">PRIVACIDAD</a>
            <a href="#" className="hover:text-[var(--accent-gold)]">TÉRMINOS</a>
            <a href="#" className="hover:text-[var(--accent-gold)]">SOPORTE</a>
          </div>

          <div className="text-[var(--text-secondary)] text-xs">
            © {new Date().getFullYear()} ALEX IO SYSTEMS. DISEÑADO PARA EL ÉXITO.
          </div>
        </div>
      </footer>

      {/* Global CSS for themes */}
      <style>{`
        [data-theme="onyx"] .glass-sidebar { background: rgba(8, 8, 8, 0.8); }
        [data-theme="silver"] .glass-sidebar { background: rgba(226, 232, 240, 0.8); }
      `}</style>
    </div>
  );
};

export default LandingPage;
