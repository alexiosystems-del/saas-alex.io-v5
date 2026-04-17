# Go / No-Go Producción — ALEX IO V5

Fecha: 2026-03-29
Objetivo: saber **dónde estamos hoy** y **qué falta** para autorizar salida a producción enterprise.

## Resumen ejecutivo

Estado actual sugerido: **NO-GO condicionado**.

- Plataforma funcional en núcleo WhatsApp/Baileys + dashboard.
- Persisten brechas para declarar multi-canal enterprise completo (Factory/Adapter por instancia, webhook broker con mapeo de `instance_id`, respuesta real por todos los canales cloud).
- Hay bloqueantes operativos de esquema DB en algunos entornos (`whatsapp_auth_state`, `prompt_versiones`) que deben cerrarse antes de escalar.

---

## Score rápido (0-100)

- Seguridad y secretos: **70/100**
- Estabilidad runtime core: **78/100**
- Multi-canal enterprise real: **40/100**
- Observabilidad/SRE: **65/100**
- Operación/Runbooks: **60/100**

**Total estimado:** **63/100** (aún no 100/100 de producción enterprise).

---

## Checklist Go/No-Go

## A) Infraestructura y Configuración

- [ ] `whatsapp_auth_state` creada y accesible en Supabase.
- [ ] `prompt_versiones` creada y accesible.
- [ ] Variables críticas validadas en producción (`JWT_SECRET`, APIs IA, Supabase, tokens webhook).
- [ ] Alerting webhook (Pager/Slack/Discord) con URL válida.

**Estado:** 🟡 (incompleto en algunos entornos).

## B) Backend Core

- [x] Endpoint `/api/saas/superadmin/clients` estabilizado (sin referencias a variables indefinidas).
- [x] Fallback de auth-state para ausencia de tabla (degradación controlada).
- [x] Clasificador de intención integrado en lead extraction + analytics.
- [ ] Pruebas automáticas completas del backend pasando en CI (no solo lint/parcial).

**Estado:** 🟡

## C) Multi-Canal Enterprise

- [ ] `whatsappCloudAPI` instanciable por credenciales de bot (no singleton `.env`).
- [ ] `whatsappCloudClient` sin dependencia global de `.env`.
- [ ] `messageRouter` con salida real para Meta/Messenger/Instagram/TikTok/Discord/Reddit.
- [ ] `webhooks-multi` con `resolveInstanceId(payload, platform)` robusto.
- [ ] Adaptadores de canal con contrato unificado (send/parse/verify/health).

**Estado:** 🔴 (principal brecha para enterprise).

## D) Frontend y Operación de Bots

- [ ] Modal “Nuevo Bot” con campos dinámicos reales por proveedor.
- [ ] Validación de credenciales por canal antes de crear bot.
- [ ] Estado de salud por instancia cloud en dashboard.

**Estado:** 🔴

## E) SRE / Calidad

- [ ] E2E por canal crítico (al menos Baileys + Meta + TikTok).
- [ ] SLO por canal: success rate, p95, error rate.
- [ ] Alertas accionables (401/429/5xx/reconnect loops).
- [ ] Runbooks de rollback por instancia (Pause Bot / Recover Bot).

**Estado:** 🟡

---

## Decisión recomendada hoy

## GO parcial permitido (solo si)

- Uso controlado en canales ya validados (Baileys).
- Sin prometer paridad completa enterprise multi-canal.
- Monitoreo reforzado y soporte on-call durante ventana de despliegue.

## NO-GO para “Enterprise Multi-Channel completo” hasta cerrar:

1. Sprint 1: Factory + InstanceLoader + AdapterFactory.
2. Sprint 2: Webhook Broker + routing real (incluye TikTok outbound).
3. Sprint 3: UI dinámica + validación + cifrado credenciales.

---

## Plan de cierre (7 días)

### Día 1-2
- Cerrar bloqueantes de esquema (`whatsapp_auth_state`, `prompt_versiones`).
- Corregir alerting URL inválida.

### Día 3-4
- Refactor de conectores cloud a patrón instanciable por bot.
- Implementar `instanceLoader` + `adapterFactory`.

### Día 5-6
- Webhook resolver por `instance_id` y salida real multi-canal.
- Tests de contrato por canal.

### Día 7
- Smoke E2E, revisión SRE, Go/No-Go final con evidencia.

---

## Evidencia mínima para aprobar GO final

- 0 errores 500 en endpoints críticos por 24h.
- `messageRouter` enviando respuestas reales en todos los canales declarados activos.
- 3 pruebas E2E verdes (Baileys, Meta, TikTok).
- Dashboard de health por instancia + alertas operativas funcionando.

