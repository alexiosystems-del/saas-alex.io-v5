# 🚀 Guía Alex + ManyChat (Para cracks) 🚀

¿Quieres que Alex (tu IA) responda tus mensajes de Instagram y Facebook por ti? Sigue estos 4 pasos súper simples.

---

### Paso 1: Consigue tus "Coordenadas" en Alex
1. Entra a tu **Panel de Alex IO**.
2. Ve a la pestaña **Configuración**.
3. Baja hasta donde dice **Puente ManyChat**.
4. Haz clic en el botón **Generar Token** (es como tu contraseña secreta).
5. **Copia la URL** que aparece en el cuadro azul (ya tiene tu ID incluido).

---

### Paso 2: Activa el "Radar" en ManyChat
1. En ManyChat, ve a **Automation** > **Keywords**.
2. Dale a **+ New Keyword**.
3. Elige **Instagram** (o Messenger).
4. En el texto, pon un asterisco: `*`.
5. Selecciona **Message is any message**.
6. Dale a **Create Keyword**.

---

### Paso 3: Conecta el Cable (External Request)
Ahora conecta ese Keyword a un flujo que haga esto:
1. Añade un bloque de **Action** > **External Request**.
2. En **Request Type**, pon `POST`.
3. En **Request URL**, pega la **URL de Alex** que copiaste en el Paso 1.
4. En la pestaña **Headers** (Cabeceras):
   - Haz clic en `+ Add Header`.
   - Pon: `Authorization` | Valor: `Bearer TU_TOKEN_DE_ALEX` (Cámbialo por el tuyo).
5. En la pestaña **Body** (Cuerpo), pega este código:

```json
{
  "user_id": "{{user_id}}",
  "name": "{{first_name}} {{last_name}}",
  "channel": "instagram",
  "platform": "instagram",
  "tenantId": "TU_ID",
  "instanceId": "TU_ID",
  "message": "{{last_text_input}}",
  "message_id": "{{message_id}}",
  "timestamp": "{{current_time}}"
}
```
*(Nota: ManyChat cambiará lo que está entre `{{ }}` automáticamente).*

---

### Paso 4: ¡Fuego! 🔥
1. Dale a **Publish** (Publicar).
2. Agarra otro celular y escribe a tu cuenta de Instagram.
3. ¡Mira cómo Alex responde solo y como un pro!

---

**Tip de experto:** Si Alex tarda un poquito, no te asustes, verás un mensaje de "procesando". Eso es porque está pensando para ser el mejor. 🧠🔥
