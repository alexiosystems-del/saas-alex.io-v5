import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Shield, Globe, MessageSquare, ArrowRight, 
  Moon, Sun, Play, CheckCircle, Smartphone, 
  Bot, Award, ZapOff, Sparkles, Languages,
  Cpu, Repeat, TrendingUp, Users, Layers,
  Instagram, Facebook, MessageCircle, Music2, Share2,
  Calendar, CheckCircle2, AlertCircle, PhoneCall
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('onyx'); // 'onyx' or 'silver'
  const [billing, setBilling] = useState('monthly');
  const [demoStep, setDemoStep] = useState(-1); // -1: Not started, 0-5: Questions, 6: Success
  const [demoData, setDemoData] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Toggle theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'onyx' ? 'silver' : 'onyx');

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  // Demo Logic
  const demoQuestions = [
    { id: 'vendes', text: "¡Hola! Soy ALEX. Empecemos el diagnóstico. ¿Qué vendes exactamente?", placeholder: "Ej: Software, Cursos, Ropa..." },
    { id: 'ticket', text: "¿Cuál es tu ticket promedio de venta? (en USD)", placeholder: "Ej: 100" },
    { id: 'canal', text: "¿Cuál es tu canal principal de atención hoy?", placeholder: "Ej: WhatsApp, Instagram..." },
    { id: 'volumen', text: "¿Cuántos leads recibes al mes aproximadamente?", placeholder: "Ej: 500" },
    { id: 'objecion', text: "¿Cuál es la objeción principal que te dan tus clientes?", placeholder: "Ej: Es caro, lo voy a pensar..." },
    { id: 'llamada', text: "Perfecto. Estamos listos para escalar. ¿Tienes disponibilidad para una llamada de diagnóstico mañana?", placeholder: "Ej: Sí, a las 10am" }
  ];

  const handleDemoNext = (val) => {
    if (!val) return;
    const currentQ = demoQuestions[demoStep];
    setDemoData(prev => ({ ...prev, [currentQ.id]: val }));
    
    setIsTyping(true);
    setTimeout(() => {
      setDemoStep(prev => prev + 1);
      setIsTyping(false);
    }, 1000);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [demoStep, isTyping]);

  return (
    <div className="min-h-screen transition-colors duration-700 bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-[var(--accent-gold)] selection:text-white overflow-x-hidden">
      
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-50 glass backdrop-blur-xl border-b border-[var(--border)] px-6 py-4 flex justify-between items-center transition-all duration-700">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-2xl font-bold tracking-tighter flex items-center gap-2 cursor-pointer"
          style={{ fontFamily: 'var(--font-title)' }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div className="w-8 h-8 bg-[var(--accent-gold)] rounded-lg flex items-center justify-center text-white rotate-12">A</div>
          ALEX <span className="text-[var(--accent-gold)] italic">IO</span>
        </motion.div>

        <div className="hidden lg:flex items-center gap-8 text-[10px] font-bold uppercase tracking-[0.2em]">
          {[
            { label: 'Canales', id: 'canales' },
            { label: 'Arquitectura Elite', id: 'arquitectura' },
            { label: 'Inversión', id: 'inversion' },
            { label: 'Roadmap v2', id: 'roadmap' }
          ].map(item => (
            <button 
              key={item.id} 
              onClick={() => scrollToSection(item.id)}
              className="hover:text-[var(--accent-gold)] transition-colors duration-300"
            >
              {item.label}
            </button>
          ))}
          
          <div className="flex items-center gap-4 border-l border-[var(--border)] pl-8">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-[var(--glass-bg-hover)] transition-all duration-500 text-[var(--accent-gold)]"
            >
              {theme === 'onyx' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 border border-[var(--accent-gold)] rounded-full text-[var(--accent-gold)] hover:bg-[var(--accent-gold)] hover:text-white transition-all duration-500 font-bold"
            >
              DEMO
            </button>
            <button 
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-[var(--accent-gold)] text-white rounded-full hover:shadow-[0_0_20px_var(--accent-gold-glow)] transition-all duration-500 font-bold"
            >
              ACTIVAR ALEX IO
            </button>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="relative pt-52 pb-32 px-6 max-w-7xl mx-auto text-center">
        {/* Orbs Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[var(--accent-gold)] opacity-[0.03] blur-[150px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-[var(--accent-gold)] opacity-[0.05] blur-[180px] animate-pulse" style={{ animationDelay: '2s' }} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[var(--accent-gold)] text-[var(--accent-gold)] text-[10px] font-black tracking-[0.3em] mb-10 bg-[var(--glass-bg)] uppercase">
            <Zap size={14} className="fill-current" /> La Nueva Frontera del Cierre Automático
          </div>
          
          <h1 className="text-5xl md:text-8xl font-black leading-[0.95] mb-10 tracking-tight" style={{ fontFamily: 'var(--font-title)' }}>
            Cada mensaje que no respondes es <br />
            <span className="text-[var(--accent-gold)] italic underline decoration-1 underline-offset-8">dinero perdido.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto mb-16 font-medium leading-snug">
            ALEX IO responde, califica y convierte clientes automáticamente en WhatsApp y redes sociales, 24/7.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-20">
            {[
              { icon: <Repeat size={20} />, text: "Respuestas en segundos" },
              { icon: <TrendingUp size={20} />, text: "Seguimiento automático" },
              { icon: <Users size={20} />, text: "Más ventas sin contratar equipo" },
              { icon: <Languages size={20} />, text: "IA multilingüe con contexto" }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-3 p-6 glass-card border border-[var(--border)] group hover:border-[var(--accent-gold)] transition-all">
                <div className="text-[var(--accent-gold)] group-hover:scale-110 transition-transform">{item.icon}</div>
                <span className="text-[11px] font-bold uppercase tracking-widest leading-tight">{item.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => navigate('/login')}
              className="w-full sm:w-auto px-12 py-6 bg-[var(--accent-gold)] text-white rounded-2xl font-black text-xl hover:scale-105 transition-all duration-500 shadow-[0_20px_40px_rgba(197,160,40,0.25)] flex items-center justify-center gap-4"
            >
              ACTIVAR ALEX IO <ArrowRight size={24} />
            </button>
            <button 
              onClick={() => scrollToSection('demo')}
              className="w-full sm:w-auto px-12 py-6 glass-card rounded-2xl font-black text-xl border border-[var(--border)] hover:bg-[var(--glass-bg-hover)] transition-all duration-500 flex items-center justify-center gap-4"
            >
              VER DEMO EN VIVO <Play size={24} className="fill-current" />
            </button>
          </div>

          <p className="mt-10 text-[var(--text-secondary)] text-sm font-bold tracking-widest uppercase opacity-50">
            Configuración en minutos. Sin código.
          </p>
        </motion.div>
      </section>

      {/* ─── PROBLEMA SECTION ─── */}
      <section className="py-32 px-6 bg-[var(--bg-secondary)]/30 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
          <div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 leading-tight">
              Esto ya está pasando <br />
              <span className="text-[var(--accent-gold)]">en tu negocio:</span>
            </h2>
            <div className="space-y-6">
              {[
                "Te escriben y no respondes a tiempo",
                "Respondes tarde y se van",
                "No haces seguimiento y no compran"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-4 p-4 glass rounded-xl border-l-4 border-[var(--accent-gold)]">
                  <AlertCircle className="text-[var(--accent-gold)] shrink-0" size={24} />
                  <span className="text-lg font-bold">{text}</span>
                </div>
              ))}
            </div>
            <p className="mt-12 text-3xl font-black text-[var(--text-primary)]">
              Cada conversación perdida = <br />
              <span className="text-red-500 italic">ingreso perdido.</span>
            </p>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-[var(--accent-gold)] opacity-10 blur-3xl rounded-full" />
            <div className="relative glass-card p-2 border border-[var(--border)] overflow-hidden rounded-[32px] shadow-2xl">
              <div className="bg-[#050510] aspect-video flex items-center justify-center text-[var(--text-secondary)] font-mono text-xs">
                {/* Simulated Error Logs */}
                <div className="p-8 space-y-2 w-full">
                  <div className="text-red-400 opacity-80">[10:02:45] Lead "Juan Pérez" connected via WhatsApp</div>
                  <div className="text-yellow-400 opacity-60">[10:05:00] Waiting for response...</div>
                  <div className="text-yellow-400 opacity-40">[10:15:00] Still waiting...</div>
                  <div className="text-red-500 font-bold">[10:20:00] ALERT: Lead Juan Pérez marked as LOST (No response)</div>
                  <div className="pt-4 text-cyan-400 animate-pulse underline">$500 potential revenue vanished.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOLUCIÓN SECTION ─── */}
      <section className="py-40 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-black mb-8">
            ALEX IO convierte conversaciones <br />
            en <span className="text-[var(--accent-gold)]">ventas automáticamente.</span>
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium">
            No es un chatbot rígido. Es una capa operativa de IA que:
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {[
            { title: "Entiende Intención", desc: "No solo lee palabras, interpreta el deseo real del cliente.", icon: <Zap /> },
            { title: "Responde con Contexto", desc: "Usa la historia de la conversación para respuestas precisas.", icon: <Layers /> },
            { title: "Guía al Cierre", desc: "Empuja al cliente hacia la compra o agendamiento de forma natural.", icon: <Award /> },
            { title: "Recupera Leads", desc: "Seguimiento inteligente a quienes dejaron de responder.", icon: <Repeat /> }
          ].map((item, i) => (
            <div key={i} className="p-10 glass-card border border-[var(--border)] hover:border-[var(--accent-gold)] transition-all group">
              <div className="w-14 h-14 bg-[var(--accent-gold)]/10 rounded-2xl flex items-center justify-center text-[var(--accent-gold)] mb-8 group-hover:scale-110 transition-transform">
                {item.icon}
              </div>
              <h3 className="text-xl font-black mb-4 uppercase tracking-tighter">{item.title}</h3>
              <p className="text-[var(--text-secondary)] text-sm font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEMO SECTION (CHAT VIVO) ─── */}
      <section id="demo" className="py-32 px-6 bg-gradient-to-b from-transparent to-[var(--bg-secondary)]/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="px-4 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black tracking-widest uppercase mb-6 inline-block border border-green-500/20">
              Modo Cierre Activo (6 preguntas)
            </span>
            <h2 className="text-4xl md:text-6xl font-black mb-4">Prueba a ALEX en vivo</h2>
            <p className="text-[var(--text-secondary)] font-medium">En 6 interacciones, ALEX identifica tu potencial y empuja al cierre.</p>
          </div>

          <div className="glass-card border border-[var(--border)] overflow-hidden shadow-2xl max-w-2xl mx-auto">
            {/* Chat Header */}
            <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-primary)]/50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-[var(--accent-gold)] rounded-full flex items-center justify-center text-white font-black">A</div>
                <div>
                  <div className="text-sm font-black">ALEX IO — Agente AI</div>
                  <div className="text-[10px] text-green-500 font-bold flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> EN LINEA
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
                <div className="w-2 h-2 rounded-full bg-[var(--border)]" />
              </div>
            </div>

            {/* Chat Body */}
            <div className="h-[400px] overflow-y-auto p-6 space-y-6 bg-[var(--bg-primary)]/20">
              {demoStep === -1 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                  <Bot size={48} className="text-[var(--accent-gold)] opacity-30" />
                  <button 
                    onClick={() => setDemoStep(0)}
                    className="px-8 py-4 bg-[var(--accent-gold)] text-white rounded-xl font-black uppercase tracking-widest hover:scale-105 transition-all"
                  >
                    INICIAR DEMO DE CIERRE
                  </button>
                </div>
              ) : (
                <>
                  {demoQuestions.slice(0, demoStep + 1).map((q, i) => (
                    <div key={i} className="space-y-4">
                      {/* Bot Message */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex gap-3 max-w-[80%]"
                      >
                        <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)] font-bold text-xs shrink-0">A</div>
                        <div className="p-4 rounded-2xl rounded-tl-none bg-[var(--glass-bg)] border border-[var(--border)] text-sm font-medium">
                          {q.text}
                        </div>
                      </motion.div>
                      
                      {/* User Message (If already answered) */}
                      {demoData[q.id] && (
                        <div className="flex justify-end">
                          <div className="p-4 rounded-2xl rounded-tr-none bg-[var(--accent-gold)] text-white text-sm font-bold shadow-lg shadow-[var(--accent-gold-glow)]">
                            {demoData[q.id]}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-[var(--accent-gold)]/20 flex items-center justify-center text-[var(--accent-gold)] font-bold text-xs shrink-0">A</div>
                      <div className="p-4 rounded-2xl rounded-tl-none bg-[var(--glass-bg)] border border-[var(--border)] flex gap-1">
                        <div className="w-1.5 h-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-[var(--accent-gold)] rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}

                  {demoStep === 6 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 bg-green-500/10 border border-green-500/20 rounded-3xl text-center space-y-4"
                    >
                      <CheckCircle2 size={48} className="mx-auto text-green-500" />
                      <h4 className="text-xl font-black">¡Diagnóstico Completado!</h4>
                      <p className="text-sm text-[var(--text-secondary)] font-medium">He calificado tu negocio como ELITE. Estás listo para escalar a 10k mensajes/mes con ALEX.</p>
                      <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-4 bg-green-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-green-500/20"
                      >
                        ACTIVAR AHORA
                      </button>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            {demoStep >= 0 && demoStep < 6 && (
              <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-primary)]/50">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleDemoNext(e.target.input.value);
                    e.target.reset();
                  }}
                  className="flex gap-3"
                >
                  <input 
                    name="input"
                    type="text" 
                    placeholder={demoQuestions[demoStep].placeholder}
                    className="flex-1 px-6 py-4 rounded-xl glass border border-[var(--border)] focus:border-[var(--accent-gold)] outline-none font-medium text-sm transition-all"
                    autoFocus
                  />
                  <button className="w-12 h-12 bg-[var(--accent-gold)] text-white rounded-xl flex items-center justify-center hover:scale-105 transition-all">
                    <ArrowRight size={20} />
                  </button>
                </form>
              </div>
            )}
          </div>
          
          <div className="mt-12 flex justify-center gap-6">
            <button 
              onClick={() => setDemoStep(-1)}
              className="text-[10px] font-black tracking-widest uppercase opacity-30 hover:opacity-100 transition-opacity"
            >
              Reiniciar Demo
            </button>
          </div>
        </div>
      </section>

      {/* ─── CANALES SECTION ─── */}
      <section id="canales" className="py-32 px-6 border-y border-[var(--border)]">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-16">Funciona donde están <br /><span className="text-[var(--accent-gold)]">tus clientes:</span></h2>
          
          <div className="grid grid-cols-2 md:grid-cols-6 gap-8">
            {[
              { icon: <MessageCircle />, name: "WhatsApp", color: "#25D366" },
              { icon: <Instagram />, name: "Instagram", color: "#E4405F" },
              { icon: <Facebook />, name: "Facebook", color: "#1877F2" },
              { icon: <Music2 />, name: "TikTok", color: "#000000" },
              { icon: <Share2 />, name: "Discord", color: "#5865F2" },
              { icon: <Globe />, name: "Webchat", color: "var(--accent-gold)" }
            ].map((channel, i) => (
              <div key={i} className="flex flex-col items-center gap-4 group">
                <div className="w-20 h-20 glass-card border border-[var(--border)] rounded-3xl flex items-center justify-center group-hover:scale-110 transition-transform duration-500 relative overflow-hidden">
                   <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity" style={{ backgroundColor: channel.color }} />
                   <div className="text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors scale-125">{channel.icon}</div>
                </div>
                <span className="text-xs font-black uppercase tracking-widest">{channel.name}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-20 p-8 glass-card border border-[var(--accent-gold)]/20 inline-block">
            <p className="text-lg font-black uppercase tracking-tighter">
              Un solo cerebro, <span className="text-[var(--accent-gold)]">múltiples canales,</span> misma conversación.
            </p>
          </div>
        </div>
      </section>

      {/* ─── ARQUITECTURA ELITE SECTION ─── */}
      <section id="arquitectura" className="py-40 px-6 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-[var(--accent-gold)] font-black tracking-[0.3em] uppercase text-[10px] mb-6 block">Ingeniería de Alta Fidelidad</span>
            <h2 className="text-4xl md:text-7xl font-black mb-8 leading-[0.9]">Arquitectura de ejecución para no caerse cuando más vendes.</h2>
            <p className="text-[var(--text-secondary)] text-lg mb-12 font-medium">Traducción en vivo, continuidad de servicio y resiliencia de respuesta.</p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {[
                "Failover inteligente",
                "Detección de idioma",
                "Memoria contextual",
                "RAG para respuestas",
                "Auto-healing operativo",
                "Observabilidad total"
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--accent-gold)]" />
                  <span className="text-sm font-bold uppercase tracking-widest">{item}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative">
            <div className="glass-card p-10 border border-[var(--border)] relative overflow-hidden">
               {/* Visual representation of architecture */}
               <div className="space-y-4">
                  {[
                    { label: "Canal Inbound", type: "success" },
                    { label: "Capa de Detección (Whisper/STT)", type: "process" },
                    { label: "Orquestador ALEX Brain", type: "core" },
                    { label: "Base de Conocimiento RAG", type: "data" },
                    { label: "Failover Layer (GPT-4/Claude/Gemini)", type: "process" },
                    { label: "Output Optimizado", type: "success" }
                  ].map((layer, i) => (
                    <div key={i} className={`p-4 border rounded-xl flex items-center justify-between font-mono text-[10px] uppercase tracking-widest ${
                      layer.type === 'core' ? 'border-[var(--accent-gold)] bg-[var(--accent-gold)]/10 text-[var(--accent-gold)] font-black' : 'border-[var(--border)] opacity-60'
                    }`}>
                      {layer.label}
                      <CheckCircle size={14} />
                    </div>
                  ))}
               </div>
               {/* Animated Pulse */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-[var(--accent-gold)]/20 rounded-full blur-3xl animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── INVERSIÓN SECTION ─── */}
      <section id="inversion" className="py-40 px-6 bg-[var(--bg-secondary)] transition-colors duration-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-8xl font-black mb-8 leading-[0.95]">Inversión en Crecimiento</h2>
            <div className="flex justify-center items-center gap-6 text-xs font-black tracking-[0.2em] uppercase">
              <span className={billing === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-50'}>Facturación Mensual</span>
              <button 
                onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                className="w-16 h-8 bg-[var(--accent-gold)] rounded-full relative p-1 transition-all"
              >
                <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-transform duration-500 ${billing === 'annual' ? 'translate-x-8' : 'translate-x-0'}`} />
              </button>
              <span className={billing === 'annual' ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)] opacity-50'}>Anual (Save 20%)</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: 'Essential',
                price: 97,
                desc: '1 agente IA • 1.000 msgs • 1 canal',
                features: ['Automatización base', 'Soporte vía Ticket', 'Dashboard Lite'],
                cta: 'EMPEZAR'
              },
              {
                name: 'Enterprise',
                price: 197,
                highlight: true,
                desc: '5 agentes IA • 10.000 msgs • Multicanal',
                features: ['CRM + Leads integrados', 'Auto-healing SRE', 'Asignación inteligente', 'Soporte Prioritario'],
                cta: 'ESCALAR AHORA'
              },
              {
                name: 'Prestige',
                price: 397,
                desc: 'Agentes ilimitados • Msgs escalables • Todo',
                features: ['Cognición RAG avanzada', 'Onboarding Guante Blanco', 'Soporte Premium 24/7', 'Account Manager'],
                cta: 'ACTIVAR TODO'
              }
            ].map((p, i) => (
              <div key={p.name} className={`relative p-12 rounded-[40px] transition-all duration-700 ${p.highlight ? 'bg-[#050510] text-white shadow-2xl scale-105 border-2 border-[var(--accent-gold)]' : 'glass-card border border-[var(--border)]'}`}>
                {p.highlight && <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-[var(--accent-gold)] text-white px-6 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase">Más Elegido</div>}
                
                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter" style={{ fontFamily: 'var(--font-title)' }}>{p.name}</h3>
                <p className={`text-sm mb-10 font-bold ${p.highlight ? 'text-gray-400' : 'text-[var(--text-secondary)]'}`}>{p.desc}</p>
                
                <div className="text-6xl font-black mb-12 tracking-tighter" style={{ fontFamily: 'var(--font-title)' }}>
                  <span className="text-2xl font-light opacity-50">$</span>
                  {billing === 'monthly' ? p.price : Math.round(p.price * 0.8)}
                  <span className="text-sm font-bold uppercase tracking-widest opacity-40"> /mes</span>
                </div>
                
                <ul className="space-y-6 mb-16">
                  {p.features.map(f => (
                    <li key={f} className="flex items-center gap-4 text-sm font-medium">
                      <CheckCircle2 size={18} className="text-[var(--accent-gold)]" /> {f}
                    </li>
                  ))}
                </ul>
                
                <button 
                  onClick={() => navigate('/login')}
                  className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all duration-500 ${
                    p.highlight ? 'bg-[var(--accent-gold)] text-white hover:shadow-[0_0_40px_var(--accent-gold-glow)]' : 'border border-[var(--border)] hover:border-[var(--accent-gold)] hover:text-[var(--accent-gold)]'
                  }`}
                >
                  {p.cta}
                </button>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-20">
            <p className="text-[var(--text-secondary)] text-sm font-black uppercase tracking-widest opacity-50">Empieza hoy. Cancela cuando quieras.</p>
          </div>
        </div>
      </section>

      {/* ─── ROADMAP SECTION ─── */}
      <section id="roadmap" className="py-40 px-6 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
          <div>
            <span className="text-[var(--accent-gold)] font-black tracking-[0.3em] uppercase text-[10px] mb-6 block">Visión 2026</span>
            <h2 className="text-5xl md:text-7xl font-black leading-[0.9]">Roadmap v2</h2>
          </div>
          <div className="text-right">
             <div className="text-sm font-black uppercase tracking-widest">Salida Objetivo</div>
             <div className="text-3xl font-black text-[var(--accent-gold)]">Fines de Octubre 2026</div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-12 relative">
           {/* Connecting Line */}
           <div className="hidden md:block absolute top-12 left-0 w-full h-[2px] bg-[var(--border)] z-0" />
           
           {[
             { phase: "Fase 1", weeks: "Semanas 1–2", title: "Cimientos adaptativos", items: ["Preferencias por usuario", "Logs de interacción", "Eventos de accesibilidad"] },
             { phase: "Fase 2", weeks: "Semanas 3–4", title: "Detection Layer", items: ["Whisper STT", "Detección de idioma", "Perfilado comportamiento"] },
             { phase: "Fase 3", weeks: "Semanas 5–6", title: "AIO Engine", items: ["Selector de formato", "Respuesta por contexto", "TTS premium"] },
             { phase: "Fase 4", weeks: "Semanas 7–8", title: "Lengua de señas", items: ["Hand Talk SDK", "ASL/LIBRAS/LSA", "Partner local"] }
           ].map((step, i) => (
             <div key={i} className="relative z-10 group">
                <div className="w-24 h-24 bg-[var(--bg-primary)] border border-[var(--border)] rounded-full flex items-center justify-center mb-10 group-hover:border-[var(--accent-gold)] transition-all duration-500 shadow-xl">
                   <div className="w-4 h-4 bg-[var(--accent-gold)] rounded-full group-hover:scale-150 transition-transform" />
                </div>
                <div className="text-[10px] font-black text-[var(--accent-gold)] tracking-widest uppercase mb-2">{step.phase} — {step.weeks}</div>
                <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">{step.title}</h3>
                <ul className="space-y-3 opacity-60">
                   {step.items.map(item => <li key={item} className="text-xs font-bold uppercase">• {item}</li>)}
                </ul>
             </div>
           ))}
        </div>
      </section>

      {/* ─── CIERRE / FOOTER ─── */}
      <section className="relative py-40 px-6 overflow-hidden bg-[#050510] text-white">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_50%,var(--accent-gold),transparent)]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <h2 className="text-5xl md:text-8xl font-black mb-12 leading-tight">
            ¿Cuántos clientes estás <br />
            <span className="text-[var(--accent-gold)] italic">perdiendo hoy?</span>
          </h2>
          <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-16 font-medium">
            Cada día sin ALEX IO es dinero que no vuelve. Automatiza conversación, seguimiento y cierre con una arquitectura lista para escalar.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
             <button 
                onClick={() => navigate('/login')}
                className="px-12 py-6 bg-[var(--accent-gold)] text-white rounded-2xl font-black text-xl hover:scale-105 transition-all shadow-[0_20px_40px_rgba(197,160,40,0.4)]"
             >
                ACTIVAR ALEX IO
             </button>
             <button 
                onClick={() => scrollToSection('demo')}
                className="px-12 py-6 border border-white/20 rounded-2xl font-black text-xl hover:bg-white/10 transition-all"
             >
                VER DEMO
             </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-40 pt-20 border-t border-white/5 flex flex-col md:row justify-between items-center gap-12 relative z-10">
          <div className="text-center md:text-left">
            <div className="text-3xl font-black tracking-tighter mb-4">
              ALEX <span className="text-[var(--accent-gold)] italic">IO</span>
            </div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest max-w-xs">
              Arquitectos de negocios y ventas impulsados por inteligencia cognitiva.
            </p>
          </div>
          
          <div className="flex gap-12 text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Términos</a>
            <a href="#" className="hover:text-white transition-colors">Soporte</a>
          </div>

          <div className="text-gray-600 text-[10px] font-black uppercase tracking-widest">
            © {new Date().getFullYear()} ALEX IO SYSTEMS. DISEÑADO PARA EL ÉXITO.
          </div>
        </div>
      </section>

      {/* Global Style Adjustments for the new V2 landing */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,900;1,900&family=Instrument+Sans:wght@400;600;700;800&display=swap');
        
        :root {
          --font-title: 'Playfair Display', serif;
          --font-body: 'Instrument Sans', sans-serif;
          --accent-gold: #C5A028;
          --accent-gold-glow: rgba(197, 160, 40, 0.4);
        }

        .glass {
          background: rgba(var(--glass-rgb, 255, 255, 255), 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        [data-theme="onyx"] {
          --glass-rgb: 0, 0, 0;
        }
        
        [data-theme="silver"] {
          --glass-rgb: 255, 255, 255;
        }

        .glass-card {
          background: var(--glass-bg);
          backdrop-filter: blur(40px);
          border: 1px solid var(--glass-border);
          border-radius: 32px;
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-card:hover {
          transform: translateY(-8px);
          border-color: var(--accent-gold);
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.25);
        }

        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: var(--bg-primary);
        }
        ::-webkit-scrollbar-thumb {
          background: var(--accent-gold);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;

