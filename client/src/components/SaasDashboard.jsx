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
      const { data, error: sbError } = await supabase
        .from('whatsapp_sessions')
        .select('*');

      if (sbError) throw sbError;
      
      // Sort in memory instead of SQL to avoid 400 error if created_at column is missing
      const sortedData = (data || []).sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return new Date(b.created_at) - new Date(a.created_at);
      });

      setBots(sortedData);
      if (sortedData.length > 0 && !selectedBotId) {
        setSelectedBotId(sortedData[0].instance_id);
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
      await supabase.from('whatsapp_sessions').delete().eq('instance_id', instanceId);
      setBots(bots.filter(b => b.instance_id !== instanceId));
    } catch (e) {
      alert(e.message);
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
                const draft = bots.find(b => b.instance_id === selectedBotId);
                if (!draft) return;

                // Sync with bot_configs table
                const { error: saveError } = await supabase
                  .from('bot_configs')
                  .upsert({
                    instance_id: draft.instance_id,
                    name: draft.name || draft.company_name,
                    custom_prompt: draft.customPrompt,
                    voice_enabled: draft.voiceEnabled,
                    voice_provider: draft.voice,
                    provider: draft.provider,
                    access_token: draft.accessToken,
                    manychat_token: draft.manychatToken,
                    d360_api_key: draft.d360ApiKey,
                    d360_url: draft.d360Url,
                    updated_at: new Date()
                  });

                if (saveError) throw saveError;
                
                // Also update whatsapp_sessions if needed (e.g. for provider)
                await supabase
                  .from('whatsapp_sessions')
                  .update({ 
                    provider: draft.provider,
                    company_name: draft.name || draft.company_name
                  })
                  .eq('instance_id', draft.instance_id);

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
                <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Neural Command Center <span className="text-indigo-500">🔱</span></h1>
                <p className="text-slate-500 mt-2 text-lg">Orquestando inteligencia autónoma a escala global.</p>
              </div>
              <div className="flex gap-4">
                  <div className="bg-slate-900/50 border border-white/5 rounded-2xl px-6 py-4 backdrop-blur-md">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Carga Neural Total</p>
                      <div className="flex items-center gap-3">
                          <span className="text-2xl font-black text-white">{(totalMessages / 1000).toFixed(1)}k</span>
                          <TrendingUp size={16} className="text-emerald-500" />
                      </div>
                  </div>
                  <button 
                    onClick={() => setShowWizard(true)}
                    className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-600/30 active:scale-95 group"
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
    <div className="flex h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <div className="w-72 bg-slate-950 border-r border-white/5 flex flex-col backdrop-blur-3xl">
        <div className="p-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[1.25rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-600/40">
              <Zap className="text-white" fill="currentColor" size={28} />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">ALEX<span className="text-blue-500">IO</span></span>
              <p className="text-[10px] font-black text-slate-600 tracking-[0.25em] -mt-1">ENTERPRISE V5</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2 overflow-y-auto custom-scrollbar">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30' 
                  : 'text-slate-500 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`${activeTab === item.id ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'} transition-colors`} />
              <span className="font-bold text-sm tracking-wide">{item.label}</span>
              {activeTab === item.id && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full shadow-lg" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8">
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-white/5 mb-8 shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Neural Load</span>
            </div>
            <p className="text-sm font-bold text-white">Enterprise Elite</p>
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-4 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 shadow-[0_0_8px_rgba(37,99,235,0.8)]" style={{ width: '62%' }} />
            </div>
            <p className="text-[10px] font-medium text-slate-600 mt-3">12.4k / 20k units</p>
          </div>

          <button className="w-full flex items-center gap-3 px-5 py-4 text-slate-600 hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all font-bold text-sm group">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Deauthorize
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-900/5 via-transparent to-transparent">
        <div className="max-w-[1400px] mx-auto min-h-full">
          {renderContent()}
        </div>
      </main>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowWizard(false)} />
          <div className="relative w-full max-w-4xl bg-slate-950 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
            <div className="absolute top-8 right-8 z-20">
              <button 
                onClick={() => setShowWizard(false)}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-full text-slate-500 transition-colors border border-white/5"
              >
                <Plus size={24} className="rotate-45" />
              </button>
            </div>
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
              <EnterpriseWizard 
                onSave={async (data) => {
                  try {
                    const newInstanceId = 'bot_' + crypto.randomUUID();
                    
                    // Insert into whatsapp_sessions to register the bot
                    const { error: err1 } = await supabase.from('whatsapp_sessions').insert({
                      instance_id: newInstanceId,
                      company_name: data.botName || 'Nuevo Bot',
                      provider: data.provider || 'baileys',
                      status: 'pending',
                      voice_enabled: data.voiceEnabled || false,
                      target_language: 'es'
                    });
                    if (err1) throw new Error("Error en whatsapp_sessions: " + err1.message);

                    // Insert into bot_configs
                    const { error: err2 } = await supabase.from('bot_configs').insert({
                      instance_id: newInstanceId,
                      name: data.botName || 'Nuevo Bot',
                      custom_prompt: data.systemPrompt,
                      voice_enabled: data.voiceEnabled,
                      voice_provider: data.voice,
                      provider: data.provider,
                      access_token: data.accessToken,
                      manychat_token: data.manychatToken,
                      updated_at: new Date()
                    });
                    if (err2) throw new Error("Error en bot_configs: " + err2.message);

                    setShowWizard(false); 
                    fetchBots();
                  } catch (e) {
                    console.error('Error creating bot:', e);
                    alert('Error guardando configuración: ' + e.message);
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

