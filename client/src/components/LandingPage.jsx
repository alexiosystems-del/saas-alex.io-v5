import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import WebChatWidget from './WebChatWidget';

const LandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('onyx');
  const [lang, setLang] = useState('es');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const handleScroll = () => {
      document.getElementById('nav')?.classList.toggle('stuck', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'onyx' ? 'silver' : 'onyx');
  const scroll2 = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  const handleEnter = () => navigate('/login');

  const content = {
    es: {
      nav: ['Canales', 'Arquitectura', 'Inversión', 'Roadmap v2'],
      badge: 'La nueva frontera del cierre automático',
      h1: ['Cada mensaje que no', 'respondes es', 'dinero perdido.'],
      p: 'ALEX IO responde, califica y convierte clientes automáticamente en WhatsApp y redes sociales, las 24 horas, los 7 días.',
      mini: [
        { icon: '⚡', txt: 'Respuestas en segundos' },
        { icon: '📈', txt: 'Seguimiento automático' },
        { icon: '👥', txt: 'Más ventas sin equipo' },
        { icon: '🌐', txt: 'IA multilingüe con contexto' }
      ],
      btns: ['HABLAR CON ALEX AHORA', 'Ver demo en vivo'],
      kicker1: 'Visión de producto · 2025–2026',
      secH1: ['Tres productos.', 'Un solo cerebro.'],
      products: [
        { ghost: 'IO', status: '● Disponible hoy · 80%', title: 'ALEX IO', sub: 'Automatización comercial · Ventas · CRM', tag: 'El primer asistente de IA que responde, califica y cierra clientes en WhatsApp e Instagram sin que toques nada.', feat: ['Cascada de modelos IA: Gemini → OpenAI → Safeguard', 'Multi-canal: WhatsApp, Instagram, Facebook, TikTok', 'CRM integrado: HubSpot, Copper, GHL', 'Shadow Audit con Claude para compliance', 'RAG con base de conocimiento propia', 'Detección de idioma y voz adaptativa'], pct: '80%' },
        { ghost: 'IN', status: '⬡ Próximamente', title: 'ALEX INCLUSIVE', sub: 'Accesibilidad universal · AIO Engine', tag: 'La primera plataforma de IA que detecta automáticamente cómo puede comunicarse cada persona y se adapta — sin configurar nada.', feat: ['Visual First: modo texto para usuarios sordos', 'Audio First: TTS con ElevenLabs + detección de idioma', 'Low Input: quick replies IA para motricidad reducida', 'Avatar en lengua de señas (Hand Talk SDK)', 'Perfil adaptativo que aprende en silencio', 'LSA en desarrollo con ANDIS y CILSA Argentina'], pct: '35%' },
        { ghost: 'TB', status: '◈ Diciembre 2025', title: 'ALEX TRANSLATE', sub: 'Comunicación inteligente para un mundo sin barreras', tag: 'Comunicación inteligente para un mundo sin barreras. Traducción espontánea, inmersión lingüística y guía turística IA en cualquier idioma y canal.', feat: ['Tutor de idiomas conversacional — aprende hablando', 'Inmersión espontánea: el bot cambia de idioma según el contexto', 'Guía turística IA con knowledge base de destinos', 'Traducción en tiempo real bidireccional', 'Corrección contextual de errores gramaticales', 'Mercados: turismo, academias, educación remota'], pct: '15%' }
      ],
      demo: { kicker: 'Demo en vivo', h: 'Hablá con ALEX ahora.', p: 'Probá cómo ALEX califica leads en tiempo real. Respondé las preguntas y mirá cómo funciona el sistema de diagnóstico inteligente.', btn: 'Iniciar diagnóstico IA →' },
      roadmap: { h: 'Roadmap v2', date: 'En desarrollo', phases: [
        { ghost: '01', tag: 'Fase 01', week: 'Semanas 1–2 · Supabase', title: 'Cimientos adaptativos', items: ['Preferencias por usuario', 'Logs de interacción', 'Eventos accesibilidad'] },
        { ghost: '02', tag: 'Fase 02', week: 'Semanas 3–4 · Detection', title: 'Detection Layer', items: ['Whisper STT', 'Detección de idioma', 'Behavior tracker'] },
        { ghost: '03', tag: 'Fase 03', week: 'Semanas 5–6 · AIO Engine', title: 'AIO Engine', items: ['Selector de formato', 'Respuesta por contexto', 'TTS premium'] },
        { ghost: '04', tag: 'Fase 04', week: 'Semanas 7–8 · Sign', title: 'Lengua de Señas', items: ['Hand Talk SDK', 'ASL / LIBRAS / LSA', 'Partner ANDIS · CILSA'] }
      ]},
      cta: { h: '¿Cuántos clientes estás perdiendo hoy?', p: 'Cada día sin ALEX IO es dinero que no vuelve. Automatizá conversación, seguimiento y cierre con arquitectura lista para escalar.', btn: 'HABLAR CON ALEX AHORA' },
      access: 'ACCESO MASTER'
    },
    en: {
      nav: ['Channels', 'Architecture', 'Pricing', 'Roadmap v2'],
      badge: 'The new frontier of automated closing',
      h1: ['Every message you', 'dont answer is', 'lost money.'],
      p: 'ALEX IO answers, qualifies, and converts customers automatically on WhatsApp and social media, 24/7.',
      mini: [
        { icon: '⚡', txt: 'Responses in seconds' },
        { icon: '📈', txt: 'Automated follow-up' },
        { icon: '👥', txt: 'More sales without a team' },
        { icon: '🌐', txt: 'Multilingual AI with context' }
      ],
      btns: ['TALK TO ALEX NOW', 'Watch live demo'],
      kicker1: 'Product Vision · 2025–2026',
      secH1: ['Three products.', 'One single brain.'],
      products: [
        { ghost: 'IO', status: '● Available today · 80%', title: 'ALEX IO', sub: 'Commercial Automation · Sales · CRM', tag: 'The first AI assistant that answers, qualifies, and closes customers on WhatsApp and Instagram without you touching anything.', feat: ['AI Model Cascade: Gemini → OpenAI → Safeguard', 'Multi-channel: WhatsApp, Instagram, Facebook, TikTok', 'Integrated CRM: HubSpot, Copper, GHL', 'Shadow Audit with Claude for compliance', 'RAG with own knowledge base', 'Adaptive language and voice detection'], pct: '80%' },
        { ghost: 'IN', status: '⬡ Coming Soon', title: 'ALEX INCLUSIVE', sub: 'Universal Accessibility · AIO Engine', tag: 'The first AI platform that automatically detects how each person can communicate and adapts — without configuring anything.', feat: ['Visual First: text mode for deaf users', 'Audio First: TTS with ElevenLabs + language detection', 'Low Input: AI quick replies for reduced motor skills', 'Sign language avatar (Hand Talk SDK)', 'Adaptive profile that learns in silence', 'LSA in development with ANDIS and CILSA Argentina'], pct: '35%' },
        { ghost: 'TB', status: '◈ December 2025', title: 'ALEX TRANSLATE', sub: 'Intelligent communication for a world without barriers', tag: 'Intelligent communication for a world without barriers. Spontaneous translation, linguistic immersion and AI tour guide in any language and channel.', feat: ['Conversational language tutor — learn by speaking', 'Spontaneous immersion: the bot changes language according to context', 'AI tour guide with knowledge base of destinations', 'Real-time bidirectional translation', 'Contextual correction of grammatical errors', 'Markets: tourism, academies, remote education'], pct: '15%' }
      ],
      demo: { kicker: 'Live Demo', h: 'Talk with ALEX now.', p: 'Test how ALEX qualifies leads in real-time. Answer the questions and see how the intelligent diagnostic system works.', btn: 'Start AI Diagnostic →' },
      roadmap: { h: 'Roadmap v2', date: 'In development', phases: [
        { ghost: '01', tag: 'Phase 01', week: 'Weeks 1–2 · Supabase', title: 'Adaptive Foundations', items: ['User preferences', 'Interaction logs', 'Accessibility events'] },
        { ghost: '02', tag: 'Phase 02', week: 'Weeks 3–4 · Detection', title: 'Detection Layer', items: ['Whisper STT', 'Language detection', 'Behavior tracker'] },
        { ghost: '03', tag: 'Phase 03', week: 'Weeks 5–6 · AIO Engine', title: 'AIO Engine', items: ['Format selector', 'Contextual response', 'Premium TTS'] },
        { ghost: '04', tag: 'Phase 04', week: 'Weeks 7–8 · Sign', title: 'Sign Language', items: ['Hand Talk SDK', 'ASL / LIBRAS / LSA', 'Partner ANDIS · CILSA'] }
      ]},
      cta: { h: 'How many customers are you losing today?', p: 'Every day without ALEX IO is money that doesnt return. Automate conversation, follow-up and closing with architecture ready to scale.', btn: 'TALK TO ALEX NOW' },
      access: 'MASTER ACCESS'
    }
  };

  const t = content[lang];

  return (
    <div className="landing-root">
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root { --gold:#C5A028; --gold2:#D4B03A; --gold3:#E8C84A; --gold-glow:rgba(197,160,40,0.35); --gold-dim:rgba(197,160,40,0.08); --gold-mid:rgba(197,160,40,0.25); --ff:'Playfair Display',Georgia,serif; --fb:'Instrument Sans',sans-serif; --fm:'DM Mono',monospace; }
        [data-theme="onyx"] { --bg:#08080D; --bg2:#0D0D14; --bg3:#121219; --b1:rgba(255,255,255,0.06); --b2:rgba(255,255,255,0.10); --b3:rgba(255,255,255,0.15); --tx:#F2F0E8; --tm:#8A8880; --td:#3A3830; --glass:rgba(255,255,255,0.04); --glass-h:rgba(255,255,255,0.07); }
        [data-theme="silver"] { --bg:#F5F3EE; --bg2:#ECEAE4; --bg3:#E2E0DA; --b1:rgba(0,0,0,0.06); --b2:rgba(0,0,0,0.10); --b3:rgba(0,0,0,0.18); --tx:#0A0A08; --tm:#5A5850; --td:#9A9890; --glass:rgba(0,0,0,0.03); --glass-h:rgba(0,0,0,0.06); }
        body{background:var(--bg);color:var(--tx);font-family:var(--fb);overflow-x:hidden;}
        .landing-root { background: var(--bg); color: var(--tx); font-family: var(--fb); }
        nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 5vw;height:68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid transparent;transition:all .4s;backdrop-filter:blur(0)}
        nav.stuck{background:rgba(8,8,13,.92);backdrop-filter:blur(20px);border-color:var(--b1)}
        .nav-logo{display:flex;align-items:center;gap:10px;font-family:var(--ff);font-size:24px;font-weight:900;color:var(--tx);text-decoration:none}
        .nav-icon{width:34px;height:34px;background:var(--gold);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;transform:rotate(6deg);}
        .nav-logo em{color:var(--gold);font-style:italic}
        .nav-links{display:flex;gap:32px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
        .nav-links a{color:var(--tm);text-decoration:none;transition:color .2s;cursor:pointer}
        .btn-gd{padding:10px 22px;background:var(--gold);border:none;border-radius:100px;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;cursor:pointer;transition:all .3s}
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 5vw 80px;position:relative}
        .hero-h1{font-family:var(--ff);font-size:clamp(52px,8.5vw,118px);line-height:.94;font-weight:900;margin-bottom:28px;}
        .hero-h1 em{font-style:italic;color:var(--gold);}
        .hero-p{font-size:clamp(15px,1.7vw,20px);color:var(--tm);max-width:600px;line-height:1.75;margin-bottom:44px;}
        .hero-mini{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:800px;margin-bottom:44px;}
        .mini-card{display:flex;flex-direction:column;align-items:center;gap:10px;padding:20px 16px;border:1px solid var(--b1);background:var(--glass);border-radius:16px;}
        .mini-icon{color:var(--gold);font-size:20px}
        .mini-txt{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--tm)}
        .section{padding:100px 5vw;border-top:1px solid var(--b1);}
        .sec-h{font-family:var(--ff);font-size:clamp(44px,6vw,80px);font-weight:900;line-height:.93;}
        .sec-h em{font-style:italic;color:var(--gold)}
        .timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:64px;}
        .prod-card{padding:52px 44px;border:1px solid var(--b1);background:var(--bg2);position:relative;transition:all .35s;}
        .prod-card.featured{background:var(--gold-dim);border-color:var(--gold-mid)}
        .prod-ghost{position:absolute;bottom:-30px;right:10px;font-family:var(--ff);font-size:180px;font-weight:900;color:var(--gold);opacity:.04;line-height:1;}
        .prod-status{font-family:var(--fm);font-size:9px;letter-spacing:.12em;text-transform:uppercase;padding:4px 10px;border-radius:100px;width:fit-content;margin-bottom:24px;border:1px solid var(--gold-mid);color:var(--gold)}
        .prod-title{font-family:var(--ff);font-size:42px;font-weight:900;line-height:1;margin-bottom:6px}
        .prod-feat{display:flex;flex-direction:column;gap:10px;margin-top:20px}
        .pfeat{display:flex;gap:12px;font-size:12px;color:var(--tm);line-height:1.6;align-items:flex-start}
        .pfeat::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--gold);margin-top:6px;flex-shrink:0}
        .roadmap-phases{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;margin-top:40px}
        .rphase{padding:36px 28px;background:var(--bg2);border:1px solid var(--b1);position:relative;overflow:hidden}
        .dashboard-preview { width:100%; max-width:1000px; margin-top:60px; border-radius:30px; border:1px solid var(--b2); box-shadow: 0 30px 60px rgba(0,0,0,0.5); overflow:hidden; }
      `}</style>

      {/* NAV */}
      <nav id="nav">
        <a className="nav-logo" href="#">
          <div className="nav-icon">A</div>
          ALEX <em>IO</em>
        </a>
        <div className="nav-links">
          <a onClick={() => scroll2('canales')}>{t.nav[0]}</a>
          <a onClick={() => scroll2('arquitectura')}>{t.nav[1]}</a>
          <a onClick={() => scroll2('inversion')}>{t.nav[2]}</a>
          <a onClick={() => scroll2('roadmap')}>{t.nav[3]}</a>
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{background:'none', border:'none', color:'var(--gold)', fontWeight:'bold', cursor:'pointer', fontSize:'10px', letterSpacing:'.1em'}}>
            {lang === 'es' ? 'EN' : 'ES'}
          </button>
        </div>
        <div className="nav-r">
          <button className="theme-btn" onClick={toggleTheme} style={{marginRight:'10px', background:'none', border:'none', cursor:'pointer'}}>{theme === 'onyx' ? '☀️' : '🌙'}</button>
          <button className="btn-gd" onClick={handleEnter}>{t.access}</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge" style={{display:'inline-flex', padding:'8px 18px', border:'1px solid var(--b2)', borderRadius:'100px', fontFamily:'var(--fm)', fontSize:'11px', color:'var(--tm)', marginBottom:'40px'}}>{t.badge}</div>
        <h1 className="hero-h1">{t.h1[0]}<br/>{t.h1[1]}<br/><em>{t.h1[2]}</em></h1>
        <p className="hero-p">{t.p}</p>
        <div className="hero-mini">
          {t.mini.map((m, i) => (
            <div key={i} className="mini-card">
              <div className="mini-icon">{m.icon}</div>
              <div className="mini-txt">{m.txt}</div>
            </div>
          ))}
        </div>
        
        {/* Dashboard Image Corrected */}
        <div className="dashboard-preview">
           <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2000&auto=format&fit=crop" style={{width:'100%', opacity:0.8}} alt="Dashboard Preview" />
        </div>

        <div className="hero-btns" style={{marginTop:'50px', display:'flex', gap:'14px'}}>
          <button 
            className="btn-gd" 
            style={{padding:'18px 44px', fontSize:'14px'}}
            onClick={() => window.dispatchEvent(new CustomEvent('open-alex-chat'))}
          >
            {t.btns[0]}
          </button>
          <button className="hbtn-s" onClick={() => scroll2('demo')} style={{padding:'18px 36px', background:'none', border:'1px solid var(--b2)', borderRadius:'100px', color:'var(--tm)', cursor:'pointer'}}>{t.btns[1]}</button>
        </div>
      </section>

      {/* PRODUCTS / TIMELINE - EXACT COPY */}
      <section className="section" id="productos">
        <div className="kicker" style={{fontFamily:'var(--fm)', fontSize:'10px', color:'var(--gold)', letterSpacing:'.2em', marginBottom:'18px'}}>{t.kicker1}</div>
        <h2 className="sec-h">{t.secH1[0]}<br/><em>{t.secH1[1]}</em></h2>
        <div className="timeline">
          {t.products.map((p, i) => (
            <div key={i} className={`prod-card ${i === 0 ? 'featured' : ''}`}>
              <div className="prod-ghost">{p.ghost}</div>
              <span className="prod-status">{p.status}</span>
              <div className="prod-title" style={{marginTop:'20px'}}>{p.title}</div>
              <div className="prod-sub" style={{fontFamily:'var(--fm)', fontSize:'10px', color:'var(--td)', marginBottom:'20px'}}>{p.sub}</div>
              <p className="prod-tagline" style={{fontSize:'15px', color:'var(--tm)', lineHeight:'1.75', marginBottom:'28px'}}>{p.tag}</p>
              <div className="prod-feat">
                {p.feat.map((f, j) => <div key={j} className="pfeat">{f}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ROADMAP - EXACT COPY */}
      <section className="section" id="roadmap">
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'64px'}}>
          <h2 className="sec-h">Roadmap <em>{t.roadmap.h.split(' ')[1]}</em></h2>
          <div style={{textAlign:'right'}}>
            <div style={{fontFamily:'var(--fm)', fontSize:'10px', color:'var(--td)'}}>{t.roadmap.date}</div>
          </div>
        </div>
        <div className="roadmap-phases">
          {t.roadmap.phases.map((ph, i) => (
            <div key={i} className="rphase">
              <div className="rphase-ghost">{ph.ghost}</div>
              <div className="rphase-tag">{ph.tag}</div>
              <div className="rphase-week" style={{fontFamily:'var(--fm)', fontSize:'10px', color:'var(--td)', marginBottom:'16px'}}>{ph.week}</div>
              <div className="rphase-title" style={{fontFamily:'var(--ff)', fontSize:'20px', fontWeight:'900', marginBottom:'12px'}}>{ph.title}</div>
              <div className="rphase-items">
                {ph.items.map((item, j) => <div key={j} style={{fontSize:'10px', color:'var(--td)', marginBottom:'4px'}}>• {item}</div>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="section" style={{textAlign:'center', background:'var(--bg2)'}}>
        <h2 className="sec-h" style={{fontSize:'clamp(52px,7vw,96px)'}}>{t.cta.h}</h2>
        <p className="cta-p" style={{fontSize:'17px', color:'var(--tm)', maxWidth:'500px', margin:'40px auto'}}>{t.cta.p}</p>
        <button className="btn-gd" style={{padding:'18px 44px', fontSize:'15px'}}>{t.cta.btn}</button>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'48px 5vw', borderTop:'1px solid var(--b1)', display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--bg)'}}>
        <div className="foot-logo">ALEX <em>IO</em></div>
        <div style={{fontFamily:'var(--fm)', fontSize:'9px', color:'var(--td)'}}>© 2026 ALEX IO SYSTEMS</div>
      </footer>

      <WebChatWidget />
    </div>
  );
};

export default LandingPage;
