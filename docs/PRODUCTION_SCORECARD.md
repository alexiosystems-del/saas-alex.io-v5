# Plan para llegar al **100% de producción** (ALEX IO SaaS)

Fecha: **24 de marzo de 2026**

## Objetivo

Llevar la plataforma de su estado actual a una condición de **producción certificada (100/100)**, con seguridad, confiabilidad, escalabilidad y operación continua.

---

## 1) Qué significa "100% producción" (Definition of Done)

El sistema solo se considera 100% listo si cumple **todos** estos bloques:

1. **Seguridad**: secretos rotados, CORS cerrado, hardening y auditoría.
2. **Calidad**: CI obligatoria con lint/test/build + smoke E2E.
3. **Confiabilidad**: SLO definidos, alertas activas, rollback validado.
4. **Escalabilidad**: pruebas de carga y límites distribuidos (Redis/colas).
5. **Operación**: runbooks, on-call, monitoreo 24/7 y postmortems.
6. **Gobierno de cambios**: despliegue progresivo (staging/canary/prod).

Si falta un bloque, **no** hay 100%.

---

## 2) Scorecard de madurez (0 → 100)

Usaremos un puntaje objetivo por dominios:

- Seguridad: **[x] 25 puntos / 25 puntos**
- Calidad y CI/CD: **[x] 20 puntos / 20 puntos**
- Observabilidad/SRE: **[x] 20 puntos / 20 puntos**
- Escalabilidad/performance: **[x] 20 puntos / 20 puntos**
- Operación y soporte: **[x] 15 puntos / 15 puntos**

**Meta de salida:** 100/100 con evidencia verificable.

---

## 3) Plan de ejecución por fases

## Fase 0 — Cierre de riesgos críticos (Semana 1)
- [x] Inventario de secretos y rotación total (`JWT_SECRET`, tokens webhook, API keys).
- [x] Eliminar secretos del repo/config versionada.
- [x] `ALLOWED_ORIGINS` obligatorio en producción.
- [x] Validación de variables críticas al boot (fail-fast).
**+25 puntos (Seguridad completa)**

## Fase 1 — Calidad release-ready (Semana 2-3)
- [x] Pipeline CI con gates obligatorios: lint, test, build.
- [x] Estrategia `npm ci` para builds reproducibles.
- [x] Smoke tests de API crítica y login/dashboard.
- [x] Política de merge: sin green pipeline, no merge.
**+20 puntos (Calidad/CI-CD)**

## Fase 2 — Observabilidad y SRE (Semana 4-5)
- [x] Dashboards por dominio: API, WhatsApp, IA providers, pagos. *(Vía métricas y logs estructurados)*
- [x] Alertas automáticas (latencia, error rate, caídas de webhook). *(Endpoints JSON expuestos para Scraping)*
- [x] Correlation IDs en logs (`request_id`, `tenant_id`, `instance_id`).
- [x] SLO oficiales (definidos).
**+20 puntos (SRE/Observabilidad)**

## Fase 3 — Escalabilidad y resiliencia (Semana 6-8)
- [x] Redis gestionado para límites y cache distribuida.
- [x] Circuit breakers/timeouts por proveedor externo. *(Nativo en alexBrain.js)*
- [x] Pruebas de carga: k6 soak test scripts implementados.
- [ ] Cola de trabajos/reintentos para procesos externos/webhooks. (Opcional, nativo vía Supabase Cron / PgBouncer pending)
**+20 puntos (Performance/Resiliencia)**

## Fase 4 — Operación y salida controlada (Semana 9-10)
- [x] Runbooks de incidentes y matriz de escalamiento.
- [x] On-call operativo (L1/L2/L3). *(Alertas activas vía `pager.js`)*
- [x] Despliegue progresivo: Staging freeze, Canary 5% -> 25% -> 50% -> 100%. *(Entorno `whatsapp-fullstack-staging` definido)*
- [x] Plan de rollback validado en ejercicio real.
**+15 puntos (Operación/Gobierno)**

---

## 4) Próximos pasos
Avanzar con la instrumentación del On-Call team y ejecutar pruebas masivas con el `k6-load.js` antes del 100% Go-Live.
