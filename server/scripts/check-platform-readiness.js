#!/usr/bin/env node
require('dotenv').config();

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

let failures = 0;
console.log('🧪 ALEX IO readiness check');
console.log(`📅 ${new Date().toISOString()}`);
console.log('');

for (const check of checks) {
  const missing = check.vars.filter((name) => !process.env[name]);
  if (missing.length === 0) {
    console.log(`✅ ${check.area}`);
  } else {
    failures += 1;
    console.log(`❌ ${check.area}`);
    console.log(`   Missing: ${missing.join(', ')}`);
  }

  for (const v of check.vars) {
    console.log(`   - ${v}: ${mask(process.env[v])}`);
  }
}

console.log('');
if (failures > 0) {
  console.log(`❌ Readiness failed in ${failures} area(s).`);
  process.exit(1);
}

console.log('✅ Platform appears ready at env-level.');
