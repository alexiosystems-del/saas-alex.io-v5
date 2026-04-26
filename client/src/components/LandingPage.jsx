import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const G = '#D4A843';
const GH = '#E0BC6A';
const GD = '#D4A84318';
const GB = '#D4A84338';

const plans = [
  {
    name: 'Starter',
    price: 97,
    annual: 77,
    desc: 'Para empezar a convertir',
    features: ['1 Bot IA activo', '1.000 mensajes/mes', '1 canal conectado', 'Respuestas automáticas', 'Soporte por email'],
    cta: 'Comenzar gratis',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 197,
    annual: 157,
    desc: 'El más elegido por pymes',
    features: ['5 Bots IA activos', '10.000 mensajes/mes', '3 canales conectados', 'CRM + extracción de leads', 'Auto-healing incluido', 'Soporte prioritario 24h'],
    cta: 'Activar Pro',
    highlight: true,
  },
  {
    name: 'Scale',
    price: 397,
    annual: 317,
    desc: 'Infraestructura enterprise',
    features: ['Bots ilimitados', 'Mensajes ilimitados', 'Todos los canales', 'Multi-agente cognitivo', 'RAG / base de conocimiento', 'Onboarding dedicado + SLA'],
    cta: 'Hablar con ventas',
    highlight: false,
  },
];

const channels = [
  { label: 'WhatsApp', color: '#25D366' },
  { label: 'TikTok', color: '#ff2d55' },
  { label: 'Discord', color: '#5865F2' },
  { label: 'Reddit', color: '#FF4500' },
  { label: 'Instagram', color: '#E1306C' },
  { label: 'Facebook', color: '#1877F2' },
];

const metrics = [
  { value: '+40%', label: 'Más conversiones' },
  { value: '+30%', label: 'Ventas cerradas' },
  { value: '99.9%', label: 'Uptime garantizado' },
  { value: '24/7', label: 'Sin interrupciones' },
];

const steps = [
  { icon: '01', title: 'Mensaje entra', desc: 'El cliente escribe en su idioma, en cualquier canal.' },
  { icon: '02', title: 'IA analiza', desc: 'Detecta intención, contexto y urgencia al instante.' },
  { icon: '03', title: 'Responde', desc: 'Respuesta personalizada en milisegundos.' },
  { icon: '04', title: 'Convierte', desc: 'Guía al cliente hasta el cierre sin fricción.' },
  { icon: '05', title: 'Auto-sana', desc: 'Si algo falla, se recupera solo. Sin intervención.' },
];

const languages = [
  { flag: '🇦🇷', lang: 'Español', reply: '¡Hola! Soy ALEX, tu asistente cognitivo. ¿En qué puedo ayudarte hoy?' },
  { flag: '🇺🇸', lang: 'English', reply: "Hi! I'm ALEX, your cognitive assistant. How can I help you today?" },
  { flag: '🇧🇷', lang: 'Português', reply: 'Olá! Sou ALEX, seu assistente cognitivo. Como posso ajudar você hoje?' },
  { flag: '🇫🇷', lang: 'Français', reply: 'Bonjour! Je suis ALEX, votre assistant cognitif. Comment puis-je vous aider?' },
  { flag: '🇩🇪', lang: 'Deutsch', reply: 'Hallo! Ich bin ALEX, Ihr kognitiver Assistent. Wie kann ich Ihnen helfen?' },
  { flag: '🇮🇹', lang: 'Italiano', reply: 'Ciao! Sono ALEX, il tuo assistente cognitivo. Come posso aiutarti oggi?' },
];

const countries = ['🇦🇷 Argentina', '🇲🇽 México', '🇧🇷 Brasil', '🇨🇴 Colombia', '🇨🇱 Chile', '🇺🇸 USA', '🇪🇸 España', '🇵🇪 Perú', '🇺🇾 Uruguay', '🇧🇴 Bolivia', '🇩🇪 Alemania', '🇫🇷 Francia'];

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setInView(true);
    }, { threshold });

    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, inView];
}

function FadeIn({ children, delay = 0 }) {
  const [ref, inView] = useInView();

  return (
    <div
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity .65s ease ${delay}s, transform .65s ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');
  const [activeLang, setActiveLang] = useState(0);
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([
    { from: 'bot', text: 'Hola 👋 Soy ALEX, tu asistente cognitivo. Preguntame lo que quieras — precios, funcionalidades, idiomas.' },
  ]);
  const [typing, setTyping] = useState(false);
  const chatRef = useRef(null);
  const currentYear = new Date().getFullYear();

  const activateDemoMode = () => {
    localStorage.setItem('demo_mode', 'true');
    localStorage.setItem('alex_io_role', 'SUPERADMIN');
    localStorage.setItem('demo_email', 'demo@alex.io');
    localStorage.setItem('alex_io_tenant', 'tenant_demo');
    navigate('/superadmin');
  };

  const goToLogin = () => {
    localStorage.removeItem('demo_mode');
    navigate('/login');
  };

  // getReply se elimina, ahora llamamos al backend
  async function sendMessage() {
    if (!msg.trim()) return;
    const userMessage = { from: 'user', text: msg };
    setChat((current) => [...current, userMessage]);
    setMsg('');
    setTyping(true);

    try {
      const response = await fetch('/api/webhooks/webchat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: 'landing_usr_' + Math.floor(Math.random() * 10000),
          text: userMessage.text,
          metadata: { tenantId: 'demo-tenant', isLanding: true }
        })
      });
      const data = await response.json();
      // Accept reply from both success AND error responses
      if (data && data.reply) {
        setChat((current) => [...current, { from: 'bot', text: data.reply }]);
      } else {
        setChat((current) => [...current, { from: 'bot', text: 'Error inesperado del servidor.' }]);
      }
    } catch (err) {
      console.error(err);
      setChat((current) => [...current, { from: 'bot', text: 'Parece que no tengo conexión con el backend ahora mismo.' }]);
    } finally {
      setTyping(false);
    }
  }

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chat, typing]);

  const price = (plan) => (billing === 'annual' ? plan.annual : plan.price);
  const saving = (plan) => (plan.price - plan.annual) * 12;

  return (
    <div style={{ background: '#07090C', color: '#EDE9E3', fontFamily: "'DM Sans','Helvetica Neue',sans-serif", minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,300&family=DM+Serif+Display:ital@0;1&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        .serif{font-family:'DM Serif Display',serif;}
        nav a{color:#6B7280;text-decoration:none;font-size:14px;transition:color .2s;}
        nav a:hover{color:#EDE9E3;}
        .btn-g{background:${G};color:#07090C;border:none;padding:13px 26px;border-radius:8px;font-weight:500;font-size:15px;cursor:pointer;transition:background .2s,transform .15s;font-family:inherit;}
        .btn-g:hover{background:${GH};transform:translateY(-1px);}
        .btn-o{background:transparent;color:#EDE9E3;border:1px solid #2A2F38;padding:12px 26px;border-radius:8px;font-size:15px;cursor:pointer;transition:border-color .2s,background .2s;font-family:inherit;}
        .btn-o:hover{border-color:#4B5563;background:#111418;}
        .card{background:#0D1117;border:1px solid #1E2530;border-radius:16px;padding:1.75rem;}
        .card-g{background:#0D1117;border:2px solid ${GB};border-radius:16px;padding:1.75rem;position:relative;}
        .tag{display:inline-block;background:${GD};color:${G};border:1px solid ${GB};font-size:12px;padding:4px 14px;border-radius:100px;margin-bottom:1.5rem;letter-spacing:.04em;}
        .pill{display:inline-flex;align-items:center;gap:8px;background:#0D1117;border:1px solid #1E2530;border-radius:100px;padding:8px 16px;font-size:13px;color:#9CA3AF;}
        .dot{width:8px;height:8px;border-radius:50%;}
        .metric{background:#0D1117;border:1px solid #1E2530;border-radius:12px;padding:1.5rem;text-align:center;}
        .bubble-bot{background:#1A1F28;border-radius:4px 16px 16px 16px;padding:11px 15px;font-size:14px;line-height:1.6;max-width:86%;color:#E5E7EB;}
        .bubble-user{background:${G};color:#07090C;border-radius:16px 4px 16px 16px;padding:11px 15px;font-size:14px;line-height:1.6;max-width:86%;margin-left:auto;}
        .tdot{width:6px;height:6px;background:#6B7280;border-radius:50%;display:inline-block;animation:blink 1.2s infinite;}
        .tdot:nth-child(2){animation-delay:.2s;}
        .tdot:nth-child(3){animation-delay:.4s;}
        @keyframes blink{0%,80%,100%{opacity:.2;}40%{opacity:1;}}
        .lang-btn{background:transparent;border:1px solid #1E2530;border-radius:100px;padding:7px 14px;font-size:13px;color:#9CA3AF;cursor:pointer;transition:all .2s;font-family:inherit;}
        .lang-btn.active{border-color:${GB};color:${G};background:${GD};}
        .billing-toggle{display:flex;background:#0D1117;border:1px solid #1E2530;border-radius:100px;padding:3px;width:fit-content;margin:0 auto 2.5rem;}
        .btog{background:transparent;border:none;padding:8px 20px;border-radius:100px;font-size:13px;cursor:pointer;color:#9CA3AF;font-family:inherit;transition:all .2s;}
        .btog.on{background:${G};color:#07090C;font-weight:500;}
        .plan-badge{position:absolute;top:-12px;left:50%;transform:translateX(-50%);background:${G};color:#07090C;font-size:11px;font-weight:500;padding:3px 14px;border-radius:100px;white-space:nowrap;}
        .country-tag{background:#0D1117;border:1px solid #1E2530;border-radius:100px;padding:6px 14px;font-size:13px;color:#9CA3AF;}
        footer a{color:#374151;text-decoration:none;font-size:13px;}
        footer a:hover{color:#9CA3AF;}
        input[type=text]{background:#1A1F28;border:1px solid #2A2F38;border-radius:8px;color:#EDE9E3;padding:10px 14px;font-size:14px;font-family:inherit;outline:none;width:100%;transition:border-color .2s;}
        input[type=text]:focus{border-color:${GB};}
        input[type=text]::placeholder{color:#4B5563;}
        @media (max-width: 1024px){
          .steps-grid{grid-template-columns:repeat(3,minmax(0,1fr)) !important;}
          .plans-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
          .healing-grid{grid-template-columns:1fr !important;}
          .metrics-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
        }
        @media (max-width: 768px){
          .steps-grid{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
          .plans-grid{grid-template-columns:1fr !important;}
          .nav-links{display:none !important;}
          .metrics-grid{grid-template-columns:1fr !important;}
        }
      `}</style>
      <nav style={{ borderBottom: '1px solid #1E2530', padding: '0 2rem', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: '#07090C', zIndex: 100 }}>
        <div className="serif" style={{ fontSize: 22 }}>ALEX <span style={{ color: G }}>IO</span></div>
        <div className="nav-links" style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <a href="#como-funciona">Cómo funciona</a>
          <a href="#canales">Canales</a>
          <a href="#planes">Planes</a>
          <a href="#demo">Demo</a>
          <button className="btn-g" style={{ padding: '8px 20px', fontSize: 13 }} onClick={goToLogin}>Probar gratis →</button>
        </div>
      </nav>

      <section style={{ textAlign: 'center', padding: '100px 2rem 60px', maxWidth: 780, margin: '0 auto', position: 'relative' }}>
        <div style={{ position: 'absolute', width: 560, height: 560, background: `radial-gradient(circle,${GD} 0%,transparent 70%)`, top: -80, left: '50%', transform: 'translateX(-50%)', pointerEvents: 'none' }} />
        <div className="tag">Sistema autónomo enterprise — activo en 12 países</div>
        <h1 className="serif" style={{ fontSize: 'clamp(40px,6vw,70px)', lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '1.25rem' }}>
          Tu empresa opera sola.<br />
          <em style={{ color: G, fontStyle: 'italic' }}>Vos cerrás ventas.</em>
        </h1>
        <p style={{ fontSize: 18, color: '#9CA3AF', lineHeight: 1.7, maxWidth: 520, margin: '0 auto 2.5rem' }}>
          ALEX IO responde, vende y gestiona tu comunicación 24/7 — en cualquier idioma, para cualquier país del mundo. Se detecta, se protege y se recupera solo.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-g" onClick={goToLogin}>Probar en WhatsApp →</button>
          <button className="btn-o" onClick={activateDemoMode}>Ver demo en vivo</button>
        </div>
        <p style={{ marginTop: '1.5rem', fontSize: 13, color: '#374151' }}>Sin tarjeta requerida · Listo en 5 minutos · Cancelás cuando quieras</p>
      </section>

      <section style={{ padding: '0 2rem 80px', maxWidth: 900, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ background: '#0D1117', border: '1px solid #1E2530', borderRadius: 16, overflow: 'hidden', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', maxWidth: 860, margin: '0 auto' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, background: G, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', cursor: 'pointer' }} onClick={activateDemoMode}>
                <div style={{ width: 0, height: 0, borderTop: '12px solid transparent', borderBottom: '12px solid transparent', borderLeft: '20px solid #07090C', marginLeft: 4 }} />
              </div>
              <p style={{ fontSize: 13, color: '#4B5563' }}>Tu video va aquí · 1080p o 4K · máx 90 segundos</p>
            </div>
            <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#07090C99', border: '1px solid #1E2530', borderRadius: 100, padding: '6px 18px', fontSize: 13, color: '#9CA3AF', whiteSpace: 'nowrap' }}>
              ALEX IO — 90 segundos que cambian tu negocio
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '0 2rem 90px', maxWidth: 900, margin: '0 auto' }}>
        <FadeIn>
          <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            {metrics.map((metric) => (
              <div className="metric" key={metric.label}>
                <div className="serif" style={{ fontSize: 34, color: G, marginBottom: 6 }}>{metric.value}</div>
                <div style={{ fontSize: 13, color: '#6B7280' }}>{metric.label}</div>
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '80px 2rem', background: '#0A0D11', borderTop: '1px solid #1E2530', borderBottom: '1px solid #1E2530' }}>
        <FadeIn>
          <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center' }}>
            <div className="tag">El problema real</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,4vw,46px)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
              Cada mensaje sin respuesta<br />es una venta que perdiste
            </h2>
            <p style={{ color: '#6B7280', fontSize: 17, lineHeight: 1.7 }}>
              No es falta de clientes. Es falta de sistema. Tu competidor que responde en 2 minutos cierra ventas que vos perdiste mientras dormías.
            </p>
          </div>
        </FadeIn>
      </section>

      <section id="como-funciona" style={{ padding: '100px 2rem', maxWidth: 1000, margin: '0 auto' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div className="tag">El proceso</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.2 }}>Sin humanos. Sin fricción.<br />Sin pérdidas.</h2>
          </div>
        </FadeIn>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 20 }}>
          {steps.map((step, i) => (
            <FadeIn key={step.icon} delay={i * 0.1}>
              <div style={{ textAlign: 'center' }}>
                <div className="serif" style={{ fontSize: 44, color: `${G}22`, lineHeight: 1, marginBottom: 8 }}>{step.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>{step.title}</div>
                <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.6 }}>{step.desc}</div>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px 2rem', background: '#0A0D11', borderTop: '1px solid #1E2530', borderBottom: '1px solid #1E2530' }}>
        <FadeIn>
          <div className="healing-grid" style={{ maxWidth: 900, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
            <div>
              <div className="tag">Diferencial enterprise</div>
              <h2 className="serif" style={{ fontSize: 'clamp(26px,3.5vw,40px)', lineHeight: 1.2, marginBottom: '1.25rem' }}>
                ALEX IO no solo funciona.<br />
                <em style={{ color: G }}>Se cura solo.</em>
              </h2>
              <p style={{ color: '#9CA3AF', lineHeight: 1.7, marginBottom: '1.5rem' }}>
                Cuando una API externa cae o un canal se degrada, ALEX IO lo detecta, se suspende para proteger recursos y se recupera automáticamente — sin que nadie toque nada.
              </p>
              {[['🛡️', 'Detecta anomalías en tiempo real'], ['⏸️', 'Se pausa antes de fallar'], ['🔄', 'Se recupera sin intervención humana']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: '#9CA3AF', marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>{icon}</span>{text}
                </div>
              ))}
            </div>
            <div className="card" style={{ fontFamily: 'monospace', fontSize: 12, lineHeight: 2, color: '#4B5563' }}>
              <div style={{ color: G, marginBottom: 8, fontSize: 11, letterSpacing: '.08em' }}>AUTO-HEALING LOG</div>
              <div><span style={{ color: '#6B7280' }}>22:14:01</span> <span style={{ color: '#9CA3AF' }}>canal=whatsapp</span> success_rate=97%</div>
              <div><span style={{ color: '#6B7280' }}>22:19:33</span> <span style={{ color: '#F59E0B' }}>DEGRADACIÓN detectada</span> rate=84%</div>
              <div><span style={{ color: '#6B7280' }}>22:19:33</span> <span style={{ color: '#EF4444' }}>instancia suspendida</span> auto_paused=true</div>
              <div><span style={{ color: '#6B7280' }}>22:31:12</span> evaluando recuperación...</div>
              <div><span style={{ color: '#6B7280' }}>22:34:50</span> <span style={{ color: G }}>RECUPERADO ✓</span> rate=99.1%</div>
              <div><span style={{ color: '#6B7280' }}>22:34:50</span> <span style={{ color: '#9CA3AF' }}>alerta enviada</span> canal=discord</div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section style={{ padding: '100px 2rem', maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
        <FadeIn>
          <div className="tag">Global desde el día 1</div>
          <h2 className="serif" style={{ fontSize: 'clamp(28px,4vw,46px)', lineHeight: 1.2, marginBottom: '1rem' }}>
            Vendé para cualquier país.<br />
            <em style={{ color: G }}>Tu cliente lo verá en su idioma.</em>
          </h2>
          <p style={{ color: '#6B7280', fontSize: 16, lineHeight: 1.7, maxWidth: 540, margin: '0 auto 2.5rem' }}>
            ALEX detecta automáticamente el idioma del cliente y responde en el mismo. Sin configuración extra. Sin barreras de mercado.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '2rem' }}>
            {languages.map((language, index) => (
              <button key={language.lang} className={`lang-btn${activeLang === index ? ' active' : ''}`} onClick={() => setActiveLang(index)}>
                {language.flag} {language.lang}
              </button>
            ))}
          </div>
          <div className="card" style={{ maxWidth: 420, margin: '0 auto', textAlign: 'left', padding: '1rem 1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, borderBottom: '1px solid #1E2530', paddingBottom: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: G }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>ALEX — {languages[activeLang].lang}</span>
            </div>
            <div className="bubble-bot">{languages[activeLang].reply}</div>
          </div>
          <div style={{ marginTop: '2.5rem' }}>
            <p style={{ fontSize: 13, color: '#4B5563', marginBottom: '1rem' }}>Activo en más de 12 países</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
              {countries.map((country) => <div key={country} className="country-tag">{country}</div>)}
            </div>
          </div>
        </FadeIn>
      </section>

      <section id="canales" style={{ padding: '80px 2rem', background: '#0A0D11', borderTop: '1px solid #1E2530', borderBottom: '1px solid #1E2530', textAlign: 'center' }}>
        <FadeIn>
          <div className="tag">Multi-canal</div>
          <h2 className="serif" style={{ fontSize: 'clamp(28px,4vw,44px)', marginBottom: '1rem', lineHeight: 1.2 }}>
            Un solo cerebro.<br />Toda tu comunicación.
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '2.5rem', fontSize: 16 }}>
            Conectá tus canales y ALEX los gestiona todos desde un centro de control unificado.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 600, margin: '0 auto' }}>
            {channels.map((channel) => (
              <div key={channel.label} className="pill">
                <div className="dot" style={{ background: channel.color }} />{channel.label}
              </div>
            ))}
          </div>
        </FadeIn>
      </section>

      <section id="demo" style={{ padding: '100px 2rem' }}>
        <FadeIn>
          <div style={{ maxWidth: 480, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div className="tag">Demo en vivo</div>
              <h2 className="serif" style={{ fontSize: 32, lineHeight: 1.2 }}>Hablá con ALEX ahora</h2>
              <p style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>Preguntale precios, funcionalidades, idiomas — lo que quieras</p>
            </div>
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid #1E2530', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: G }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>ALEX — el Cognitivo</span>
                <span style={{ fontSize: 11, color: '#4B5563', marginLeft: 'auto' }}>En línea ahora</span>
              </div>
              <div ref={chatRef} style={{ height: 260, overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: 12, scrollBehavior: 'smooth' }}>
                {chat.map((message, index) => (
                  <div key={`${message.from}-${index}`} style={{ display: 'flex', justifyContent: message.from === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div className={message.from === 'bot' ? 'bubble-bot' : 'bubble-user'}>{message.text}</div>
                  </div>
                ))}
                {typing && (
                  <div style={{ display: 'flex', gap: 4, padding: '10px 14px', background: '#1A1F28', borderRadius: '4px 16px 16px 16px', width: 'fit-content' }}>
                    <span className="tdot" /><span className="tdot" /><span className="tdot" />
                  </div>
                )}
              </div>
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1E2530', display: 'flex', gap: 8 }}>
                <input type="text" placeholder="Escribí tu mensaje..." value={msg} onChange={(event) => setMsg(event.target.value)} onKeyDown={(event) => event.key === 'Enter' && sendMessage()} />
                <button className="btn-g" style={{ padding: '10px 16px', whiteSpace: 'nowrap', fontSize: 13 }} onClick={sendMessage}>Enviar</button>
              </div>
            </div>
          </div>
        </FadeIn>
      </section>

      <section id="planes" style={{ padding: '80px 2rem 100px', background: '#0A0D11', borderTop: '1px solid #1E2530' }}>
        <FadeIn>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div className="tag">Precios</div>
            <h2 className="serif" style={{ fontSize: 'clamp(28px,4vw,44px)', lineHeight: 1.2, marginBottom: '2rem' }}>Empezá hoy. Escalá mañana.</h2>
            <div className="billing-toggle">
              <button className={`btog${billing === 'monthly' ? ' on' : ''}`} onClick={() => setBilling('monthly')}>Mensual</button>
              <button className={`btog${billing === 'annual' ? ' on' : ''}`} onClick={() => setBilling('annual')}>Anual — 20% off</button>
            </div>
          </div>
        </FadeIn>
        <div className="plans-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 22, maxWidth: 960, margin: '0 auto', alignItems: 'start' }}>
          {plans.map((plan, index) => (
            <FadeIn key={plan.name} delay={index * 0.1}>
              <div className={plan.highlight ? 'card-g' : 'card'}>
                {plan.highlight && <div className="plan-badge">Más popular ⚡</div>}
                <div style={{ fontSize: 13, color: '#6B7280', marginBottom: 4 }}>{plan.desc}</div>
                <div className="serif" style={{ fontSize: 20, marginBottom: 6 }}>{plan.name}</div>
                <div className="serif" style={{ fontSize: 42, color: plan.highlight ? G : '#EDE9E3', lineHeight: 1.1, marginBottom: 2 }}>
                  ${price(plan)}<span style={{ fontSize: 15, color: '#6B7280', fontFamily: 'inherit' }}>/mes</span>
                </div>
                {billing === 'annual'
                  ? <div style={{ fontSize: 12, color: G, marginBottom: 4 }}>Ahorrás ${saving(plan)}/año</div>
                  : <div style={{ fontSize: 12, color: '#4B5563', marginBottom: 4 }}>o ${plan.annual}/mes pagando anual</div>
                }
                <div style={{ height: 1, background: '#1E2530', margin: '1.25rem 0' }} />
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: '1.5rem' }}>
                  {plan.features.map((feature) => (
                    <li key={`${plan.name}-${feature}`} style={{ fontSize: 13, color: '#9CA3AF', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: G, fontSize: 12 }}>✓</span>{feature}
                    </li>
                  ))}
                </ul>
                <button className={plan.highlight ? 'btn-g' : 'btn-o'} style={{ width: '100%' }} onClick={plan.name === 'Scale' ? activateDemoMode : goToLogin}>{plan.cta}</button>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      <section style={{ padding: '100px 2rem', textAlign: 'center', borderTop: '1px solid #1E2530' }}>
        <FadeIn>
          <h2 className="serif" style={{ fontSize: 'clamp(32px,5vw,56px)', lineHeight: 1.15, marginBottom: '1.5rem' }}>
            Mientras vos dormís,<br />
            <em style={{ color: G }}>tu empresa sigue creciendo.</em>
          </h2>
          <p style={{ color: '#6B7280', marginBottom: '2.5rem', fontSize: 17 }}>No es el futuro. Ya está pasando — en 12 países, en 6 idiomas.</p>
          <button className="btn-g" style={{ fontSize: 16, padding: '16px 36px' }} onClick={activateDemoMode}>Activar ALEX IO ahora →</button>
          <p style={{ marginTop: '1.25rem', fontSize: 13, color: '#374151' }}>Sin tarjeta requerida · Listo en 5 minutos</p>
        </FadeIn>
      </section>

      <footer style={{ borderTop: '1px solid #1E2530', padding: '1.75rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="serif" style={{ fontSize: 18 }}>ALEX <span style={{ color: G }}>IO</span></div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <a href="#">Privacidad</a>
          <a href="#">Términos</a>
          <a href="#">Contacto</a>
        </div>
        <div style={{ fontSize: 13, color: '#374151' }}>© {currentYear} ALEX IO — Tu arquitecto de negocios & ventas IA</div>
      </footer>
    </div>
  );
}
