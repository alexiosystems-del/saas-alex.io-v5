# Arquitectura Premium: Live Chat Multilenguaje para ALEX IO

Fecha: 2026-04-06

## 1) Objetivo de negocio

Permitir que el operador humano vea y responda conversaciones en su idioma preferido (ej. español), aunque el lead escriba en alemán, francés, inglés u otros idiomas, sin perder contexto, intención comercial ni trazabilidad legal.

---

## 2) Capacidades objetivo (Premium)

1. **Detección automática de idioma inbound** por mensaje.
2. **Traducción en tiempo real** a idioma del operador (vista Live Chat).
3. **Respuesta asistida bilingüe**:
   - Operador escribe en su idioma.
   - Sistema traduce al idioma del lead antes de enviar.
4. **Modo “mostrar original + traducción”** para auditoría.
5. **Memoria de idioma por conversación** (lead_lang y operator_lang).
6. **Fallback inteligente** si falla proveedor de traducción.

---

## 3) Arquitectura propuesta

## 3.1 Capa de dominio

### A. Language Orchestrator (nuevo servicio)

Responsable de:
- detectar idioma (`detected_lang`) por mensaje,
- decidir si se traduce o no,
- llamar proveedores (Gemini/OpenAI/DeepSeek) con fallback,
- registrar metadatos de traducción.

### B. Translation Policy Engine

Reglas por tenant/bot:
- idioma por defecto del operador,
- auto-traducción ON/OFF,
- idiomas permitidos,
- formato de visualización (solo traducido vs dual).

### C. Conversation Language Memory

Estado por conversación:
- `lead_lang`
- `operator_lang`
- `translation_mode`
- `last_detect_confidence`

---

## 3.2 Flujo inbound (lead -> ALEX)

1. Webhook/entrada llega a `messages`.
2. `Language Orchestrator` detecta idioma.
3. Si idioma != operador:
   - guarda `original_text`
   - calcula `translated_text`
4. Live Chat muestra:
   - burbuja principal traducida
   - toggle “ver original”.

---

## 3.3 Flujo outbound humano (agente -> lead)

1. Operador escribe en idioma local (ej. español).
2. Antes de `messages/send`, traducir a `lead_lang`.
3. Enviar al canal (WhatsApp/Meta/etc.) en idioma del lead.
4. Guardar en DB:
   - `agent_original_text`
   - `agent_translated_text`
   - `target_lang`.

---

## 4) Modelo de datos recomendado

### 4.1 Extensión tabla `messages`

Agregar columnas:
- `original_text` TEXT
- `translated_text` TEXT
- `source_lang` TEXT
- `target_lang` TEXT
- `translation_provider` TEXT
- `translation_confidence` NUMERIC
- `translation_latency_ms` INT

### 4.2 Nueva tabla `conversation_locale_state`

Campos:
- `instance_id`
- `remote_jid`
- `lead_lang`
- `operator_lang`
- `translation_mode` (OFF|INBOUND_ONLY|BIDIRECTIONAL)
- `updated_at`

---

## 5) UX Premium en Live Chat

1. **Badge de idioma detectado** por conversación (`DE`, `FR`, `EN`).
2. **Switch global**: “Traducir automáticamente”.
3. **Switch por conversación**: “Bidireccional”.
4. **Botón rápido**: “Responder en idioma original del lead”.
5. **Tooltip de calidad**: proveedor + latencia + confianza.

---

## 6) Integración con componentes existentes

- Reusar `alexBrain.translateIncomingMessage` para inbound inmediato.
- Reusar `translator.js` como fallback premium (incluye routing y cache).
- En `whatsappSaas.js`:
  - mantener preprocesamiento inbound,
  - agregar metadatos de traducción al guardar `messages`.
- En `LiveChat.jsx`:
  - render dual (`translated_text` + `original_text`),
  - enviar outbound traducido cuando corresponda.

---

## 7) SLO / observabilidad

KPIs obligatorios:
- `% mensajes traducidos correctamente`
- `latencia p95 de traducción`
- `fallback rate por proveedor`
- `errores de idioma detectado`

Alertas:
- p95 traducción > 1200ms por 10 min.
- error rate traducción > 3% por 5 min.

---

## 8) Roadmap de implementación (7 días)

### Día 1-2
- Diseño de esquema DB y migraciones.
- Guardado dual `original_text/translated_text` en inbound.

### Día 3-4
- UI LiveChat: badge idioma + toggle original/traducción.
- Memoria de idioma por conversación.

### Día 5-6
- Outbound bidireccional (agente -> lead traducido).
- Métricas + logs estructurados.

### Día 7
- QA multilenguaje (ES/EN/DE/FR), hardening y runbook.

---

## 9) Criterio de éxito (Premium)

- Operador en español puede atender lead en DE/FR/EN sin salir del panel.
- Mensajes se visualizan con contexto original y traducción.
- Respuestas del operador llegan al lead en su idioma automáticamente.
- Auditoría completa de original/traducción por mensaje.
