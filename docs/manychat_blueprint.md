# Blueprint: Conexión ManyChat a ALEX IO (Omnicanal)

Este documento explica cómo configurar ManyChat para reenviar todos los mensajes de plataformas de Meta (Instagram, Facebook Messenger) al "Cerebro IA" de ALEX IO.

## 1. Crear el Flujo "Default Reply" en ManyChat

1. En ManyChat, dirígete a **Settings** > **Instagram** (o Meseenger) > **Default Reply**.
2. Edita el flujo para que contenga un único bloque de inicio.
3. Añade un paso de tipo **Action**.
4. Selecciona la acción específica: **External Request** *(Nota: Esta función requiere una cuenta ManyChat PRO)*.

## 2. Configurar la "External Request"

En la ventana de configuración del External Request, completa los siguientes datos para conectar con tu backend V5:

- **Request Type:** `POST`
- **Request URL:** `https://tu-admin.tu-dominio.com/api/webhooks/manychat`
- **Headers (Cabeceras):**
  - Haz clic en "Add Header".
  - Key: `Content-Type` | Value: `application/json`
  - Key: `Authorization` | Value: `Bearer TU_TOKEN_MANYCHAT_DEL_DASHBOARD` *(Cópialo de la pestaña Configuración en el panel de ALEX IO)*.

## 3. Configurar el Body (Cuerpo de la Petición)

En la pestaña **Body** de la External Request, pega exactamente este código JSON. ManyChat utilizará sus variables mágicas `{{...}}` para inyectar los datos en tiempo real:

```json
{
  "user_id": "{{user_id}}",
  "name": "{{first_name}} {{last_name}}",
  "channel": "instagram",
  "message": "{{last_text_input}}"
}
```
*(Tip: Si estás configurando el Default Reply para Facebook Messenger, simplemente cambia `"channel": "instagram"` por `"channel": "messenger"`).*

## 4. Retorno de Datos (Dynamic Block Response)

¡Aquí viene la magia!
1. Una vez guardado el Request, no necesitas mapear ninguna variable (Response Mapping).
2. El enrutador de mensajes (`messageRouter.js`) de ALEX IO detectará la petición y procesará la respuesta con IA.
3. ALEX IO enviará automáticamente de regreso a ManyChat un JSON estructurado con el formato `version: "v2"`, `content: { messages: [...] }`.
4. ManyChat interpretará esto como un "Dynamic Block" e inyectará los mensajes de texto (o audios) directamente en el chat del usuario.

## 5. Publicar

Conecta la acción al flujo inicial, dale al botón azul de **Publish** arriba a la derecha en ManyChat, y prueba enviar un mensaje privado a tu propia cuenta de Instagram. ¡Tu bot omnicanal responderá casi al instante!
