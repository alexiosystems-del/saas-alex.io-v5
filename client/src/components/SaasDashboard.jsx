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
  TrendingUp,
  QrCode,
  Sun,
  Moon
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
import KnowledgeBase from './KnowledgeBase';
import WhatsAppConnect from './WhatsAppConnect';

const getAuthHeaders = () => {
  const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

const SaasDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'onyx');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'onyx' ? 'silver' : 'onyx');

  const sidebarItems = [
    { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
    { id: 'livechat', label: 'Live Chat (Gold)', icon: MessageSquare },
    { id: 'knowledge', label: 'Knowledge (RAG)', icon: Book },
    { id: 'leads', label: 'CRM PRO Pipeline', icon: Target },
    { id: 'campaigns', label: 'Growth Campaigns', icon: Send },
    { id: 'intelligence', label: 'Analytics SRE', icon: BarChart3 },
    { id: 'config', label: 'Connectors', icon: Cloud },
    { id: 'whatsapp', label: 'WhatsApp QR', icon: QrCode },
    { id: 'billing', label: 'Premium Billing', icon: CreditCard },
  ];

  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/saas/bots', { headers: getAuthHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const botsList = data.bots || data || [];
      setBots(botsList);
      if (botsList.length > 0 && !selectedBotId) {
        setSelectedBotId(botsList[0].instance_id || botsList[0].id);
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (instanceId) => {
    if (!window.confirm('¿Estás seguro? Se borrará la configuración.')) return;
    try {
      const res = await fetch(`/api/saas/bots/${instanceId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBots(bots.filter(b => (b.instance_id || b.id) !== instanceId));
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'intelligence':
        return <EnterpriseAnalytics />;
      case 'knowledge':
        return <KnowledgeBase instanceId={selectedBotId} tenantId={localStorage.getItem('alex_io_tenant')} />;
      case 'leads':
        return <CrmProTab />;
      case 'billing':
        return <BillingTab />;
      case 'settings':
        return <SettingsTab />;
      case 'whatsapp':
        return <WhatsAppConnect />;
      case 'livechat':
        return <LiveChat instanceId={selectedBotId} />;
      case 'campaigns':
        return <BroadcastCampaign instanceId={selectedBotId} />;
      case 'config':
        const currentBot = bots.find(b => b.instance_id === selectedBotId);
        return (
          <ConfigTab 
            selected={currentBot} 
            configDraft={currentBot || {}} 
            setConfigDraft={(newData) => {
              // Functional update to local state
              setBots(prev => prev.map(b => 
                b.instance_id === selectedBotId 
                ? { ...b, ...newData } 
                : b
              ));
            }}
            onSave={async () => {
              try {
                const draft = bots.find(b => (b.instance_id || b.id) === selectedBotId);
                if (!draft) return;

                const res = await fetch(`/api/saas/bots/${draft.instance_id || draft.id}`, {
                  method: 'PUT',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    name: draft.name || draft.company_name,
                    prompt: draft.customPrompt,
                    voice_enabled: draft.voiceEnabled,
                    voice: draft.voice,
                    provider: draft.provider,
                    industry: draft.industry,
                    objective: draft.objective
                  })
                });

                if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.error || `HTTP ${res.status}`);
                }

                alert('Configuración sincronizada con el Kernel exitosamente.');
              } catch (e) {
                console.error('Error saving config:', e);
                alert('Error al guardar: ' + e.message);
              }
            }}
          />
        );
      case 'dashboard':
        const totalMessages = bots.reduce((acc, b) => acc + (b.total_messages || 0), 0);
        const avgAccuracy = 94.8; // Simulated aggregate

        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-700">
            {/* Modo Dios Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded text-[9px] font-black uppercase tracking-widest">SRE_COMMAND_CENTER_V5.5</span>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[9px] font-black uppercase tracking-widest">SYSTEM_OPTIMIZED</span>
                </div>
                <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic" style={{ fontFamily: 'var(--font-title)' }}>
                  Neural Command Center <span className="text-[var(--accent-gold)] drop-shadow-[0_0_15px_var(--accent-gold-glow)]">🔱</span>
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-lg">Orquestando inteligencia autónoma a escala global.</p>
              </div>
              <div className="flex gap-4">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-6 py-4 shadow-xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Carga Neural Total</p>
                      <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-[var(--text-primary)]">{(totalMessages / 1000).toFixed(1)}k</span>
                          <TrendingUp size={16} className="text-emerald-500" />
                      </div>
                  </div>
                  <button 
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-gold-hover)] text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-gold-600/30 active:scale-95 group border-none"
                  >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                    Inicializar Agente
                  </button>
              </div>
            </div>

            {/* Neural Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: 'Precisión AI', value: '98.4%', icon: Zap, color: 'text-amber-400', sub: 'Cascade 2.0 Active' },
                    { label: 'Latencia Global', value: '1.2s', icon: Activity, color: 'text-blue-400', sub: 'Edge Optimized' },
                    { label: 'Leads Calientes', value: '428', icon: Target, color: 'text-rose-400', sub: 'Intent Matching' },
                    { label: 'Auto-Healing', value: '100%', icon: Shield, color: 'text-emerald-400', sub: 'SRE Resilient' }
                ].map((stat, i) => (
                    <div key={i} className="p-5 rounded-[2rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2 rounded-xl bg-white/5 ${stat.color}`}>
                                <stat.icon size={18} />
                            </div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                        </div>
                        <div className="text-2xl font-black text-white">{stat.value}</div>
                        <p className="text-[9px] text-slate-600 mt-1 font-mono uppercase">{stat.sub}</p>
                    </div>
                ))}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-indigo-500" size={48} />
                <p className="text-slate-500 animate-pulse font-black uppercase tracking-[0.3em] text-xs">Sincronizando con la Red Neural...</p>
              </div>
            ) : bots.length === 0 ? (
              <div className="bg-slate-900/30 border border-white/5 rounded-[3.5rem] overflow-hidden shadow-3xl">
                <OnboardingFlow onComplete={() => setShowWizard(true)} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {bots.map((bot) => (
                  <div 
                    key={bot.instance_id} 
                    onClick={() => setSelectedBotId(bot.instance_id)}
                    className={`group bg-slate-900/60 border-2 ${selectedBotId === bot.instance_id ? 'border-indigo-500 shadow-[0_0_40px_rgba(79,70,229,0.2)]' : 'border-white/5'} rounded-[3rem] p-8 hover:border-indigo-500/40 transition-all duration-500 relative overflow-hidden backdrop-blur-md cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="flex items-center gap-5">
                        <div className={`w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center ${bot.status === 'online' ? 'text-indigo-400' : 'text-slate-600'} group-hover:scale-110 transition-transform duration-500 shadow-inner border border-white/5 relative`}>
                          <Bot size={32} />
                          {bot.status === 'online' && (
                              <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-slate-900 animate-pulse shadow-[0_0_10px_#10b981]" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-white tracking-tighter uppercase italic">{bot.company_name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{bot.provider || 'Enterprise'} Engine</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                          <span className="text-[9px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">V5.5_GOLD</span>
                          <span className="text-[8px] font-mono text-slate-600 uppercase">#{bot.instance_id.slice(0,8)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                      <div className="bg-black/40 p-5 rounded-[1.75rem] border border-white/5 group-hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Carga AI</p>
                        <p className="text-white font-black text-base">{bot.total_messages || '0'}</p>
                      </div>
                      <div className="bg-black/40 p-5 rounded-[1.75rem] border border-white/5 group-hover:border-white/10 transition-colors">
                        <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mb-1">Health Score</p>
                        <p className="text-emerald-400 font-black text-base">99.9%</p>
                      </div>
                    </div>

                    <div className="flex gap-4 relative z-10">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setActiveTab('config'); }}
                        className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-600/20"
                      >
                        Gestionar
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteBot(bot.instance_id); }}
                        className="p-4 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-2xl transition-all border border-white/5 hover:border-rose-500/20"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
            <Activity className="text-blue-500/20" size={64} />
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">Calibrando módulo {activeTab}...</p>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans">
      {/* Sidebar */}
      <div className="w-80 glass-sidebar flex flex-col border-r border-[var(--border)] bg-[var(--bg-secondary)] shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer" onClick={toggleTheme}>
            <div className="w-12 h-12 bg-gradient-to-br from-[var(--accent-gold)] to-[var(--accent-gold-hover)] rounded-2xl flex items-center justify-center shadow-lg shadow-gold-500/30 group-hover:scale-110 transition-transform">
              {theme === 'onyx' ? <Sun size={28} className="text-white" /> : <Moon size={28} className="text-white" />}
            </div>
            <div>
              <h2 className="text-2xl font-black text-[var(--text-primary)] tracking-tighter italic" style={{ fontFamily: 'var(--font-title)' }}>
                ALEX <span className="text-[var(--accent-gold)]">IO</span>
              </h2>
              <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-[0.3em]">
                {theme === 'onyx' ? 'Onyx Black' : 'Silver Luxury'}
              </p>
            </div>
          </div>

          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all font-bold text-sm ${
                  activeTab === item.id 
                  ? 'bg-[var(--accent-gold)] text-white shadow-lg shadow-gold-500/30 translate-x-2' 
                  : 'text-slate-500 hover:text-[var(--accent-gold)] hover:bg-[var(--accent-gold)]/10'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <div className="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border)] mb-8 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[var(--accent-gold)] animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Load</span>
            </div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Enterprise Elite</p>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-[var(--accent-gold)]" style={{ width: '62%' }} />
            </div>
          </div>

          <button className="w-full flex items-center gap-3 px-5 py-4 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-2xl transition-all font-bold text-sm group">
            <LogOut size={18} />
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[var(--bg-primary)]">
        <div className="max-w-[1400px] mx-auto min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-black/40">
          <div className="absolute inset-0" onClick={() => setShowWizard(false)} />
          <div className="relative w-full max-w-4xl bg-[var(--bg-primary)] border border-[var(--border)] rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-8 right-8 z-20">
              <button 
                onClick={() => setShowWizard(false)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 transition-colors border border-[var(--border)]"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
              <EnterpriseWizard 
                onSave={async (data) => {
                  try {
                    const payload = {
                      name: data.botName || 'Nuevo Bot',
                      prompt: data.systemPrompt || `Eres un asistente experto.`,
                      tone: data.tone || 'professional',
                      industry: data.industry || 'general',
                      objective: data.goal || 'assist customers',
                      voice_enabled: data.voiceEnabled === true,
                      voice: data.voice || 'nova',
                      channel: data.provider || 'baileys',
                      target_language: data.targetLanguage || 'es',
                      accessToken: data.accessToken,
                      d360ApiKey: data.d360ApiKey,
                      discordToken: data.discordToken,
                      tiktokAccessToken: data.tiktokAccessToken,
                      tiktokSellerId: data.tiktokSellerId,
                      manychatToken: data.manychatToken,
                      identity: data.botName,
                      strategy: data.salesStyle || 'consultive'
                    };

                    const res = await fetch('/api/saas/bots', {
                      method: 'POST',
                      headers: getAuthHeaders(),
                      body: JSON.stringify(payload)
                    });

                    const result = await res.json();
                    if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);

                    setShowWizard(false); 
                    fetchBots();
                    alert(`Agente "${result.bot?.name || payload.name}" inicializado.`);
                  } catch (e) {
                    console.error('Error creating bot:', e);
                    alert('Error: ' + e.message);
                  }
                }}
                onCancel={() => setShowWizard(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasDashboard;

