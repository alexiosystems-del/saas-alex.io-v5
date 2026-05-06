#!/usr/bin/env node
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const checks = [
  {
    area: 'RAG uploads (Supabase/OpenAI)',
    vars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'OPENAI_API_KEY']
  },
  {
    area: 'Multilenguaje (traducción)',
    vars: ['GEMINI_API_KEY']
  },
  {
    area: 'Claude/Anthropic (cascada + auditoría)',
    vars: ['ANTHROPIC_API_KEY']
  },
  {
    area: 'CRM PRO (interno)',
    vars: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  },
  {
    area: 'WhatsApp Meta Cloud API',
    vars: ['WHATSAPP_TOKEN', 'WHATSAPP_PHONE_NUMBER_ID', 'VERIFY_TOKEN']
  },
  {
    area: '360dialog',
    vars: ['DIALOG360_API_KEY']
  },
  {
    area: 'Baileys (WhatsApp Web)',
    vars: ['BAILEYS_ENABLED']
  },
  {
    area: 'Discord',
    vars: ['DISCORD_BOT_TOKEN']
  },
  {
    area: 'TikTok',
    vars: ['TIKTOK_ACCESS_TOKEN']
  },
  {
    area: 'Live Chat / Socket',
    vars: ['JWT_SECRET']
  }
];

function mask(v) {
  if (!v) return 'MISSING';
  if (v.length <= 8) return 'SET';
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}

const isJson = process.argv.includes('--json');
let failures = 0;
const results = [];

for (const check of checks) {
  const missing = check.vars.filter((name) => !process.env[name]);
  const status = missing.length === 0 ? 'PASS' : 'FAIL';
  if (status === 'FAIL') failures += 1;

  results.push({
    area: check.area,
    status,
    missing,
    vars: check.vars.reduce((acc, v) => {
      acc[v] = mask(process.env[v]);
      return acc;
    }, {})
  });
}

if (isJson) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    success: failures === 0,
    failures,
    results
  }, null, 2));
} else {
  console.log('🧪 ALEX IO readiness check');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('');

  for (const res of results) {
    console.log(`${res.status === 'PASS' ? '✅' : '❌'} ${res.area}`);
    if (res.status === 'FAIL') {
      console.log(`   Missing: ${res.missing.join(', ')}`);
    }
    for (const [name, val] of Object.entries(res.vars)) {
      console.log(`   - ${name}: ${val}`);
    }
  }

  console.log('');
  if (failures > 0) {
    console.log(`❌ Readiness failed in ${failures} area(s).`);
  } else {
    console.log('✅ Platform appears ready at env-level.');
  }
}

if (failures > 0) process.exit(1);
