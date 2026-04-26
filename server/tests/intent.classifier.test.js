const test = require('node:test');
const assert = require('node:assert/strict');

const { __intentUtils } = require('../services/whatsappSaas');

const {
    normalizeIntentText,
    hasIntentTerm,
    classifyInboundIntent,
    SALES_INTENT_TERMS,
    SUPPORT_INTENT_TERMS
} = __intentUtils;

test('normalizeIntentText limpia acentos, signos y espacios', () => {
    const input = '  ¡Cotización   URGENTE! ¿Puedo pagar con Tárjeta?  ';
    const normalized = normalizeIntentText(input);
    assert.equal(normalized, 'cotizacion urgente puedo pagar con tarjeta');
});

test('hasIntentTerm detecta términos de ventas tras normalización', () => {
    const normalized = normalizeIntentText('Necesito una cotización y quiero contratar hoy');
    assert.equal(hasIntentTerm(normalized, SALES_INTENT_TERMS), true);
});

test('classifyInboundIntent clasifica ventas correctamente', () => {
    assert.equal(classifyInboundIntent('Hola, quiero pagar con tarjeta'), 'ventas');
});

test('classifyInboundIntent clasifica soporte correctamente', () => {
    assert.equal(classifyInboundIntent('Ayuda, tengo un problema y no funciona'), 'soporte');
});

test('classifyInboundIntent clasifica otros cuando no hay match', () => {
    assert.equal(classifyInboundIntent('Gracias, buen día'), 'otros');
});

test('listas de términos no tienen duplicados exactos', () => {
    const salesUnique = new Set(SALES_INTENT_TERMS);
    const supportUnique = new Set(SUPPORT_INTENT_TERMS);

    assert.equal(salesUnique.size, SALES_INTENT_TERMS.length);
    assert.equal(supportUnique.size, SUPPORT_INTENT_TERMS.length);
});
