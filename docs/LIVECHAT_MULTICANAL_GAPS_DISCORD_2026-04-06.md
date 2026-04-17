# Live Chat Multicanal + Discord: Estado actual y faltantes

Fecha: 2026-04-06

## 1) ¿Cómo funcionaría el Live Chat cuando entren mensajes por Meta / ManyChat / TikTok / Discord?

## Flujo objetivo (premium)

1. **Webhook de canal** recibe mensaje entrante.
2. Se transforma a `standardizedMessage` (plataforma, senderId, texto, metadata).
3. `messageRouter` procesa IA y guarda conversación.
4. Live Chat consume tabla `messages` y muestra cada chat con badge/plataforma.
5. Agente humano responde desde Live Chat.
6. Router/adaptador envía la respuesta al canal correcto (Meta, TikTok, Discord, etc.).

---

## 2) Estado actual real (hoy)

### Lo que ya existe

- Live Chat muestra origen por prefijos (`[messenger]`, `[instagram]`, `[tiktok]`, etc.).
- Existen conectores inbound para Messenger/Instagram/TikTok y webhook ManyChat.
- Hay endpoint de envío manual Live Chat (`/api/saas/messages/send`) para WhatsApp/Baileys.

### Limitación importante

- `messageRouter` **no tiene salida real implementada** para varios canales (placeholders).
- Live Chat outbound actual depende de socket Baileys (`activeSessions`) y no enruta por adaptador de plataforma.

---

## 3) Qué falta para Meta / ManyChat / TikTok en Live Chat

1. **Router outbound real** por plataforma (sin placeholders).
2. **Resolver de instancia/canal** por conversación para saber a dónde enviar.
3. **Tabla de mapeo conversación-canal** (`instance_id`, `remote_jid`, `platform`, `channel_account_id`).
4. **Live Chat send unificado**:
   - si `platform=whatsapp` -> Baileys/Meta
   - si `platform=messenger` -> Graph API
   - si `platform=instagram` -> IG API
   - si `platform=tiktok` -> TikTok Messaging API
   - si `platform=manychat` -> response block / send endpoint según modo

5. **Observabilidad por canal**: success rate, 4xx/5xx, latencia p95, retries.

---

## 4) Qué falta específicamente para Discord

## Backend

- [ ] Crear `discordAdapter` con:
  - `parseWebhook` (si usan interaction/webhook gateway)
  - `sendMessage(channelId/userId, text)`
  - `verifyWebhook` (firma/timestamp)
  - `healthCheck`

- [ ] Registrar endpoint en `webhooks-multi` para Discord.
- [ ] Mapear `instance_id` por `application_id`/`guild_id`/`channel_id`.
- [ ] Persistir mensajes de Discord en `messages` con prefijo `[discord]`.

## Frontend Live Chat

- [ ] Añadir icono/badge Discord en lista de conversaciones.
- [ ] Mostrar `channel`/`guild` en metadata de conversación.
- [ ] Permitir responder y adjuntar multimedia según capacidades Discord.

## Seguridad

- [ ] Rotación de bot token y secretos Discord.
- [ ] Verificación de firma de interacciones.
- [ ] Rate limiting por canal/tenant.

---

## 5) Propuesta de arquitectura premium para resolverlo

## 5.1 AdapterFactory + ChannelAdapters

Interfaz única por canal:
- `parseInbound(req): StandardizedMessage[]`
- `sendOutbound(ctx, payload): SendResult`
- `verify(req): boolean`
- `health(): HealthResult`

Adapters:
- `whatsappBaileysAdapter`
- `metaCloudAdapter`
- `messengerAdapter`
- `instagramAdapter`
- `tiktokAdapter`
- `manychatAdapter`
- `discordAdapter` (nuevo)

## 5.2 Live Chat Gateway

Nuevo endpoint: `POST /api/livechat/send`
- Input: `conversationId`, `text`, `attachments[]`
- Gateway resuelve plataforma + instance + adapter
- Envía al canal y registra OUTBOUND en `messages`

## 5.3 Conversation Registry

Tabla sugerida: `conversation_channels`
- `conversation_id`
- `instance_id`
- `tenant_id`
- `platform`
- `remote_jid`
- `channel_account_id`
- `status`
- `last_seen_at`

---

## 6) Roadmap corto (10 días)

### Días 1-2
- Implementar `AdapterFactory` + contrato base.
- Conectar outbound real Messenger/Instagram/TikTok.

### Días 3-4
- Crear `livechat/send` gateway unificado.
- Registrar `conversation_channels`.

### Días 5-6
- Integrar ManyChat outbound según modo (Dynamic Block/API).
- Métricas por canal.

### Días 7-8
- Implementar `discordAdapter` + webhook endpoint.
- Persistencia `[discord]` en mensajes.

### Días 9-10
- QA E2E (Meta, TikTok, Discord, ManyChat).
- Hardening SRE + runbooks.

---

## 7) Criterio de éxito

- Un agente humano responde desde Live Chat y el mensaje sale por el canal correcto sin importar origen.
- Discord aparece como canal nativo en lista de conversaciones.
- Tasa de éxito outbound >= 99% por canal en 24h.
- Sin placeholders activos en rutas de envío.

