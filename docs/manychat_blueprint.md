# 🤖 Guía para Conectar ALEX IO con ManyChat (Paso a Paso)

> Esta guía te explica cómo hacer que tu bot ALEX IO responda automáticamente
> cuando alguien te escribe por Instagram o Facebook Messenger usando ManyChat.

---

## 📋 Antes de empezar, necesitás tener 3 cosas listas:

1. **Tu cuenta de ManyChat** ya conectada con tu Instagram o Facebook.
2. **Tu Dashboard de ALEX IO** abierto en otra pestaña del navegador.
3. **Estos 3 datos** que vas a copiar desde el Dashboard de ALEX IO:
   - `Tenant ID` (lo ves en la barra superior del Dashboard)
   - `Instance ID` (ejemplo: `alex_1775663077275`)
   - `Token Secreto` (lo generás desde la pestaña **Configuración** → sección **ManyChat**)

---

## Paso 1: Entrá a ManyChat y creá una nueva automatización

1. Abrí **ManyChat** en tu navegador: [https://manychat.com](https://manychat.com)
2. En el menú de la izquierda, hacé clic en **"Automation"** (Automatización).
3. Después hacé clic en **"+ New Automation"** (Nueva Automatización).
4. Elegí **"Start from Scratch"** (Empezar de cero).
5. Ponele un nombre como: `ALEX IO Bot`.

---

## Paso 2: Elegí cuándo se activa el bot

1. Te va a pedir que elijas un **Trigger** (disparador). Esto es "¿cuándo querés que el bot responda?".
2. Elegí **"Keywords"** (Palabras clave).
3. En el campo de palabras clave escribí: `*` (un asterisco solo).
   - Esto significa: **"responder a CUALQUIER mensaje"**.
4. Asegurate de que esté seleccionada la plataforma correcta (**Instagram** o **Messenger**).
5. Hacé clic en **"Apply"** o **"Save"**.

---

## Paso 3: Agregá una acción de "External Request"

Ahora le vamos a decir a ManyChat que cuando alguien escriba, le pregunte a ALEX IO qué responder.

1. En el editor de flujo, hacé clic en el botón **"+"** para agregar un paso nuevo.
2. Elegí **"Action"** (Acción).
3. Dentro de las acciones, buscá y elegí **"External Request"**.

---

## Paso 4: Configurá la conexión (la parte más importante ⚡)

Se te va a abrir una ventana con varios campos. Completá así:

### 4.1 — Request Type (Tipo de petición)
Dejalo en: **POST**

### 4.2 — Request URL (Dirección del servidor)
Copiá y pegá esta URL, **reemplazando** los valores en mayúsculas con los tuyos:

```
https://whatsapp-fullstack-ylsx.onrender.com/api/webhooks/manychat?tenantId=TU_TENANT_ID&instanceId=TU_INSTANCE_ID
```

**Ejemplo real:**
```
https://whatsapp-fullstack-ylsx.onrender.com/api/webhooks/manychat?tenantId=tenant_superadmin&instanceId=alex_1775663077275
```

### 4.3 — Headers (Cabeceras)
Hacé clic en **"+ Add Header"** y agregá **dos** cabeceras:

| Key (Nombre)    | Value (Valor)                        |
|-----------------|--------------------------------------|
| `Content-Type`  | `application/json`                   |
| `Authorization` | `Bearer PEGA_AQUI_TU_TOKEN_SECRETO`  |

> ⚠️ **MUY IMPORTANTE:** Entre la palabra `Bearer` y tu token tiene que haber **un espacio**.
> Ejemplo: `Bearer abc123xyz`

### 4.4 — Body (Cuerpo del mensaje)
Hacé clic en la pestaña **"Body"**, asegurate de que esté en modo **"JSON"**, y pegá exactamente este texto:

```json
{
  "user_id": "{{user_id}}",
  "name": "{{first_name}} {{last_name}}",
  "channel": "instagram",
  "message": "{{last_text_input}}",
  "message_id": "{{message_id}}",
  "timestamp": "{{current_time}}",
  "custom_fields": {
    "email": "{{email}}",
    "phone": "{{phone}}"
  }
}
```

> 💡 **¿Usás Facebook Messenger en vez de Instagram?**
> Cambiá `"channel": "instagram"` por `"channel": "messenger"`.

---

## Paso 5: Probá la conexión

1. Con todo lo anterior listo, buscá el botón **"Test Request"** (Probar petición) en la parte de abajo de la ventana de External Request.
2. Hacé clic en **"Test Request"**.
3. **Si ves esto**, ¡todo está perfecto! ✅
   ```
   Response Code: 200
   ```
   Y en la respuesta vas a ver algo como:
   ```json
   {
     "version": "v2",
     "content": {
       "messages": [{ "type": "text", "text": "¡Hola! Soy ALEX..." }]
     }
   }
   ```
4. **Si ves un error**, revisá estos puntos:
   - ❌ `401 Unauthorized` → El token está mal. Copialo de nuevo desde el Dashboard.
   - ❌ `400 Bad Request` → Falta el `tenantId` o `instanceId` en la URL.
   - ❌ `404 Not Found` → El `instanceId` no existe. Verificalo en el Dashboard.

---

## Paso 6: Publicá el flujo

1. Cerrá la ventana del External Request haciendo clic en **"Save"** (Guardar).
2. Arriba a la derecha de ManyChat vas a ver un botón azul que dice **"Publish"** (Publicar).
3. Hacé clic en **"Publish"**.
4. ¡Listo! 🎉

---

## Paso 7: ¡Probalo en vivo!

1. Abrí **Instagram** en tu celular (o Facebook Messenger).
2. Buscá tu propia cuenta de negocio (la que conectaste con ManyChat).
3. Mandá un mensaje como: `Hola, ¿qué servicios ofrecen?`
4. Esperá unos segundos (máximo 10).
5. **¡Deberías recibir una respuesta automática de ALEX IO!** 🤖✨

---

## Paso 8 (Opcional): Especialización para Clínicas y Profesionales (High Ticket)

Si estás configurando ALEX IO para el nicho **Médico, Clínico o de Servicios Profesionales (High Ticket)**, te recomendamos agregar estas acciones adicionales en tu flujo de ManyChat:

1. **Etiquetas (Tags) Automáticas para Filtrado:**
   - En tu flujo, justo arriba del bloque "External Request", agregá un bloque "Action" que aplique una etiqueta como `[ALEX] Lead Calificado` o `[ALEX] Consulta Profesional`.
   - Cuando ALEX responda y pre-califique al contacto (paciente o cliente), tu equipo podrá filtrar rápidamente en ManyChat a todas las personas interesadas en servicios de alto valor.

2. **Captura de Teléfono para Cierre B2B / Consultoría (WhatsApp):**
   - Si el objetivo final es llevar a la persona a una llamada diagnóstica o agendar por WhatsApp, asegurate de que ALEX le pida el número de teléfono.
   - En ManyChat, podés configurar que cuando ALEX detecte un teléfono o correo electrónico, envíe una notificación automática a un asesor comercial.

---

## ❓ Preguntas Frecuentes

### ¿Puedo tener ManyChat y WhatsApp al mismo tiempo?
**Sí.** ALEX IO maneja todos los canales de forma independiente. WhatsApp sigue funcionando igual.

### ¿Qué pasa si alguien manda un emoji o un sticker?
ALEX IO lo detecta como `[non-text-input]` y responde con un mensaje genérico amigable.

### ¿Qué pasa si la IA tarda mucho?
Si la IA tarda más de 7.5 segundos, el bot responde automáticamente: *"Estamos procesando tu consulta, en un momento te respondemos."*

### ¿Puedo cambiar la personalidad del bot?
Sí, desde el Dashboard de ALEX IO en la pestaña **Configuración** → **Prompt del Sistema**.

---

## 6. ¿Hace falta algo más según el Quick Start oficial de ManyChat?

Sí, **si vas a escalar esta integración como app reusable** (en lugar de solo un flujo con External Request), conviene implementar lo siguiente:

1. **Bloque de autenticación (`auth`)** en la app JSON de ManyChat.
   - Para evitar pegar manualmente tokens por cada acción.
2. **Variables globales de autenticación** (ej. `base_url`, `token`) para reutilizar en múltiples acciones.
3. **Payload configurable** en acciones para mapear campos opcionales/obligatorios.
4. **Guide/ayuda dentro de la acción** para reducir errores de configuración de usuarios no técnicos.
5. **Proceso de publicación y versionado** de app si se usará en más de una cuenta/workspace.

En resumen:
- **Modo rápido (actual):** External Request + headers/body manuales.
- **Modo profesional/escala:** App JSON de ManyChat con `auth`, `actions`, `sources` y guía integrada.
