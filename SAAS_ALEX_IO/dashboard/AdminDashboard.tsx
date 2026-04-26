import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Save, Shield, Layout, MessageSquare, Activity } from 'lucide-react';
import { useAuth } from '../src/auth/AuthContext';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface WhatsAppAccount {
    account_name: string;
    phone_number: string;
}

interface BotConfig {
    id: string;
    constitution: string;
    conversation_structure: string;
    system_prompt: string;
    conversion_goal: 'whatsapp' | 'calendly' | 'payment' | 'lead_form';
    cta_link: string;
    demo_mode: boolean;
    whatsapp_accounts: WhatsAppAccount;
}

interface MessageLog {
    id: string;
    direction: 'inbound' | 'outbound';
    content: string;
    created_at: string;
    is_ai_generated: boolean;
    ai_model?: string;
    processing_time_ms?: number;
    ai_tokens_used?: number;
}

const AdminDashboard = () => {
    const { user } = useAuth();
    const [configs, setConfigs] = useState<BotConfig[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<BotConfig | null>(null);
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) fetchConfigs();
    }, [user]);

    // AUTO-REFRESH LOGS FOR LIVE DEMO
    useEffect(() => {
        let interval: any;
        if (selectedConfig) {
            fetchLogs(selectedConfig.id);
            interval = setInterval(() => fetchLogs(selectedConfig.id), 5000);
        }
        return () => clearInterval(interval);
    }, [selectedConfig]);

    const fetchConfigs = async () => {
        if (!user) return;
        try {
            const { data, error } = await supabase
                .from('bot_configs')
                .select('*, whatsapp_accounts(account_name, phone_number)')
                .eq('user_id', user.id);

            if (error) throw error;
            if (data) setConfigs(data as BotConfig[]);
        } catch (err: any) {
            console.error("❌ Error fetching configs:", err.message);
            alert("Error al cargar las configuraciones de los bots.");
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async (configId: string) => {
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', configId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            if (data) setLogs(data as MessageLog[]);
        } catch (err: any) {
            console.error("❌ Error fetching logs:", err.message);
        }
    };

    const handleSave = async () => {
        if (!selectedConfig || !user) return;
        try {
            const { error } = await supabase
                .from('bot_configs')
                .update({
                    constitution: selectedConfig.constitution,
                    conversation_structure: selectedConfig.conversation_structure,
                    system_prompt: selectedConfig.system_prompt,
                    conversion_goal: selectedConfig.conversion_goal,
                    cta_link: selectedConfig.cta_link,
                    demo_mode: selectedConfig.demo_mode,
                    user_id: user.id
                })
                .eq('id', selectedConfig.id);

            if (error) throw error;
            alert('Configuración guardada en ALEX IO 🚀');
        } catch (err: any) {
            console.error("❌ Save failed:", err.message);
            alert("Error al guardar los cambios.");
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-400">Iniciando Cerebro ALEX IO...</div>;

    return (
        <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
            {/* Sidebar */}
            <div className="w-64 bg-slate-950 border-r border-slate-800 p-4">
                <div className="flex items-center gap-2 mb-8 px-2">
                    <Shield className="text-blue-500" size={24} />
                    <h1 className="text-xl font-bold tracking-tight">ALEX <span className="text-blue-500">IO</span></h1>
                </div>

                <nav className="space-y-1">
                    {configs.map(cfg => (
                        <button
                            key={cfg.id}
                            onClick={() => { setSelectedConfig(cfg); fetchLogs(cfg.id); }}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedConfig?.id === cfg.id ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'
                                }`}
                        >
                            <div className="font-medium truncate">{cfg.whatsapp_accounts?.account_name}</div>
                            <div className="text-xs opacity-60">{cfg.whatsapp_accounts?.phone_number}</div>
                        </button>
                    ))}
                    {configs.length === 0 && <p className="text-xs text-slate-600 p-2 italic">Sin cuentas configuradas</p>}
                </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedConfig ? (
                    <>
                        {/* Header */}
                        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur">
                            <div className="flex items-center gap-4">
                                <h2 className="font-semibold text-lg">{selectedConfig.whatsapp_accounts?.account_name}</h2>
                                <span className="bg-blue-500/10 text-blue-400 text-xs px-2 py-1 rounded border border-blue-500/20 uppercase tracking-widest font-bold">
                                    SaaS Active
                                </span>
                            </div>
                            <button
                                onClick={handleSave}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                            >
                                <Save size={18} />
                                Guardar Cambios
                            </button>
                        </header>

                        {/* Editor Grid */}
                        <main className="flex-1 overflow-auto p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4 text-blue-400">
                                        <Shield size={18} />
                                        <h3 className="font-bold uppercase text-xs tracking-widest">Constitución del Bot</h3>
                                    </div>
                                    <textarea
                                        className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Define las leyes fundamentales aquí..."
                                        value={selectedConfig.constitution || ''}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, constitution: e.target.value })}
                                    />
                                </section>

                                <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-5">
                                    <div className="flex items-center gap-2 mb-4 text-purple-400">
                                        <Layout size={18} />
                                        <h3 className="font-bold uppercase text-xs tracking-widest">Estructura de Conversación</h3>
                                    </div>
                                    <textarea
                                        className="w-full h-32 bg-slate-950 border border-slate-700 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                                        placeholder="Define el flujo de la conversación..."
                                        value={selectedConfig.conversation_structure || ''}
                                        onChange={(e) => setSelectedConfig({ ...selectedConfig, conversation_structure: e.target.value })}
                                    />
                                </section>

                                {/* NUEVA SECCIÓN: MOTOR DE VENTAS (SALES ENGINE) */}
                                <section className="bg-blue-600/10 border border-blue-500/30 rounded-xl p-5 shadow-inner">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-blue-400">
                                            <Activity size={18} />
                                            <h3 className="font-bold uppercase text-xs tracking-widest">Motor de Ventas (Agente de Adquisición)</h3>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-blue-300 uppercase">Modo Demo</span>
                                            <button 
                                                onClick={() => setSelectedConfig({...selectedConfig, demo_mode: !selectedConfig.demo_mode})}
                                                className={`w-10 h-5 rounded-full transition-all relative ${selectedConfig.demo_mode ? 'bg-blue-500' : 'bg-slate-700'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${selectedConfig.demo_mode ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Objetivo de Conversión</label>
                                            <select 
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                value={selectedConfig.conversion_goal || 'whatsapp'}
                                                onChange={(e) => setSelectedConfig({...selectedConfig, conversion_goal: e.target.value as any})}
                                            >
                                                <option value="whatsapp">WhatsApp Directo</option>
                                                <option value="calendly">Calendly (Reunión)</option>
                                                <option value="payment">Link de Pago (Stripe/PayPal)</option>
                                                <option value="lead_form">Formulario de Lead</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Link Real de Cierre (CTA)</label>
                                            <input 
                                                type="text"
                                                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                                placeholder="https://calendly.com/tu-usuario"
                                                value={selectedConfig.cta_link || ''}
                                                onChange={(e) => setSelectedConfig({...selectedConfig, cta_link: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Logs / Cognitive Trace */}
                            <div className="space-y-6">
                                <section className="bg-slate-800/40 border border-slate-700 rounded-xl p-5 h-full flex flex-col">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2 text-emerald-400">
                                            <Activity size={18} />
                                            <h3 className="font-bold uppercase text-xs tracking-widest">Trazabilidad Cognitiva</h3>
                                        </div>
                                        {selectedConfig.demo_mode && (
                                            <div className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                                                <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                                DEMO LIVE
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-auto space-y-3">
                                        {logs.map(log => (
                                            <div key={log.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs">
                                                <div className="flex justify-between mb-2">
                                                    <span className={`font-bold ${log.direction === 'inbound' ? 'text-slate-400' : 'text-blue-400'}`}>
                                                        {log.direction.toUpperCase()}
                                                    </span>
                                                    <span className="opacity-40">{new Date(log.created_at).toLocaleTimeString()}</span>
                                                </div>
                                                <p className="mb-2 italic opacity-80">"{log.content?.substring(0, 300)}..."</p>
                                                {log.is_ai_generated && (
                                                    <div className="flex gap-3 text-[10px] mt-2 pt-2 border-t border-slate-800 opacity-60">
                                                        <span>🧠 {log.ai_model}</span>
                                                        <span>⚡ {log.processing_time_ms}ms</span>
                                                        <span>🪙 {log.ai_tokens_used} tokens</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        {logs.length === 0 && <p className="text-center text-slate-600 text-xs py-10 italic">Sin actividad reciente</p>}
                                    </div>
                                </section>
                            </div>
                        </main>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                        <Layout size={48} className="mb-4 opacity-20" />
                        <p>Selecciona una cuenta de WhatsApp para configurar su Cerebro ALEX IO</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
