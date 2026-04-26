# ALEX IO SRE Runbook (Fase 2)

Este documento es la fuente primaria de resolución de incidencias en producción. 

## 1. Webhook de WhatsApp Timeout / Falling Behind
**Síntoma**: Los clientes se quejan de que el bot no responde o tarda mucho. Metric `latency_p95_ms` > 5000ms.
**Solución Inmediata**:
1. Verificar si hay un Spike de Tráfico: Escalar horizontalmente el Web Service de Render.
2. Comprobar OpenAI / Gemini Status (`https://status.openai.com`). Si la API base está lenta, el *Circuit Breaker* debería activar el Fallback a DeepSeek o mensajes estandarizados. Revisa los logs buscando `[CircuitBreaker] OPEN`.
3. Revisar logs por el patrón `[MessageRouter] timeout`.
**Recuperación**: El sistema procesará el backlog de webhooks conforme la API vuelva.

## 2. Caída de Base de Datos (Supabase)
**Síntoma**: Errores 5xx disparados. Los logins de usuarios fallan, los leads reportan 500. Error logs muestran `PostgrestError`.
**Solución Inmediata**:
1. El backend seguirá contestando por WhatsApp gracias a la Caché en Memoria y a que el `LLM` no se bloquea por la persistencia asíncrona (Fire & Forget). Las conversaciones no se perderán de memoria si no se reinicia el servidor.
2. Si Supabase requiere reinicio: Usa el panel de Supabase -> Settings -> Restart Database.
3. El frontend levantará bandera roja de "Servicio de Datos en Mantenimiento" pero la operación transaccional no caerá.

## 3. Rate Limits Excedidos en Redis
**Síntoma**: `429 Too Many Requests` en llamadas válidas.
**Solución Inmediata**:
1. Verificar en Render el plan de consumo de Redis (OOM o conexiones máximas).
2. Si es un ataque DDoS: Bajar de inmediato la IP infractora usando la red externa (Cloudflare) o pedirle a Render bloquear el path vía IP origin.

## Documentación de Contactos Clave
- SRE On-Call: `sre@alex.io`
- OpenAI Enterprise Support
- Render Enterprise Support
