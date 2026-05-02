import React, { useState, useEffect } from 'react';
import {
  Users,
  Phone,
  Mail,
  MessageSquare,
  ChevronRight,
  Tag,
  Plus,
  Search,
  Filter,
  User,
  Clock,
  Target,
  TrendingUp,
  ArrowRight,
  Star,
  FileText
} from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'Nuevo', color: 'bg-slate-500', count: 0 },
  { id: 'contacted', label: 'Contactado', color: 'bg-blue-500', count: 0 },
  { id: 'qualified', label: 'Calificado', color: 'bg-amber-500', count: 0 },
  { id: 'proposal', label: 'Propuesta', color: 'bg-indigo-500', count: 0 },
  { id: 'negotiation', label: 'Negociación', color: 'bg-purple-500', count: 0 },
  { id: 'won', label: 'Ganado', color: 'bg-emerald-500', count: 0 },
  { id: 'lost', label: 'Perdido', color: 'bg-rose-500', count: 0 },
];

const CrmProTab = () => {
  const [leads, setLeads] = useState([]);
  const [pipeline, setPipeline] = useState({});
  const [selectedLead, setSelectedLead] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStage, setActiveStage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchPipeline();
  }, [activeStage, searchQuery]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  };

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStage) params.set('stage', activeStage);
      if (searchQuery) params.set('search', searchQuery);
      params.set('limit', '50');

      const res = await fetch(`/api/crm/leads?${params}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setLeads(data.leads || []);
    } catch (e) {
      console.error('CRM fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchPipeline = async () => {
    try {
      const res = await fetch('/api/crm/pipeline', { headers: getAuthHeaders() });
      const data = await res.json();
      setPipeline(data.pipeline || {});
    } catch (e) {
      console.error('Pipeline fetch error:', e);
    }
  };

  const moveStage = async (leadId, stage) => {
    try {
      await fetch(`/api/crm/leads/${leadId}/stage`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ stage })
      });
      fetchLeads();
      fetchPipeline();
      if (selectedLead?.id === leadId) {
        setSelectedLead(prev => ({ ...prev, lead: { ...prev.lead, stage } }));
      }
    } catch (e) {
      console.error('Move stage error:', e);
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !selectedLead) return;
    try {
      await fetch(`/api/crm/leads/${selectedLead.lead.id}/notes`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ content: noteText })
      });
      setNoteText('');
      selectLead(selectedLead.lead.id);
    } catch (e) {
      console.error('Add note error:', e);
    }
  };

  const selectLead = async (leadId) => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setSelectedLead(data);
    } catch (e) {
      console.error('Lead detail error:', e);
    }
  };

  const totalLeads = Object.values(pipeline).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-indigo-400 to-rose-400 bg-clip-text text-transparent">
            CRM Enterprise
          </h2>
          <p className="text-slate-400 mt-1 text-sm">{totalLeads} leads en pipeline • Gestión automática por IA</p>
        </div>
      </div>

      {/* Pipeline Kanban Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveStage(null)}
          className={`shrink-0 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all border ${
            !activeStage ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
          }`}
        >
          Todos ({totalLeads})
        </button>
        {STAGES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveStage(s.id === activeStage ? null : s.id)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
              activeStage === s.id ? 'bg-white/10 border-white/20 text-white' : 'bg-transparent border-white/5 text-slate-500 hover:text-white'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            {s.label} ({pipeline[s.id] || 0})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-white/5 rounded-2xl text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 transition-colors text-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Leads List */}
        <div className="lg:col-span-2 space-y-3">
          {loading ? (
            <div className="text-center py-20 text-slate-500 animate-pulse">Cargando leads...</div>
          ) : leads.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/30 rounded-3xl border border-white/5">
              <Users className="mx-auto text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 font-medium">No hay leads {activeStage ? `en etapa "${activeStage}"` : 'aún'}.</p>
              <p className="text-slate-600 text-sm mt-1">Los leads se crean automáticamente con cada conversación.</p>
            </div>
          ) : (
            leads.map(lead => (
              <div
                key={lead.id}
                onClick={() => selectLead(lead.id)}
                className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all group ${
                  selectedLead?.lead?.id === lead.id
                    ? 'bg-indigo-500/10 border-indigo-500/30'
                    : 'bg-slate-900/30 border-white/5 hover:border-white/10'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-700 flex items-center justify-center text-white text-xs font-black shadow-lg">
                  {(lead.name || lead.phone || '?').slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm truncate">{lead.name || lead.phone}</h4>
                    {lead.score > 0.7 && <Star size={12} className="text-amber-400 shrink-0" />}
                  </div>
                  <p className="text-slate-500 text-xs truncate mt-0.5">{lead.last_message || 'Sin mensajes'}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                    STAGES.find(s => s.id === lead.stage)?.color || 'bg-slate-600'
                  } text-white`}>
                    {lead.stage}
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    {lead.updated_at ? new Date(lead.updated_at).toLocaleDateString() : ''}
                  </p>
                </div>
                <ChevronRight size={16} className="text-slate-700 group-hover:text-white transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Lead Detail Panel */}
        <div className="bg-slate-900/40 border border-white/5 rounded-3xl p-6 backdrop-blur-sm">
          {selectedLead ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-lg shadow-xl">
                  {(selectedLead.lead.name || selectedLead.lead.phone || '?').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedLead.lead.name || selectedLead.lead.phone}</h3>
                  <p className="text-slate-500 text-xs font-mono">{selectedLead.lead.phone}</p>
                </div>
              </div>

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Score</p>
                  <p className="text-emerald-400 font-bold text-lg">{((selectedLead.lead.score || 0) * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Stage</p>
                  <p className="text-white font-bold text-sm capitalize">{selectedLead.lead.stage}</p>
                </div>
              </div>

              {/* Stage Controls */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Mover a:</p>
                <div className="flex flex-wrap gap-1.5">
                  {STAGES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => moveStage(selectedLead.lead.id, s.id)}
                      disabled={selectedLead.lead.stage === s.id}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                        selectedLead.lead.stage === s.id
                          ? `${s.color} text-white`
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tags */}
              {selectedLead.lead.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedLead.lead.tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-lg text-[10px] font-bold border border-indigo-500/20">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Notas</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote()}
                    placeholder="Agregar nota..."
                    className="flex-1 px-3 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50"
                  />
                  <button onClick={addNote} className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white transition-colors">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {(selectedLead.notes || []).map((note, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-xl border border-white/5">
                      <p className="text-white text-xs">{note.content}</p>
                      <p className="text-slate-600 text-[10px] mt-1">{new Date(note.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Activity Log */}
              <div>
                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-2">Actividad</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(selectedLead.activity || []).map((act, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <Clock size={10} className="text-slate-600 shrink-0" />
                      <span className="text-slate-400">{act.activity_type}</span>
                      <span className="text-slate-600">{new Date(act.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              <User className="text-slate-700 mb-4" size={48} />
              <p className="text-slate-500 font-medium text-sm">Selecciona un lead</p>
              <p className="text-slate-600 text-xs mt-1">para ver su detalle completo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrmProTab;
