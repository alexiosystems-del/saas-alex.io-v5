/**
 * intentClassifier.js
 * Specialized utility for detecting user intent in messages (Sales, Support, etc.)
 */

const SALES_INTENT_TERMS = [
    'comprar', 'precio', 'costo', 'cotizacion', 'cotizar', 'presupuesto', 'pagar', 'pago', 'tarjeta',
    'plan', 'suscripcion', 'agendar', 'cita', 'quiero', 'info', 'contacto', 'demo', 'contratar'
];

const SUPPORT_INTENT_TERMS = [
    'ayuda', 'soporte', 'problema', 'error', 'falla', 'no funciona', 'asesor', 'reclamo',
    'devolucion', 'reembolso', 'incidente'
];

/**
 * Normaliza el texto eliminando acentos, signos de puntuación y espacios extras.
 */
const normalizeIntentText = (text = '') => String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Verifica si un texto normalizado contiene algún término de una lista.
 */
const hasIntentTerm = (normalizedText, terms = []) => terms.some(term => normalizedText.includes(term));

/**
 * Clasifica el intent de un mensaje entrante.
 */
const classifyInboundIntent = (text = '') => {
    const normalized = normalizeIntentText(text);
    if (!normalized) return 'otros';
    if (hasIntentTerm(normalized, SALES_INTENT_TERMS)) return 'ventas';
    if (hasIntentTerm(normalized, SUPPORT_INTENT_TERMS)) return 'soporte';
    return 'otros';
};

module.exports = {
    normalizeIntentText,
    hasIntentTerm,
    classifyInboundIntent,
    SALES_INTENT_TERMS,
    SUPPORT_INTENT_TERMS
};
