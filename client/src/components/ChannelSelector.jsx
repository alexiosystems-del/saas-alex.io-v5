import React, { useState } from 'react';

const CHANNELS = [
  { id: 'whatsapp_baileys', name: 'WhatsApp', sub: 'BAILEYS', available: true },
  { id: 'whatsapp_cloud', name: 'WhatsApp', sub: 'CLOUD API', available: true },
  { id: 'discord', name: 'Discord', sub: 'BOT API', available: true },
  { id: 'tiktok', name: 'TikTok', sub: 'BUSINESS', available: true },
  { id: 'messenger', name: 'Messenger', sub: 'FACEBOOK', available: true },
  { id: 'instagram', name: 'Instagram', sub: 'DIRECT', available: true },
  { id: 'dialog360', name: '360Dialog', sub: 'WHATSAPP', available: true },
];

const ACCENT = {
  whatsapp_baileys: '#25D366',
  whatsapp_cloud: '#5B9BD5',
  discord: '#5865F2',
  tiktok: '#EE1D52',
  messenger: '#0084FF',
  instagram: '#E1306C',
  dialog360: '#00C2FF'
};

export default function ChannelSelector({ selected = 'whatsapp_baileys', onSelect }) {
  const [hovered, setHovered] = useState(null);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {CHANNELS.map((ch) => {
        const active = selected === ch.id || hovered === ch.id;
        return (
          <button
            key={ch.id}
            type="button"
            onClick={() => onSelect?.(ch)}
            onMouseEnter={() => setHovered(ch.id)}
            onMouseLeave={() => setHovered(null)}
            className="relative rounded-xl p-3 text-left transition-all"
            style={{
              border: `1px solid ${active ? `${ACCENT[ch.id]}66` : 'rgba(255,255,255,0.12)'}`,
              background: active ? `${ACCENT[ch.id]}15` : 'rgba(255,255,255,0.03)',
              opacity: ch.available ? 1 : 0.55,
              cursor: 'pointer'
            }}
          >
            {ch.badge && <span className="absolute top-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-white/10">PRÓXIMAMENTE</span>}
            <div className="text-sm font-semibold text-white">{ch.name}</div>
            <div className="text-[10px] tracking-wider text-slate-400">{ch.sub}</div>
            {!ch.available && <div className="text-[10px] mt-1 text-amber-400">Usar wizard</div>}
          </button>
        );
      })}
    </div>
  );
}
