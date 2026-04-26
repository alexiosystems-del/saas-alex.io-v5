# 🎮 Guía para Conectar ALEX IO con Discord (Paso a Paso)

> Esta guía te explica cómo hacer que tu bot ALEX IO responda automáticamente
> en tu servidor de Discord (mensajes y DMs).

---

## 📋 Antes de empezar, necesitás tener:

1. Una **cuenta de Discord**.
2. Un **servidor de Discord** donde seas administrador.
3. Tu **Dashboard de ALEX IO** abierto en otra pestaña.

---

## Paso 1: Creá una aplicación en Discord

1. Abrí el portal de desarrolladores: [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Hacé clic en **"New Application"** (Nueva Aplicación).
3. Ponele un nombre como: `ALEX IO Bot`.
4. Aceptá los términos y hacé clic en **"Create"** (Crear).

---

## Paso 2: Creá el Bot

1. En el menú de la izquierda, hacé clic en **"Bot"**.
2. Hacé clic en **"Add Bot"** → **"Yes, do it!"**.
3. Vas a ver la sección del bot con su nombre e imagen.

### Copiá el Token:
1. Hacé clic en **"Reset Token"** (Regenerar Token).
2. Copiá el token que aparece. **Guardalo en un lugar seguro** — solo se muestra una vez.

> ⚠️ **NUNCA compartas este token con nadie.** Es como la contraseña de tu bot.

### Activá los permisos del bot:
En la misma página de "Bot", buscá la sección **"Privileged Gateway Intents"** y activá:

- ✅ **MESSAGE CONTENT INTENT** (obligatorio — sin esto el bot no puede leer mensajes)
- ✅ **SERVER MEMBERS INTENT** (opcional — para ver datos de usuarios)

Hacé clic en **"Save Changes"**.

---

## Paso 3: Invitá al Bot a tu servidor

1. En el menú de la izquierda, hacé clic en **"OAuth2"** → **"URL Generator"**.
2. En **"Scopes"**, marcá: `bot`
3. En **"Bot Permissions"**, marcá:
   - ✅ Send Messages (Enviar mensajes)
   - ✅ Read Message History (Leer historial)
   - ✅ View Channels (Ver canales)
4. Abajo se genera una **URL de invitación**.
5. Copiá esa URL y pegala en tu navegador.
6. Elegí el servidor donde querés agregar el bot.
7. Hacé clic en **"Authorize"** (Autorizar).
8. ¡El bot ya aparece en tu servidor! (pero todavía está offline 💤)

---

## Paso 4: Agregá el Token en Render

1. Abrí tu proyecto en **Render** → **Environment** → **Environment Variables**.
2. Agregá esta variable:

| Key | Value |
|---|---|
| `DISCORD_BOT_TOKEN` | *(pegá el token del Paso 2)* |

3. Hacé clic en **"Save Changes"** y esperá a que Render redespliegue (~2 min).

---

## Paso 5: Verificá que el bot esté online

1. Abrí tu servidor de Discord.
2. Mirá la lista de miembros a la derecha.
3. Tu bot debería aparecer con un **punto verde** (online). ✅

> Si no aparece online, revisá los logs de Render buscando:
> `discord_ready` → el bot se conectó.
> `discord_login_failed` → el token es incorrecto.

---

## Paso 6: ¡Probalo en vivo!

1. Andá a cualquier canal de texto de tu servidor.
2. Escribí un mensaje como: `Hola bot, ¿qué podés hacer?`
3. Esperá unos segundos.
4. **¡ALEX IO va a responder en el mismo canal!** 🤖✨

### ¿Y los mensajes directos (DMs)?
También funcionan. Hacé clic derecho en el bot → **"Send Message"** → escribí algo. El bot responde por DM también.

---

## ❓ Preguntas Frecuentes

### ¿El bot responde en todos los canales o solo en algunos?
Por defecto, responde en **todos los canales** donde tenga permiso. Si querés limitarlo a un canal específico, podés configurarlo desde el Dashboard.

### ¿Qué pasa si se cae la conexión?
Discord se reconecta **automáticamente** con su propio sistema de reconexión. No necesitás hacer nada.

### ¿Puedo tener Discord y WhatsApp al mismo tiempo?
**Sí.** ALEX IO maneja todos los canales de forma independiente.

### ¿Puedo cambiar el nombre o foto del bot?
Sí, desde el portal de Discord Developers → tu app → sección "Bot" → cambiá el nombre e ícono.
