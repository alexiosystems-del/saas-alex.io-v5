# Master Enterprise Multi-Channel Plan V2 (ALEX IO)

Fecha: 2026-03-29

## 1) Revisión del plan propuesto por Gemini

**Veredicto:** la dirección es correcta y profesional.

Coincido con los puntos clave:
- Migrar de servicios singleton acoplados a `.env` hacia patrón **Factory + Adapter por instancia**.
- Implementar **Webhook Broker** con resolución de `instance_id` por identificadores nativos de cada plataforma.
- Completar **feature parity** (entrada/salida real) en `messageRouter` para canales cloud.
- Extender UI para credenciales por canal y controles operativos enterprise.

Ajustes recomendados para hacerlo ejecutable en producción real:
1. Definir contratos de adapter (`parseWebhook`, `send`, `healthCheck`, `normalizeOutboundError`).
2. Cifrar credenciales en repositorio de secretos (no texto plano en DB).
3. Añadir pruebas de contrato por canal antes de activar en producción.
4. Medir SLO por canal desde Sprint 1 (no al final).

---

## 2) Diagnóstico técnico del código actual

## 2.1 Estado real

1. `whatsappCloudAPI.js` usa constructor con variables globales de entorno.
2. `whatsappCloudClient.js` también usa token/phone de entorno global.
3. `messageRouter.js` mantiene placeholders de salida para varios canales.
4. `SaasDashboard.jsx` crea bots cloud enviando credenciales vacías.
5. Persisten dependencias de migraciones DB (`whatsapp_auth_state`, `prompt_versiones`) para estabilidad completa.

## 2.2 Impacto

- No existe aislamiento profesional por `tenant_id + instance_id` en conectores cloud.
- Un bot puede afectar a otro por compartir credenciales singleton.
- Webhooks multi-canal no están mapeados con resolución robusta por instancia.

---

## 3) Arquitectura objetivo (Factory + Adapter)

## 3.1 Contrato de adaptador

Cada canal implementa la misma interfaz:

- `verifyWebhook(req): VerifyResult`
- `parseWebhook(req): StandardizedInbound[]`
- `send(ctx, outboundPayload): SendResult`
- `healthCheck(ctx): HealthResult`
- `capabilities(): ChannelCapabilities`

## 3.2 Componentes

1. **InstanceLoader**
   - Carga config/capacidades por `instance_id` desde Supabase.
2. **AdapterFactory**
   - Devuelve adapter instanciado por `channel_type` + credenciales.
3. **WebhookBroker**
   - Resuelve `instance_id` por payload (`phone_number_id`, `page_id`, `application_id`, etc.).
4. **MessageRouter Universal**
   - IA + RAG + políticas -> llama `adapter.send(...)`.

## 3.3 Modelo de datos recomendado

Tabla `channel_instances` (o extender `whatsapp_accounts`) con:
- `instance_id` (PK lógica)
- `tenant_id`
- `channel_type`
- `external_mapping_key` (phone_number_id/page_id/bot_id/application_id)
- `credentials_encrypted`
- `status`
- `capabilities_json`
- `last_health_check_at`

---

## 4) Matriz de paridad objetivo

| Feature | Baileys | Meta Cloud | TikTok | Discord | Reddit | ManyChat |
|---|---:|---:|---:|---:|---:|---:|
| Texto bidireccional | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audio TTS/STT | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| RAG/Knowledge Base | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lead extraction | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Botones/Listas | ✅ | ✅ | ❌ | Slash Cmd | ❌ | ✅ |
| Health check por instancia | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 5) Roadmap ejecutable (sprints de 2 días)

## Sprint 1 — Base multi-tenant real

- [MODIFY] `server/services/whatsappCloudAPI.js`
  - Clase instanciable con credenciales por constructor.
- [NEW] `server/services/instanceLoader.js`
  - Resolve config por `instance_id` desde DB.
- [NEW] `server/services/adapterFactory.js`
  - Selección de adapter por canal.
- [MODIFY] `server/services/messageRouter.js`
  - Reemplazar placeholders por `adapter.send(...)` para WhatsApp Cloud.

**Exit criteria:** Meta Cloud envía/recibe con credenciales por bot (sin depender de `.env`).

## Sprint 2 — Webhook Broker + TikTok

- [MODIFY] `server/routes/webhooks-multi.js`
  - `resolveInstanceId(payload, platform)`.
  - Estandarización `StandardizedInbound`.
- [MODIFY] `server/services/messageRouter.js`
  - Outbound real para TikTok.
- [MODIFY] logging de `messages`
  - Prefijos por canal (`[tiktok]`, `[discord]`, `[reddit]`, etc.).

**Exit criteria:** inbound TikTok -> IA -> outbound TikTok validado.

## Sprint 3 — UI & credenciales

- [MODIFY] `client/src/components/SaasDashboard.jsx`
  - Formulario dinámico por proveedor.
- [NEW] backend encryption helper
  - Cifrado de credenciales antes de persistencia.
- [MODIFY] endpoints de create/update bot
  - Validación fuerte por canal.

**Exit criteria:** creación de bots cloud completa desde UI, sin valores vacíos.

## Sprint 4 — Discord + Reddit

- [NEW] adapters `discordAdapter`, `redditAdapter`.
- [MODIFY] webhook broker y router para ambos canales.

**Exit criteria:** roundtrip estable para Discord y Reddit.

## Sprint 5 — SRE hardening

- Dashboard por canal: success rate, p95, errores 4xx/5xx.
- Alertas por canal (401/429/5xx/reconnect failures).
- Runbooks + rollback por instancia (“Pause Bot”).

**Exit criteria:** SLO por canal definidos y medidos.

---

## 6) Bloqueantes actuales antes de activar masivo

1. Crear `whatsapp_auth_state` en Supabase.
2. Crear/arreglar `prompt_versiones` para evitar 500 en dashboard.
3. Corregir alerting webhook inválido (`[Pager] Invalid URL`).

---

## 7) Criterios de aceptación final (enterprise)

- Multi-tenant estricto sin colisión de credenciales.
- Webhook resolver determinístico por plataforma.
- MessageRouter sin placeholders en canales activos.
- Tasa de éxito outbound >= 99% (rolling 24h por canal).
- On-call con runbook por canal y rollback por instancia.

