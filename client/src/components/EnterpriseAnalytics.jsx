import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Zap, 
  Target, 
  Users, 
  DollarSign,
  ShieldCheck,
  Cpu
} from 'lucide-react';

const EnterpriseAnalytics = ({ tenantId }) => {
  const [stats, setStats] = useState({
    totalMessages: 12450,
    avgLatency: '420ms',
    avgScore: 0.88,
    leadsGenerated: 142,
    conversionRate: '12.5%',
    costs: '$12.40'
  });

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Intelligence Overview
          </h2>
          <p className="text-slate-400 mt-1">Real-time performance and conversion metrics.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-xs font-mono border border-blue-500/20">
            Live Feed: Active
          </span>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Conversations', value: stats.totalMessages, icon: Users, color: 'text-blue-400' },
          { label: 'Avg Confidence', value: (stats.avgScore * 100).toFixed(0) + '%', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Avg Latency', value: stats.avgLatency, icon: Zap, color: 'text-amber-400' },
          { label: 'AI Cost (MTD)', value: stats.costs, icon: DollarSign, color: 'text-rose-400' },
        ].map((stat, i) => (
          <div key={i} className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl backdrop-blur-sm hover:border-blue-500/30 transition-all group">
            <div className="flex justify-between items-start">
              <div className={`p-2 rounded-lg bg-slate-800 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="mt-4">
              <p className="text-slate-400 text-sm font-medium">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quality Chart Placeholder */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-white/5 p-6 rounded-2xl h-[300px] flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="text-blue-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Conversion Funnel</h3>
          </div>
          <div className="flex-1 flex items-end gap-2 px-4">
            {[40, 65, 45, 90, 75, 55, 85, 95, 70, 80].map((h, i) => (
              <div 
                key={i} 
                className="flex-1 bg-gradient-to-t from-blue-600/20 to-blue-500/60 rounded-t-lg transition-all hover:to-blue-400" 
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-4 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* Lead Intelligence */}
        <div className="bg-slate-900/50 border border-white/5 p-6 rounded-2xl flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Target className="text-rose-400" size={20} />
            <h3 className="text-lg font-semibold text-white">Top Intent Leads</h3>
          </div>
          <div className="space-y-4 flex-1">
            {[
              { name: '+54 11 55...21', score: 0.95, time: '2m ago' },
              { name: '+34 602...44', score: 0.88, time: '15m ago' },
              { name: '+1 305...90', score: 0.82, time: '1h ago' },
            ].map((lead, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold">
                    {lead.name.slice(0, 3)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{lead.name}</p>
                    <p className="text-[10px] text-slate-500">{lead.time}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 text-xs font-bold">{(lead.score * 100).toFixed(0)}%</p>
                  <div className="w-12 h-1 bg-slate-800 rounded-full mt-1 overflow-hidden">
                    <div className="h-full bg-emerald-500" style={{ width: `${lead.score * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors border border-white/5">
            View All Leads
          </button>
        </div>
      </div>

      {/* Autonomous Status */}
      <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 border border-blue-500/20 p-4 rounded-2xl flex items-center gap-4">
        <div className="relative">
          <Cpu className="text-blue-400 animate-pulse" size={24} />
          <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Autonomous Agents Active</p>
          <p className="text-xs text-slate-400">Optimizer is currently scaling Gemini-1.5-Flash for 85% of traffic.</p>
        </div>
        <button className="text-blue-400 text-xs font-bold hover:underline">
          View Audit Logs
        </button>
      </div>
    </div>
  );
};

export default EnterpriseAnalytics;
