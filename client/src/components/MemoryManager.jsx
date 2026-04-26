import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MemoryManager = () => {
    const [customerId, setCustomerId] = useState('');
    const [memories, setMemories] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [newMemory, setNewMemory] = useState({ content: '', category: 'fact', importance: 3 });
    const [error, setError] = useState(null);

    const token = localStorage.getItem('alex_io_token') || sessionStorage.getItem('alex_io_token');
    const apiUrl = import.meta.env.VITE_API_URL || '';

    const fetchMemories = async () => {
        if (!customerId) return;
        setLoading(true);
        setError(null);
        try {
            const [memRes, sumRes] = await Promise.all([
                axios.get(`${apiUrl}/api/memories?customer_id=${customerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get(`${apiUrl}/api/memories/summary/${customerId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);
            setMemories(Array.isArray(memRes.data) ? memRes.data : []);
            setSummary(sumRes.data || { total_memories: 0 });
        } catch (err) {
            setError('Error al cargar la memoria del cliente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMemory = async (e) => {
        e.preventDefault();
        if (!customerId || !newMemory.content) return;
        setLoading(true);
        try {
            await axios.post(`${apiUrl}/api/memories`, {
                customer_id: customerId,
                ...newMemory
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setNewMemory({ content: '', category: 'fact', importance: 3 });
            fetchMemories();
        } catch (err) {
            setError('Error al guardar la nueva memoria.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteMemory = async (id) => {
        if (!window.confirm('¿Eliminar este hecho de la memoria?')) return;
        try {
            await axios.delete(`${apiUrl}/api/memories/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchMemories();
        } catch (err) {
            setError('Error al eliminar.');
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        🧠 Memoria Larga del Cliente
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">Gestiona los hechos y preferencias persistentes detectados por la IA.</p>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto">
                    <input 
                        type="text" 
                        placeholder="ID del Cliente (ej: WhatsApp JID)" 
                        className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all flex-grow"
                        value={customerId}
                        onChange={(e) => setCustomerId(e.target.value)}
                    />
                    <button 
                        onClick={fetchMemories}
                        disabled={loading || !customerId}
                        className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg shadow-cyan-900/20"
                    >
                        Buscar
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Hechos</div>
                        <div className="text-2xl font-bold text-white">{summary.total_memories}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Relevancia Media</div>
                        <div className="text-2xl font-bold text-cyan-400">{summary.avg_importance || 0} / 5</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Auto-Generados</div>
                        <div className="text-2xl font-bold text-purple-400">{summary.auto_generated || 0}</div>
                    </div>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">Último Acceso</div>
                        <div className="text-sm font-semibold text-gray-300 mt-2">
                            {summary.last_accessed_at ? new Date(summary.last_accessed_at).toLocaleDateString() : 'Nunca'}
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Formulario */}
                <div className="lg:col-span-1">
                    <form onSubmit={handleAddMemory} className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-4 sticky top-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Añadir Hecho Manual</h3>
                        
                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Hecho o Preferencia</label>
                            <textarea 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                rows="3"
                                placeholder="Ej: El cliente prefiere ser contactado por la tarde."
                                value={newMemory.content}
                                onChange={(e) => setNewMemory({...newMemory, content: e.target.value})}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Categoría</label>
                            <select 
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm focus:outline-none"
                                value={newMemory.category}
                                onChange={(e) => setNewMemory({...newMemory, category: e.target.value})}
                            >
                                <option value="fact">Hecho General</option>
                                <option value="preference">Preferencia</option>
                                <option value="purchase">Interés de Compra</option>
                                <option value="issue">Problema/Ticket</option>
                                <option value="context">Contexto Temporal</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 uppercase mb-1">Importancia (1-5)</label>
                            <input 
                                type="range" min="1" max="5" 
                                className="w-full accent-cyan-500"
                                value={newMemory.importance}
                                onChange={(e) => setNewMemory({...newMemory, importance: parseInt(e.target.value)})}
                            />
                            <div className="flex justify-between text-[10px] text-gray-600 mt-1">
                                <span>TRIVIAL</span>
                                <span>CRÍTICO</span>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading || !customerId}
                            className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-all disabled:opacity-30"
                        >
                            GUARDAR EN MEMORIA
                        </button>
                    </form>
                </div>

                {/* Lista de Memorias */}
                <div className="lg:col-span-2 space-y-4">
                    {memories.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-3xl text-gray-600">
                            {customerId ? 'No hay hechos registrados para este cliente.' : 'Introduce un ID de cliente para ver su memoria.'}
                        </div>
                    ) : (
                        memories.map(m => (
                            <div key={m.id} className="group bg-white/5 border border-white/10 p-5 rounded-2xl hover:border-cyan-500/50 transition-all">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-grow">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                                                m.category === 'preference' ? 'bg-purple-500/20 text-purple-400' :
                                                m.category === 'issue' ? 'bg-red-500/20 text-red-400' :
                                                'bg-cyan-500/20 text-cyan-400'
                                            }`}>
                                                {m.category}
                                            </span>
                                            <span className="text-[10px] text-gray-600">
                                                {m.source === 'auto' ? '🤖 AUTO-GENERADO' : '👤 MANUAL'}
                                            </span>
                                        </div>
                                        <p className="text-white text-lg font-medium leading-relaxed">{m.content}</p>
                                        <div className="mt-3 flex items-center gap-4 text-[10px] text-gray-600">
                                            <span>Importancia: {m.importance} / 5</span>
                                            <span>Usado: {m.access_count} veces</span>
                                            <span>Creado: {new Date(m.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <button 
                                        onClick={() => handleDeleteMemory(m.id)}
                                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-500 transition-all"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemoryManager;
