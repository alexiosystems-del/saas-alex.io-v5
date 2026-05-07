import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState('onyx');
  const [lang, setLang] = useState('es');
  const [step, setStep] = useState(-1);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
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
        'Respuestas en segundos',
        'Seguimiento automático',
        'Más ventas sin equipo',
        'IA multilingüe con contexto'
      ],
      btns: ['ACTIVAR ALEX IO AHORA', 'Ver demo en vivo'],
      kicker1: 'Visión de producto · 2025–2026',
      secH1: ['Tres productos.', 'Un solo cerebro.'],
      access: 'ACCESO MASTER'
    },
    en: {
      nav: ['Channels', 'Architecture', 'Pricing', 'Roadmap v2'],
      badge: 'The new frontier of automated closing',
      h1: ['Every message you', 'dont answer is', 'lost money.'],
      p: 'ALEX IO answers, qualifies, and converts customers automatically on WhatsApp and social media, 24/7.',
      mini: [
        'Responses in seconds',
        'Automated follow-up',
        'More sales without a team',
        'Multilingual AI with context'
      ],
      btns: ['ACTIVATE ALEX IO NOW', 'Watch live demo'],
      kicker1: 'Product Vision · 2025–2026',
      secH1: ['Three products.', 'One single brain.'],
      access: 'MASTER ACCESS'
    }
  };

  const t = content[lang];

  return (
    <div className="landing-wrapper">
      <style>{`
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        :root {
          --gold:#C5A028; --gold2:#D4B03A; --gold3:#E8C84A;
          --gold-glow:rgba(197,160,40,0.35); --gold-dim:rgba(197,160,40,0.08);
          --gold-mid:rgba(197,160,40,0.25); --ff:'Playfair Display',Georgia,serif;
          --fb:'Instrument Sans',sans-serif; --fm:'DM Mono',monospace;
        }
        [data-theme="onyx"] {
          --bg:#08080D; --bg2:#0D0D14; --bg3:#121219;
          --b1:rgba(255,255,255,0.06); --b2:rgba(255,255,255,0.10);
          --b3:rgba(255,255,255,0.15); --tx:#F2F0E8; --tm:#8A8880;
          --td:#3A3830; --glass:rgba(255,255,255,0.04); --glass-h:rgba(255,255,255,0.07);
        }
        [data-theme="silver"] {
          --bg:#F5F3EE; --bg2:#ECEAE4; --bg3:#E2E0DA;
          --b1:rgba(0,0,0,0.06); --b2:rgba(0,0,0,0.10);
          --b3:rgba(0,0,0,0.18); --tx:#0A0A08; --tm:#5A5850;
          --td:#9A9890; --glass:rgba(0,0,0,0.03); --glass-h:rgba(0,0,0,0.06);
        }
        .landing-wrapper { background:var(--bg); color:var(--tx); font-family:var(--fb); min-height: 100vh; }
        nav{position:fixed;top:0;left:0;right:0;z-index:100;padding:0 5vw;height:68px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--b1);background:rgba(8,8,13,.92);backdrop-filter:blur(20px);}
        .nav-logo{display:flex;align-items:center;gap:10px;font-family:var(--ff);font-size:24px;font-weight:900;color:var(--tx);text-decoration:none}
        .nav-icon{width:34px;height:34px;background:var(--gold);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#fff;transform:rotate(6deg);}
        .nav-logo em{color:var(--gold);font-style:italic}
        .nav-links{display:flex;gap:32px;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}
        .nav-links a{color:var(--tm);text-decoration:none;cursor:pointer}
        .btn-gd{padding:10px 22px;background:var(--gold);border:none;border-radius:100px;color:#fff;font-size:11px;font-weight:700;cursor:pointer;}
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:120px 5vw 80px;}
        .hero-h1{font-family:var(--ff);font-size:clamp(52px,8.5vw,118px);line-height:.94;font-weight:900;margin-bottom:28px;}
        .hero-h1 em{font-style:italic;color:var(--gold);}
        .hero-p{font-size:clamp(15px,1.7vw,20px);color:var(--tm);max-width:600px;line-height:1.75;margin-bottom:44px;}
        .hero-mini{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:800px;margin-bottom:44px;}
        .mini-card{padding:20px 16px;border:1px solid var(--b1);background:var(--glass);border-radius:16px;}
        .mini-icon{color:var(--gold);font-size:20px;margin-bottom:10px;}
        .mini-txt{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--tm)}
        .section{padding:100px 5vw;border-top:1px solid var(--b1);}
        .sec-h{font-family:var(--ff);font-size:clamp(44px,6vw,80px);font-weight:900;line-height:.93;}
        .sec-h em{font-style:italic;color:var(--gold)}
        .timeline{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;margin-top:64px;}
        .prod-card{padding:52px 44px;border:1px solid var(--b1);background:var(--bg2);position:relative;}
        .featured{background:var(--gold-dim);border-color:var(--gold-mid);}
        .dashboard-preview-img { width: 100%; border-radius: 20px; border: 1px solid var(--b2); margin-top: 40px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
      `}</style>

      {/* NAV */}
      <nav>
        <a className="nav-logo" href="#">
          <div className="nav-icon">A</div>
          ALEX <em>IO</em>
        </a>
        <div className="nav-links">
          {t.nav.map((n, i) => <a key={i} onClick={() => scroll2('canales')}>{n}</a>)}
          <button onClick={() => setLang(lang === 'es' ? 'en' : 'es')} style={{background:'none', border:'none', color:'var(--gold)', fontWeight:'bold', cursor:'pointer'}}>
            {lang.toUpperCase()}
          </button>
        </div>
        <div className="nav-r">
          <button className="btn-gd" onClick={handleEnter}>{t.access}</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge" style={{padding:'8px 18px', border:'1px solid var(--b2)', borderRadius:'100px', fontSize:'11px', color:'var(--tm)', marginBottom:'40px'}}>{t.badge}</div>
        <h1 className="hero-h1">{t.h1[0]}<br/>{t.h1[1]}<br/><em>{t.h1[2]}</em></h1>
        <p className="hero-p">{t.p}</p>
        
        <div className="hero-mini">
          {t.mini.map((m, i) => (
            <div key={i} className="mini-card">
              <div className="mini-icon">⚡</div>
              <div className="mini-txt">{m}</div>
            </div>
          ))}
        </div>

        {/* Dashboard Image Requested */}
        <div style={{maxWidth:'1000px', width:'100%'}}>
           <img src="https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2000&auto=format&fit=crop" className="dashboard-preview-img" alt="Neural Command Center" />
        </div>
      </section>

      {/* TIMELINE */}
      <section className="section" id="productos">
        <div className="kicker" style={{color:'var(--gold)', fontSize:'10px', marginBottom:'20px'}}>{t.kicker1}</div>
        <h2 className="sec-h">{t.secH1[0]}<br/><em>{t.secH1[1]}</em></h2>
        <div className="timeline">
          <div className="prod-card featured">
            <h3 style={{fontSize:'32px', marginBottom:'20px'}}>ALEX IO</h3>
            <p style={{color:'var(--tm)', fontSize:'14px'}}>Automatización comercial · Ventas · CRM</p>
          </div>
          <div className="prod-card">
            <h3 style={{fontSize:'32px', marginBottom:'20px'}}>INCLUSIVE</h3>
            <p style={{color:'var(--tm)', fontSize:'14px'}}>Accesibilidad universal</p>
          </div>
          <div className="prod-card">
            <h3 style={{fontSize:'32px', marginBottom:'20px'}}>TRANSLATE</h3>
            <p style={{color:'var(--tm)', fontSize:'14px'}}>Comunicación sin fronteras</p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{padding:'50px 5vw', borderTop:'1px solid var(--b1)', textAlign:'center'}}>
        <div className="foot-logo" style={{fontSize:'24px', fontWeight:'900'}}>ALEX <em>IO</em></div>
        <p style={{fontSize:'10px', color:'var(--tm)', marginTop:'10px'}}>© 2026 ALEX IO SYSTEMS</p>
      </footer>
    </div>
  );
};

export default LandingPage;
