# 🎵 Guía para Conectar ALEX IO con TikTok (Paso a Paso)

> Esta guía te explica cómo hacer que tu bot ALEX IO responda automáticamente
> cuando alguien te escribe por TikTok Business.

---

## 📋 Antes de empezar, necesitás tener:

1. Una **cuenta de TikTok for Business** activa.
2. Tu **Dashboard de ALEX IO** abierto en otra pestaña.
3. Acceso a internet para registrar la app en el portal de TikTok.

---

## Paso 1: Registrá tu App en TikTok for Developers

1. Abrí el portal de desarrolladores: [https://developers.tiktok.com/apps/](https://developers.tiktok.com/apps/)
2. Hacé clic en **"Create App"** (Crear App).
3. Elegí el tipo **"Business"**.
4. Completá los datos:
   - **App Name**: `ALEX IO Bot` (o el nombre que quieras)
   - **Description**: `Bot de atención al cliente con IA`
5. Hacé clic en **"Create"** (Crear).

---

## Paso 2: Activá los permisos de mensajería

1. Una vez creada la app, andá a la sección **"Products"** (Productos).
2. Buscá **"Business Messaging API"** y hacé clic en **"Add"** (Agregar).
3. En la sección de **Scopes** (Permisos), activá:
   - `tiktok.business.message.read` (leer mensajes)
   - `tiktok.business.message.write` (enviar mensajes)
4. Hacé clic en **"Save"** (Guardar).

---

## Paso 3: Copiá tus credenciales

1. Andá a la sección **"App Info"** (Información de la App).
2. Copiá estos dos valores y guardalos en un lugar seguro:

| Campo | Dónde ponerlo |
|---|---|
| **App ID** (client_key) | Variable de entorno `TIKTOK_APP_ID` |
| **App Secret** (client_secret) | Variable de entorno `TIKTOK_APP_SECRET` |

---

## Paso 4: Configurá el Webhook

1. En el portal de TikTok, andá a la sección **"Webhook"**.
2. En el campo **"Callback URL"**, pegá esta dirección:

```
https://whatsapp-fullstack-ylsx.onrender.com/api/webhooks/tiktok
```

3. Hacé clic en **"Verify"** (Verificar).
   - TikTok va a enviar un `GET` con un parámetro `?challenge=xxx`.
   - Tu servidor ya está preparado para responder automáticamente con ese valor. ✅
4. Si ves el mensaje **"Webhook verified"**, ¡todo bien! 🎉

---

## Paso 5: Agregá las variables de entorno en Render

1. Abrí tu proyecto en **Render** → **Environment** → **Environment Variables**.
2. Agregá estas dos variables:

| Key | Value |
|---|---|
| `TIKTOK_APP_ID` | *(pegá tu App ID del Paso 3)* |
| `TIKTOK_APP_SECRET` | *(pegá tu App Secret del Paso 3)* |

3. Hacé clic en **"Save Changes"** y esperá a que Render redespliegue (~2 min).

---

## Paso 6: ¡Probalo en vivo!

1. Abrí **TikTok** en tu celular.
2. Mandá un mensaje directo a tu cuenta de negocio.
3. Esperá unos segundos.
4. **¡Deberías recibir una respuesta de ALEX IO!** 🤖✨

---

## ❓ Preguntas Frecuentes

### ¿Puedo usar TikTok sin registrar la app?
En modo desarrollo (local), sí — el servidor acepta mensajes sin verificar la firma HMAC. **En producción, es obligatorio** tener el `TIKTOK_APP_SECRET` configurado.

### ¿TikTok funciona con ManyChat?
ManyChat solo permite responder a **comentarios** en TikTok, no a mensajes directos. Por eso ALEX IO usa el webhook directo de TikTok, que permite responder DMs.

### ¿Qué tipos de mensaje soporta?
Por ahora, solo **texto**. Audio, imágenes y stickers están en el roadmap.
