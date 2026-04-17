# Runbook: Migración de app HubSpot y conexión con bot ALEX IO

Fecha: 2026-04-06

## 1) Objetivo

Aplicar la migración recomendada por HubSpot (CLI 7.6.0+), validar que el token sigue funcionando y conectar el bot ALEX IO sin cambios invasivos de backend.

---

## 2) Pre-requisitos

1. Node.js y npm instalados.
2. HubSpot CLI >= 7.6.0.
3. Cuenta HubSpot con permisos para el app.
4. Token de app privada (`HUBSPOT_PRIVATE_APP_TOKEN`) para pruebas de API.

---

## 3) Pasos de migración (HubSpot CLI)

> Nota: estos comandos se ejecutan fuera del runtime del servidor (tu terminal local o CI de DevOps).

```bash
npm i -g @hubspot/cli@latest
hs --version
hs auth
hs accounts use
```

Si tu app es legacy no-project:

```bash
hs app migrate
```

Si tu app ya era project-based:

```bash
hs project migrate
```

Confirma prompts:
- app a migrar
- componentes a migrar
- nombre del proyecto
- ruta local
- UIDs (mantener estables)

---

## 4) Validación post-migración para ALEX IO

1. Verifica que `hsproject.json` incluya `"platformVersion": "2025.2"`.
2. Conserva token vigente (no romper instalaciones existentes).
3. En ALEX IO, configura `hubspotAccessToken` del bot (por instancia) en dashboard/config.

---

## 5) Prueba técnica de conectividad HubSpot (incluida en este repo)

Se agregó script:

- `server/scripts/check-hubspot-connection.js`

Ejecuta:

```bash
cd server
HUBSPOT_PRIVATE_APP_TOKEN=tu_token npm run hubspot:check
```

Qué valida:
- acceso al endpoint de cuenta (`/account-info/v3/details`)
- acceso a CRM contacts search (`/crm/v3/objects/contacts/search`)

---

## 6) Conexión con bot (flujo funcional)

1. Crear/editar bot en ALEX IO.
2. Guardar `hubspotAccessToken` en su configuración.
3. En conversación real, cuando el extractor detecte lead, ALEX IO ejecuta sync:
   - busca contacto por teléfono
   - crea/actualiza contacto
   - adjunta nota resumen

---

## 7) Criterio de éxito

- `npm run hubspot:check` devuelve OK.
- Mensaje lead real genera contacto/actualización en HubSpot.
- Se crea nota asociada al contacto con resumen de IA.

---

## 8) Troubleshooting rápido

- **401/403 en HubSpot API**: token inválido o sin scopes.
- **429 rate limit**: aplicar backoff y limitar ráfaga de sincronizaciones.
- **No crea contacto**: revisar formato de teléfono y campos requeridos.
- **No llega nota**: verificar permiso para objetos `notes` y asociaciones.

