// server/services/scoringService.js
// Enterprise Lead Scoring Engine (Phase 4)

function scoreLead(text) {
  if (!text) return 0;
  let score = 0;
  const normalized = text.toLowerCase();
  
  // Buying Intent Patterns
  if (normalized.includes("precio") || normalized.includes("costo") || normalized.includes("cuanto sale")) score += 0.4;
  if (normalized.includes("comprar") || normalized.includes("contratar") || normalized.includes("pagar")) score += 0.6;
  if (normalized.includes("demo") || normalized.includes("probar") || normalized.includes("probandolo")) score += 0.3;
  if (normalized.includes("ahora mismo") || normalized.includes("urgente") || normalized.includes("ya")) score += 0.2;
  
  // Negative Patterns (Support/Other)
  if (normalized.includes("ayuda") || normalized.includes("soporte") || normalized.includes("falla")) score -= 0.2;

  return Math.max(0, Math.min(score, 1.0));
}

module.exports = { scoreLead };
