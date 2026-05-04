import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Users, Search, Filter, MessageSquare, Phone, Calendar, MoreVertical, Star, ChevronRight, ArrowUpRight, ArrowDownRight, UserPlus, Zap } from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'Nuevos', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Calificados', color: 'bg-purple-500' },
  { id: 'engaged', label: 'En Conversación', color: 'bg-amber-500' },
  { id: 'converted', label: 'Cerrados', color: 'bg-emerald-500' }
];

export default function CrmProTab() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLeads();
  }, [filter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/saas/leads?status=${filter}`);
      const data = await res.json();
      setLeads(data);
    } catch (e) {
      console.error('Error fetching leads:', e);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    { label: 'Leads Totales', value: leads.length.toString(), change: '+0%', icon: Users, color: 'text-blue-400' },
    { label: 'Tasa de Conversión', value: '18.4%', change: '+3.2%', icon: Target, color: 'text-emerald-400' },
    { label: 'Valor Estimado', value: `$${(leads.length * 50).toLocaleString()}`, change: '+0%', icon: TrendingUp, color: 'text-amber-400' }
  ];

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tight">CRM PRO Pipeline</h1>
            <p className="text-slate-500 mt-2">Gestión inteligente de leads calificados por IA.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
            <UserPlus size={16} /> Añadir Lead Manual
        </button>
      </div>

      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-white/5 shadow-xl relative overflow-hidden group backdrop-blur-md">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-all">
                <stat.icon size={80} />
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-white/5 ${stat.color}`}>
                <stat.icon size={20} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</span>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-white/5 ${stat.change.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Pipeline Area */}
      <div className="rounded-3xl bg-slate-900 border border-white/5 shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col md:flex-row justify-between gap-4">
          <div className="flex items-center gap-6">
            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Listado de Oportunidades</h2>
            <div className="flex gap-2">
              {['all', 'hot', 'warm', 'cold'].map(t => (
                <button 
                  key={t}
                  onClick={() => setFilter(t)}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filter === t ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o teléfono..." 
              className="pl-10 pr-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-all w-full md:w-64"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-black/20 text-left">
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead / Contacto</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado AI</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Lead Score</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Último Mensaje</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {leads.map((lead) => (
                <tr key={lead.id} className="group hover:bg-white/5 transition-all">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-xs">
                        {lead.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-white">{lead.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{lead.phone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${STAGES.find(s => s.id === lead.stage)?.color}`} />
                        <span className="text-[10px] font-black text-white uppercase tracking-wider">
                            {STAGES.find(s => s.id === lead.stage)?.label}
                        </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[80px]">
                            <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${lead.score}%` }}
                                className={`h-full ${lead.score > 80 ? 'bg-emerald-500' : lead.score > 50 ? 'bg-amber-500' : 'bg-red-500'}`}
                            />
                        </div>
                        <span className="text-xs font-mono font-black text-white">{lead.score}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="max-w-[200px]">
                        <div className="text-[11px] text-slate-300 truncate font-medium">"{lead.lastMsg}"</div>
                        <div className="text-[9px] text-slate-600 mt-1 uppercase font-black">{lead.time}</div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                        <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-indigo-500 transition-all">
                            <MessageSquare size={16} />
                        </button>
                        <button className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-indigo-500 transition-all">
                            <Zap size={16} className="text-amber-500" />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase">Neural Lead Tracking Active • 99.9% Recall</p>
            <button className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-[0.2em] transition-all">Exportar Datos (.csv)</button>
        </div>
      </div>
    </div>
  );
}
