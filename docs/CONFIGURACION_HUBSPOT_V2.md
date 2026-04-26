# Guía de Configuración y Migración de HubSpot (V2) para ALEX IO

Esta guía describe el proceso exacto para configurar, verificar y migrar la integración de HubSpot dentro de la plataforma ALEX IO SaaS hacia el nuevo framework de Proyectos de HubSpot (Developer Platform V2).

---

## 1. Requisitos Previos

Para integrar HubSpot con la plataforma, necesitas un **Personal Access Token (PAT)** o el **Token de una App Privada** en tu cuenta de HubSpot, con al menos los siguientes alcances (scopes):
*   `crm.objects.contacts.read`
*   `crm.objects.contacts.write`
*   Permisos para webhooks e integración de apps (si requieres webhooks inversos).

---

## 2. Configuración en el Servidor

Debes agregar el token obtenido al archivo de configuración del entorno (`.env`) en la carpeta `server/` de ALEX IO.

**Archivo `server/.env`:**
```env
# Puedes usar la clave privada de la app o el Personal Access Token
HUBSPOT_PRIVATE_APP_TOKEN=pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
# Alternativamente:
# HUBSPOT_ACCESS_TOKEN=tu_token_aqui
```

---

## 3. Verificación de Conexión

Una vez configurado el token, puedes verificar que la conexión bidireccional entre la SaaS y tu CRM funciona correctamente, ejecutando la utilidad de test incluida.

1.  Abre tu terminal en la carpeta `server/`.
2.  Ejecuta el siguiente comando:
    ```bash
    npm run hubspot:check
    ```

**Salida esperada:**
```
--- VERIFICACIÓN DE CONEXIÓN HUBSPOT ---
✅ Token detectado. Intentando conexión...
✅ Conexión Exitosa: Portal ID 12345678
✅ Permisos CRM validados. Total de Contactos (muestra): API responde 200 OK.

Todo listo para usar HubSpot en producción 🚀
```

---

## 4. Migración a la Arquitectura de Proyectos (HubSpot CLI)

Recientemente, HubSpot está descontinuando la arquitectura legacy, y es necesario migrar la app pública (integración del portal) al nuevo framework de proyectos (Projects V2). 

Esto se hace a través de la interfaz de línea de comandos (CLI) de HubSpot. El proceso **mantiene intactos tus tokens, instalaciones y features actuales**, y no requiere modificaciones en el código backend de ALEX IO.

### Paso A: Instalar HubSpot CLI
Asegúrate de tener instalada la herramienta oficial de HubSpot de forma global.

```bash
npm install -g @hubspot/cli@latest
```
*(Puede requerir permisos de administrador dependiendo del sistema).*

### Paso B: Autenticar tu Entorno
Vincula la CLI con tu cuenta usando tu Token (Personal Access Key).

```bash
hs auth
```
Durante este comando interactivo:
1.  **Select the authorization mechanism:** Elije "Personal Access Key".
2.  Pega tu token (`pat-na1-...`).
3.  La CLI creará automáticamente el archivo de configuración `hubspot.config.yml`.

### Paso C: Ejecutar la Migración de la App
Una vez autenticado en la CLI y conectado a la cuenta de desarrollador, ejecuta el comando de migración:

```bash
hs app migrate
```
1.  Verás una lista interactiva. Usa tus flechas del teclado para seleccionar tu integración o "App Legacy".
2.  Pulsa Enter y la herramienta creará automáticamente la estructura de proyecto requerida por HubSpot bajo el capó.
3.  Espera al mensaje de éxito que confirma que la migración ha concluido en los servidores de HubSpot.

---

## 5. Notas Adicionales de Arquitectura

- La plataforma ALEX IO gestiona las conversiones de Intenciones a *Leads* directamente en memoria o base de datos temporalmente.
- Asegúrate de monitorear el script `server/services/whatsappSaas.js` (u otro de enrutamiento) por si requieres habilitar/deshabilitar la sincronización directa hacia el CRM (la cual requiere de endpoints válidos bajo la API estándar de V3 de contactos de HubSpot).
