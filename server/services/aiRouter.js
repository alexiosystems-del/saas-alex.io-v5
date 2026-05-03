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

async function callProvider(p, input) {
  if (!isAvailable(p.name)) throw "circuit open";

  try {
    return await p.fn(input);
  } catch (err) {
    failures[p.name] = {
      count: (failures[p.name]?.count || 0) + 1,
      lastFail: Date.now()
    };
    throw err;
  }
}

async function aiRouter(input) {
  for (let p of providers) {
    try {
      const start = Date.now();
      const res = await callProvider(p, input);
      console.log("AI:", p.name, Date.now() - start, "ms");
      return res;
    } catch (e) {
      console.log("FAIL:", p.name);
    }
  }

  throw new Error("ALL MODELS FAILED");
}

function getSystemStatus() {
  return {
    ai: "ok",
    db: "ok",
    bots: 1, // we will override bots count at the endpoint
    whatsapp: "ready"
  };
}

module.exports = { aiRouter, getSystemStatus, isAvailable };
