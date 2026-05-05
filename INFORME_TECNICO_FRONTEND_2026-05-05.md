# Informe técnico de incidente frontend

**Fecha del análisis:** 2026-05-05 (UTC)

## Resumen ejecutivo

El fallo principal observado en CRM/RAG/QR **no es de lógica de pantalla**, sino de **CSP/Realtime en frontend desplegado**: el navegador bloquea conexiones `wss://<project>.supabase.co/realtime/v1/websocket` por una directiva `connect-src` incompleta en la respuesta HTTP actual del despliegue.

Esto provoca ruido constante de errores (`CSP violation` + `400`) y degrada funcionalidades dependientes de estado en vivo y sincronización.

## Evidencia técnica

En consola del navegador (capturas compartidas):

- Error recurrente: `Connecting to wss://...supabase.co/realtime/v1/websocket ... violates Content Security Policy directive connect-src`.
- La directiva reportada en runtime **no incluye** `wss://*.supabase.co`.

## Hallazgos de código en esta rama

1. El backend **sí** tiene soporte CSP websocket en `server/index.js` para:
   - `wss://*.supabase.co`
   - `wss://*.onrender.com`
   - `ws://localhost:*`
2. Si producción sigue mostrando una CSP sin `wss`, hay alta probabilidad de:
   - despliegue en rama/commit distinto,
   - servicio distinto sirviendo frontend,
   - o cabecera CSP sobrescrita en infraestructura.

## Hipótesis raíz (prioridad)

### H1 (Muy alta): Desalineación de despliegue
El entorno publicado no corresponde al commit actual (o no está ejecutando el `server/index.js` actualizado).

### H2 (Alta): CSP sobrescrita fuera de Node
Render/Proxy/CDN podría estar inyectando CSP y anulando la de Helmet.

### H3 (Media): Config de Supabase en frontend inválida o cruzada
Si `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` apuntan a otro proyecto, aparecen `400` y pérdida de sincronización aunque CSP esté correcta.

## Acciones de validación inmediata

1. Ejecutar chequeo de cabecera real del entorno:

```bash
cd server
npm run frontend:csp:check -- https://whatsapp-fullstack-ylsx.onrender.com/#/dashboard
```

2. Confirmar commit desplegado y rama activa en Render (debe incluir el cambio CSP).

3. Verificar en Render si existe CSP custom en settings/reverse proxy.

4. Validar variables frontend:
   - `VITE_SUPABASE_URL=https://<tu-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<jwt anon supabase>`

## Riesgo funcional por módulo

- **CRM PRO:** alto (listas/contadores y estados pueden desincronizarse).
-- **RAG:** medio-alto (indexación/estado visual y eventos en tiempo real afectados).
- **Generación QR/canales:** medio (flujo de sesión y updates de estado pueden llegar tarde o fallar visualmente).

## Recomendación para consulta externa (Claude)

Pedir revisión focalizada sobre:

1. Cadena completa de emisión de CSP en producción (Node -> Render -> navegador).
2. Estrategia de fallback cuando Realtime está bloqueado (polling controlado / feature flag).
3. Validación estricta de entorno por build target (staging/prod) para evitar Supabase cross-project.

## Estado

**Conclusión actual:** incidente de frontend causado por política/cadena de despliegue de CSP + posible desalineación de variables/entorno, no por un bug aislado del componente CRM/RAG.
