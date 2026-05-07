import React, { useState, useEffect } from 'react';

const LandingPage = () => {
  const [theme, setTheme] = useState('onyx');
  const [scrolled, setScrolled] = useState(false);
  const [step, setStep] = useState(-1);
  const [chatData, setChatData] = useState({});
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');

  const questions = [
    { id: 'vendes', text: '¡Hola! Soy ALEX. Estoy aquí para que no pierdas ni un cliente más. Para empezar: ¿Qué negocio o servicio vamos a escalar hoy?', ph: 'Ej: Mi agencia de marketing, mi clínica...' },
    { id: 'ticket', text: 'Entendido. Con ALEX IO, el retorno de inversión es masivo. ¿Cuál es el valor promedio de cada cliente que cierras?', ph: 'Ej: 500 USD' },
    { id: 'dolor', text: '¿Sientes que hoy se te escapan ventas por no responder a tiempo o por falta de seguimiento?', ph: 'Ej: Sí, pierdo muchos por WhatsApp...' },
    { id: 'volumen', text: 'El 80% de las ventas ocurren después del 5to seguimiento. ¿Cuántos interesados recibes al mes que hoy manejas manualmente?', ph: 'Ej: 200 personas' },
    { id: 'magia', text: 'Imagina a ALEX respondiendo en 2 segundos y haciendo seguimiento por 7 días seguidos. ¿Cuánto cambiaría tu facturación?', ph: 'Ej: Duplicaría mis ventas...' },
    { id: 'cta', text: 'Perfecto. He diseñado un plan de despliegue para ti. ¿Quieres ver cómo ALEX IO tomará el control de tus ventas hoy mismo?', ph: 'Ej: ¡Sí, quiero empezar!' }
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    document.documentElement.setAttribute('data-theme', theme);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === 'onyx' ? 'silver' : 'onyx';
    setTheme(newTheme);
  };

  const scroll2 = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const startDemo = () => {
    setStep(0);
    const firstQ = questions[0];
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages([{ type: 'bot', text: firstQ.text }]);
    }, 1000);
  };

  const sendMsg = () => {
    if (!inputValue.trim() || step === -1) return;
    
    const userMsg = inputValue.trim();
    setMessages(prev => [...prev, { type: 'user', text: userMsg }]);
    setChatData(prev => ({ ...prev, [questions[step].id]: userMsg }));
    setInputValue('');
    
    if (step < questions.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { type: 'bot', text: questions[nextStep].text }]);
      }, 1200);
    } else {
      setStep(questions.length); // Final state
    }
  };

  return (
    <div className="landing-root">
      <style>{`
        .landing-root {
          --gold: #C5A028;
          --gold2: #D4B03A;
          --gold3: #E8C84A;
          --gold-glow: rgba(197, 160, 40, 0.35);
          --gold-dim: rgba(197, 160, 40, 0.08);
          --gold-mid: rgba(197, 160, 40, 0.25);
          --ff: 'Playfair Display', Georgia, serif;
          --fb: 'Instrument Sans', sans-serif;
          --fm: 'DM Mono', monospace;
          background: var(--bg);
          color: var(--tx);
          font-family: var(--fb);
          min-height: 100vh;
          transition: background .7s, color .7s;
        }

        [data-theme="onyx"] {
          --bg: #08080D;
          --bg2: #0D0D14;
          --bg3: #121219;
          --b1: rgba(255, 255, 255, 0.06);
          --b2: rgba(255, 255, 255, 0.10);
          --b3: rgba(255, 255, 255, 0.15);
          --tx: #F2F0E8;
          --tm: #8A8880;
          --td: #3A3830;
          --glass: rgba(255, 255, 255, 0.04);
        }

        [data-theme="silver"] {
          --bg: #F5F3EE;
          --bg2: #ECEAE4;
          --bg3: #E2E0DA;
          --b1: rgba(0, 0, 0, 0.06);
          --b2: rgba(0, 0, 0, 0.10);
          --b3: rgba(0, 0, 0, 0.18);
          --tx: #0A0A08;
          --tm: #5A5850;
          --td: #9A9890;
          --glass: rgba(0, 0, 0, 0.03);
        }

        .hero-orb { position: absolute; border-radius: 50%; pointer-events: none; z-index: 0; }
        .orb1 { width: 700px; height: 500px; top: 5%; left: 50%; transform: translateX(-50%); background: radial-gradient(ellipse, rgba(197, 160, 40, 0.06), transparent 70%); }
        .orb2 { width: 400px; height: 400px; bottom: -100px; left: 20%; background: radial-gradient(ellipse, rgba(197, 160, 40, 0.04), transparent 70%); }

        nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; padding: 0 5vw; height: 68px; display: flex; align-items: center; justify-content: space-between; transition: all .4s; }
        nav.stuck { background: var(--bg2); border-bottom: 1px solid var(--b1); backdrop-filter: blur(20px); }

        .hero-h1 { font-family: var(--ff); font-size: clamp(48px, 8vw, 100px); line-height: 0.95; font-weight: 900; letter-spacing: -0.02em; margin-bottom: 24px; position: relative; z-index: 1; }
        .hero-h1 em { font-style: italic; color: var(--gold); }

        .chat-window { background: var(--bg2); border: 1px solid var(--b2); border-radius: 24px; overflow: hidden; height: 500px; display: flex; flex-direction: column; box-shadow: 0 30px 60px rgba(0,0,0,0.5); }
        .msg { padding: 12px 18px; border-radius: 18px; font-size: 14px; max-width: 85%; margin-bottom: 8px; animation: fadeIn 0.3s ease; }
        .msg.bot { background: var(--bg3); color: var(--tx); border-bottom-left-radius: 4px; align-self: flex-start; }
        .msg.user { background: var(--gold); color: white; border-bottom-right-radius: 4px; align-self: flex-end; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .btn-gd { padding: 12px 28px; background: var(--gold); color: white; border-radius: 100px; font-weight: 700; font-size: 12px; letter-spacing: 0.1em; transition: all 0.3s; border: none; cursor: pointer; }
        .btn-gd:hover { transform: translateY(-2px); box-shadow: 0 10px 30px var(--gold-glow); background: var(--gold2); }

        .kicker { font-family: var(--fm); font-size: 10px; color: var(--gold); letter-spacing: 0.2em; text-transform: uppercase; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
        .kicker::before { content: '//'; opacity: 0.5; }

        .prod-card { padding: 40px; border: 1px solid var(--b1); background: var(--bg2); border-radius: 32px; transition: all 0.4s; position: relative; overflow: hidden; }
        .prod-card:hover { border-color: var(--gold-mid); transform: translateY(-8px); }
        .prod-ghost { position: absolute; bottom: -20px; right: 0; font-size: 120px; font-weight: 900; color: var(--gold); opacity: 0.03; font-family: var(--ff); }

        .canal-card { padding: 32px; background: var(--bg2); border: 1px solid var(--b1); border-radius: 24px; transition: all 0.3s; }
        .canal-card:hover { border-color: var(--gold-mid); transform: translateY(-4px); }
      `}</style>

      {/* NAV */}
      <nav className={scrolled ? 'stuck' : ''}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--gold)] rounded-xl flex items-center justify-center font-black text-white transform rotate-6">A</div>
          <span className="font-serif text-2xl font-black italic">ALEX <span className="text-[var(--gold)]">IO</span></span>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-bold uppercase tracking-widest text-[var(--tm)]">
          <a onClick={() => scroll2('productos')} className="hover:text-[var(--gold)] cursor-pointer">Productos</a>
          <a onClick={() => scroll2('canales')} className="hover:text-[var(--gold)] cursor-pointer">Canales</a>
          <a onClick={() => scroll2('arquitectura')} className="hover:text-[var(--gold)] cursor-pointer">Arquitectura</a>
          <a onClick={() => scroll2('inversion')} className="hover:text-[var(--gold)] cursor-pointer">Inversión</a>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleTheme} className="w-10 h-10 rounded-full border border-[var(--b2)] flex items-center justify-center text-[var(--gold)] hover:bg-[var(--gold-dim)] transition-all">
            {theme === 'onyx' ? '☀️' : '🌙'}
          </button>
          <button className="btn-gd hidden sm:block">ACTIVAR ALEX IO</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <div className="hero-orb orb1"></div>
        <div className="hero-orb orb2"></div>
        
        <div className="inline-block px-4 py-1.5 border border-[var(--b2)] rounded-full text-[10px] font-mono text-[var(--tm)] uppercase tracking-widest mb-10 relative z-10 bg-[var(--glass)]">
          ⚡ La nueva frontera del cierre automático
        </div>

        <h1 className="hero-h1">
          Cada mensaje que no<br />
          respondes es<br />
          <em>dinero perdido.</em>
        </h1>

        <p className="text-lg md:text-xl text-[var(--tm)] max-width-[600px] leading-relaxed mb-12 relative z-10">
          ALEX IO responde, califica y convierte clientes automáticamente<br className="hidden md:block" />
          en <span className="text-[var(--tx)] font-semibold">WhatsApp y redes sociales</span>, las 24 horas.
        </p>

        <div className="flex gap-4 relative z-10">
          <button className="hbtn-p px-10 py-5 bg-[var(--gold)] text-white rounded-full font-bold text-sm hover:scale-105 transition-all shadow-xl shadow-[var(--gold-glow)]">ACTIVAR ALEX IO AHORA</button>
          <button onClick={() => scroll2('demo')} className="px-10 py-5 border border-[var(--b2)] text-[var(--tm)] rounded-full font-bold text-sm hover:border-[var(--gold)] hover:text-[var(--gold)] transition-all">Ver demo en vivo</button>
        </div>
      </section>

      {/* PRODUCTOS */}
      <section id="productos" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="kicker">Visión de producto · 2025–2026</div>
        <h2 className="text-5xl md:text-7xl font-serif font-black mb-20 leading-none">Tres productos.<br /><em className="text-[var(--gold)] italic">Un solo cerebro.</em></h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="prod-card border-[var(--gold-mid)] bg-[var(--gold-dim)]">
            <div className="prod-ghost">IO</div>
            <div className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full w-fit mb-6 uppercase tracking-widest">● Disponible hoy</div>
            <h3 className="text-4xl font-serif font-black mb-2">ALEX IO</h3>
            <p className="text-sm text-[var(--tm)] mb-8">El primer asistente de IA que responde, califica y cierra clientes en WhatsApp e Instagram.</p>
            <div className="space-y-3">
              {['Cascada de modelos AI', 'Multi-canal completo', 'CRM Integrado', 'Shadow Audit'].map(f => (
                <div key={f} className="flex items-center gap-3 text-xs text-[var(--tm)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)]"></div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="prod-card">
            <div className="prod-ghost">IN</div>
            <div className="text-[9px] font-mono text-[var(--gold)] bg-[var(--gold-dim)] border border-[var(--gold-mid)] px-3 py-1 rounded-full w-fit mb-6 uppercase tracking-widest">⬡ Próximamente</div>
            <h3 className="text-4xl font-serif font-black mb-2">ALEX IN</h3>
            <p className="text-sm text-[var(--tm)] mb-8">Accesibilidad universal. Detecta y se adapta a las necesidades de cada persona automáticamente.</p>
            <div className="space-y-3">
              {['Visual First (Sordos)', 'Audio First (ElevenLabs)', 'Hand Talk SDK', 'Perfil Adaptativo'].map(f => (
                <div key={f} className="flex items-center gap-3 text-xs text-[var(--tm)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--gold)] opacity-40"></div>
                  {f}
                </div>
              ))}
            </div>
          </div>

          <div className="prod-card">
            <div className="prod-ghost">TB</div>
            <div className="text-[9px] font-mono text-indigo-400 bg-indigo-400/10 border border-indigo-400/20 px-3 py-1 rounded-full w-fit mb-6 uppercase tracking-widest">◈ Diciembre 2025</div>
            <h3 className="text-4xl font-serif font-black mb-2">ALEX TR</h3>
            <p className="text-sm text-[var(--tm)] mb-8">Comunicación sin barreras. Traducción espontánea e inmersión lingüística en tiempo real.</p>
            <div className="space-y-3">
              {['Tutor de idiomas', 'Traducción Bidireccional', 'Guía turística IA', 'Contexto Global'].map(f => (
                <div key={f} className="flex items-center gap-3 text-xs text-[var(--tm)]">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 opacity-40"></div>
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* DEMO */}
      <section id="demo" className="py-32 px-6 bg-[var(--bg2)] border-y border-[var(--b1)]">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
          <div>
            <div className="kicker">Demo en vivo</div>
            <h2 className="text-5xl md:text-7xl font-serif font-black leading-none mb-6">Hablá con<br /><em className="text-[var(--gold)] italic">ALEX ahora.</em></h2>
            <p className="text-[var(--tm)] text-lg leading-relaxed">Probá cómo ALEX califica leads en tiempo real. Respondé las preguntas y mirá cómo funciona el sistema de diagnóstico inteligente.</p>
          </div>

          <div className="chat-window">
            {step === -1 ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center">
                <div className="w-16 h-16 bg-[var(--gold-dim)] border border-[var(--gold-mid)] rounded-full flex items-center justify-center text-3xl mb-6">🔱</div>
                <h4 className="text-2xl font-serif font-black mb-4">Diagnóstico IA</h4>
                <p className="text-sm text-[var(--tm)] mb-8">ALEX analizará tu negocio para determinar el nivel de automatización necesario.</p>
                <button onClick={startDemo} className="btn-gd w-full py-4 text-sm">INICIAR DIAGNÓSTICO IA →</button>
              </div>
            ) : step === questions.length ? (
              <div className="h-full flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-500">
                <div className="w-20 h-20 bg-[var(--gold-dim)] border-2 border-[var(--gold-mid)] rounded-full flex items-center justify-center text-3xl mb-6 text-[var(--gold)]">🔱</div>
                <h4 className="text-3xl font-serif font-black text-[var(--gold)] mb-4">¡Tu Plan está Listo!</h4>
                <p className="text-sm text-[var(--tm)] leading-relaxed">ALEX ha calculado que puedes recuperar hasta un 40% de tus ventas perdidas en los primeros 30 días.</p>
                <button onClick={() => scroll2('inversion')} className="btn-gd w-full py-4 text-sm mt-8">VER PLANES Y ACTIVAR AHORA</button>
              </div>
            ) : (
              <div className="h-full flex flex-col">
                <div className="p-5 border-b border-[var(--b1)] flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--gold)] animate-pulse"></div>
                  <span className="font-mono text-[10px] text-[var(--gold)] font-bold uppercase tracking-widest">ALEX IO · Neural Engine</span>
                </div>
                <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
                  {messages.map((m, i) => (
                    <div key={i} className={`msg ${m.type}`}>
                      {m.text}
                    </div>
                  ))}
                  {isTyping && (
                    <div className="msg bot flex gap-1 items-center py-4 px-6">
                      <div className="w-1 h-1 bg-[var(--gold)] rounded-full animate-bounce"></div>
                      <div className="w-1 h-1 bg-[var(--gold)] rounded-full animate-bounce [animation-delay:0.2s]"></div>
                      <div className="w-1 h-1 bg-[var(--gold)] rounded-full animate-bounce [animation-delay:0.4s]"></div>
                    </div>
                  )}
                </div>
                <div className="p-4 border-t border-[var(--b1)] flex gap-3">
                  <input 
                    className="flex-1 bg-[var(--bg3)] border border-[var(--b1)] rounded-xl px-4 py-3 text-sm outline-none focus:border-[var(--gold-mid)] transition-all"
                    placeholder={questions[step]?.ph || "Escribe aquí..."}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMsg()}
                  />
                  <button onClick={sendMsg} className="px-6 bg-[var(--gold)] text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-[var(--gold2)] transition-all">Enviar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CANALES */}
      <section id="canales" className="py-32 px-6 max-w-7xl mx-auto">
        <div className="kicker">Multi-canal</div>
        <h2 className="text-5xl md:text-7xl font-serif font-black leading-none mb-20">Donde están<br /><em className="text-[var(--gold)] italic">tus clientes.</em></h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
          {[
            { icon: '💬', name: 'WhatsApp', sub: 'Baileys · Meta · 360', body: 'ALEX maneja conversaciones, envía audios PTT, procesa imágenes y gestiona el historial completo.' },
            { icon: '📸', name: 'Instagram', sub: 'Direct · ManyChat', body: 'Responde DMs automáticamente. Captura leads desde stories y posts usando webhooks integrados.' },
            { icon: '👥', name: 'Facebook', sub: 'Messenger · Webhook', body: 'Gestión de Messenger con el mismo flujo de calificación. Compatible con campañas de tráfico.' },
            { icon: '🎵', name: 'TikTok', sub: 'Business API', body: 'Responde DMs de TikTok Business automáticamente. Integración con nativa para social commerce.' },
            { icon: '🤝', name: 'Inclusive', sub: 'AIO Engine', body: 'Voz, texto, señas o botones. El motor detecta el perfil del usuario y adapta el formato.' },
            { icon: '🌐', name: 'Translate', sub: 'Neural Babel', body: 'Traducción espontánea e inmersión lingüística en cualquier idioma y canal sin configuración.' }
          ].map((c, i) => (
            <div key={i} className="canal-card">
              <div className="text-3xl mb-4">{c.icon}</div>
              <h4 className="text-2xl font-serif font-black mb-1">{c.name}</h4>
              <p className="text-[9px] font-mono text-[var(--td)] uppercase tracking-widest mb-4">{c.sub}</p>
              <p className="text-sm text-[var(--tm)] leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 px-6 border-t border-[var(--b1)] bg-[var(--bg2)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="text-center md:text-left">
            <div className="text-2xl font-serif font-black italic mb-2">ALEX <span className="text-[var(--gold)]">IO</span></div>
            <p className="text-[9px] font-mono text-[var(--td)] uppercase tracking-widest">Arquitectos de negocios impulsados por IA cognitiva</p>
          </div>
          <div className="flex gap-8 text-[10px] font-mono text-[var(--td)] uppercase tracking-widest">
            <a href="#" className="hover:text-[var(--gold)] transition-all">Privacidad</a>
            <a href="#" className="hover:text-[var(--gold)] transition-all">Términos</a>
            <a href="#" className="hover:text-[var(--gold)] transition-all">Soporte</a>
          </div>
          <div className="text-[9px] font-mono text-[var(--td)] uppercase tracking-widest opacity-50">
            © 2025 ALEX IO SYSTEMS · DISEÑADO PARA EL ÉXITO
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
