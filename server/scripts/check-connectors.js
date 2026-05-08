#!/usr/bin/env node
require('dotenv').config();
const axios = require('axios');

const BASE_URL = process.env.VITE_API_URL || 'http://localhost:3000';
const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || process.env.VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '';

const connectors = [
  {
    name: 'Meta (WhatsApp Cloud)',
    url: `${BASE_URL}/api/webhooks/meta?hub.mode=subscribe&hub.challenge=11223344&hub.verify_token=${META_VERIFY_TOKEN}`,
    method: 'GET',
    expectedStatus: 200,
    expectedDataPattern: '11223344',
    condition: !!META_VERIFY_TOKEN
  },
  {
    name: 'ManyChat',
    url: `${BASE_URL}/api/webhooks/manychat`,
    method: 'POST', // ManyChat usually expects POST
    expectedStatus: [200, 401, 400], // 401/400 are fine since it means the endpoint exists but body is empty
    condition: true
  },
  {
    name: 'Discord',
    url: `${BASE_URL}/api/webhooks/discord`,
    method: 'POST',
    expectedStatus: [200, 401, 400],
    condition: !!(process.env.DISCORD_BOT_TOKEN || process.env.DISCORD_TOKEN)
  },
  {
    name: 'Baileys (Engine Status)',
    url: `${BASE_URL}/api/whatsapp/status`,
    method: 'GET',
    expectedStatus: [200, 401], // 401 means auth is working but missing token, 200 is public status
    condition: ['1', 'true', 'yes', 'on'].includes(String(process.env.BAILEYS_ENABLED || '').toLowerCase())
  }
];

async function runChecks() {
  console.log(`🔌 Verificando Conectores y Webhooks en: ${BASE_URL}`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log('');

  let failures = 0;

  for (const connector of connectors) {
    if (!connector.condition) {
      console.log(`⏭️  ${connector.name}: SKIPPED (No configurado en .env)`);
      continue;
    }

    try {
      const res = await axios({
        method: connector.method,
        url: connector.url,
        validateStatus: () => true, // resolve all statuses
        timeout: 5000
      });

      const isStatusValid = Array.isArray(connector.expectedStatus) 
        ? connector.expectedStatus.includes(res.status) 
        : res.status === connector.expectedStatus;

      const isDataValid = connector.expectedDataPattern 
        ? String(res.data).includes(connector.expectedDataPattern)
        : true;

      if (isStatusValid && isDataValid) {
        console.log(`✅ ${connector.name} [HTTP ${res.status}] - OK`);
      } else {
        failures++;
        console.log(`❌ ${connector.name} [HTTP ${res.status}] - FAILED`);
        if (!isDataValid) {
          console.log(`   Esperaba patrón '${connector.expectedDataPattern}' pero recibió: ${String(res.data).substring(0, 50)}...`);
        }
      }
    } catch (err) {
      failures++;
      console.log(`❌ ${connector.name} - ERROR CONEXIÓN: ${err.message}`);
    }
  }

  console.log('');
  if (failures > 0) {
    console.log(`⚠️ Alerta: ${failures} conector(es) fallaron la validación.`);
    process.exit(1);
  } else {
    console.log(`🚀 Todos los webhooks y conectores configurados responden correctamente.`);
  }
}

runChecks();
