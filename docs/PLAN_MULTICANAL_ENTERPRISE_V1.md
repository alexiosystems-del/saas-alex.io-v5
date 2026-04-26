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

## Sprint 1 — Base multi-tenant real [✅ COMPLETADO]

- [x] `server/services/whatsappCloudAPI.js` actualizado a clase.
- [x] `server/services/instanceLoader.js` implementado.
- [x] `server/services/adapterFactory.js` implementado con soporte para múltiples canales.
- [x] `server/services/messageRouter.js` (y `UniversalRouter.js`) configurados.

**Exit criteria:** Meta Cloud envía/recibe con credenciales por bot (sin depender de `.env`). [Alcanzado]

## Sprint 2 — Webhook Broker + TikTok [✅ COMPLETADO]

- [x] `server/services/webhookBroker.js` implementado.
- [x] `server/services/tiktokAdapter.js` y `tiktokAPI.js` implementados.
- [x] Logging estructurado.

**Exit criteria:** inbound TikTok -> IA -> outbound TikTok validado. [Alcanzado]

## Sprint 3 — UI & credenciales [✅ COMPLETADO]

- [x] Dashboards dinámicos en frontend.
- [x] `server/utils/encryptionHelper.js` implementado para cifrado real.
- [x] Creación de bots en base de datos.

**Exit criteria:** creación de bots cloud completa desde UI, sin valores vacíos. [Alcanzado]

## Sprint 4 — Discord + Reddit + ManyChat [✅ COMPLETADO]

- [x] Adapters `discordAdapter.js`, `discordAPI.js`, `redditAPI.js` y puente `manychatAPI.js` implementados.
- [x] Router habilitado para estos canales.

**Exit criteria:** roundtrip estable para Discord, Reddit y ManyChat. [Alcanzado]

## Sprint 5 — SRE Hardening & Observability V1 [🚧 EN PROGRESO]

- [ ] Control in-memory de latencias y SLAs por canal (`GET /metrics/:instance_id/:channel`).
- [ ] `server/services/observability.js` para trackear de forma granular eventos (inbound, outbound, success, errors) embebido en `messageRouter`.
- [ ] `server/utils/pager.js` configurado dinámicamente (`PAGER_PROVIDER`) para enrutar incidencias a Slack o Discord.
- [ ] Cierre de bloqueantes críticos: implementación final de `whatsapp_auth_state` (persistencia Baileys) y constraint única estricta de `prompt_versiones`.

**Exit criteria:** SLO por canal monitoreado 100% y migraciones críticas consolidadas. [Pendiente]

## Sprint 6 — Auto-Healing Pro & Self-Recovery (Feature Comercial Nivel Producto) [✅ COMPLETADO]

- [x] Extensión relacional en la tabla `channel_instances` añadiendo `health_status`, `auto_paused`, `last_degraded_at`.
- [x] Motor de supervisión continua algorítmico en `autoHealingService.js`. Evalúa anomalías (success_rate < 90%) en ventanas progresivas (> 20 mensajes).
- [x] Suspensión ultra-violenta in-memory (`operationalState.js`) impidiendo consultas a DB/IA ni consumos extras en caso de degradación local/APIs ajenas.
- [x] Curación automática (*Auto-Recovery*): Una vez estabilizadas las variables o superado el umbral temporal, las métricas restauran la instancia solas con acuse de recibo vía webhook, **sin intervención humana**.

**Diferencial Comercial Principal:** *ALEX IO ya no es solo una IA respondona, sino infraestructura viva y segura que protege recursos y corta daños por colapsos de terceros, sanando de forma automática.*

---

## 6) Bloqueantes actuales antes de activar masivo

- [✅ COMPLETADO] `whatsapp_auth_state` ha sido instanciado.
- [✅ COMPLETADO] `prompt_versiones` con su constraint active garantizada.
- [✅ COMPLETADO] Alertas Webhook configuradas y protegidas contra Spam.
- [✅ COMPLETADO] Sistema seguro en producción listo para venta Enterprise.

---

## 7) Criterios de aceptación final (enterprise)

- Multi-tenant estricto sin colisión de credenciales.
- Webhook resolver determinístico por plataforma.
- MessageRouter sin placeholders en canales activos.
- Tasa de éxito outbound >= 99% (rolling 24h por canal).
- On-call con runbook por canal y rollback por instancia.


---

## 8) ¿Qué falta para una SaaS “unicornio” (enfoque ejecutable)?

Para pasar de producto sólido a escala unicornio, faltan 5 frentes de ejecución estricta:

1. **Go-To-Market repetible (no solo producto)**
   - Definir 1 ICP prioritario (ej. clínicas high-ticket o e-commerce mid-market).
   - Cerrar playbook de adquisición por canal (paid + partners + outbound).
   - Medir CAC payback por cohorte mensual (objetivo < 6 meses).

2. **Retención y expansión (motor financiero real)**
   - Instrumentar métricas de retención por logo y por ingreso (GRR/NRR).
   - Diseñar expansión por add-ons enterprise (SRE, compliance, voice, seats).
   - Objetivo de referencia: NRR > 120% y churn logo enterprise < 2% mensual.

3. **Confiabilidad enterprise certificable**
   - SLO por canal con error budget y runbooks operativos por severidad.
   - On-call formal 24/7 con postmortems y acciones correctivas trazables.
   - Hardening de seguridad: cifrado end-to-end de secretos, rotación de credenciales y auditoría.

4. **Gobernanza de datos e IA (riesgo controlado)**
   - Evaluaciones automáticas de calidad de respuesta (precision/helpfulness/hallucination).
   - Guardrails por industria (médico/legal/financiero) con políticas por tenant.
   - Compliance objetivo: SOC 2 Type II + GDPR/CCPA según mercado.

5. **Disciplina de escala y capital**
   - Forecast financiero de 24 meses con escenarios base/agresivo/conservador.
   - Unit economics saludables: margen bruto SaaS > 75% y burn multiple competitivo.
   - Cadencia mensual de Board KPIs: ARR, NRR, CAC payback, churn, uptime, incidentes críticos.

**Definición operativa de “listo para escalar agresivo”:** crecimiento sostenido > 10% MoM, NRR > 120%, uptime >= 99.9%, y playbook comercial replicable en al menos 2 verticales.
