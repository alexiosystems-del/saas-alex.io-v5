const express = require('express');
const router = express.Router();

router.post("/generate-prompt", async (req, res) => {
  const { business, tone, objective, audience, language } = req.body;

  const prompt = `
Eres un asistente de ventas para un negocio de ${business}.

Objetivo: ${objective}
Tono: ${tone}
Público: ${audience}

Reglas:
- Responder en ${language}
- Ser claro y directo
- Intentar cerrar ventas
- No inventar información

Flujo:
1. Saludo
2. Detectar intención
3. Responder con valor
4. Intentar conversión

Ejemplo:
Cliente: Hola
IA: Hola! 👋 Bienvenido a ${business}. ¿En qué puedo ayudarte hoy?
`;

  res.json({ prompt });
});

module.exports = router;
