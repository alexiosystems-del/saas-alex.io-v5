# Checklist post-deploy Render — Frontend CSP / Supabase Realtime

**Objetivo:** confirmar que producción está sirviendo el commit correcto y que el navegador ya puede abrir `wss://*.supabase.co` para CRM PRO, RAG y QR/canales.

## 1) Confirmar rama correcta en Render

En Render Dashboard:

1. Abrir el servicio que sirve `https://whatsapp-fullstack-ylsx.onrender.com`.
2. Ir a **Settings → Build & Deploy**.
3. Verificar **Branch**.
4. Debe ser la rama donde estén los fixes, idealmente:

```text
deploy-fix
```

> Si Render está desplegando `work`, `main`, `master` u otra rama, el navegador puede seguir recibiendo la CSP vieja aunque el código corregido exista en Git.

## 2) Comparar commit desplegado vs commit esperado

En local:

```bash
git fetch --all --prune
git log deploy-fix -1 --oneline
git log work -1 --oneline
```

En Render:

1. Abrir **Events** o **Deploys** del servicio.
2. Entrar al último deploy exitoso.
3. Comparar el commit SHA mostrado por Render con el SHA de `deploy-fix`.

Resultado esperado:

```text
Render debe mostrar el mismo commit o uno posterior que incluya el fix CSP.
```

## 3) Forzar redeploy limpio

Si la rama/commit no coincide:

1. Render → **Manual Deploy**.
2. Seleccionar **Clear build cache & deploy** si está disponible.
3. Confirmar que el deploy finaliza sin errores.

## 4) Validar CSP real desde fuera del navegador

Desde tu máquina local o un servidor externo:

```bash
curl -I https://whatsapp-fullstack-ylsx.onrender.com/ | grep -i content-security
```

La cabecera debe contener, como mínimo:

```text
wss://*.supabase.co
https://*.supabase.co
```

También puedes usar el script del repo:

```bash
cd server
npm run frontend:csp:check -- https://whatsapp-fullstack-ylsx.onrender.com/#/dashboard
```

Resultado esperado:

```text
✅ WSS supabase realtime: wss://*.supabase.co
```

## 5) Si la CSP sigue sin `wss://*.supabase.co`

Revisar estas fuentes de sobrescritura:

1. **Render Static Site Headers** o reglas custom de headers.
2. CDN/proxy delante de Render.
3. Otro servicio Render sirviendo el frontend en lugar del backend Node corregido.
4. Caché del navegador: probar en incógnito o con hard refresh.

## 6) Validar variables frontend de Supabase en Render

En el servicio frontend/static de Render validar:

```text
VITE_SUPABASE_URL=https://euknjjnjcgdlksrcbkde.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Reglas:

- `VITE_SUPABASE_URL` debe terminar en `.supabase.co`.
- `VITE_SUPABASE_ANON_KEY` debe ser la **anon public key** del mismo proyecto Supabase.
- Si cambias cualquier variable `VITE_`, debes reconstruir el frontend; Vite las inyecta en build time.

## 7) Validación visual en navegador

Después del redeploy:

1. Abrir incógnito.
2. Ir a `https://whatsapp-fullstack-ylsx.onrender.com/#/dashboard`.
3. Abrir DevTools → Console.
4. Confirmar que ya no aparece:

```text
violates the following Content Security Policy directive: "connect-src"
```

5. Probar módulos:
   - CRM PRO Pipeline.
   - Knowledge (RAG).
   - Generación QR / WhatsApp Engine Hub.

## 8) Resultado esperado final

- Sin errores CSP para `wss://...supabase.co/realtime/v1/websocket`.
- Sin cascada de errores 400 por Realtime bloqueado.
- CRM/RAG/QR dejan de romper el frontend por sincronización en vivo bloqueada.

## Resumen de causa probable

Claude y Codex coinciden: si el código contiene el fix pero producción sigue mostrando CSP vieja, el problema más probable es **Render desplegando una rama/commit incorrecto** o **una cabecera CSP sobrescrita fuera de Node**.
