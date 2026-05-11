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
  Moon,
  Cpu,
  Bell,
  ShieldAlert
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
import { t, setLanguage, getCurrentLanguage, supportedLanguages } from '../i18n/translations';

const getAuthHeaders = () => {
  const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

import apiClient from '../api/apiClient';

const SaasDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBotId, setSelectedBotId] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'onyx');
  const [lang, setLang] = useState(getCurrentLanguage());
  const [userEmail, setUserEmail] = useState('');

  // Persistent config drafts — survives tab navigation
  const [configDrafts, setConfigDrafts] = useState(() => {
    try {
      const saved = localStorage.getItem('alex_config_drafts');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  // Save drafts to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('alex_config_drafts', JSON.stringify(configDrafts));
    } catch {}
  }, [configDrafts]);

  const getConfigDraft = (botId) => {
    if (!botId) return {};
    const bot = bots.find(b => (b.instance_id || b.id) === botId);
    return { ...bot, ...(configDrafts[botId] || {}) };
  };

  const updateConfigDraft = (botId, updater) => {
    setConfigDrafts(prev => {
      const currentDraft = { ...(prev[botId] || {}) };
      const newValues = typeof updater === 'function' ? updater(currentDraft) : updater;
      return { ...prev, [botId]: { ...currentDraft, ...newValues } };
    });
  };

  useEffect(() => {
    const email = localStorage.getItem('alex_io_email') || 'Operador Master';
    setUserEmail(email);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'onyx' ? 'silver' : 'onyx');

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setLang(newLang);
    window.location.reload(); // Reload to refresh all translations in the tree
  };

  const sidebarItems = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { id: 'livechat', label: t('nav.livechat'), icon: MessageSquare },
    { id: 'config', label: '1. Inicializar Bot', icon: Bot },
    { id: 'knowledge', label: '2. Entrenar (RAG)', icon: Book },
    { id: 'whatsapp', label: '3. Conectar Canales', icon: QrCode },
    { id: 'leads', label: t('nav.crm'), icon: Target },
    { id: 'campaigns', label: t('nav.campaigns'), icon: Send },
    { id: 'intelligence', label: t('nav.analytics'), icon: BarChart3 },
    { id: 'billing', label: t('nav.billing'), icon: CreditCard },
  ];

  useEffect(() => {
    fetchBots();
  }, []);

  const [connectionStatus, setConnectionStatus] = useState('offline');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch('/api/status');
        if (res.ok) setConnectionStatus('online');
        else setConnectionStatus('offline');
      } catch {
        setConnectionStatus('offline');
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchBots = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await apiClient.get('/api/saas/bots', { retry: 3 });
      const botsList = data.bots || data || [];
      setBots(botsList);
      if (botsList.length > 0 && !selectedBotId) {
        setSelectedBotId(botsList[0].instance_id || botsList[0].id);
      }
    } catch (err) {
      console.error('Error fetching bots:', err);
      setError("Error de conexión con el centro de comando.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBot = async (botId) => {
    if (!window.confirm('¿Estás seguro? Se borrará la configuración.')) return;
    try {
      const res = await fetch(`/api/saas/bots/${botId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setBots(bots.filter(b => (b.instance_id || b.id) !== botId));
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
        const botToConnect = bots.find(b => (b.instance_id || b.id) === selectedBotId);
        const hasPrompt = botToConnect?.customPrompt || botToConnect?.prompt;
        return <WhatsAppConnect instanceId={selectedBotId} initialCompanyName={botToConnect?.name || botToConnect?.company_name} />;
      case 'livechat':
        return <LiveChat instanceId={selectedBotId} />;
      case 'campaigns':
        return <BroadcastCampaign instanceId={selectedBotId} />;
      case 'config':
        const currentBot = bots.find(b => (b.instance_id || b.id) === selectedBotId);
        const draft = getConfigDraft(selectedBotId);
        return (
          <ConfigTab 
            selected={currentBot} 
            configDraft={draft} 
            connectionStatus={connectionStatus}
            setConfigDraft={(updater) => {
              const newValues = typeof updater === 'function' ? updater(draft) : updater;
              updateConfigDraft(selectedBotId, newValues);
            }}
            onSave={async () => {
              try {
                const saveDraft = getConfigDraft(selectedBotId);
                if (!saveDraft) return;

                const botId = saveDraft.instance_id || saveDraft.id || selectedBotId;
                const res = await fetch(`/api/saas/bots/${botId}`, {
                  method: 'PUT',
                  headers: getAuthHeaders(),
                  body: JSON.stringify({
                    name: saveDraft.name || saveDraft.company_name,
                    prompt: saveDraft.customPrompt,
                    voice_enabled: saveDraft.voiceEnabled,
                    voice: saveDraft.voice,
                    provider: saveDraft.provider,
                    industry: saveDraft.industry,
                    objective: saveDraft.objective,
                    target_language: saveDraft.target_language,
                    access_token: saveDraft.accessToken,
                    phone_number_id: saveDraft.phoneNumberId,
                    d360_api_key: saveDraft.d360ApiKey,
                    discord_token: saveDraft.discordToken,
                    tiktok_access_token: saveDraft.tiktokAccessToken,
                    tiktok_seller_id: saveDraft.tiktokSellerId,
                    manychat_token: saveDraft.manychatToken
                  })
                });

                if (!res.ok) {
                  const errData = await res.json();
                  throw new Error(errData.error || `HTTP ${res.status}`);
                }

                // Clear draft after successful save (use server data)
                setConfigDrafts(prev => {
                  const next = { ...prev };
                  delete next[selectedBotId];
                  return next;
                });
                fetchBots();
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
                <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic" style={{ fontFamily: 'var(--font-title)' }}>
                  {t('dashboard.title')} <span className="text-[var(--accent-gold)] drop-shadow-[0_0_15px_var(--accent-gold-glow)]">🔱</span>
                </h1>
                <p className="text-[var(--text-secondary)] mt-2 text-lg">{t('dashboard.subtitle')}</p>
              </div>
              <div className="flex gap-4">
                  <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl px-6 py-4 shadow-xl">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">{t('dashboard.neuralLoad')}</p>
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
                    {t('dashboard.initAgent')}
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
                <p className="text-slate-500 mb-6">{t('dashboard.noBots')}</p>
                <button onClick={() => setShowWizard(true)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">{t('dashboard.initAgent')}</button>
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
                      <button onClick={() => setActiveTab('config')} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest">{t('nav.manage')}</button>
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
    <div className="flex h-screen bg-[#08080D] text-white overflow-hidden font-['Instrument_Sans']">
      <style>{`
        .glass-sidebar {
          background: rgba(13, 13, 20, 0.95);
          backdrop-filter: blur(30px);
          border-right: 1px solid rgba(197, 160, 40, 0.1);
        }
        .active-nav-item {
          background: linear-gradient(90deg, rgba(197, 160, 40, 0.15) 0%, transparent 100%);
          border-left: 3px solid #C5A028;
          color: #E8C84A;
        }
        .gold-glow {
          box-shadow: 0 0 20px rgba(197, 160, 40, 0.15);
        }
      `}</style>

      {/* Sidebar */}
      <div className="w-72 glass-sidebar flex flex-col z-20">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 mb-10 group cursor-pointer">
            <div className="w-12 h-12 bg-[#C5A028] rounded-2xl flex items-center justify-center shadow-lg shadow-gold-600/20 group-hover:scale-110 transition-transform">
              <Cpu size={28} className="text-[#08080D]" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tighter italic">
                ALEX <span className="text-[#C5A028]">IO</span>
              </h2>
              <p className="text-[10px] text-[#C5A028] font-black uppercase tracking-[0.3em]">
                Neural Command
              </p>
            </div>
          </div>

          <nav className="space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all font-bold text-sm uppercase tracking-wider ${
                  activeTab === item.id 
                  ? 'active-nav-item' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-8">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 text-slate-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-2xl transition-all font-bold text-sm uppercase tracking-widest group"
          >
            <LogOut size={18} />
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#08080D]">
        <div className="max-w-[1600px] mx-auto min-h-full p-10">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter flex items-center gap-4 text-white uppercase">
                <Cpu size={36} className="text-[#C5A028]" />
                Neural Command Center
              </h1>
              <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em] mt-2 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Despliegue Cognitivo v5.0 — Sistema Operativo Activo
              </p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Bot Selector */}
              <div className="flex items-center gap-3 bg-white/5 px-5 py-3 rounded-2xl border border-white/10 hover:border-[#C5A028]/30 transition-all">
                <Bot size={18} className="text-[#C5A028]" />
                <select
                  value={selectedBotId || ''}
                  onChange={(e) => setSelectedBotId(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest text-white focus:ring-0 outline-none cursor-pointer"
                >
                  <option value="" className="bg-[#08080D]">Seleccionar Agente...</option>
                  {bots.map((b) => (
                    <option key={b.id} value={b.instance_id || b.id} className="bg-[#08080D]">{b.name}</option>
                  ))}
                </select>
              </div>
              
              <button className="p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors relative group">
                <Bell size={22} className="text-slate-400 group-hover:text-white" />
                <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#C5A028] rounded-full gold-glow animate-pulse"></span>
              </button>
              
              <div className="flex items-center gap-5 bg-white/5 pl-2 pr-5 py-2 rounded-3xl border border-white/10">
                <div className="w-12 h-12 bg-gradient-to-br from-[#C5A028] to-[#E8C84A] rounded-2xl flex items-center justify-center font-black italic text-[#08080D] text-xl shadow-lg shadow-gold-500/20">
                  {userEmail?.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-black tracking-widest uppercase truncate max-w-[140px] text-white">
                    {userEmail?.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-black text-[#C5A028] uppercase tracking-[0.2em]">Master Operator</span>
                </div>
              </div>
            </div>
          </header>

          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderContent()}
          </div>
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
                      metaPhoneNumberId: data.metaPhoneNumberId,
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
                    if (!res.ok) {
                      console.error('Bot Create Error Response:', result);
                      throw new Error(result.error || `HTTP ${res.status}: ${JSON.stringify(result)}`);
                    }

                    setShowWizard(false); 
                    fetchBots();
                    alert(`Agente "${result.bot?.name || payload.name}" inicializado correctamente.`);
                  } catch (e) {
                    console.error('Error creating bot:', e);
                    alert('Error al crear bot: ' + e.message);
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
