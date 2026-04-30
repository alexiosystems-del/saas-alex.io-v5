# Diagnóstico rápido — Wizard de Conexiones (2026-04-29)

## Hallazgo principal
El usuario ve tarjetas de canales (Instagram/Facebook/TikTok), pero el flujo real de alta del bot crea principalmente una instancia WhatsApp (`baileys`, `meta`, `360dialog`).

Esto genera expectativa de “click y conectar” en canales sociales, pero el alta inicial no hace OAuth directo para esos canales.

## Evidencia técnica
- En dashboard, el alta usa `newBotProvider` limitado a proveedores WhatsApp.
- Instagram/Facebook/TikTok se conectan por ruta separada (Wizard + webhooks).

## Impacto UX
- Sensación de “iconos no funcionan”.
- Confusión entre:
  1) **Crear instancia principal** (WhatsApp),
  2) **Conectar canales sociales** (ManyChat/TikTok webhook).

## Acción aplicada hoy
- Se agregó aclaración visible en el modal de alta:
  - “Instagram, Facebook y TikTok se conectan desde Configuración → Conexiones y Canales usando el Wizard rápido”.

## Recomendación para siguiente iteración (core negocio)
1. Unificar en un solo Wizard de onboarding por pasos:
   - Paso 1: crear instancia.
   - Paso 2: elegir canal social.
   - Paso 3: autogenerar URLs webhook + copiar token.
   - Paso 4: check de conexión en vivo (ping webhook).
2. Estado visual por canal:
   - No conectado / Conectando / Verificado.
3. Botón “Probar canal ahora” por cada tarjeta.
