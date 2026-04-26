# Acta de Cierre de Producción — ALEX IO

> Plantilla oficial para auditoría interna de salida a producción.

---

## 1) Información General

- **Fecha de cierre:** ____ / ____ / ______
- **Versión / Release ID:** ______________________
- **Entorno:** ☐ Staging ☐ Producción
- **Ventana de despliegue:** ______________________
- **Responsable técnico:** ______________________
- **Aprobador de negocio:** ______________________
- **Aprobador de seguridad/SRE:** ______________________

---

## 2) Alcance de la liberación

- **Objetivo del release:**
  - _____________________________________________
- **Módulos impactados:**
  - _____________________________________________
- **Canales habilitados en esta salida:**
  - ☐ WhatsApp (Baileys)
  - ☐ WhatsApp Cloud API
  - ☐ Messenger
  - ☐ Instagram
  - ☐ ManyChat
  - ☐ TikTok
  - ☐ Discord
  - ☐ Reddit

---

## 3) Checklist Go/No-Go (evidencia obligatoria)

## A. Infraestructura y DB

- [ ] `whatsapp_auth_state` creada y accesible.
- [ ] `prompt_versiones` creada y accesible.
- [ ] Migraciones ejecutadas sin error.
- [ ] Backups/restore verificados.

**Evidencia (links/capturas):**
- _____________________________________________

## B. Seguridad

- [ ] Secretos críticos rotados/validados.
- [ ] CORS y auth validados en entorno target.
- [ ] Logs sin exposición de credenciales.

**Evidencia:**
- _____________________________________________

## C. Calidad técnica

- [ ] Lint verde.
- [ ] Tests unitarios verdes.
- [ ] Build frontend verde.
- [ ] Smoke tests API críticos verdes.

**Comandos ejecutados:**
- _____________________________________________

## D. Operación multi-canal

- [ ] Inbound/outbound validado por canal activo.
- [ ] `messageRouter` responde correctamente.
- [ ] Dashboard/SuperAdmin sin errores 500.

**Evidencia:**
- _____________________________________________

## E. SRE

- [ ] `/api/sre/health` estable.
- [ ] Alertas funcionales (Slack/Discord/Pager).
- [ ] Runbook de rollback probado.

**Evidencia:**
- _____________________________________________

---

## 4) Resultados de smoke test post-deploy (primeros 30 min)

| Prueba | Resultado | Detalle |
|---|---|---|
| Login panel | ☐ OK ☐ FAIL | __________________ |
| Crear bot | ☐ OK ☐ FAIL | __________________ |
| Conexión QR / Cloud | ☐ OK ☐ FAIL | __________________ |
| Mensaje inbound | ☐ OK ☐ FAIL | __________________ |
| Respuesta outbound | ☐ OK ☐ FAIL | __________________ |
| Analíticas | ☐ OK ☐ FAIL | __________________ |
| SuperAdmin clients | ☐ OK ☐ FAIL | __________________ |
| SRE health | ☐ OK ☐ FAIL | __________________ |

---

## 5) Métricas de estabilización (primeras 24h)

- **Error rate 5xx:** __________
- **Latencia p95 endpoints críticos:** __________
- **Tasa de éxito outbound por canal:** __________
- **Incidentes SEV1/SEV2:** __________

---

## 6) Incidencias detectadas y resolución

| ID | Severidad | Descripción | Estado | Responsable |
|---|---|---|---|---|
| INC-___ | ☐ Alta ☐ Media ☐ Baja | __________________ | ☐ Abierta ☐ Cerrada | __________ |

---

## 7) Decisión final

- **Estado de cierre:** ☐ GO ☐ GO PARCIAL ☐ NO-GO
- **Justificación:**
  - _____________________________________________
  - _____________________________________________

- **Acciones post-cierre (si aplica):**
  1. _____________________________________________
  2. _____________________________________________
  3. _____________________________________________

---

## 8) Firmas

- **Tech Lead:** ______________________  Fecha: ___ / ___ / _____
- **SRE Lead:** ______________________   Fecha: ___ / ___ / _____
- **Product/Business:** _______________ Fecha: ___ / ___ / _____
