import React, { useEffect, useMemo, useState, Component } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, Activity, Settings, Smartphone, Plus, PlusCircle, Loader, AlertTriangle, CheckCircle2, X, Wand2, LogOut, MessageCircle, MessageSquare, Send, Globe, Book, Sparkles, Sun, Moon, Trash2, PauseCircle, Play, RefreshCw, Zap } from 'lucide-react';
import PromptWizard from './PromptWizard';
import PromptCopilot from './PromptCopilot';
import LiveChat from './LiveChat';
import KnowledgeBase from './KnowledgeBase';
import BroadcastCampaign from './BroadcastCampaign';
import DataCompliance from './DataCompliance';
import MemoryManager from './MemoryManager';
import ConfigTab from './ConfigTab';
import { fetchJsonWithApiFallback, getLastResolvedApiBase, getPreferredApiBase, getAuthHeaders } from '../api';
import { supabase } from '../supabaseClient';

const VERSION = "v2.0.7.8-STABLE";

// Inject DM Sans font
if (typeof document !== 'undefined' && !document.getElementById('dm-sans-font')) {
  const link = document.createElement('link');
  link.id = 'dm-sans-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap';
  document.head.appendChild(link);
}

// --- THEME SYSTEM ---
const themes = {
  dark: {
    bg: '#050510', bgAlt: '#08081a', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)',
    text: '#e2e8f0', textMuted: '#64748b', textDim: '#94a3b8',
    accent: '#06b6d4', accentHover: '#22d3ee', accentBg: 'rgba(6,182,212,0.12)', accentBorder: 'rgba(6,182,212,0.25)',
    inputBg: 'rgba(255,255,255,0.03)', inputBorder: 'rgba(255,255,255,0.08)',
    modalBg: 'rgba(15,15,30,0.85)', modalOverlay: 'rgba(0,0,0,0.7)',
    footerBg: 'rgba(5,5,16,0.8)', footerBorder: 'rgba(255,255,255,0.06)',
    noticeText: '#e2e8f0',
    glass: 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);',
    sidebarBg: 'rgba(8,8,20,0.6)',
  },
  light: {
    bg: '#f8fafc', bgAlt: '#ffffff', card: 'rgba(255,255,255,0.8)', border: 'rgba(0,0,0,0.08)',
    text: '#1e293b', textMuted: '#64748b', textDim: '#475569',
    accent: '#06b6d4', accentHover: '#0891b2', accentBg: 'rgba(6,182,212,0.08)', accentBorder: 'rgba(6,182,212,0.25)',
    inputBg: 'rgba(241,245,249,0.8)', inputBorder: 'rgba(0,0,0,0.1)',
    modalBg: 'rgba(255,255,255,0.9)', modalOverlay: 'rgba(0,0,0,0.3)',
    footerBg: 'rgba(255,255,255,0.85)', footerBorder: 'rgba(0,0,0,0.06)',
    noticeText: '#1e293b',
    glass: 'backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);',
    sidebarBg: 'rgba(255,255,255,0.6)',
  }
};

const PROVIDERS = [
  { value: 'baileys', label: 'WhatsApp: Baileys' },
  { value: 'meta', label: 'WhatsApp: Meta Cloud' },
  { value: 'messenger', label: 'Facebook: Messenger' },
  { value: 'instagram', label: 'Instagram: Direct' },
  { value: 'tiktok', label: 'TikTok: Business Messaging' },
  { value: 'discord', label: 'Discord: Server Bot' },
  { value: 'reddit', label: 'Reddit: Chat' },
  { value: '360dialog', label: 'WhatsApp: 360Dialog' }
];

// --- Error Boundary to prevent full page crashes ---
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Dashboard Error Boundary:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 max-w-lg text-center">
            <AlertTriangle size={48} className="text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Error del Dashboard</h2>
            <p className="text-red-300 text-sm mb-4">{this.state.error?.message || 'Error inesperado'}</p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="bg-red-600 hover:bg-red-500 text-white px-6 py-2 rounded-lg font-bold"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SaasDashboard() {
  const { t, i18n } = useTranslation();
  const [isDark, setIsDark] = useState(() => (localStorage.getItem('alex_theme') || 'dark') === 'dark');
  const T = isDark ? themes.dark : themes.light;
  const toggleTheme = () => { const next = !isDark; setIsDark(next); localStorage.setItem('alex_theme', next ? 'dark' : 'light'); };

  const userEmail = localStorage.getItem('demo_email') || 'user@app.com';
  const userRole = localStorage.getItem('alex_io_role') || 'OWNER';
  const userTenant = localStorage.getItem('alex_io_tenant') || '';

  const handleLogout = async () => {
    try {
      if (supabase?.auth) {
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Logout Supabase warning:', e?.message || e);
    }

    localStorage.removeItem('alex_io_token');
    localStorage.removeItem('demo_email');
    localStorage.removeItem('alex_io_role');
    localStorage.removeItem('alex_io_tenant');
    sessionStorage.removeItem('alex_io_token');

    if (typeof window !== 'undefined') {
      window.__alexLogoutRedirecting = false;
      window.location.replace('/#/login');
    }
  };

  const [connecting, setConnecting] = useState(false);
  const [savingConfig, setSavingConfig] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [apiDebugUrl, setApiDebugUrl] = useState(getPreferredApiBase() || 'No resuelta');
  const [notice, setNotice] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingInstances, setLoadingInstances] = useState(false);
  const [instances, setInstances] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showNewBotModal, setShowNewBotModal] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [usage, setUsage] = useState({ messages_sent: 0, plan_limit: 500, tokens_consumed: 0 });
  const [promptVersions, setPromptVersions] = useState([]);
  const [loadingPromptVersions, setLoadingPromptVersions] = useState(false);
  const [promotingVersionId, setPromotingVersionId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [newBotName, setNewBotName] = useState('');
  const [newBotProvider, setNewBotProvider] = useState('baileys');
  const [newBotCredentials, setNewBotCredentials] = useState({
    metaPhoneNumberId: '',
    metaAccessToken: '',
    metaVerifyToken: '',
    tiktokAccessToken: '',
    tiktokSellerId: '',
    discordToken: '',
    discordGuildId: '',
    redditClientId: '',
    redditClientSecret: '',
    redditUsername: '',
    redditPassword: ''
  });
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'chat'
  const [botToDelete, setBotToDelete] = useState(null);
  const [deletingBot, setDeletingBot] = useState(false);

  // Soporte AI Chat
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState([{ role: 'assistant', content: '¡Hola! Soy Alex Support. ¿En qué te puedo ayudar sobre la plataforma ALEX IO?' }]);
  const [supportInput, setSupportInput] = useState('');
  const [isSupportTyping, setIsSupportTyping] = useState(false);

  const [configDraft, setConfigDraft] = useState({
    name: '',
    provider: 'baileys',
    customPrompt: 'Eres un asistente virtual amigable y profesional.',
    voice: 'nova',
    maxWords: 50,
    maxMessages: 10,
    metaApiUrl: '',
    metaPhoneNumberId: '',
    metaAccessToken: '',
    manychatToken: '',
    tiktokAccessToken: '',
    dialogApiKey: '',
    hubspotAccessToken: '',
    copperApiKey: '',
    copperUserEmail: ''
  });

  useEffect(() => {
    const resolved = getLastResolvedApiBase();
    if (resolved) setApiDebugUrl(resolved);
    fetchInstances();
  }, []);

  useEffect(() => {
    if (selected?.instanceId) {
      fetchPromptVersions(selected.instanceId);
      fetchAnalytics(selected.instanceId);
    } else {
      setPromptVersions([]);
      setAnalytics(null);
    }
  }, [selected?.instanceId]);

  const fetchAnalytics = async (instanceId) => {
    setLoadingAnalytics(true);
    try {
      const { response, data } = await fetchJsonWithApiFallback(`/api/saas/analytics/${instanceId}`, {
        headers: { ...getAuthHeaders() }
      });
      if (response.ok && data.success) {
        setAnalytics(data);
      }
    } catch (e) {
      console.error("Error fetching analytics:", e);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleSendSupportMessage = async (e) => {
    e.preventDefault();
    if (!supportInput.trim() || isSupportTyping) return;

    const currentInput = supportInput.trim();
    const newMessages = [...supportMessages, { role: 'user', content: currentInput }];
    setSupportMessages(newMessages);
    setSupportInput('');
    setIsSupportTyping(true);

    try {
      const { response, data } = await fetchJsonWithApiFallback('/api/saas/support-chat', {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: currentInput, history: supportMessages })
      });

      if (response.ok && data.success) {
        setSupportMessages([...newMessages, { role: 'assistant', content: data.text }]);
      } else {
        setSupportMessages([...newMessages, { role: 'assistant', content: 'Lo siento, hubo un error técnico. Reintenta.' }]);
      }
    } catch (err) {
      setSupportMessages([...newMessages, { role: 'assistant', content: 'Fallo de red.' }]);
    } finally {
      setIsSupportTyping(false);
    }
  };

  const fetchInstances = async () => {
    setLoadingInstances(true);
    try {
      const { response, data } = await fetchJsonWithApiFallback('/api/saas/status', {
        timeoutMs: 15000,
        headers: { ...getAuthHeaders() }
      });
      if (response.ok && Array.isArray(data.sessions)) {
        setInstances(data.sessions.map(s => ({
          ...s,
          id: s.instanceId || s.id,
          name: s.companyName || 'Instancia Sin Nombre',
          status: s.status || 'disconnected',
          phone: s.phone || (s.provider === 'baileys' ? 'WhatsApp Web' : 'Cloud API')
        })));
        if (data.sessions.length > 0) {
          setLogs([
            { text: 'Quiero información', ai_model: 'gemini-flash', timestamp: new Date() },
            { text: '¿Cual es el precio?', ai_model: 'gemini-flash', timestamp: new Date(Date.now() - 60000) }
          ]);
        }
      }
    } catch (e) {
      console.error("Error fetching instances:", e);
    } finally {
      setLoadingInstances(false);
    }

    try {
      const { response: useRes, data: useData } = await fetchJsonWithApiFallback('/api/saas/usage', {
        timeoutMs: 15000,
        headers: { ...getAuthHeaders() }
      });
      if (useRes.ok && useData.usage) {
        setUsage(useData.usage);
      }
    } catch (e) {
      console.error("Error fetching usage:", e);
    }
  };

  useEffect(() => {
    if (!selected) return;
    setConfigDraft({
      name: selected.name || '',
      provider: selected.provider || 'baileys',
      customPrompt: selected.customPrompt || 'Eres un asistente virtual amigable y profesional.',
      voice: selected.voice || 'nova',
      maxWords: selected.maxWords || 50,
      maxMessages: selected.maxMessages || 10,
      metaApiUrl: selected.metaApiUrl || '',
      metaPhoneNumberId: selected.metaPhoneNumberId || '',
      metaAccessToken: selected.metaAccessToken || '',
      manychatToken: selected.manychatToken || '',
      tiktokAccessToken: selected.tiktokAccessToken || '',
      dialogApiKey: selected.dialogApiKey || '',
      hubspotAccessToken: selected.hubspotAccessToken || '',
      copperApiKey: selected.copperApiKey || '',
      copperUserEmail: selected.copperUserEmail || ''
    });
  }, [selected]);

  const pushNotice = (type, message) => setNotice({ type, message });

  const providerLabel = useMemo(() => {
    const found = PROVIDERS.find((p) => p.value === (selected?.provider || 'baileys'));
    return found?.label || 'Baileys (QR)';
  }, [selected]);

  const sortPromptVersions = (versions = []) => {
    const ranking = { active: 0, test: 1, archived: 2 };
    return [...versions].sort((a, b) => {
      const byStatus = (ranking[a.status] ?? 9) - (ranking[b.status] ?? 9);
      if (byStatus !== 0) return byStatus;
      return String(b.created_at || '').localeCompare(String(a.created_at || ''));
    });
  };

  const handleBotAction = async (instanceId, action) => {
    if (!instanceId) return;
    try {
      const { response, data } = await fetchJsonWithApiFallback(`/api/saas/action/${instanceId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ action })
      });

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || `Error al ${action === 'pause' ? 'pausar' : 'reanudar'}`);
      }

      pushNotice('success', `Bot ${action === 'pause' ? 'pausado' : 'reanudado'} correctamente.`);
      setTimeout(fetchInstances, 1000);
    } catch (error) {
      pushNotice('error', error.message);
    }
  };

  const handleRestartInstance = async () => {
    if (!selected?.instanceId) return;
    try {
      pushNotice('warning', 'Reiniciando el conector. Espera unos segundos...');
      await fetchJsonWithApiFallback(`/api/saas/instance/${selected.instanceId}/restart`, {
        method: 'POST',
        timeoutMs: 30000,
        headers: { ...getAuthHeaders() }
      });
      pushNotice('success', 'Sesión reiniciada. Generando nuevo código QR...');

      if (selected.provider === 'baileys') {
        const result = await waitForQr(selected.instanceId);
        if (result.type === 'qr') {
          setQrCode(result.value);
          pushNotice('success', 'Nuevo QR generado. Escanéalo para reconectar el bot sin perder la memoria.');
        } else if (result.type === 'online') {
          pushNotice('success', 'El bot se reconectó automáticamente.');
        }
      }
      setTimeout(fetchInstances, 2000);
    } catch (error) {
      pushNotice('error', error.message || 'Fallo al reiniciar.');
    }
  };

  const handleDeleteBot = async () => {
    if (!botToDelete?.instanceId || deletingBot) return;

    setDeletingBot(true);
    try {
      const { response, data } = await fetchJsonWithApiFallback('/api/saas/disconnect', {
        method: 'POST',
        timeoutMs: 30000,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ instanceId: botToDelete.instanceId })
      });

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'No se pudo eliminar el bot.');
      }

      const deletedInstanceId = botToDelete.instanceId;
      setInstances((prev) => prev.filter((inst) => (inst.instanceId || inst.id) !== deletedInstanceId));
      setSelected((current) => ((current?.instanceId || current?.id) === deletedInstanceId ? null : current));
      setBotToDelete(null);
      pushNotice('success', 'Bot eliminado correctamente. Ya puedes crear uno nuevo.');
      setActiveTab('config');
      setTimeout(fetchInstances, 1000);
    } catch (error) {
      pushNotice('error', error.message || 'Fallo al eliminar el bot.');
    } finally {
      setDeletingBot(false);
    }
  };

  const waitForQr = (instanceId) => new Promise((resolve, reject) => {
    const timeoutMs = 120000;
    const startedAt = Date.now();

    const poll = async () => {
      try {
        const { response: statusRes, data: statusData } = await fetchJsonWithApiFallback(`/api/saas/status/${instanceId}`, { timeoutMs: 30000, headers: { ...getAuthHeaders() } });
        setApiDebugUrl(getLastResolvedApiBase() || getPreferredApiBase() || 'No resuelta');

        if (!statusRes.ok) return;
        if (statusData.qr_code) {
          clearInterval(intervalId);
          return resolve({ type: 'qr', value: statusData.qr_code });
        }

        if (statusData.status === 'online') {
          clearInterval(intervalId);
          return resolve({ type: 'online' });
        }

        if (statusData.status === 'disconnected') {
          clearInterval(intervalId);
          return reject(new Error('WhatsApp desconectó la sesión durante el enlace. Reintenta.'));
        }
      } catch (_) {
        // keep polling
      }

      if (Date.now() - startedAt >= timeoutMs) {
        clearInterval(intervalId);
        reject(new Error('No se recibió QR a tiempo. Verifica backend/WhatsApp y reintenta.'));
      }
    };

    const intervalId = setInterval(poll, 5000);
    poll();
  });

  const handleCreateNew = async () => {
    const name = (newBotName || '').trim();
    if (!name) return;
    const provider = newBotProvider || 'baileys';

    setShowNewBotModal(false);
    setNewBotName('');
    setConnecting(true);
    setNotice(null);

    try {
      const { response: res, data } = await fetchJsonWithApiFallback('/api/saas/connect', {
        timeoutMs: 120000,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          companyName: name,
          customPrompt: `Eres un asistente virtual de ${name}`,
          provider,
          ...newBotCredentials,
          dialogApiKey: ''
        })
      });

      setApiDebugUrl(getLastResolvedApiBase() || getPreferredApiBase() || 'No resuelta');

      if (!res.ok && res.status !== 408) {
        throw new Error(data.error || `Error de conexión (HTTP ${res.status})`);
      }

      const instance = {
        id: Date.now(),
        instanceId: data.instance_id,
        name,
        provider,
        customPrompt: `Eres un asistente virtual de ${name}`,
        voice: 'nova',
        maxWords: 50,
        maxMessages: 10,
        super_prompt_json: null,
        metaApiUrl: '',
        metaPhoneNumberId: '',
        metaAccessToken: '',
        manychatToken: '',
        tiktokAccessToken: '',
        dialogApiKey: '',
        hubspotAccessToken: '',
        copperApiKey: '',
        copperUserEmail: ''
      };

      if (provider !== 'baileys') {
        const cloudInstance = { ...instance, status: 'online', phone: provider === 'meta' ? 'Meta Cloud API' : '360Dialog' };
        setInstances((prev) => [...prev, cloudInstance]);
        setSelected(cloudInstance);
        pushNotice('success', data.message || 'Bot cloud configurado correctamente.');
        return;
      }

      let qr = data.qr_code;

      if (!qr && res.status === 408 && data.instance_id) {
        pushNotice('warning', 'Conexión lenta detectada: intentando recuperar QR automáticamente...');
        const result = await waitForQr(data.instance_id);

        if (result.type === 'online') {
          const onlineInstance = { ...instance, status: 'online', phone: 'Conectado' };
          setInstances((prev) => [...prev, onlineInstance]);
          setSelected(onlineInstance);
          pushNotice('success', 'La instancia se conectó correctamente sin requerir nuevo QR.');
          return;
        }

        qr = result.value;
      }

      if (!qr) throw new Error(data.error || 'No se recibió código QR.');

      setQrCode(qr);
      const connectingInstance = { ...instance, status: 'connecting', phone: 'Escaneando QR...' };
      setInstances((prev) => [...prev, connectingInstance]);
      setSelected(connectingInstance);
      pushNotice('success', 'QR generado correctamente. Escanéalo para finalizar conexión.');
    } catch (error) {
      pushNotice('error', error.message);
    } finally {
      setConnecting(false);
    }
  };

  const fetchPromptVersions = async (instanceId) => {
    if (!instanceId) {
      setPromptVersions([]);
      return;
    }

    setLoadingPromptVersions(true);
    try {
      const { data } = await fetchJsonWithApiFallback(`/api/saas/prompt-versions/${instanceId}`, {
        timeoutMs: 20000,
        headers: { ...getAuthHeaders() }
      });
      setPromptVersions(sortPromptVersions(data.versions || []));
    } catch (error) {
      console.warn('No se pudieron cargar versiones del prompt:', error.message);
      setPromptVersions([]);
    } finally {
      setLoadingPromptVersions(false);
    }
  };

  const handlePromotePromptVersion = async (version) => {
    if (!selected?.instanceId || !version?.id) return;
    setPromotingVersionId(version.id);
    try {
      const { data } = await fetchJsonWithApiFallback(`/api/saas/prompt-versions/${selected.instanceId}/${version.id}/promote`, {
        method: 'PATCH',
        timeoutMs: 20000,
        headers: { ...getAuthHeaders() }
      });

      const activePrompt = data.version?.prompt_text || version.prompt_text;
      if (activePrompt) {
        const nextDraft = { ...configDraft, customPrompt: activePrompt };
        setConfigDraft(nextDraft);

        await fetchJsonWithApiFallback(`/api/saas/config/${selected.instanceId}`, {
          timeoutMs: 30000,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(nextDraft)
        });
      }

      await fetchPromptVersions(selected.instanceId);
      pushNotice('success', 'Versión promovida como activa.');
    } catch (error) {
      pushNotice('error', error.message || 'No se pudo promover la versión.');
    } finally {
      setPromotingVersionId(null);
    }
  };

  const handleArchivePromptVersion = async (version) => {
    if (!selected?.instanceId || !version?.id) return;
    setPromotingVersionId(version.id);
    try {
      await fetchJsonWithApiFallback(`/api/saas/prompt-versions/${selected.instanceId}/${version.id}/archive`, {
        method: 'PATCH',
        timeoutMs: 20000,
        headers: { ...getAuthHeaders() }
      });
      await fetchPromptVersions(selected.instanceId);
      pushNotice('success', 'Versión archivada correctamente.');
    } catch (error) {
      pushNotice('error', error.message || 'No se pudo archivar la versión.');
    } finally {
      setPromotingVersionId(null);
    }
  };

  const handleSaveConfig = async () => {
    if (!selected) return;

    const merged = { ...selected, ...configDraft };
    setSavingConfig(true);

    try {
      if (selected.instanceId) {
        const { data } = await fetchJsonWithApiFallback(`/api/saas/config/${selected.instanceId}`, {
          timeoutMs: 30000,
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(configDraft)
        });

        if (!data.success) throw new Error(data.error || 'No se pudo guardar configuración.');
      }

      setInstances((prev) => prev.map((inst) => (inst.id === selected.id ? merged : inst)));
      setSelected(merged);
      pushNotice('success', `Configuración guardada (${providerLabel}).`);
    } catch (error) {
      pushNotice('error', error.message);
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: T.bg, color: T.text, fontFamily: "'DM Sans', sans-serif" }}>

      {/* New Bot Modal */}
      {showNewBotModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: T.modalOverlay }}>
          <div className="rounded-xl p-6 w-full max-w-sm" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Nuevo Asesor Digital</h3>
              <button onClick={() => setShowNewBotModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1" style={{ color: T.textMuted }}>Nombre del Bot</label>
                <input
                  className="w-full rounded p-2"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }}
                  placeholder="Ej: Mi Tienda Online"
                  value={newBotName}
                  onChange={(e) => setNewBotName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNew()}
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm mb-1" style={{ color: T.textMuted }}>Plataforma / Canal</label>
                <select
                  className="w-full rounded p-2"
                  style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }}
                  value={newBotProvider}
                  onChange={(e) => setNewBotProvider(e.target.value)}
                >
                  {PROVIDERS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>

              {/* Dynamic Credentials Fields */}
              {(newBotProvider === 'meta' || newBotProvider === 'whatsapp_cloud') && (
                <div className="space-y-3 p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20">
                  <p className="text-[10px] uppercase font-bold text-indigo-400">Credenciales Meta Cloud</p>
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Phone Number ID" value={newBotCredentials.metaPhoneNumberId} onChange={e => setNewBotCredentials({...newBotCredentials, metaPhoneNumberId: e.target.value})} />
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Access Token (Permanent)" value={newBotCredentials.metaAccessToken} onChange={e => setNewBotCredentials({...newBotCredentials, metaAccessToken: e.target.value})} />
                </div>
              )}

              {newBotProvider === 'tiktok' && (
                <div className="space-y-3 p-3 rounded-lg bg-pink-500/5 border border-pink-500/20">
                  <p className="text-[10px] uppercase font-bold text-pink-400">Credenciales TikTok</p>
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Seller ID" value={newBotCredentials.tiktokSellerId} onChange={e => setNewBotCredentials({...newBotCredentials, tiktokSellerId: e.target.value})} />
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Access Token" value={newBotCredentials.tiktokAccessToken} onChange={e => setNewBotCredentials({...newBotCredentials, tiktokAccessToken: e.target.value})} />
                </div>
              )}

              {newBotProvider === 'discord' && (
                <div className="space-y-3 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-[10px] uppercase font-bold text-blue-400">Credenciales Discord</p>
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Bot Token" value={newBotCredentials.discordToken} onChange={e => setNewBotCredentials({...newBotCredentials, discordToken: e.target.value})} />
                </div>
              )}

              {newBotProvider === 'reddit' && (
                <div className="space-y-3 p-3 rounded-lg bg-orange-500/5 border border-orange-500/20">
                  <p className="text-[10px] uppercase font-bold text-orange-400">Credenciales Reddit</p>
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Username" value={newBotCredentials.redditUsername} onChange={e => setNewBotCredentials({...newBotCredentials, redditUsername: e.target.value})} />
                  <input className="w-full rounded p-2 text-xs" style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} placeholder="Password" type="password" value={newBotCredentials.redditPassword} onChange={e => setNewBotCredentials({...newBotCredentials, redditPassword: e.target.value})} />
                </div>
              )}
              <button
                onClick={handleCreateNew}
                disabled={!newBotName.trim()}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-lg disabled:opacity-50"
              >
                Crear Bot
              </button>
            </div>
          </div>
        </div>
      )}

      {botToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: T.modalOverlay }}>
          <div className="rounded-xl p-6 w-full max-w-md" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="flex items-start gap-3 mb-4">
              <div className="p-2 rounded-lg bg-red-500/10 text-red-400">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Eliminar bot</h3>
                <p className="text-sm mt-1" style={{ color: T.textMuted }}>
                  Vas a borrar <strong style={{ color: T.text }}>{botToDelete.name}</strong> y su sesión activa.
                </p>
              </div>
            </div>

            <div className="rounded-lg p-3 mb-5 text-sm" style={{ background: T.bgAlt, border: `1px solid ${T.border}`, color: T.textMuted }}>
              Esto también limpiará la sesión persistente y los datos operativos asociados para que puedas crear un bot nuevo sin arrastrar residuos del anterior.
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setBotToDelete(null)}
                disabled={deletingBot}
                className="flex-1 py-2.5 rounded-lg font-bold transition-colors"
                style={{ background: T.inputBg, border: `1px solid ${T.border}`, color: T.text }}
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteBot}
                disabled={deletingBot}
                className="flex-1 py-2.5 rounded-lg font-bold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #dc2626, #ef4444)' }}
              >
                {deletingBot ? <Loader size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {deletingBot ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrCode && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: T.modalOverlay }}>
          <div className="p-8 rounded-xl text-center max-w-sm w-full" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h2 className="text-2xl font-bold mb-4">Escanea el QR</h2>
            <img src={qrCode} alt="QR" className="border-4 border-white p-2 rounded mb-4 mx-auto" />
            <button onClick={() => setQrCode(null)} className="text-blue-500">Cerrar</button>
          </div>
        </div>
      )}

      <header className="border-b p-4 flex justify-between items-center" style={{ background: T.bgAlt, borderColor: T.border }}>
        <div className="flex items-center gap-3">
          <Shield className="text-indigo-400" size={28} />
          <h1 className="text-2xl font-bold">ALEX <span className="text-indigo-400">IO</span></h1>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>{VERSION}</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg transition-all hover:scale-110" style={{ background: T.card, border: `1px solid ${T.border}` }} title={isDark ? 'Modo Claro' : 'Modo Oscuro'}>
            {isDark ? <Sun size={16} style={{ color: '#f59e0b' }} /> : <Moon size={16} style={{ color: '#6366f1' }} />}
          </button>
          <div className="text-right hidden sm:block">
            <p className="text-xs" style={{ color: T.textMuted }}>{userEmail}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold" style={{ color: T.textDim }}>{userRole === 'SUPERADMIN' ? '⭐ Admin' : '👤 Cliente'}</p>
          </div>

          {/* Language Switcher */}
          <div className="relative group flex items-center gap-1 px-3 py-1.5 rounded-lg cursor-pointer transition-colors" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <Globe size={16} style={{ color: T.textMuted }} />
            <select
              className="bg-transparent text-sm font-bold focus:outline-none cursor-pointer appearance-none pl-1 pr-3"
              style={{ color: T.textDim }}
              value={i18n.language}
              onChange={(e) => i18n.changeLanguage(e.target.value)}
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="pt">Português</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
              <option value="zh">中文</option>
            </select>
          </div>

          <Link to="/pricing" className="px-4 py-2 rounded-lg font-bold text-sm transition-all hover:scale-105" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', color: '#fff' }}>Planes</Link>
          <button
            onClick={handleLogout}
            className="hover:text-red-400 transition-colors p-2"
            style={{ color: T.textMuted }}
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {notice && (
        <div className={`mx-6 mt-4 p-3 rounded-lg border text-sm flex items-center gap-2 ${notice.type === 'error' ? 'bg-red-900/30 border-red-700 text-red-200' : notice.type === 'warning' ? 'bg-yellow-900/20 border-yellow-700 text-yellow-200' : 'bg-green-900/20 border-green-700 text-green-200'
          }`}>
          {notice.type === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notice.message}</span>
        </div>
      )}

      <main className="flex h-[calc(100vh-64px)]">
        <aside className="w-64 border-r p-4 flex flex-col" style={{ background: T.bgAlt, borderColor: T.border }}>
          <div className="mb-6 rounded-xl p-4" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <h2 className="text-[10px] font-bold uppercase tracking-widest flex justify-between items-center mb-2" style={{ color: T.textMuted }}>
              Uso del Plan
              <span style={{ color: T.accentHover }}>{usage.messages_sent} / {usage.plan_limit}</span>
            </h2>
            <div className="w-full rounded-full h-1.5 mb-2 overflow-hidden" style={{ background: T.border }}>
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min((usage.messages_sent / Math.max(usage.plan_limit, 1)) * 100, 100)}%`, background: `linear-gradient(90deg, #6366f1, ${usage.messages_sent / Math.max(usage.plan_limit, 1) > 0.8 ? '#ef4444' : '#f59e0b'})` }}></div>
            </div>
            <p className="text-[10px] text-right" style={{ color: T.textMuted }}>
              {usage.tokens_consumed ? `${(usage.tokens_consumed / 1000).toFixed(1)}k tokens` : '0 tokens'}
            </p>
          </div>

          <h2 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: T.textMuted }}>{t('dashboard.myBots', 'Asesores Digitales')}</h2>
          <div className="space-y-2 flex-1 overflow-auto">
            {instances.map((inst) => (
              <button key={inst.id} onClick={() => setSelected(inst)} className="w-full text-left p-3 rounded-xl flex items-center justify-between transition-all"
                style={{
                  background: selected?.id === inst.id ? T.accentBg : T.card,
                  border: `1px solid ${selected?.id === inst.id ? T.accent : T.border}`,
                }}>
                <div>
                  <div className="font-medium text-sm" style={{ color: T.text }}>{inst.name}</div>
                  <div className="text-xs" style={{ color: T.textMuted }}>{inst.phone}</div>
                </div>
                <div className="relative">
                  <div className={`w-2.5 h-2.5 rounded-full ${inst.status === 'online' ? 'bg-green-500' : inst.status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                  {inst.status === 'online' && <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-500 animate-ping opacity-40" />}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewBotModal(true)} className="w-full mt-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textDim }}>
            <PlusCircle size={20} /> {t('dashboard.createNewBot', 'Añadir Nuevo Asesor')}
          </button>
        </aside>

        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {selected ? (
            <div className="flex flex-col h-full w-full max-w-7xl mx-auto">
              {/* Bot Header */}
              <div className="flex items-center justify-between gap-4 mb-2">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: T.text }}>{selected.name}</h2>
                  <p className="text-sm flex items-center gap-2" style={{ color: T.textMuted }}>
                    {providerLabel} · Estado: {selected.status || 'desconocido'}
                    {selected.paused && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">PAUSADO</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => setBotToDelete(selected)}
                  className="px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                >
                  <Trash2 size={16} />
                  Eliminar Bot
                </button>
              </div>

              {/* Action Toolbar - always visible, wraps on small screens */}
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2 rounded-lg" style={{ background: T.bgAlt, border: `1px solid ${T.border}` }}>
                <button
                  onClick={() => handleBotAction(selected.instanceId, selected.paused ? 'resume' : 'pause')}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, color: selected.paused ? T.accent : T.textDim }}
                >
                  {selected.paused ? <Play size={14} /> : <PauseCircle size={14} />}
                  {selected.paused ? 'Reanudar' : 'Pausar'}
                </button>
                <button
                  onClick={handleRestartInstance}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, color: '#f59e0b' }}
                >
                  <Zap size={14} />
                  Nuevo QR
                </button>
                <button
                  onClick={() => handleBotAction(selected.instanceId, 'reconnect')}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textDim }}
                >
                  <RefreshCw size={14} />
                  Reconectar
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { response, data } = await fetchJsonWithApiFallback(`/api/saas/test-sync/${selected.instanceId}`, {
                        method: 'POST',
                        headers: { ...getAuthHeaders() }
                      });
                      if (response.ok) pushNotice('success', data.message);
                      else throw new Error(data.error);
                    } catch (e) {
                       pushNotice('error', e.message);
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all hover:scale-[1.02]"
                  style={{ background: T.card, border: `1px solid ${T.border}`, color: '#6366f1' }}
                >
                  <Activity size={14} />
                  Test HubSpot
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 mb-4 pb-2 flex-shrink-0 overflow-x-auto" style={{ borderBottom: `1px solid ${T.border}` }}>
                {[
                  { key: 'config', icon: <Settings size={15} />, label: 'Configuración', color: '#6366f1' },
                  { key: 'rag', icon: <Book size={15} />, label: 'Protocolos Clínicos', color: '#6366f1' },
                  { key: 'chat', icon: <MessageSquare size={15} />, label: 'Chat de Pacientes', color: '#6366f1' },
                  { key: 'broadcast', icon: <Send size={15} />, label: 'Campañas', color: '#a855f7' },
                  { key: 'compliance', icon: <Shield size={15} />, label: 'Auditoría', color: '#06b6d4' },
                  { key: 'memories', icon: <Sparkles size={15} />, label: 'Memoria Larga', color: '#f59e0b' },
                ].map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className="font-bold pb-2 px-3 border-b-2 transition-all flex items-center gap-2 text-sm whitespace-nowrap"
                    style={{
                      borderColor: activeTab === tab.key ? tab.color : 'transparent',
                      color: activeTab === tab.key ? tab.color : T.textMuted,
                    }}>
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'config' ? (
                <div className="flex-1 overflow-y-auto pb-6 pr-2">
                  <ConfigTab
                    selected={selected}
                    configDraft={configDraft}
                    setConfigDraft={setConfigDraft}
                    onSave={handleSaveConfig}
                    analytics={analytics}
                    connectionStatus={selected?.status}
                    theme={T}
                  />
                </div>
              ) : activeTab === 'chat' ? (
                <div className="flex-1 overflow-hidden">
                  <LiveChat instanceId={selected.instanceId || selected.id} tenantId={userTenant} />
                </div>
              ) : activeTab === 'rag' ? (
                <div className="flex-1 overflow-hidden">
                  <KnowledgeBase instanceId={selected.instanceId || selected.id} tenantId={userTenant} />
                </div>
              ) : activeTab === 'broadcast' ? (
                <div className="flex-1 overflow-auto p-4 sm:p-6 pb-24 h-full">
                  <BroadcastCampaign instanceId={selected.instanceId || selected.id} instanceName={selected.name} />
                </div>
              ) : activeTab === 'compliance' ? (
                <div className="flex-1 overflow-hidden">
                  <DataCompliance instanceId={selected.instanceId || selected.id} tenantId={userTenant} />
                </div>
              ) : activeTab === 'memories' ? (
                <div className="flex-1 overflow-y-auto">
                  <MemoryManager />
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full" style={{ color: T.textMuted }}>
              <Smartphone size={64} className="mb-4 opacity-20" />
              <p className="text-lg font-medium mb-2">Selecciona un bot</p>
              <p className="text-sm">del panel lateral para administrar su configuración.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="fixed bottom-2 right-3 text-[11px] px-2 py-1 rounded flex items-center gap-2" style={{ background: T.footerBg, border: `1px solid ${T.footerBorder}`, color: T.textMuted }}>
        <span className="font-bold" style={{ color: '#818cf8' }}>{VERSION}</span>
        <span>Hardened | V8 Multi-Tenancy | API: {apiDebugUrl}</span>
      </footer>

      {showWizard && (
        <PromptWizard
          onClose={() => setShowWizard(false)}
          onPromptGenerated={async (prompt, promptMeta) => {
            setConfigDraft(prev => ({ ...prev, customPrompt: prompt }));
            try {
              if (selected?.instanceId && prompt) {
                await fetchJsonWithApiFallback('/api/saas/prompt-versions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                  body: JSON.stringify({ instanceId: selected.instanceId, prompt, super_prompt_json: promptMeta || null, status: 'test' })
                });
                await fetchPromptVersions(selected.instanceId);
              }
            } catch (error) {
              console.warn('No se pudo versionar el prompt automáticamente:', error.message);
            }
          }}
          instanceName={selected?.name || configDraft.name}
        />
      )}

      {showCopilot && selected && (
        <PromptCopilot
          currentPrompt={configDraft.customPrompt}
          onClose={() => setShowCopilot(false)}
          onPromptImproved={(newPrompt) => {
            setConfigDraft(prev => ({ ...prev, customPrompt: newPrompt }));
          }}
        />
      )}

      {/* Floating AI Support Chat */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {isSupportOpen && (
          <div className="rounded-xl shadow-2xl mb-4 w-80 h-96 flex flex-col overflow-hidden" style={{ background: T.card, border: `1px solid ${T.border}` }}>
            <div className="p-3 text-white flex justify-between items-center" style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)' }}>
              <div className="flex items-center gap-2">
                <Wand2 size={16} />
                <span className="font-bold text-sm">Alex Support</span>
              </div>
              <button onClick={() => setIsSupportOpen(false)} className="hover:text-indigo-200 transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: T.bg }}>
              {supportMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-2 text-sm ${msg.role === 'user' ? 'text-white rounded-br-none' : 'text-slate-200 rounded-bl-none'}`}
                    style={msg.role === 'user' ? { background: T.accent } : { background: T.card, border: `1px solid ${T.border}` }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSupportTyping && (
                <div className="flex justify-start">
                  <div className="rounded-lg rounded-bl-none p-2 text-xs flex gap-1 items-center" style={{ background: T.card, border: `1px solid ${T.border}`, color: T.textMuted }}>
                    <span className="animate-bounce">●</span>
                    <span className="animate-bounce delay-75">●</span>
                    <span className="animate-bounce delay-150">●</span>
                  </div>
                </div>
              )}
            </div>
            <form onSubmit={handleSendSupportMessage} className="p-2 flex gap-2" style={{ borderTop: `1px solid ${T.border}`, background: T.card }}>
              <input type="text" value={supportInput} onChange={e => setSupportInput(e.target.value)} placeholder="Escribe tu duda..."
                className="flex-1 rounded-full px-3 py-1.5 text-sm focus:outline-none"
                style={{ background: T.inputBg, border: `1px solid ${T.inputBorder}`, color: T.text }} />
              <button type="submit" disabled={!supportInput.trim() || isSupportTyping}
                className="disabled:opacity-50 text-white rounded-full p-2 transition-colors flex items-center justify-center"
                style={{ background: '#6366f1' }}>
                <Send size={16} className="-ml-0.5" />
              </button>
            </form>
          </div>
        )}
        <button onClick={() => setIsSupportOpen(!isSupportOpen)}
          className={`text-white p-4 rounded-full shadow-lg transition-all ${isSupportOpen ? 'rotate-90 scale-90 opacity-0' : 'rotate-0 scale-100 opacity-100'}`}
          style={{ background: 'linear-gradient(135deg, #6366f1, #7c3aed)', boxShadow: '0 4px 20px rgba(99,102,241,0.3)' }}>
          <MessageCircle size={24} />
        </button>
      </div>

    </div>
  );
}


export default function SaasDashboardWithBoundary() {
  return (
    <ErrorBoundary>
      <SaasDashboard />
    </ErrorBoundary>
  );
}

