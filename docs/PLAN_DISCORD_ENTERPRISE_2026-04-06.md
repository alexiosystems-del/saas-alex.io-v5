# Plan completo: Integración Discord Enterprise en ALEX IO

Fecha: 2026-04-06
Estado: Plan de implementación listo para ejecución.

## 1) Objetivo

Habilitar Discord como canal nativo en ALEX IO con:
- recepción de mensajes (inbound),
- respuesta automática IA (outbound),
- operación desde Live Chat,
- observabilidad, seguridad y multi-tenant reales.

---

## 2) Alcance funcional

## Incluye

1. Conector Discord bidireccional.
2. Enrutamiento por `instance_id`/`tenant_id`.
3. Persistencia de mensajes en tabla `messages`.
4. Respuesta humana desde Live Chat hacia Discord.
5. Métricas, alertas y runbooks.

## Excluye (fase futura)

- Gestión avanzada de threads.
- Moderación automática con ML propia.
- Slash-commands complejos multi-step.

---

## 3) Arquitectura objetivo

## 3.1 Componentes nuevos

1. `server/services/adapters/discordAdapter.js`
   - `verify(req)`
   - `parseInbound(req)`
   - `sendOutbound(ctx, payload)`
   - `health()`

2. `server/services/adapterFactory.js`
   - retorna adapter según `channel_type`.

3. `server/services/instanceLoader.js`
   - carga credenciales y mapping por `instance_id`.

4. `server/routes/webhooks-multi.js`
   - nueva ruta `/discord` para eventos entrantes.

5. `POST /api/livechat/send` (gateway unificado)
   - resuelve canal por `conversationId`.

## 3.2 Tablas recomendadas

### A) `channel_instances`
- `instance_id`
- `tenant_id`
- `channel_type` (discord)
- `credentials_encrypted`
- `external_mapping_key` (`application_id`/`guild_id`)
- `status`
- `created_at`, `updated_at`

### B) `conversation_channels`
- `conversation_id`
- `instance_id`
- `tenant_id`
- `platform` (`discord`)
- `remote_jid` (user_id o channel_id normalizado)
- `channel_account_id`
- `last_seen_at`

---

## 4) Flujo técnico end-to-end

## Inbound Discord -> ALEX IO

1. Discord entrega evento al endpoint configurado.
2. `discordAdapter.verify` valida firma/timestamp.
3. `parseInbound` transforma a `StandardizedMessage`.
4. `messageRouter` genera respuesta IA.
5. Se guarda inbound/outbound en `messages`.

## Outbound desde Live Chat -> Discord

1. Agente escribe en Live Chat.
2. Gateway `/api/livechat/send` resuelve conversación + adapter.
3. `discordAdapter.sendOutbound` publica respuesta.
4. Se persiste en `messages` con metadatos de entrega.

---

## 5) Seguridad (obligatorio)

1. Verificación criptográfica de requests Discord.
2. Secretos en vault/env seguro (no en frontend).
3. Rotación de token cada 90 días.
4. Rate-limit por tenant/canal.
5. Auditoría de acciones de operador en Live Chat.

---

## 6) UX en Live Chat

1. Badge Discord por conversación.
2. Vista de metadata (`guild`, `channel`, usuario).
3. Respuesta humana habilitada con estado de entrega.
4. Banner de capacidades (texto, adjuntos permitidos).
5. Historial con prefijo `[discord]` + limpieza visual.

---

## 7) API contract (mínimo)

## Webhook
- `POST /api/webhooks/discord`
- Headers: firma/timestamp
- Body: evento Discord

## Live Chat send
- `POST /api/livechat/send`
- Body:
```json
{
  "conversationId": "conv_123",
  "text": "Hola, gracias por escribir",
  "attachments": []
}
```

## Respuesta
```json
{
  "success": true,
  "platform": "discord",
  "message_id": "...",
  "latency_ms": 123
}
```

---

## 8) Observabilidad / SRE

## Métricas
- `discord_inbound_total`
- `discord_outbound_total`
- `discord_outbound_failures_total`
- `discord_send_p95_ms`
- `discord_webhook_verify_failures_total`

## Alertas
- 401/403 consecutivos > 5 en 5 min.
- p95 outbound > 1500ms por 10 min.
- error rate outbound > 3% por 5 min.

---

## 9) Plan de pruebas

## Unit
- parse de payload Discord.
- verify de firma.
- factory y resolver de instancia.

## Integration
- webhook real -> DB -> router -> outbound mock.
- livechat/send -> discordAdapter -> persistencia.

## E2E
- caso feliz (usuario Discord recibe respuesta).
- token inválido.
- rate-limit.
- caída proveedor (retry/fallback).

---

## 10) Roadmap de ejecución (12 días)

### Sprint A (Día 1-4): Núcleo técnico
- Adapter Discord + Factory + Loader.
- Endpoint webhook Discord.
- Persistencia base en `messages`.

### Sprint B (Día 5-8): Live Chat operativo
- `livechat/send` unificado.
- Mapeo `conversation_channels`.
- UI badge + metadata Discord.

### Sprint C (Día 9-12): Hardening
- Seguridad firma/tokens.
- Métricas y alertas.
- QA E2E + runbook de incidentes.

---

## 11) Criterio GO/NO-GO para Discord

## GO
- E2E verde (inbound/outbound + live chat humano).
- error outbound < 1% por 24h.
- alertas operativas activas.

## NO-GO
- Sin verificación de firma.
- Sin persistencia consistente de mensajes.
- Sin fallback/observabilidad.

---

## 12) Entregables finales

1. Código adapter + factory + loader.
2. Migraciones SQL (`channel_instances`, `conversation_channels`).
3. Actualización Live Chat para Discord.
4. Dashboard SRE con métricas Discord.
5. Runbook de operación + rollback.

