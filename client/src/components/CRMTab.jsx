import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, TrendingUp, Users, Search, Filter, MessageSquare, Phone, Calendar, MoreVertical, Star, ChevronRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const STAGES = [
  { id: 'new', label: 'Nuevos', color: 'bg-blue-500' },
  { id: 'qualified', label: 'Calificados', color: 'bg-purple-500' },
  { id: 'engaged', label: 'En Conversación', color: 'bg-amber-500' },
  { id: 'converted', label: 'Cerrados', color: 'bg-emerald-500' }
];

export default function CRMTab() {
  const [leads, setLeads] = useState([
    { id: 1, name: 'Juan Pérez', phone: '+54 11 2345 6789', stage: 'new', score: 85, lastMsg: 'Me interesa el plan premium', time: '2 min ago', tags: ['Inversor', 'Hot'] },
    { id: 2, name: 'María García', phone: '+34 612 345 678', stage: 'qualified', score: 92, lastMsg: '¿Tienen soporte 24/7?', time: '1 hour ago', tags: ['Enterprise'] },
    { id: 3, name: 'Carlos Ruiz', phone: '+52 55 1234 5678', stage: 'engaged', score: 45, lastMsg: 'Lo voy a pensar', time: '3 hours ago', tags: ['Follow-up'] }
  ]);

  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const stats = [
    { label: 'Leads Totales', value: '1,284', change: '+12%', icon: Users, color: 'text-blue-400' },
    { label: 'Tasa de Conversión', value: '18.4%', change: '+3.2%', icon: Target, color: 'text-emerald-400' },
    { label: 'Valor Estimado', value: '$42,500', change: '+8%', icon: TrendingUp, color: 'text-amber-400' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stats Header */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl bg-slate-900 border border-white/5 shadow-xl relative overflow-hidden group">
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
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Pipeline de Ventas</h2>
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
                        <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
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
                            <MoreVertical size={16} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-6 bg-white/5 border-t border-white/5 flex justify-between items-center">
            <p className="text-[10px] text-slate-500 font-mono uppercase">Mostrando {leads.length} leads calificados por AI Core</p>
            <button className="text-[10px] font-black text-indigo-400 hover:text-white uppercase tracking-[0.2em] transition-all">Ver Pipeline Completo</button>
        </div>
      </div>
    </div>
  );
}
