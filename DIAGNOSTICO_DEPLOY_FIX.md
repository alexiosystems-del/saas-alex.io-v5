# Diagnóstico rápido del stack (CRM + multicanal + RAG)

Este proyecto ahora incluye un chequeo único de preparación de entorno para validar por qué funciones como CRM propio, RAG, multilenguaje y canales pueden quedar inactivas.

## 1) Confirmar rama activa

```bash
git branch --show-current
```

Si no estás en `deploy-fix`, cámbiate:

```bash
git checkout deploy-fix
git pull deploy deploy-fix
```

## 2) Ejecutar chequeo de plataforma

```bash
cd server
npm run platform:check
```

El comando valida variables para:
- RAG (Supabase/OpenAI)
-- Traducción/multilenguaje
- CRM propio (CRM PRO)
- Meta Cloud API
- 360dialog
- Baileys
- Discord
- TikTok
- Live Chat

Si falta una variable, ese módulo no puede operar.

## 3) Chequeos específicos

### CRM propio (tablas + API)
```bash
cd server
node --check routes/crm.js services/crmProService.js
```

### RAG (estructura DB + RPC)
```bash
cd server
node check_rag_setup.js
```

## 4) Nota importante de tu incidente

En este entorno, la rama actual detectada fue `work` (no `deploy-fix`). Si tus correcciones están en `deploy-fix`, desplegar desde otra rama puede explicar por qué "no funciona nada" en producción.
