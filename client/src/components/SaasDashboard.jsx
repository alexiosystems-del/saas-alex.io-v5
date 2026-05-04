import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  Settings, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  LogOut, 
  Plus, 
  MoreVertical,
  Activity,
  CreditCard,
  Target,
  RefreshCw,
  AlertCircle,
  Trash2,
  Send,
  Cloud,
  Book,
  TrendingUp
} from 'lucide-react';
import EnterpriseAnalytics from './EnterpriseAnalytics';
import BillingTab from './BillingTab';
import ConfigTab from './ConfigTab';
import EnterpriseWizard from './EnterpriseWizard';
import OnboardingFlow from './OnboardingFlow';
import CrmProTab from './CrmProTab';
import SettingsTab from './SettingsTab';
import LiveChat from './LiveChat';
import BroadcastCampaign from './BroadcastCampaign';
import { supabase } from '../supabaseClient';
import KnowledgeTab from './KnowledgeTab';

const SaasDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);

  const sidebarItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'livechat', label: 'Live Chat (Gold)', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge (RAG)', icon: Book },
    { id: 'leads', label: 'CRM PRO Pipeline', icon: Target },
    { id: 'campaigns', label: 'Growth Campaigns', icon: Send },
    { id: 'intelligence', label: 'Analytics SRE', icon: BarChart3 },
    { id: 'config', label: 'Connectors', icon: Cloud },
    { id: 'billing', label: 'Premium Billing', icon: CreditCard },
  ];

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/saas/bots');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const botsList = data.bots || [];
      setBots(botsList);
      if (botsList.length > 0 && !selectedBotId) {
        setSelectedBotId(botsList[0].id);
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('¿Estás seguro? Se borrará la configuración.')) return;
    try {
      const res = await fetch(`/api/saas/bots/${botId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBots(bots.filter(b => b.id !== botId));
    } catch (e) {
      alert('Error al eliminar bot: ' + e.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'intelligence':
        return <EnterpriseAnalytics />;
      case 'knowledge':
        return <KnowledgeTab />;
      case 'leads':
        return <CrmProTab />;
      case 'billing':
        return <BillingTab />;
      case 'settings':
        return <SettingsTab />;
      case 'livechat':
        return <LiveChat instanceId={selectedBotId} />;
      case 'campaigns':
        return <BroadcastCampaign instanceId={selectedBotId} />;
      case 'config':
        const currentBot = bots.find(b => b.id === selectedBotId);
        return (
          <ConfigTab 
            selected={currentBot} 
            configDraft={currentBot || {}} 
            setConfigDraft={(newData) => {
              setBots(prev => prev.map(b => 
                b.id === selectedBotId ? { ...b, ...newData } : b
              ));
            }}
            onSave={async () => {
              try {
                const draft = bots.find(b => b.id === selectedBotId);
                if (!draft) return;
                
                const res = await fetch(`/api/saas/bots/${draft.id}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: draft.name,
                    prompt: draft.prompt,
                    voice_enabled: draft.voice_enabled,
                    industry: draft.industry,
                    objective: draft.objective
                  })
                });

                if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.error || `HTTP ${res.status}`);
                }

                alert('Configuración sincronizada exitosamente.');
              } catch (e) {
                alert('Error al guardar: ' + e.message);
              }
            }}
          />
        );
      case 'dashboard':
        const totalMessages = 12400; // Simulated for demo
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black uppercase tracking-widest">SRE_COMMAND_CENTER_V6.0</span>
                </div>
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Neural Command Center <span className="text-indigo-500">🔱</span></h1>
              </div>
              <div className="flex gap-4">
                  <button 
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 group"
                  >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Inicializar Agente
                  </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Precisión AI', value: '98.4%', icon: Zap, color: 'text-amber-400', sub: 'Cascade 3.0' },
                    { label: 'Latencia', value: '1.2s', icon: Activity, color: 'text-blue-400', sub: 'Edge' },
                    { label: 'Leads', value: '428', icon: Target, color: 'text-rose-400', sub: 'Intent' },
                    { label: 'Uptime', value: '100%', icon: Shield, color: 'text-emerald-400', sub: 'SRE' }
                ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                    </div>
                ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="animate-spin text-indigo-500 mb-4" size={48} />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Sincronizando...</p>
              </div>
            ) : bots.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/30 rounded-[3rem] border border-white/5">
                <p className="text-slate-500 mb-6">No hay agentes activos.</p>
                <button onClick={() => setShowWizard(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Crear Mi Primer Bot</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bots.map((bot) => (
                  <div 
                    key={bot.id} 
                    onClick={() => setSelectedBotId(bot.id)}
                    className={`group bg-slate-900/60 border-2 ${selectedBotId === bot.id ? 'border-indigo-500' : 'border-white/5'} rounded-[3rem] p-8 hover:border-indigo-500/40 transition-all cursor-pointer relative`}
                  >
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center text-indigo-400 border border-white/5">
                          <Bot size={32} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{bot.name}</h3>
                          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{bot.industry}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => setActiveTab('config')} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">Gestionar</button>
                      <button onClick={() => handleDeleteBot(bot.id)} className="p-4 bg-white/5 text-slate-500 hover:text-rose-500 rounded-2xl border border-white/5"><Trash2 size={20} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-slate-950 border-r border-white/5 flex flex-col">
        <div className="p-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
            <Zap className="text-white" fill="currentColor" size={28} />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">ALEX<span className="text-blue-500">IO</span></span>
          </div>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-2xl' : 'text-slate-500 hover:bg-white/5 hover:text-white'}`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-8">
          <button className="w-full flex items-center gap-3 px-5 py-4 text-slate-600 hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all font-bold text-sm">
            <LogOut size={18} /> Deauthorize
          </button>
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[1400px] mx-auto min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWizard(false)} />
          <div className="relative w-full max-w-4xl bg-slate-950 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
              <EnterpriseWizard 
                onSave={async (data) => {
                  try {
                    const generatedPrompt = `Eres un asistente experto en ${data.industry || 'Negocios'}.
NEGOCIO: ${data.businessName || 'ALEX IO'}
CLIENTE IDEAL: ${data.targetCustomer || 'Público General'}
PRODUCTOS: ${data.products || 'Servicios Varios'}
ESTILO: ${data.salesStyle || 'Consultivo'}
TONO: ${data.tone || 'Profesional'}
OBJETIVO: ${data.goal || 'Cerrar Ventas'}

REGLAS:
- Responde claro y corto (máx 50 palabras).
- Prioriza cerrar la intención del usuario.
- Usa lenguaje natural y empático.
- Si no sabes la respuesta, deriva a un humano.
- No inventes datos técnicos o precios no mencionados.`;

                    const payload = {
                      name: data.businessName || 'Nuevo Bot',
                      prompt: generatedPrompt,
                      tone: data.tone || 'professional',
                      industry: data.industry || 'general',
                      objective: data.goal || 'assist customers',
                      voice_enabled: data.voiceEnabled === true,
                      translation_enabled: false,
                      channel: data.provider || 'baileys',
                      identity: data.businessName,
                      strategy: data.salesStyle
                    };

                    const res = await fetch('/api/saas/bots', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(payload)
                    });

                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);

                    setShowWizard(false); 
                    fetchBots();
                    alert(`Bot "${result.bot.name}" creado exitosamente.`);
                  } catch (e) {
                    alert('Error al crear bot: ' + e.message);
                  }
                }}
                onCancel={() => setShowWizard(false)}
              />
            </div>
          </div>
        </div>
      )}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      `}} />
    </div>
  );
};

export default SaasDashboard;
