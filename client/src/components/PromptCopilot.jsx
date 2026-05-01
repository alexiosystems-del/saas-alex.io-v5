import React, { useState, useMemo } from 'react';
import { Sparkles, Loader, X, Send, Wand2, Copy, CheckCircle2, History, RotateCcw, Zap, Shield, MessageSquare, Scissors, Users } from 'lucide-react';
import { fetchJsonWithApiFallback, getAuthHeaders } from '../api';

const QUICK_SUGGESTIONS = [
    { icon: '🎯', label: 'Más persuasivo', instruction: 'Hacé que el prompt sea más persuasivo y orientado al cierre de ventas. Agregá urgencia sutil.' },
    { icon: '🛡️', label: 'Anti-descuentos', instruction: 'Agregá una regla estricta: el bot NUNCA debe ofrecer descuentos, códigos promocionales ni rebajas. Si le piden descuento, debe redirigir al valor del servicio.' },
    { icon: '📋', label: 'Manejo objeciones', instruction: 'Agregá una sección completa de manejo de objeciones comunes: precio alto, falta de tiempo, "lo pienso", competencia más barata.' },
    { icon: '🌐', label: 'Traducir a inglés', instruction: 'Traducí todo el prompt a inglés profesional manteniendo la misma estructura y reglas.' },
    { icon: '⚡', label: 'Más conciso', instruction: 'Reducí el prompt a la mitad de longitud sin perder reglas críticas. Eliminá redundancias y simplificá.' },
    { icon: '🤝', label: 'Derivación humana', instruction: 'Agregá reglas claras de cuándo el bot debe derivar a un humano: quejas graves, solicitudes de reembolso, consultas legales/médicas, y cuando el cliente lo pida explícitamente.' },
];

function computeDiff(oldText, newText) {
    if (!oldText || !newText) return [];
    const oldLines = oldText.split('\n');
    const newLines = newText.split('\n');
    const diff = [];
    const maxLen = Math.max(oldLines.length, newLines.length);

    for (let i = 0; i < maxLen; i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';
        if (oldLine === newLine) {
            diff.push({ type: 'same', text: newLine });
        } else {
            if (oldLine && !newLines.includes(oldLine)) {
                diff.push({ type: 'removed', text: oldLine });
            }
            if (newLine && !oldLines.includes(newLine)) {
                diff.push({ type: 'added', text: newLine });
            }
            if (oldLine && newLine && oldLine !== newLine && newLines.includes(oldLine)) {
                diff.push({ type: 'same', text: newLine });
            }
        }
    }
    return diff;
}

export default function PromptCopilot({ onClose, currentPrompt, onPromptImproved }) {
    const [instruction, setInstruction] = useState('');
    const [loading, setLoading] = useState(false);
    const [improvedPrompt, setImprovedPrompt] = useState(null);
    const [copied, setCopied] = useState(false);
    const [showDiff, setShowDiff] = useState(false);
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const diffLines = useMemo(() => {
        if (!improvedPrompt || !currentPrompt) return [];
        return computeDiff(currentPrompt, improvedPrompt);
    }, [currentPrompt, improvedPrompt]);

    const handleImprove = async (customInstruction) => {
        const instr = customInstruction || instruction;
        if (!instr.trim() || !currentPrompt) return;

        setLoading(true);
        try {
            const res = await fetchJsonWithApiFallback('/api/saas/prompt-copilot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                body: JSON.stringify({ currentPrompt: improvedPrompt || currentPrompt, instruction: instr }),
                timeoutMs: 30000
            });

            if (res.data && res.data.prompt) {
                if (improvedPrompt) {
                    setHistory(prev => [...prev, { prompt: improvedPrompt, instruction: instr, timestamp: new Date() }]);
                }
                setImprovedPrompt(res.data.prompt);
                setInstruction('');
            } else {
                throw new Error(res.data?.error || 'No se pudo generar el prompt mejorado');
            }
        } catch (err) {
            console.error('Error enhancing prompt:', err);
            alert('Falló la conexión o el modelo tardó mucho en responder.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!improvedPrompt) return;
        navigator.clipboard.writeText(improvedPrompt);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleApply = () => {
        if (improvedPrompt) {
            onPromptImproved(improvedPrompt);
            onClose();
        }
    };

    const handleRevert = (idx) => {
        setImprovedPrompt(history[idx].prompt);
        setHistory(prev => prev.slice(0, idx));
        setShowHistory(false);
    };

    const addedCount = diffLines.filter(d => d.type === 'added').length;
    const removedCount = diffLines.filter(d => d.type === 'removed').length;

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden flex flex-col shadow-2xl h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-900 to-purple-900 border-b border-indigo-700 p-4 flex items-center justify-between shadow-lg z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600/50 flex items-center justify-center">
                            <Sparkles size={22} className="text-indigo-300" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Co-Piloto AI</h2>
                            <p className="text-indigo-300 text-xs">Mejorá tu System Prompt con lenguaje natural</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {history.length > 0 && (
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${showHistory ? 'bg-purple-600 text-white' : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'}`}
                            >
                                <History size={14} />
                                {history.length} versiones
                            </button>
                        )}
                        <button onClick={onClose} className="text-indigo-300 hover:text-white transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
                    {/* History Panel */}
                    {showHistory && history.length > 0 && (
                        <div className="bg-slate-900/80 border border-purple-500/30 rounded-xl p-3 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                                <History size={12} /> Historial de Iteraciones
                            </h4>
                            {history.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2 border border-slate-700/50">
                                    <div className="flex-1 min-w-0">
                                        <span className="text-xs text-purple-300 font-bold">v{idx + 1}</span>
                                        <span className="text-xs text-slate-400 ml-2 truncate">"{item.instruction}"</span>
                                    </div>
                                    <button
                                        onClick={() => handleRevert(idx)}
                                        className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 ml-2 shrink-0"
                                    >
                                        <RotateCcw size={12} /> Revertir
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Prompt Actual (Read-only) */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prompt Actual</h3>
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-3 max-h-32 overflow-auto">
                            <pre className="text-[11px] text-slate-300 whitespace-pre-wrap font-mono">{currentPrompt || 'No hay prompt actualmente configurado.'}</pre>
                        </div>
                    </div>

                    {/* Quick Suggestion Chips */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                            <Zap size={12} /> Mejoras Rápidas
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {QUICK_SUGGESTIONS.map((chip, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleImprove(chip.instruction)}
                                    disabled={loading || !currentPrompt}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all
                                        bg-slate-900 border-slate-700 text-slate-300
                                        hover:bg-indigo-900/30 hover:border-indigo-500/50 hover:text-indigo-200
                                        active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span>{chip.icon}</span>
                                    <span>{chip.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Instruction Input */}
                    <div className="flex flex-col gap-2">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">O escribí tu instrucción</h3>
                        <div className="flex gap-2 relative">
                            <input
                                type="text"
                                className="w-full bg-slate-900 border border-indigo-500/50 rounded-lg pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner placeholder-slate-500"
                                placeholder="Ej: Agregá una regla para no hablar de la competencia..."
                                value={instruction}
                                onChange={(e) => setInstruction(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleImprove(); }}
                                disabled={loading || !currentPrompt}
                            />
                            <button
                                onClick={() => handleImprove()}
                                disabled={loading || !currentPrompt || !instruction.trim()}
                                className="absolute right-1 top-1 bottom-1 aspect-square bg-indigo-600 hover:bg-indigo-500 rounded-md flex items-center justify-center text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="flex items-center justify-center gap-3 py-6 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-indigo-600/30 flex items-center justify-center">
                                <Loader size={18} className="animate-spin text-indigo-400" />
                            </div>
                            <span className="text-indigo-300 text-sm font-medium">Mejorando tu prompt con IA...</span>
                        </div>
                    )}

                    {/* Result Panel */}
                    {improvedPrompt && !loading && (
                        <div className="flex-1 flex flex-col gap-2 min-h-0 bg-slate-900 border border-emerald-500/30 rounded-xl overflow-hidden">
                            {/* Result Header */}
                            <div className="bg-emerald-900/20 px-4 py-3 border-b border-emerald-500/20 flex justify-between items-center">
                                <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                    <Wand2 size={14} />
                                    Nueva Versión {history.length > 0 ? `(v${history.length + 1})` : ''}
                                </h3>
                                <div className="flex gap-2 items-center">
                                    {diffLines.length > 0 && (
                                        <button
                                            onClick={() => setShowDiff(!showDiff)}
                                            className={`text-xs flex items-center gap-1 px-2 py-1 rounded transition-all font-medium ${showDiff
                                                    ? 'bg-amber-600/20 border border-amber-500/30 text-amber-300'
                                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                                                }`}
                                        >
                                            {showDiff ? '📝 Texto' : '🔀 Diff'}
                                            {addedCount > 0 && <span className="text-emerald-400">+{addedCount}</span>}
                                            {removedCount > 0 && <span className="text-red-400">-{removedCount}</span>}
                                        </button>
                                    )}
                                    <button onClick={handleCopy} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white transition-colors bg-slate-800 px-2 py-1 rounded">
                                        {copied ? <CheckCircle2 size={12} className="text-green-400" /> : <Copy size={12} />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            {/* Content: Diff or Raw */}
                            <div className="flex-1 overflow-auto p-4">
                                {showDiff ? (
                                    <div className="space-y-0.5 font-mono text-[11px]">
                                        {diffLines.map((line, idx) => (
                                            <div
                                                key={idx}
                                                className={`px-2 py-0.5 rounded-sm ${line.type === 'added'
                                                        ? 'bg-emerald-900/40 text-emerald-300 border-l-2 border-emerald-500'
                                                        : line.type === 'removed'
                                                            ? 'bg-red-900/30 text-red-300 border-l-2 border-red-500 line-through opacity-70'
                                                            : 'text-slate-400'
                                                    }`}
                                            >
                                                <span className="select-none mr-2 text-slate-600">
                                                    {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                                </span>
                                                {line.text || '\u00A0'}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <pre className="text-[11px] text-emerald-100/90 whitespace-pre-wrap font-mono">{improvedPrompt}</pre>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {improvedPrompt && !loading && (
                    <div className="p-4 bg-slate-900 border-t border-slate-700 flex justify-between items-center gap-3">
                        <button onClick={() => { setImprovedPrompt(null); setHistory([]); }} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">
                            Descartar todo
                        </button>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setImprovedPrompt(null)}
                                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors border border-slate-700 rounded-lg"
                            >
                                Seguir mejorando
                            </button>
                            <button onClick={handleApply} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-2 rounded-lg text-sm font-bold shadow-lg shadow-emerald-900/50 transition-all flex items-center gap-2">
                                <CheckCircle2 size={16} /> Aplicar Prompt
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
