# Checklist express (15 min) — Incidentes: idioma, Live Chat, campañas y crédito AI

Fecha: 2026-04-21

## Objetivo
Validar rápidamente los 4 problemas reportados:
1. El bot no responde.
2. Campaña masiva no envía.
3. Usuario escribe en inglés y bot responde en español.
4. El chat no aparece en Live Chat.

---

## 1) Sanidad de credenciales AI (3 min)

1. Verifica variables cargadas en backend:
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `DEEPSEEK_API_KEY`
2. Si OpenAI está sin saldo, confirma que Gemini o DeepSeek estén activos para fallback.
3. En logs, buscar errores típicos:
   - `insufficient_quota`
   - `invalid_api_key`
   - `expired`

**Resultado esperado:** al menos 1 proveedor AI funcional.

---

## 2) Prueba de idioma (3 min)

### Webchat (controlada)
Enviar payload en inglés:

```bash
curl -X POST "https://<TU_BACKEND>/api/webhooks/webchat?instanceId=<INSTANCE_ID>" \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "lead_en_test",
    "text": "Hello, I need pricing information",
    "metadata": { "tenantId": "<TENANT_ID>" }
  }'
```

**Resultado esperado:** respuesta en inglés (`reply` en inglés).

---

## 3) Validación de Live Chat (4 min)

1. En Supabase, confirma inserción de mensajes con:
   - `instance_id = <INSTANCE_ID>`
   - `remote_jid = lead_en_test`
2. Abre Live Chat con esa misma `instanceId`.
3. Verifica que el lead aparezca en sidebar y conversación.

Query sugerida:

```sql
select created_at, instance_id, remote_jid, direction, content
from messages
where instance_id = '<INSTANCE_ID>'
order by created_at desc
limit 30;
```

**Resultado esperado:** mensaje inbound/outbound visible en DB y UI.

---

## 4) Campaña masiva / Broadcast (5 min)

1. Ejecutar preflight:

```bash
curl -X POST "https://<TU_BACKEND>/api/saas/broadcast/preflight" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "instanceId": "<INSTANCE_ID>",
    "mediaUrl": "",
    "mediaType": "image"
  }'
```

2. Lanzar campaña mínima (2 números de prueba):

```bash
curl -X POST "https://<TU_BACKEND>/api/saas/broadcast" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{
    "instanceId": "<INSTANCE_ID>",
    "phones": ["5491100001111", "5491122223333"],
    "message": "Test broadcast"
  }'
```

3. Revisar logs backend para conteo final:
   - `BROADCAST FINISHED`
   - `enviados/fallidos`

**Resultado esperado:** cola iniciada + al menos 1 envío exitoso.

---

## Criterio de cierre (Go/No-Go)

- ✅ AI responde (sin bloqueo por créditos globales).
- ✅ Inglés -> respuesta en inglés.
- ✅ Conversación visible en Live Chat.
- ✅ Broadcast envía y registra trazas.

Si falla uno de los cuatro, dejar incidente en estado **NO-GO** y adjuntar:
- request payload,
- respuesta HTTP,
- traza de logs (2-3 líneas),
- `instanceId` afectada.
