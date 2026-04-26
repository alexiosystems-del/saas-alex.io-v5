import React, { useState, useEffect, useRef, useCallback } from "react";
import { Send, Filter, Users, Calendar, Tag, Thermometer, CheckCircle2, AlertTriangle, Loader, Zap, Plus, X, Image as ImageIcon, Video, FileText, Music } from 'lucide-react';
import { fetchJsonWithApiFallback, getAuthHeaders } from '../api';

// --- Constantes Estéticas ---
const TEMP_COLORS = {
  HOT:  { bg: "rgba(220, 38, 38, 0.15)", border: "rgba(220, 38, 38, 0.4)", text: "#f87171", icon: "🔥" },
  WARM: { bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)", text: "#fbbf24", icon: "🟡" },
  COLD: { bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)", text: "#60a5fa", icon: "❄️" },
};

const DELAY_MIN = 35000;
const DELAY_MAX = 60000;

// --- Sub-componentes ---
function TempBadge({ temp }) {
  const c = TEMP_COLORS[temp] || TEMP_COLORS.COLD;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border"
      style={{ background: c.bg, color: c.text, borderColor: c.border }}>
      {c.icon} {temp}
    </span>
  );
}

function StatChip({ value, label, color, icon: Icon }) {
  return (
    <div className="flex-1 bg-slate-900/40 border border-slate-700/50 rounded-xl p-3 text-center group hover:border-slate-500/50 transition-all">
        <div className="flex justify-center mb-1">
            {Icon && <Icon size={14} className="text-slate-500" />}
        </div>
      <div className="text-xl font-bold" style={{ color: color || '#fff' }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">{label}</div>
    </div>
  );
}

export default function BroadcastCampaign({ instanceId, instanceName }) {
  // Filtros
  const [selectedBot, setSelectedBot]   = useState(instanceId || "all");
  const [selectedTemp, setSelectedTemp] = useState("all");
  const [selectedTag, setSelectedTag]   = useState("all");
  const [dateFrom, setDateFrom]         = useState("");
  const [dateTo, setDateTo]             = useState("");

  // Leads
  const [leads, setLeads]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [checked, setChecked]           = useState(new Set());
  const [bots, setBots]                 = useState([]);
  const [tags, setTags]                 = useState([]);

  // Mensaje
  const [message, setMessage]           = useState("");
  const [mediaType, setMediaType]       = useState("image");
  const [mediaUrl, setMediaUrl]         = useState("");
  const textareaRef                     = useRef(null);

  // Campaña
  const [preflight, setPreflight]       = useState(null); // null | "loading" | "ok" | "error"
  const [preflightMsg, setPreflightMsg] = useState("");
  const [sending, setSending]           = useState(false);
  const [progress, setProgress]         = useState(null); // { sent, total, nextDelay, failed }
  const pollRef                         = useRef(null);
  const campaignIdRef                   = useRef(null);

  // --- Cargar datos iniciales ---
  useEffect(() => {
    const loadInit = async () => {
        try {
            const { data: botsData } = await fetchJsonWithApiFallback("/api/saas/bots", { headers: getAuthHeaders() });
            setBots(botsData.bots || []);
            
            const { data: tagsData } = await fetchJsonWithApiFallback("/api/saas/leads/tags", { headers: getAuthHeaders() });
            setTags(tagsData.tags || []);
        } catch (e) { console.error("Error loading broadcast data", e); }
    };
    loadInit();
  }, []);

  // --- Buscar leads con filtros ---
  const fetchLeads = useCallback(async () => {
    setLoading(true);
    setChecked(new Set());
    try {
      const params = new URLSearchParams();
      if (selectedBot  !== "all") params.set("bot",  selectedBot);
      if (selectedTemp !== "all") params.set("temp", selectedTemp);
      if (selectedTag  !== "all") params.set("tag",  selectedTag);
      if (dateFrom) params.set("from", dateFrom);
      if (dateTo)   params.set("to",   dateTo);

      const { data } = await fetchJsonWithApiFallback(`/api/saas/leads?${params.toString()}`, { headers: getAuthHeaders() });
      setLeads(data.leads || []);
    } catch (err) {
      console.error("Error al cargar leads:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBot, selectedTemp, selectedTag, dateFrom, dateTo]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // --- Selección de leads ---
  const toggleLead = (phone) => {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(phone) ? next.delete(phone) : next.add(phone);
      return next;
    });
  };

  const toggleAll = () => {
    if (checked.size === leads.length) {
      setChecked(new Set());
    } else {
      setChecked(new Set(leads.map(l => l.phone)));
    }
  };

  // --- Insertar variable en el textarea ---
  const insertVar = (variable) => {
    const ta    = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    const next  = message.slice(0, start) + variable + message.slice(end);
    setMessage(next);
    setTimeout(() => {
      ta.selectionStart = ta.selectionEnd = start + variable.length;
      ta.focus();
    }, 0);
  };

  // --- Preflight ---
  const runPreflight = async () => {
    setPreflight("loading");
    setPreflightMsg("");
    try {
      const { response, data } = await fetchJsonWithApiFallback("/api/saas/broadcast/preflight", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ instanceId: selectedBot === "all" ? instanceId : selectedBot, mediaUrl, mediaType }),
      });
      if (response.ok && data.valid) {
        setPreflight("ok");
        setPreflightMsg(data.message || "Instancia conectada y lista.");
      } else {
        setPreflight("error");
        setPreflightMsg(data.error || "Error en preflight.");
      }
    } catch {
      setPreflight("error");
      setPreflightMsg("No se pudo contactar al servidor.");
    }
  };

  // --- Lanzar campaña ---
  const startCampaign = async () => {
    const selectedPhones = Array.from(checked);

    if (selectedPhones.length === 0) {
      alert("Seleccioná al menos un lead.");
      return;
    }
    if (!message.trim()) {
      alert("El mensaje no puede estar vacío.");
      return;
    }

    setSending(true);
    setProgress({ sent: 0, total: selectedPhones.length, failed: 0 });

    try {
      const { response, data } = await fetchJsonWithApiFallback("/api/saas/broadcast", {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({
          instanceId: selectedBot === "all" ? instanceId : selectedBot,
          phones: selectedPhones,
          message,
          mediaType:  mediaUrl ? mediaType : null,
          mediaUrl:   mediaUrl || null,
        }),
      });
      
      if (response.ok && data.success) {
        campaignIdRef.current = data.campaignId;
        pollStatus();
      } else {
        alert(data.error || "Error al lanzar campaña");
        setSending(false);
      }
    } catch (err) {
      console.error("Error al lanzar campaña:", err);
      setSending(false);
    }
  };

  // --- Polling de status ---
  const pollStatus = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await fetchJsonWithApiFallback(`/api/saas/broadcast/status/${campaignIdRef.current}`, {
            headers: getAuthHeaders()
        });
        setProgress({ 
            sent: data.sent, 
            total: data.total, 
            failed: data.failed, 
            progress: data.progress,
            status: data.status
        });
        if (data.status === "finished") {
          clearInterval(pollRef.current);
          setSending(false);
        }
      } catch (e) {
        console.warn("Poll error", e);
      }
    }, 5000);
  };

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const countByTemp = (t) => leads.filter(l => l.temp === t).length;
  const pct = progress ? progress.progress : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header Interactivo */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-fuchsia-500/20">
            <Send size={20} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Campaña de Growth</h2>
                <span className="text-[9px] bg-fuchsia-500/20 text-fuchsia-400 px-1.5 py-0.5 rounded border border-fuchsia-500/30 font-bold">v2.1.5-LEADS</span>
            </div>
            <p className="text-xs text-slate-400">Automatiza el seguimiento y rescate de leads capturados por IA.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">Enterprise Engine</span>
        </div>
      </div>

      {/* Panel de Filtros y Leads */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-900/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <Filter size={16} className="text-fuchsia-400" />
                <span className="text-sm font-bold text-slate-200">Filtrar Base de Datos</span>
            </div>
            <button onClick={fetchLeads} className="text-[10px] font-bold text-fuchsia-400 hover:text-fuchsia-300 transition-colors uppercase tracking-widest">Refrescar</button>
        </div>
        
        <div className="p-5 space-y-4">
            {/* Filtros Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={10} /> Bot Origen</label>
                    <select value={selectedBot} onChange={e => setSelectedBot(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-fuchsia-500 outline-none transition-all">
                        <option value="all">Todos los bots</option>
                        {bots.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Calendar size={10} /> Desde</label>
                    <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-fuchsia-500 outline-none transition-all" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Tag size={10} /> Etiqueta</label>
                    <select value={selectedTag} onChange={e => setSelectedTag(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-fuchsia-500 outline-none transition-all">
                        <option value="all">Todas</option>
                        {tags.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Thermometer size={10} /> Temperatura</label>
                    <div className="flex gap-1">
                        {["all", "HOT", "WARM", "COLD"].map(t => (
                            <button key={t} onClick={() => setSelectedTemp(t)} className={`flex-1 py-2 text-[9px] font-bold rounded border transition-all ${selectedTemp === t ? 'bg-fuchsia-600/20 border-fuchsia-500 text-fuchsia-400' : 'bg-slate-950 border-slate-700 text-slate-500 hover:border-slate-500'}`}>
                                {t === 'all' ? 'TODOS' : t}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Estadísticas de Filtrado */}
            <div className="flex gap-3">
                <StatChip value={countByTemp("HOT")}  label="Hot Leads"  color={TEMP_COLORS.HOT.text} />
                <StatChip value={countByTemp("WARM")} label="Warm" color={TEMP_COLORS.WARM.text} />
                <StatChip value={countByTemp("COLD")} label="Cold" color={TEMP_COLORS.COLD.text} />
                <StatChip value={checked.size} label="Seleccionados" color="#a855f7" icon={CheckCircle2} />
            </div>

            {/* Tabla de Selección */}
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/30">
                <div className="grid grid-cols-[40px_1fr_1.5fr_100px_1fr] gap-4 p-3 bg-slate-900/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <div className="flex justify-center">
                        <input type="checkbox" checked={leads.length > 0 && checked.size === leads.length} onChange={toggleAll} className="accent-fuchsia-500" />
                    </div>
                    <span>Teléfono</span>
                    <span>Nombre del Lead</span>
                    <span className="text-center">Temp</span>
                    <span>Etiqueta</span>
                </div>
                
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-10 flex flex-col items-center gap-3 opacity-50">
                            <Loader className="animate-spin text-fuchsia-500" size={24} />
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Analizando Leads...</span>
                        </div>
                    ) : leads.length > 0 ? (
                        leads.map(lead => (
                            <div key={lead.phone} onClick={() => toggleLead(lead.phone)} className={`grid grid-cols-[40px_1fr_1.5fr_100px_1fr] gap-4 p-3 items-center border-b border-slate-800/50 text-xs transition-colors cursor-pointer ${checked.has(lead.phone) ? 'bg-fuchsia-500/5' : 'hover:bg-slate-800/30'}`}>
                                <div className="flex justify-center">
                                    <input type="checkbox" checked={checked.has(lead.phone)} readOnly className="accent-fuchsia-500" />
                                </div>
                                <span className="font-mono text-slate-400">+{lead.phone}</span>
                                <span className="font-medium text-slate-200">{lead.name || 'Sin nombre'}</span>
                                <div className="flex justify-center">
                                    <TempBadge temp={lead.temp} />
                                </div>
                                <span className="text-slate-500 truncate">{lead.tag || '—'}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-10 text-center">
                            <p className="text-xs text-slate-500">No se encontraron leads con estos filtros.</p>
                        </div>
                    )}
                </div>
            </div>

            <button onClick={toggleAll} className="w-full py-2.5 rounded-xl text-xs font-bold bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-400 hover:bg-fuchsia-500/20 transition-all">
                {checked.size === leads.length ? 'Deseleccionar todos' : `Seleccionar los ${leads.length} leads filtrados`}
            </button>
        </div>
      </div>

      {/* Sección de Mensaje y Configuración de Envío */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor de Mensaje */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Zap size={12} className="text-amber-400" /> Contenido del Mensaje</label>
                <div className="flex gap-1">
                    {["{nombre}", "{bot}", "{etiqueta}"].map(v => (
                        <button key={v} onClick={() => insertVar(v)} className="text-[9px] font-bold px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-white transition-all border border-slate-700">{v}</button>
                    ))}
                </div>
            </div>
            <textarea
                ref={textareaRef}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hola {nombre}, un gusto saludarte. Soy {bot}..."
                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:border-fuchsia-500 outline-none transition-all resize-none"
            />
            
            <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Adjunto Multimedia</label>
                <div className="flex gap-2">
                    <select value={mediaType} onChange={e => setMediaType(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-fuchsia-500">
                        <option value="image">Imagen</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">PDF</option>
                    </select>
                    <input type="text" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Pegar URL pública del archivo..." className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-fuchsia-500" />
                </div>
            </div>
        </div>

        {/* Panel de Control y Anti-ban */}
        <div className="space-y-4">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4">
                <div className="bg-amber-900/20 border border-amber-600/30 rounded-xl p-4 flex gap-3">
                    <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-1" />
                    <div>
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-1">Estrategia Anti-Ban</h4>
                        <p className="text-[10px] text-amber-200/70 leading-relaxed">
                            Retraso aleatorio de 35-60 segundos activo. 
                            Recomendamos no enviar más de 50 mensajes diarios desde cuentas nuevas en Baileys.
                        </p>
                    </div>
                </div>

                {preflight && (
                    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${preflight === 'ok' ? 'bg-green-900/20 border-green-500/30 text-green-400' : 'bg-red-900/20 border-red-500/30 text-red-400'}`}>
                        {preflight === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                        {preflightMsg}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button onClick={runPreflight} disabled={preflight === 'loading'} className="py-3 rounded-xl text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                        {preflight === 'loading' ? <Loader className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                        Validar Conector
                    </button>
                    <button onClick={startCampaign} disabled={sending || checked.size === 0} className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg ${sending || checked.size === 0 ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white shadow-fuchsia-500/20 hover:scale-[1.02]'}`}>
                        {sending ? <Loader className="animate-spin" size={14} /> : <Send size={14} />}
                        {sending ? 'Campaña en curso...' : `Lanzar (${checked.size})`}
                    </button>
                </div>
            </div>

            {/* Monitor de Progreso */}
            {progress && (
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3 animate-in slide-in-from-bottom-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            {progress.status === 'finished' ? '✓ Campaña Finalizada' : '⏳ Procesando Envíos...'}
                        </span>
                        <span className="text-sm font-bold text-fuchsia-400">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-gradient-to-r from-fuchsia-600 to-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-[11px] font-bold">
                        <span className="text-green-400">Enviados: {progress.sent}</span>
                        {progress.failed > 0 && <span className="text-red-400">Fallidos: {progress.failed}</span>}
                        <span className="text-slate-400">Total: {progress.total}</span>
                    </div>
                </div>
            )}
        </div>
      </div>

        {/* Estilos para el scrollbar */}
        <style dangerouslySetInnerHTML={{ __html: `
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
        `}} />
    </div>
  );
}
