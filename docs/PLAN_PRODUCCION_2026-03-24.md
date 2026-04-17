# Plan para llegar al **100% de producción** (ALEX IO SaaS)

Fecha: **24 de marzo de 2026**

## Objetivo

Llevar la plataforma de su estado actual a una condición de **producción certificada (100/100)**, con seguridad, confiabilidad, escalabilidad y operación continua.

---

## 1) Qué significa “100% producción” (Definition of Done)

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

- Seguridad: **25 puntos**
- Calidad y CI/CD: **20 puntos**
- Observabilidad/SRE: **20 puntos**
- Escalabilidad/performance: **20 puntos**
- Operación y soporte: **15 puntos**

**Meta de salida:** 100/100 con evidencia verificable.

---

## 3) Plan de ejecución por fases

## Fase 0 — Cierre de riesgos críticos (Semana 1)

### Entregables
- Inventario de secretos y rotación total (`JWT_SECRET`, tokens webhook, API keys).
- Eliminar secretos del repo/config versionada.
- `ALLOWED_ORIGINS` obligatorio en producción.
- Validación de variables críticas al boot (fail-fast).

### Criterio de aprobación
- Pentest básico interno sin hallazgos críticos/altos.
- Checklist de seguridad firmado.

### Puntaje acumulado esperado
- **+25 puntos (Seguridad completa)**

---

## Fase 1 — Calidad release-ready (Semana 2-3)

### Entregables
- Pipeline CI con gates obligatorios:
  - `npm --prefix server run lint`
  - `npm --prefix server test`
  - `npm --prefix client run build`
- Estrategia `npm ci` para builds reproducibles.
- Smoke tests de API crítica y login/dashboard.
- Política de merge: sin green pipeline, no merge.

### Criterio de aprobación
- 100% PRs pasan por CI.
- 0 despliegues manuales sin pipeline.

### Puntaje acumulado esperado
- **+20 puntos (Calidad/CI-CD)**

---

## Fase 2 — Observabilidad y SRE (Semana 4-5)

### Entregables
- Dashboards por dominio: API, WhatsApp, IA providers, pagos.
- Alertas automáticas (latencia, error rate, caídas de webhook).
- Correlation IDs en logs (`request_id`, `tenant_id`, `instance_id`).
- SLO oficiales:
  - Disponibilidad mensual >= 99.9%
  - Error 5xx < 1%
  - Latencia p95 endpoints críticos <= 800 ms

### Criterio de aprobación
- Simulacro de incidente con MTTD < 5 min y MTTR < 30 min.

### Puntaje acumulado esperado
- **+20 puntos (SRE/Observabilidad)**

---

## Fase 3 — Escalabilidad y resiliencia (Semana 6-8)

### Entregables
- Redis gestionado para límites y cache distribuida.
- Cola de trabajos/reintentos para procesos externos/webhooks.
- Circuit breakers/timeouts por proveedor externo.
- Pruebas de carga:
  - pico 2x del tráfico esperado
  - soak test 8h

### Criterio de aprobación
- Cumplimiento de SLO bajo carga objetivo.

### Puntaje acumulado esperado
- **+20 puntos (Performance/Resiliencia)**

---

## Fase 4 — Operación y salida controlada (Semana 9-10)

### Entregables
- Runbooks de incidentes y matriz de escalamiento.
- On-call operativo (L1/L2/L3).
- Despliegue progresivo:
  - Staging freeze
  - Canary 5% -> 25% -> 50% -> 100%
- Plan de rollback validado en ejercicio real.

### Criterio de aprobación
- 72h post-go-live sin incidentes severos (SEV1/SEV2).

### Puntaje acumulado esperado
- **+15 puntos (Operación/Gobierno)**

---

## 4) Cronograma resumido

- Semana 1: Seguridad total (25/100)
- Semana 2-3: CI/CD + calidad (45/100)
- Semana 4-5: Observabilidad/SRE (65/100)
- Semana 6-8: Escalabilidad/resiliencia (85/100)
- Semana 9-10: Operación + go-live (100/100)

---

## 5) Checklist final de “100% producción”

### Seguridad
- [ ] CORS cerrado por entorno
- [ ] Secretos fuera del repo y rotados
- [ ] Validación fail-fast de env vars
- [ ] Revisión de permisos y accesos admin

### Calidad
- [ ] Lint, tests y build obligatorios en CI
- [ ] Smoke E2E en staging
- [ ] Política de release documentada

### SRE
- [ ] Dashboards productivos
- [ ] Alertas con umbrales y guardias
- [ ] SLO aprobados por negocio y tecnología

### Escala
- [ ] Redis/colas en producción
- [ ] Load test y soak test aprobados
- [ ] Plan de capacidad trimestral

### Operación
- [ ] Runbooks y on-call activos
- [ ] Rollback validado
- [ ] Postmortem template y proceso activo

---

## 6) Riesgos si se omite este plan

1. Vulnerabilidades por configuración permisiva.
2. Caídas sin detección temprana.
3. Releases inestables sin calidad mínima.
4. Degradación al escalar tráfico real.

---

## 7) Acciones inmediatas (próximas 72 horas)

1. Nombrar owners por fase (Engineering, SRE, Seguridad, Producto).
2. Ejecutar Fase 0 completa sin excepción.
3. Activar CI obligatoria antes del siguiente despliegue.
4. Definir fecha de Go/No-Go con criterios de puntaje (>=100/100).

