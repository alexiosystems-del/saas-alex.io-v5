import React, { useState } from 'react';
import { Book, Upload, Globe, FileText, Plus, Database, Search, Zap, CheckCircle2 } from 'lucide-react';

export default function KnowledgeTab() {
  const [sources, setSources] = useState([
    { id: 1, type: 'file', name: 'Catalogo_2024.pdf', status: 'indexed', size: '2.4 MB' },
    { id: 2, type: 'url', name: 'https://alexio.com/faq', status: 'indexing', size: '-' },
    { id: 3, type: 'text', name: 'Preguntas Frecuentes Manual', status: 'indexed', size: '12 KB' }
  ]);

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
            <h1 className="text-4xl font-black text-white tracking-tight">RAG Intelligence</h1>
            <p className="text-slate-500 mt-2">La memoria real de tu negocio. Sube archivos para que la IA aprenda de ellos.</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20">
            <Plus size={16} /> Entrenar Nueva Fuente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-white/5 bg-white/5 flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Fuentes de Conocimiento</h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Sincronización Activa</span>
                    </div>
                </div>
                <div className="divide-y divide-white/5">
                    {sources.map(source => (
                        <div key={source.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    {source.type === 'file' ? <FileText size={18} /> : source.type === 'url' ? <Globe size={18} /> : <Book size={18} />}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-white">{source.name}</div>
                                    <div className="text-[10px] text-slate-500 font-mono uppercase mt-0.5">{source.size} • {source.type}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${source.status === 'indexed' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                                    {source.status}
                                </span>
                                <button className="p-2 text-slate-600 hover:text-white transition-colors"><Search size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="p-8 border-2 border-dashed border-white/5 rounded-3xl bg-blue-500/5 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Upload size={32} />
                </div>
                <div>
                    <h4 className="text-lg font-bold text-white">Arrastra tus archivos aquí</h4>
                    <p className="text-sm text-slate-500 max-w-sm mt-2">Soporta PDF, TXT, DOCX y MP3. Nuestra IA extraerá los datos y generará embeddings automáticamente.</p>
                </div>
                <button className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold border border-white/10 transition-all">
                    Explorar Archivos
                </button>
            </div>
        </div>

        <div className="space-y-6">
            <div className="p-6 bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/20 rounded-3xl shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Database size={100} className="text-indigo-400" />
                </div>
                <h3 className="text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Zap size={14} /> Neural Cache
                </h3>
                <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                        <span className="text-sm font-bold text-white">Tokens Indexados</span>
                        <span className="text-2xl font-black text-white">1.2M</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-[65%]" />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed italic">
                        "La IA utiliza estos datos para responder con un 98.4% de precisión sin inventar información."
                    </p>
                </div>
            </div>

            <div className="p-6 bg-slate-900 border border-white/5 rounded-3xl space-y-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Beneficios Gold RAG</h4>
                {[
                  'Cero alucinaciones (IA anclada a datos)',
                  'Soporte técnico 100% autónomo',
                  'Venta basada en catálogo real',
                  'Multilingüe (Lee en EN, responde en ES)'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-xs text-slate-300 font-medium">{item}</span>
                  </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
