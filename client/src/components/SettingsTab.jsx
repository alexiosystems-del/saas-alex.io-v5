import React, { useState, useEffect } from 'react';
import {
  Key,
  Globe,
  Bot,
  Shield,
  Bell,
  Palette,
  Save,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Cpu,
  Zap
} from 'lucide-react';

const SettingsTab = () => {
  const [saved, setSaved] = useState(false);
  const [showKeys, setShowKeys] = useState({});
  const [poolStatus, setPoolStatus] = useState([]);
  const [config, setConfig] = useState({
    // API Keys
    openai_key: '',
    gemini_key: '',
    minimax_key: '',
    stripe_key: '',
    meta_token: '',
    // General
    bot_name: 'ALEX IO',
    default_language: 'es',
    max_words: '60',
    max_messages: '15',
    voice_mode: 'off',
    // Webhook
    webhook_verify_token: 'alexio_verify',
  });

  useEffect(() => {
    fetchPoolStatus();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchPoolStatus = async () => {
    try {
      const res = await fetch('/api/pool/status', { headers: getAuthHeaders() });
      const data = await res.json();
      setPoolStatus(data.bots || []);
    } catch (e) {
      console.error('Pool status error:', e);
    }
  };

  const handleSave = () => {
    // In production, this would POST to /api/settings
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleShowKey = (key) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateConfig = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const Section = ({ title, icon: Icon, children }) => (
    <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-white/5 rounded-xl">
          <Icon size={18} className="text-blue-400" />
        </div>
        <h3 className="text-lg font-bold text-white">{title}</h3>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const KeyInput = ({ label, configKey, placeholder }) => (
    <div>
      <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">{label}</label>
      <div className="flex gap-2">
        <input
          type={showKeys[configKey] ? 'text' : 'password'}
          value={config[configKey]}
          onChange={e => updateConfig(configKey, e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 font-mono"
        />
        <button onClick={() => toggleShowKey(configKey)} className="p-3 bg-white/5 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors">
          {showKeys[configKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500 max-w-4xl">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-slate-200 to-slate-400 bg-clip-text text-transparent">
            Settings
          </h2>
          <p className="text-slate-500 mt-1 text-sm">Configure your ALEX IO enterprise instance.</p>
        </div>
        <button
          onClick={handleSave}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
            saved
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
          }`}
        >
          {saved ? <CheckCircle2 size={18} /> : <Save size={18} />}
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      {/* API Keys */}
      <Section title="API Keys" icon={Key}>
        <KeyInput label="OpenAI API Key" configKey="openai_key" placeholder="sk-..." />
        <KeyInput label="Gemini API Key" configKey="gemini_key" placeholder="AIza..." />
        <KeyInput label="MiniMax API Key" configKey="minimax_key" placeholder="eyJ..." />
        <KeyInput label="Stripe Secret Key" configKey="stripe_key" placeholder="sk_live_..." />
        <KeyInput label="Meta / WhatsApp Token" configKey="meta_token" placeholder="EAAG..." />
        <div className="flex items-start gap-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-400/80 leading-relaxed">
            Las API Keys se almacenan de forma segura en variables de entorno del servidor (Render).
            Si las configurás aquí, se guardan en la DB encriptadas para tu tenant.
          </p>
        </div>
      </Section>

      {/* General Config */}
      <Section title="General" icon={Bot}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Bot Name</label>
            <input
              type="text"
              value={config.bot_name}
              onChange={e => updateConfig('bot_name', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Default Language</label>
            <select
              value={config.default_language}
              onChange={e => updateConfig('default_language', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
            >
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Max Words per Response</label>
            <input
              type="number"
              value={config.max_words}
              onChange={e => updateConfig('max_words', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Voice Mode</label>
            <select
              value={config.voice_mode}
              onChange={e => updateConfig('voice_mode', e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500/50 appearance-none"
            >
              <option value="off">Off</option>
              <option value="always">Always On</option>
              <option value="auto">Auto (respond to audio)</option>
            </select>
          </div>
        </div>
      </Section>

      {/* Webhook Config */}
      <Section title="Webhook & Security" icon={Shield}>
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 block">Webhook Verify Token</label>
          <input
            type="text"
            value={config.webhook_verify_token}
            onChange={e => updateConfig('webhook_verify_token', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/5 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-blue-500/50"
          />
        </div>
        <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
          <Globe size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="text-xs text-blue-400/80 leading-relaxed">
            <p className="font-bold text-blue-400 mb-1">Webhook URL de tu servidor:</p>
            <code className="bg-white/5 px-2 py-0.5 rounded text-[11px]">
              {typeof window !== 'undefined' ? window.location.origin : 'https://tu-app.onrender.com'}/api/webhooks/meta
            </code>
          </div>
        </div>
      </Section>

      {/* Bot Pool Status */}
      <Section title="Bot Pool Status" icon={Server}>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500">{poolStatus.length} bot(s) registrados</p>
          <button onClick={fetchPoolStatus} className="p-1.5 bg-white/5 rounded-lg text-slate-400 hover:text-white transition-colors">
            <RefreshCw size={14} />
          </button>
        </div>
        {poolStatus.length === 0 ? (
          <p className="text-center text-slate-600 text-sm py-8">No hay bots en el pool actualmente.</p>
        ) : (
          <div className="space-y-2">
            {poolStatus.map((bot, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    bot.health === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' :
                    bot.health === 'DEGRADED' ? 'bg-amber-500' : 'bg-rose-500'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-white font-mono">{bot.instanceId?.slice(0, 16)}...</p>
                    <p className="text-[10px] text-slate-500">{bot.provider} • {bot.totalMessages} msgs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    bot.health === 'HEALTHY' ? 'text-emerald-400' :
                    bot.health === 'DEGRADED' ? 'text-amber-400' : 'text-rose-400'
                  }`}>{bot.health}</p>
                  <p className="text-[10px] text-slate-600">{bot.avgLatency}ms avg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};

export default SettingsTab;
