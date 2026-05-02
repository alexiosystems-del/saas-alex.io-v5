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
  Trash2
} from 'lucide-react';
import EnterpriseAnalytics from './EnterpriseAnalytics';
import BillingTab from './BillingTab';
import ConfigTab from './ConfigTab';
import EnterpriseWizard from './EnterpriseWizard';
import OnboardingFlow from './OnboardingFlow';
import CrmProTab from './CrmProTab';
import SettingsTab from './SettingsTab';
import { supabase } from '../supabaseClient';

const SaasDashboard = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'intelligence', label: 'Intelligence', icon: BarChart3 },
    { id: 'leads', label: 'CRM Leads', icon: Target },
    { id: 'automations', label: 'Automations', icon: Zap },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
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
        .select('*')
        .order('created_at', { ascending: false });

      if (sbError) throw sbError;
      setBots(data || []);
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
      case 'leads':
        return <CrmProTab />;
      case 'billing':
        return <BillingTab />;
      case 'settings':
        return <SettingsTab />;
      case 'dashboard':
        return (
          <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h1 className="text-4xl font-black text-white tracking-tight">Command Center</h1>
                <p className="text-slate-400 mt-2 text-lg">Orchestrating autonomous agents across your enterprise.</p>
              </div>
              <button 
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
              >
                <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                Initialize Agent
              </button>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <RefreshCw className="animate-spin text-blue-500" size={48} />
                <p className="text-slate-400 animate-pulse font-medium">Syncing with neural grid...</p>
              </div>
            ) : bots.length === 0 ? (
              <div className="bg-slate-900/30 border border-white/5 rounded-[3rem] overflow-hidden">
                <OnboardingFlow onComplete={() => setShowWizard(true)} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bots.map((bot) => (
                  <div key={bot.instance_id} className="group bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 hover:border-blue-500/40 transition-all duration-300 relative overflow-hidden backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 rounded-[1.25rem] bg-slate-800 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform duration-300 shadow-inner border border-white/5">
                          <Bot size={32} />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white tracking-tight">{bot.company_name}</h3>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className={`w-2 h-2 rounded-full ${bot.status === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`} />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{bot.status || 'offline'}</span>
                          </div>
                        </div>
                      </div>
                      <button className="text-slate-600 hover:text-white p-2">
                        <MoreVertical size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Platform</p>
                        <p className="text-white font-bold mt-1 text-sm">{bot.provider || 'Baileys'}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Confidence</p>
                        <p className="text-emerald-400 font-bold mt-1 text-sm">88.5%</p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button className="flex-1 py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-blue-500/20">
                        Settings
                      </button>
                      <button 
                        onClick={() => handleDeleteBot(bot.instance_id)}
                        className="p-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition-all border border-rose-500/20"
                      >
                        <Trash2 size={18} />
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

        <nav className="flex-1 px-6 space-y-2">
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
              <EnterpriseWizard onSuccess={() => { setShowWizard(false); fetchBots(); }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaasDashboard;
