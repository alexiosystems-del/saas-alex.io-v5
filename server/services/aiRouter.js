/**
 * AI ROUTER PRO (Con Métricas + Failover)
 */
const { logInfo, logError } = require('../utils/logger');

// Mock functions para los proveedores, en producción llamarían a las APIs reales
const gemini = async (input) => { /* llamar a Gemini API */ return "Respuesta Gemini: " + input; };
const minimax = async (input) => { /* llamar a MiniMax API */ return "Respuesta MiniMax: " + input; };
const deepseek = async (input) => { /* llamar a DeepSeek API */ return "Respuesta DeepSeek: " + input; };
const gpt = async (input) => { /* llamar a OpenAI API */ return "Respuesta GPT: " + input; };

const providers = [
  { name: "gemini", fn: gemini, priority: 1 },
  { name: "minimax", fn: minimax, priority: 2 },
  { name: "deepseek", fn: deepseek, priority: 3 },
  { name: "gpt", fn: gpt, priority: 4 }
];

const failures = {};

function isAvailable(name) {
  const f = failures[name];
  if (!f) return true;

  if (f.count >= 3 && Date.now() - f.lastFail < 30000) {
    return false;
  }
  return true;
}

async function aiRouter(input) {
  for (let p of providers) {
    if (!isAvailable(p.name)) continue;

    try {
      const start = Date.now();
      const res = await p.fn(input);
      const latency = Date.now() - start;

      logInfo(`[AI Router] AI OK: ${p.name} | Latency: ${latency}ms`);
      failures[p.name] = { count: 0 };
      return res;

    } catch (err) {
      failures[p.name] = {
        count: (failures[p.name]?.count || 0) + 1,
        lastFail: Date.now()
      };
      logError(`[AI Router] AI FAIL: ${p.name}`, err.message);
    }
  }

  throw new Error("ALL MODELS DOWN");
}

function getSystemStatus() {
  return {
    ai: failures,
    status: "running",
    uptime: process.uptime()
  };
}

module.exports = { aiRouter, getSystemStatus, isAvailable };
