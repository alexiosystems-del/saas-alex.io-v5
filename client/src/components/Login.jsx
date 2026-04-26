import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Globe, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [rememberSession, setRememberSession] = useState(true);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('error');

    const showMsg = (text, type = 'error') => {
        setMessage(text);
        setMessageType(type);
    };

    const handleGoogleLogin = async () => {
        if (!supabase) {
            showMsg('Supabase no está configurado correctamente.');
            return;
        }
        setLoading(true);
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: { redirectTo: window.location.origin + '/#/dashboard' }
            });
            if (error) throw error;
        } catch (error) {
            console.error("Google Auth Error:", error);
            showMsg(error.message);
            setLoading(false);
        }
    };

    const handleAuth = async (e) => {
        e.preventDefault();
        if (!supabase) {
            const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
            const keyRaw = import.meta.env.VITE_SUPABASE_ANON_KEY || 'MISSING';
            const keyValid = keyRaw.startsWith('eyJ');
            showMsg(`Supabase no configurado. URL: ${hasUrl ? 'OK' : 'FAIL'}, KEY: ${keyValid ? 'JWT' : 'INVALID/MISSING'}. Ver: 2.0.4.21`);
            return;
        }
        setLoading(true);
        setMessage('');

        try {
            if (isSignUp) {
                const normalizedEmail = email.trim().toLowerCase();
                try {
                    const { fetchJsonWithApiFallback } = await import('../api.js');
                    const { response } = await fetchJsonWithApiFallback('/api/auth/register', {
                        method: 'POST',
                        body: JSON.stringify({ email: normalizedEmail, password })
                    });
                    if (response.ok) {
                        showMsg('✅ ¡Cuenta creada exitosamente! Ingresá tu contraseña para iniciar sesión.', 'success');
                        setIsSignUp(false);
                        return;
                    }
                } catch (beErr) {
                    console.warn('[Registration] Backend error:', beErr.message);
                    if (!beErr.message.includes('requiere SUPABASE_SERVICE_ROLE_KEY')) {
                        // Error de red u otro error fatal, pero permitimos fallback a Supabase si es posible
                    }
                }
                const { error } = await supabase.auth.signUp({
                    email: normalizedEmail,
                    password,
                    options: { emailRedirectTo: window.location.origin + '/#/login' }
                });
                if (error) throw error;
                showMsg('✅ ¡Cuenta creada! Revisá tu casilla de email para confirmar tu cuenta.', 'success');
            } else {
                const normalizedEmail = email.trim().toLowerCase();
                const { data, error } = await supabase.auth.signInWithPassword({ email: normalizedEmail, password });
                if (error) throw error;
                if (!data.session) throw new Error('No se pudo establecer sesión con Supabase.');

                let backendToken = null;
                let backendRole = data.user?.user_metadata?.role || 'OWNER';
                let backendTenant = data.user?.id;

                try {
                    const { fetchJsonWithApiFallback } = await import('../api.js');
                    const { data: backendData } = await fetchJsonWithApiFallback('/api/auth/session-exchange', {
                        method: 'POST',
                        body: JSON.stringify({ access_token: data.session.access_token })
                    });
                    
                    if (backendData.token) {
                        backendToken = backendData.token;
                        backendRole = backendData.role || backendRole;
                        backendTenant = backendData.tenantId || backendTenant;
                    } else {
                        throw new Error(`Detalle: ${JSON.stringify(backendData)}`);
                    }
                } catch (backendErr) {
                    console.error('❌ Backend Session Error:', backendErr.message);
                    throw new Error(`Error de sincronización: ${backendErr.message}`);
                }

                localStorage.setItem('alex_io_token', backendToken);
                localStorage.setItem('demo_email', data.user.email);
                localStorage.setItem('alex_io_role', backendRole);
                localStorage.setItem('alex_io_tenant', backendTenant);

                if (!rememberSession) {
                    sessionStorage.setItem('alex_io_token', backendToken);
                    localStorage.removeItem('alex_io_token');
                }

                navigate((backendRole === 'SUPERADMIN') ? '/superadmin' : '/dashboard');
            }
        } catch (error) {
            console.error('Auth Error:', error);
            const msg = error.message;
            if (msg.includes('Invalid login credentials')) {
                showMsg('Email o contraseña incorrectos.');
            } else if (msg.includes('Email not confirmed')) {
                showMsg('Necesitás confirmar tu email. Buscá el link en tu casilla de correo.');
            } else if (msg.includes('User already registered')) {
                showMsg('Ya existe una cuenta con ese email. Usá "Iniciar Sesión".');
            } else if (msg.includes('Password should be')) {
                showMsg('La contraseña debe tener al menos 6 caracteres.');
            } else {
                showMsg(msg || 'Error al conectar con el servidor.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#050510' }}>
            {/* Animated Background */}
            <div className="animated-bg" />

            {/* Floating Orbs */}
            <div className="glass-orb" style={{ width: 500, height: 500, top: '-20%', left: '-10%', background: 'rgba(6, 182, 212, 0.1)' }} />
            <div className="glass-orb" style={{ width: 400, height: 400, bottom: '-15%', right: '-10%', background: 'rgba(139, 92, 246, 0.1)', animationDelay: '-7s' }} />
            <div className="glass-orb" style={{ width: 200, height: 200, top: '60%', left: '60%', background: 'rgba(236, 72, 153, 0.06)', animationDelay: '-3s' }} />

            {/* Back Link */}
            <div className="absolute top-6 left-6 z-20">
                <Link to="/" className="flex items-center gap-2 text-white/30 hover:text-white/70 transition-colors text-sm">
                    <ArrowLeft size={18} /> Volver
                </Link>
            </div>

            {/* Login Card */}
            <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="glass-card p-8 md:p-10 w-full max-w-md relative z-10"
                style={{ '--glass-blur': '30px' }}
            >
                {/* Logo */}
                <div className="flex justify-center mb-7">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center shimmer-border" style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.15), rgba(139,92,246,0.15))' }}>
                        <Globe className="text-cyan-400 w-8 h-8" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-white mb-2 text-center tracking-tight">
                    {isSignUp ? 'Crear Cuenta' : 'Bienvenido'}
                </h1>
                <p className="text-white/30 text-sm text-center mb-7">
                    {isSignUp ? 'Registrate para empezar' : 'Ingresá a tu cuenta'}
                </p>

                {/* Toggle Tabs */}
                <div className="flex gap-1 mb-7 p-1 rounded-xl glass" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <button
                        onClick={() => { setIsSignUp(false); setMessage(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${!isSignUp ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        Iniciar Sesión
                    </button>
                    <button
                        onClick={() => { setIsSignUp(true); setMessage(''); }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${isSignUp ? 'bg-white/10 text-white shadow-lg' : 'text-white/30 hover:text-white/60'}`}
                    >
                        Registrarse
                    </button>
                </div>

                {/* Google Button */}
                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full mb-5 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: 'rgba(255,255,255,0.95)', color: '#1a1a2e' }}
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                </button>

                <div className="flex items-center gap-3 mb-5">
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <span className="text-white/20 text-xs">o con email</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Email Form */}
                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-white/40 text-xs font-bold mb-2 uppercase tracking-wider">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full glass-input"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-white/40 text-xs font-bold mb-2 uppercase tracking-wider">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full glass-input"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {message && (
                        <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-4 rounded-xl text-sm flex items-start gap-2 glass ${messageType === 'success'
                                ? 'text-emerald-300 border-emerald-500/20'
                                : 'text-red-300 border-red-500/20'
                            }`}
                            style={{ background: messageType === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)' }}
                        >
                            {messageType === 'success' ? <Mail size={16} className="mt-0.5 shrink-0" /> : null}
                            <span>{message}</span>
                        </motion.div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full glass-btn py-4 text-base flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {loading && <Loader2 className="animate-spin" size={20} />}
                        <span>{isSignUp ? 'Crear Cuenta' : 'Entrar'}</span>
                    </button>
                </form>

                <div className="mt-7 text-center text-sm text-white/25">
                    {isSignUp ? '¿Ya tenés cuenta?' : '¿No tenés cuenta?'}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setMessage(''); }}
                        className="ml-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                    >
                        {isSignUp ? 'Ingresá aquí' : 'Registrate gratis'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}
