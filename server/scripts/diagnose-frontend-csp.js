#!/usr/bin/env node
/*
 * Usage:
 *   node scripts/diagnose-frontend-csp.js https://whatsapp-fullstack-ylsx.onrender.com/#/dashboard
 */
const https = require('https');
const http = require('http');

const inputUrl = process.argv[2] || 'https://whatsapp-fullstack-ylsx.onrender.com/#/dashboard';
const url = new URL(inputUrl);
url.hash = '';
url.pathname = '/';

const lib = url.protocol === 'http:' ? http : https;

function extractDirective(csp, name) {
  if (!csp) return '';
  const pieces = csp.split(';').map(s => s.trim());
  const match = pieces.find(p => p.toLowerCase().startsWith(name.toLowerCase() + ' '));
  return match || '';
}

lib.get(url, (res) => {
  const csp = res.headers['content-security-policy'] || '';
  const connectSrc = extractDirective(csp, 'connect-src');

  console.log('🔎 Frontend CSP diagnostic');
  console.log('URL:', url.toString());
  console.log('HTTP status:', res.statusCode);
  console.log('connect-src:', connectSrc || 'NOT FOUND');

  const checks = [
    { token: 'https://*.supabase.co', label: 'HTTPS supabase' },
    { token: 'wss://*.supabase.co', label: 'WSS supabase realtime' },
    { token: 'https://*.onrender.com', label: 'HTTPS onrender' },
    { token: 'https://*.openai.com', label: 'HTTPS openai' }
  ];

  let failed = 0;
  for (const c of checks) {
    const ok = connectSrc.includes(c.token);
    if (!ok) failed += 1;
    console.log(`${ok ? '✅' : '❌'} ${c.label}: ${c.token}`);
  }

  if (failed > 0) {
    console.log('\n❌ CSP mismatch detected. Deployed frontend/header is missing required connect-src entries.');
    process.exitCode = 2;
  } else {
    console.log('\n✅ CSP connect-src looks compatible with Supabase Realtime.');
  }
}).on('error', (err) => {
  console.error('❌ Failed to fetch URL:', err.message);
  process.exit(1);
});
