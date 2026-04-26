import React, { useState, useEffect } from 'react';
import { fetchJsonWithApiFallback, getAuthHeaders } from '../api';
import {
    Users, DollarSign, Activity, ShieldAlert, Search, MessageCircle, Server,
    ChevronDown, ChevronRight, RefreshCw, Power, Trash2, AlertTriangle,
    Info, Cpu, Zap, Heart
} from 'lucide-react';

// --- Inject Inter Font ---
if (typeof document !== 'undefined' && !document.getElementById('inter-font-sa')) {
    const link = document.createElement('link');
    link.id = 'inter-font-sa';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap';
    document.head.appendChild(link);
}

// --- DESIGN TOKENS: Soft Mode + Deep Ocean Blue ---
const T = {
    bg: '#1a2744',
    bgGradient: 'linear-gradient(135deg, #1a2744 0%, #162038 50%, #1e2d4d 100%)',
    glass: 'rgba(255, 255, 255, 0.06)',
    glassBorder: 'rgba(0, 119, 134, 0.2)',
    glassHover: 'rgba(255, 255, 255, 0.1)',
    accent: '#007786',
    accentLight: '#00a5b5',
    accentGlow: 'rgba(0, 119, 134, 0.3)',
    text: '#e8edf5',
    textMuted: '#94a3c0',
    textDim: '#607090',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#a78bfa',
    cyan: '#22d3ee',
    font: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
};

// --- Shared Styles ---
const glassCard = (extra: React.CSSProperties = {}): React.CSSProperties => ({
    background: T.glass,
    border: `1px solid ${T.glassBorder}`,
    borderRadius: 16,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    ...extra,
});

interface GlobalStats {
    total_users: number; active_bots: number; total_revenue: number;
    total_messages: number; bots_with_errors: number; estimated_daily_cost: number;
}

interface SreHealthSnapshot {
    http: { error_5xx_count: number; latency_avg_ms: number; latency_p95_ms: number };
    ai: { failures: number; latency_avg_ms: number; providers: Record<string, any> };
    whatsapp: { failures: number; latency_avg_ms: number; latency_p95_ms: number };
    window: { requests: number; ai_calls: number; whatsapp_messages: number };
    generated_at: string;
}

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState<GlobalStats>({ total_users: 0, active_bots: 0, total_revenue: 0, total_messages: 0, bots_with_errors: 0, estimated_daily_cost: 0 });
    const [clients, setClients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedBot, setExpandedBot] = useState<string | null>(null);
    const [botDetails, setBotDetails] = useState<any>(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [healthData, setHealthData] = useState<SreHealthSnapshot | null>(null);
    const [aiDiag, setAiDiag] = useState<any>(null);

    useEffect(() => { fetchGlobalData(); const iv = setInterval(fetchGlobalData, 30000); return () => clearInterval(iv); }, []);

    const fetchGlobalData = async () => {
        try {
            setLoading(true);
            const { response, data } = await fetchJsonWithApiFallback('/api/saas/superadmin/clients', { headers: { ...getAuthHeaders() } });
            if (response.ok && data.clients) {
                const totalMsgs = data.clients.reduce((acc: number, c: any) => acc + (c.usage?.messages_sent || 0), 0);
                const allBots = data.clients.flatMap((c: any) => c.bots || []);
                const revMap: Record<string, number> = { 'PRO': 29.99, 'ENTERPRISE': 99.99, 'FREE': 0 };
                const revenue = data.clients.reduce((acc: number, c: any) => acc + (revMap[c.plan?.toUpperCase()] || 0), 0);
                let totalCost = 0;
                allBots.forEach((b: any) => { if (b.ai_usage) { totalCost += (b.ai_usage.openai?.tokens || 0) / 1e6 * 0.60; totalCost += (b.ai_usage.deepseek?.tokens || 0) / 1e6 * 0.28; } });
                setClients(data.clients);
                setStats({ total_users: data.clients.length, active_bots: allBots.length, total_revenue: revenue, total_messages: totalMsgs, bots_with_errors: allBots.filter((b: any) => b.last_error).length, estimated_daily_cost: totalCost });
            }
            try {
                const healthRes = await fetchJsonWithApiFallback('/api/sre/health', { headers: { ...getAuthHeaders() } });
                if (healthRes.response.ok && healthRes.data) {
                    const raw = healthRes.data.health || healthRes.data || {};
                    setHealthData({
                        http: { error_5xx_count: 0, latency_avg_ms: 0, latency_p95_ms: 0, ...raw.http },
                        ai: { failures: 0, latency_avg_ms: 0, providers: {}, ...raw.ai },
                        whatsapp: { failures: 0, latency_avg_ms: 0, latency_p95_ms: 0, ...raw.whatsapp },
                        window: { requests: 0, ai_calls: 0, whatsapp_messages: 0, ...raw.window },
                        generated_at: raw.generated_at || new Date().toISOString()
                    });
                }
            } catch (e: any) { console.warn('SRE Health fetch failed:', e.message); }
            // Fetch AI Diagnostics
            try {
                const diagRes = await fetchJsonWithApiFallback('/api/diagnostics/ai', {});
                if (diagRes.response.ok && diagRes.data) setAiDiag(diagRes.data);
            } catch (e: any) { console.warn('AI Diag fetch failed:', e.message); }
        } catch (err: any) { console.error("SuperAdmin Error:", err.message); }
        finally { setLoading(false); }
    };

    const fetchBotDetails = async (instanceId: string) => {
        if (expandedBot === instanceId) { setExpandedBot(null); setBotDetails(null); return; }
        setExpandedBot(instanceId); setLoadingDetails(true);
        try {
            const { response, data } = await fetchJsonWithApiFallback(`/api/saas/superadmin/bot-details/${instanceId}`, { headers: { ...getAuthHeaders() } });
            if (response.ok && data.success) setBotDetails(data);
        } catch (err: any) { console.error("Bot details error:", err.message); }
        finally { setLoadingDetails(false); }
    };

    const executeBotAction = async (instanceId: string, action: string) => {
        if (action === 'delete' && !confirm(`¿Eliminar permanentemente el bot ${instanceId}?`)) return;
        setActionLoading(`${instanceId}_${action}`);
        try {
            const { response, data } = await fetchJsonWithApiFallback('/api/saas/superadmin/bot-action', { method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ instanceId, action }) });
            if (response.ok) { alert(data.message || 'Acción ejecutada.'); fetchGlobalData(); }
            else alert(data.error || 'Error');
        } catch (err: any) { alert('Error: ' + err.message); }
        finally { setActionLoading(null); }
    };

    const filteredClients = clients.filter(c => c.email?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (loading && clients.length === 0) return (
        <div style={{ minHeight: '100vh', background: T.bgGradient, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: T.font }}>
            <div style={{ textAlign: 'center', color: T.textMuted }}>
                <RefreshCw size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: 12, color: T.accent }} />
                <p>Accediendo a la Consola de Control...</p>
            </div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: T.bgGradient, color: T.text, padding: '32px 40px', fontFamily: T.font }}>
            {/* Ambient Glow */}
            <div style={{ position: 'fixed', top: -200, right: -200, width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, ${T.accentGlow} 0%, transparent 70%)`, pointerEvents: 'none', zIndex: 0 }} />

            {/* Header */}
            <header style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative', zIndex: 1 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: T.accent }}>
                        <ShieldAlert size={18} />
                        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3 }}>SaaS SuperAdmin</span>
                    </div>
                    <h1 style={{ fontSize: 36, fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                        Consola Global <span style={{ color: T.accentLight }}>ALEX IO</span>
                    </h1>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button onClick={fetchGlobalData} style={{ ...glassCard({ borderRadius: 12, padding: '8px 16px', cursor: 'pointer', color: T.textMuted, fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s' })}}>
                        <RefreshCw size={14} style={loading ? { animation: 'spin 1s linear infinite' } : {}} /> Actualizar
                    </button>
                    <div style={{ position: 'relative' }}>
                        <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textDim }} size={16} />
                        <input type="text" placeholder="Buscar por email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ ...glassCard({ borderRadius: 12, padding: '8px 12px 8px 38px', fontSize: 13, color: T.text, outline: 'none', width: 240 })} as any} />
                    </div>
                </div>
            </header>

            {/* Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))', gap: 16, marginBottom: 40, position: 'relative', zIndex: 1 }}>
                <MetricCard icon={<Users size={18} />} title="Clientes" value={stats.total_users} color={T.accentLight} />
                <MetricCard icon={<Server size={18} />} title="Bots Activos" value={stats.active_bots} color={T.success} />
                <MetricCard icon={<DollarSign size={18} />} title="MRR" value={`$${Math.round(stats.total_revenue)}`} color={T.warning} />
                <MetricCard icon={<MessageCircle size={18} />} title="Mensajes" value={stats.total_messages.toLocaleString()} color={T.purple} />
                <MetricCard icon={<AlertTriangle size={18} />} title="Bots con Errores" value={stats.bots_with_errors} color={stats.bots_with_errors > 0 ? T.danger : T.textDim} accent={stats.bots_with_errors > 0} />
                <MetricCard icon={<Cpu size={18} />} title="Costo IA / Día" value={`$${stats.estimated_daily_cost.toFixed(4)}`} color={T.cyan} />
            </div>

            {/* SRE Health */}
            {healthData && (
                <div style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Activity size={16} style={{ color: T.success }} />
                        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: T.textMuted, margin: 0 }}>Observabilidad SRE v5</h3>
                        <span style={{ fontSize: 10, color: T.textDim, marginLeft: 'auto' }}>Última: {new Date(healthData.generated_at).toLocaleTimeString()}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                        <HealthPanel title="Infraestructura HTTP" icon={<Server size={15} />} metrics={[
                            { label: 'Errores 5xx', value: healthData.http.error_5xx_count, unit: 'req', bad: healthData.http.error_5xx_count > 0 },
                            { label: 'Latencia P95', value: healthData.http.latency_p95_ms, unit: 'ms', warn: healthData.http.latency_p95_ms > 800 },
                            { label: 'Ventana', value: healthData.window.requests, unit: 'req' }
                        ]} />
                        <HealthPanel title="Motores de IA" icon={<Zap size={15} />} metrics={[
                            { label: 'Fallos Críticos', value: healthData.ai.failures, unit: 'err', bad: healthData.ai.failures > 0 },
                            { label: 'Latencia Promedio', value: healthData.ai.latency_avg_ms, unit: 'ms' },
                            { label: 'Llamadas (Win)', value: healthData.window.ai_calls, unit: 'op' }
                        ]} />
                        <HealthPanel title="WhatsApp Gateway" icon={<MessageCircle size={15} />} metrics={[
                            { label: 'Errores Proces.', value: healthData.whatsapp.failures, unit: 'msg', bad: healthData.whatsapp.failures > 0 },
                            { label: 'Latencia P95', value: healthData.whatsapp.latency_p95_ms, unit: 'ms', warn: healthData.whatsapp.latency_p95_ms > 2000 },
                            { label: 'Tráfico (Win)', value: healthData.window.whatsapp_messages, unit: 'msg' }
                        ]} />
                    </div>
                </div>
            )}

            {/* AI Provider Health Panel */}
            {aiDiag && (
                <div style={{ marginBottom: 40, position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                        <Zap size={16} style={{ color: T.warning }} />
                        <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 3, color: T.textMuted, margin: 0 }}>Estado de APIs de IA — Créditos & Conexión</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
                        {[
                            { name: 'Gemini', key: 'gemini', color: '#4285F4', icon: '🔷' },
                            { name: 'OpenAI', key: 'openai', color: '#10a37f', icon: '🟢' },
                            { name: 'DeepSeek', key: 'deepseek', color: T.purple, icon: '🟣' },
                            { name: 'Anthropic', key: 'anthropic', color: '#d97706', icon: '🟠' },
                        ].map(provider => {
                            const info = aiDiag[provider.key];
                            if (!info) return null;
                            const status = !info.configured ? 'MISSING' : info.dead ? 'DEAD' : 'ONLINE';
                            const statusColor = status === 'ONLINE' ? T.success : status === 'DEAD' ? T.danger : T.textDim;
                            const statusBg = status === 'ONLINE' ? 'rgba(16,185,129,0.12)' : status === 'DEAD' ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)';
                            return (
                                <div key={provider.key} style={glassCard({ padding: 18 })}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                        <span style={{ fontSize: 18 }}>{provider.icon}</span>
                                        <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{provider.name}</span>
                                        <span style={{
                                            marginLeft: 'auto', fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 20,
                                            background: statusBg, color: statusColor, border: `1px solid ${statusColor}40`,
                                            letterSpacing: 1, textTransform: 'uppercase'
                                        }}>{status}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                            <span style={{ color: T.textDim }}>API Key</span>
                                            <span style={{ fontFamily: 'monospace', color: info.configured ? T.text : T.danger, fontSize: 10 }}>{info.masked}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                            <span style={{ color: T.textDim }}>Estado</span>
                                            <span style={{ color: statusColor, fontWeight: 600 }}>{
                                                status === 'ONLINE' ? '✓ Operativa' : status === 'DEAD' ? '✗ Expirada/Sin crédito' : '— No configurada'
                                            }</span>
                                        </div>
                                        {info.dead && (
                                            <div style={{ fontSize: 10, color: T.danger, background: 'rgba(239,68,68,0.08)', padding: '6px 10px', borderRadius: 8, marginTop: 4 }}>
                                                ⚠️ Key desactivada por Circuit Breaker. Renovar en Render.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {/* Cache Stats */}
                        {aiDiag.cache && (
                            <div style={glassCard({ padding: 18 })}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                                    <span style={{ fontSize: 18 }}>📊</span>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: T.text }}>Cache IA</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {[
                                        ['Hits', aiDiag.cache.hits],
                                        ['Misses', aiDiag.cache.misses],
                                        ['Keys Activas', aiDiag.cache.keys],
                                        ['Hit Rate', aiDiag.cache.hits + aiDiag.cache.misses > 0 ? `${((aiDiag.cache.hits / (aiDiag.cache.hits + aiDiag.cache.misses)) * 100).toFixed(1)}%` : '0%']
                                    ].map(([label, value]) => (
                                        <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                                            <span style={{ color: T.textDim }}>{label}</span>
                                            <span style={{ fontFamily: 'monospace', color: T.text }}>{value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Clients Table */}
            <section style={{ ...glassCard({ overflow: 'hidden', boxShadow: `0 8px 32px rgba(0,0,0,0.2)` }), position: 'relative', zIndex: 1 }}>
                <div style={{ padding: '20px 24px', borderBottom: `1px solid ${T.glassBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Users size={16} style={{ color: T.textDim }} /> Directorio de Entidades (Tenants)
                    </h3>
                    <span style={{ fontSize: 11, color: T.textDim }}>{filteredClients.length} clientes</span>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: `1px solid ${T.glassBorder}` }}>
                                {['Tenant (Email)', 'Plan', 'Uso', 'Tokens IA', 'Bots'].map(h => (
                                    <th key={h} style={{ padding: '14px 24px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: T.textDim }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map(client => (
                                <React.Fragment key={client.id}>
                                    <tr style={{ borderBottom: `1px solid rgba(255,255,255,0.03)`, transition: 'background 0.15s' }}
                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                        <td style={{ padding: '14px 24px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${T.accent}, ${T.accentLight})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 13 }}>
                                                    {client.email?.[0]?.toUpperCase()}
                                                </div>
                                                <div>
                                                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{client.email}</p>
                                                    <p style={{ margin: 0, fontSize: 11, color: T.textDim }}>ID: {client.tenant_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 24px' }}>
                                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1,
                                                background: client.plan === 'ENTERPRISE' ? 'rgba(167,139,250,0.15)' : client.plan === 'PRO' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.06)',
                                                color: client.plan === 'ENTERPRISE' ? T.purple : client.plan === 'PRO' ? T.warning : T.textDim,
                                                border: `1px solid ${client.plan === 'ENTERPRISE' ? 'rgba(167,139,250,0.3)' : client.plan === 'PRO' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.1)'}`,
                                            }}>{client.plan || 'FREE'}</span>
                                        </td>
                                        <td style={{ padding: '14px 24px' }}>
                                            <div style={{ width: 90 }}>
                                                <div style={{ width: '100%', height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                                    <div style={{ width: `${Math.min(((client.usage?.messages_sent || 0) / Math.max(client.usage?.plan_limit || 1, 1)) * 100, 100)}%`, height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${T.accent}, ${T.accentLight})` }} />
                                                </div>
                                                <span style={{ fontSize: 10, color: T.textDim }}>{client.usage?.messages_sent || 0} / {client.usage?.plan_limit || 0}</span>
                                            </div>
                                        </td>
                                        <td style={{ padding: '14px 24px' }}>
                                            <span style={{ fontSize: 12, fontFamily: 'monospace', color: T.purple }}>{client.usage?.tokens_consumed ? `${(client.usage.tokens_consumed / 1000).toFixed(1)}k` : '0'}</span>
                                        </td>
                                        <td style={{ padding: '14px 24px' }}>
                                            {client.bots?.length > 0 ? (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                    {client.bots.map((b: any) => (
                                                        <button key={b.instance_id} onClick={() => fetchBotDetails(b.instance_id)}
                                                            style={{ ...glassCard({ borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 8, color: T.text, transition: 'all 0.2s',
                                                                ...(expandedBot === b.instance_id ? { background: `rgba(0,119,134,0.15)`, borderColor: T.accent } : {}) }) }}>
                                                            <div style={{ width: 7, height: 7, borderRadius: '50%', background: b.status === 'online' ? T.success : T.danger, boxShadow: b.status === 'online' ? `0 0 6px ${T.success}` : 'none' }} />
                                                            <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{b.company_name}</span>
                                                            <span style={{ marginLeft: 'auto', fontSize: 9, fontWeight: 700, color: (b.health_score ?? 100) >= 80 ? T.success : (b.health_score ?? 100) >= 50 ? T.warning : T.danger }}>{b.health_score ?? 100}</span>
                                                            {b.last_error && <AlertTriangle size={10} style={{ color: T.danger }} />}
                                                            {expandedBot === b.instance_id ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                        </button>
                                                    ))}
                                                </div>
                                            ) : <span style={{ fontSize: 12, color: T.textDim, fontStyle: 'italic' }}>Sin bots</span>}
                                        </td>
                                    </tr>
                                    {/* Expanded Bot Details */}
                                    {client.bots?.map((b: any) => expandedBot === b.instance_id && (
                                        <tr key={`det-${b.instance_id}`}>
                                            <td colSpan={5} style={{ padding: 0 }}>
                                                <div style={{ background: 'rgba(0,119,134,0.05)', borderTop: `1px solid ${T.glassBorder}`, borderBottom: `1px solid ${T.glassBorder}`, padding: 24 }}>
                                                    {loadingDetails ? <div style={{ textAlign: 'center', color: T.textMuted, padding: 16 }}>Cargando detalles...</div> : botDetails ? (
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                                                            {/* Bot Header */}
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                                                    <div><h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{botDetails.company_name}</h4><p style={{ margin: 0, fontSize: 11, color: T.textDim, fontFamily: 'monospace' }}>{botDetails.instance_id}</p></div>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                        <Heart size={14} style={{ color: (botDetails.health_score ?? 100) >= 80 ? T.success : T.danger }} />
                                                                        <span style={{ fontSize: 20, fontWeight: 800, color: (botDetails.health_score ?? 100) >= 80 ? T.success : (botDetails.health_score ?? 100) >= 50 ? T.warning : T.danger }}>{botDetails.health_score ?? 100}</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ display: 'flex', gap: 8 }}>
                                                                    {[
                                                                        { action: 'reconnect', icon: <RefreshCw size={12} />, label: 'Reconectar', bg: 'rgba(16,185,129,0.15)', color: T.success },
                                                                        { action: 'disconnect', icon: <Power size={12} />, label: 'Desconectar', bg: 'rgba(245,158,11,0.15)', color: T.warning },
                                                                        { action: 'delete', icon: <Trash2 size={12} />, label: 'Eliminar', bg: 'rgba(239,68,68,0.15)', color: T.danger },
                                                                    ].map(a => (
                                                                        <button key={a.action} onClick={() => executeBotAction(b.instance_id, a.action)} disabled={actionLoading === `${b.instance_id}_${a.action}`}
                                                                            style={{ background: a.bg, color: a.color, border: 'none', borderRadius: 10, padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'opacity 0.2s', opacity: actionLoading === `${b.instance_id}_${a.action}` ? 0.5 : 1 }}>
                                                                            {a.icon} {a.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* AI Usage */}
                                                            <div>
                                                                <h5 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: T.textDim, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Cpu size={13} /> Consumo por Modelo</h5>
                                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                                                                    {[
                                                                        { name: 'Gemini', color: T.accentLight, data: botDetails.ai_usage?.gemini, cost: botDetails.estimated_costs?.gemini },
                                                                        { name: 'OpenAI', color: T.success, data: botDetails.ai_usage?.openai, cost: botDetails.estimated_costs?.openai },
                                                                        { name: 'DeepSeek', color: T.purple, data: botDetails.ai_usage?.deepseek, cost: botDetails.estimated_costs?.deepseek },
                                                                    ].map(m => (
                                                                        <div key={m.name} style={glassCard({ padding: 14 })}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}><Zap size={13} style={{ color: m.color }} /><span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{m.name}</span></div>
                                                                            {[['Llamadas', m.data?.count || 0], ['Tokens', (m.data?.tokens || 0) > 1000 ? `${((m.data?.tokens || 0) / 1000).toFixed(1)}k` : m.data?.tokens || 0], ['Costo', `$${(m.cost || 0).toFixed(4)}`]].map(([l, v]) => (
                                                                                <div key={l as string} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}><span style={{ color: T.textDim }}>{l}</span><span style={{ fontFamily: 'monospace', color: T.text }}>{v}</span></div>
                                                                            ))}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            {/* Event Logs */}
                                                            <div>
                                                                <h5 style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: T.textDim, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={13} /> Últimos Eventos</h5>
                                                                <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                                    {botDetails.logs?.length > 0 ? [...botDetails.logs].reverse().map((log: any, idx: number) => (
                                                                        <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 12px', borderRadius: 10, fontSize: 11, background: log.level === 'error' ? 'rgba(239,68,68,0.08)' : log.level === 'warn' ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${log.level === 'error' ? 'rgba(239,68,68,0.2)' : log.level === 'warn' ? 'rgba(245,158,11,0.15)' : 'rgba(255,255,255,0.05)'}` }}>
                                                                            {log.level === 'error' ? <AlertTriangle size={11} style={{ color: T.danger }} /> : log.level === 'warn' ? <AlertTriangle size={11} style={{ color: T.warning }} /> : <Info size={11} style={{ color: T.accentLight }} />}
                                                                            <span style={{ color: T.textDim, fontFamily: 'monospace', whiteSpace: 'nowrap' as const }}>{new Date(log.timestamp).toLocaleTimeString()}</span>
                                                                            <span style={{ flex: 1, color: T.text }}>{log.message}</span>
                                                                        </div>
                                                                    )) : <p style={{ color: T.textDim, fontSize: 12, textAlign: 'center', fontStyle: 'italic', padding: 16 }}>Sin eventos registrados aún.</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : <div style={{ textAlign: 'center', color: T.textDim, padding: 16 }}>No se pudieron cargar los detalles.</div>}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                    {filteredClients.length === 0 && <p style={{ textAlign: 'center', padding: 32, color: T.textDim, fontStyle: 'italic' }}>No se encontraron clientes.</p>}
                </div>
            </section>

            {/* CSS Animations */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};

// --- Sub-components ---
const MetricCard = ({ icon, title, value, color, accent }: any) => (
    <div style={{ ...glassCard({ padding: '20px 18px', transition: 'all 0.25s', cursor: 'default', ...(accent ? { borderColor: `rgba(239,68,68,0.3)` } : {}) }) }}
        onMouseEnter={e => { e.currentTarget.style.background = T.glassHover; e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.glass; e.currentTarget.style.transform = 'translateY(0)'; }}>
        <div style={{ marginBottom: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>{icon}</div>
        </div>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, color: T.textDim, margin: '0 0 4px' }}>{title}</p>
        <h4 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: accent ? T.danger : '#fff' }}>{value}</h4>
    </div>
);

const HealthPanel = ({ title, icon, metrics }: any) => (
    <div style={glassCard({ padding: 18 })}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, color: T.text }}>
            <div style={{ padding: 6, borderRadius: 8, background: 'rgba(255,255,255,0.06)' }}>{icon}</div>
            <h4 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, margin: 0 }}>{title}</h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {metrics.map((m: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>{m.label}</span>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                        <span style={{ fontSize: 15, fontFamily: 'monospace', fontWeight: 700, color: m.bad ? T.danger : m.warn ? T.warning : T.text }}>{m.value}</span>
                        <span style={{ fontSize: 9, textTransform: 'uppercase', color: T.textDim }}>{m.unit}</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default SuperAdminDashboard;
