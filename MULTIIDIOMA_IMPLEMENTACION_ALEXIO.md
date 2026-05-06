# Implementación multi-idioma (ALEX IO)

## Cambios aplicados

1. **Detección de idioma mejorada en backend** (`alexBrain`):
   - Soporta `es`, `en`, `pt`, `fr`, `de`, `it` con heurísticas por señales lingüísticas.
   - Usa historial reciente (últimos 8 mensajes de usuario) para mayor estabilidad.
   - Permite idioma forzado por contexto (`metadata.language`, `metadata.userLanguage`, `botConfig.language`, `botConfig.default_language`).

2. **Idioma global por request**:
   - `chat()` ahora pasa `metadata` a `generateResponse()`.
   - `generateResponse()` resuelve idioma final en este orden de prioridad:
     1. `metadata.language`
     2. `metadata.userLanguage`
     3. `botConfig.language`
     4. `botConfig.default_language`
     5. auto-detección

3. **Respuesta nativa dinámica**:
   - Se mantiene la regla de prompt para responder en el idioma detectado y adaptarse al cambio de idioma del usuario.

## Recomendación operativa

- Persistir `user.language` por conversación en tu capa de sesión/tenant.
- Enviar ese valor en `metadata.language` en cada interacción.
- Mantener embeddings multilingües en RAG para no degradar recuperación en idiomas mixtos.

## Ejemplo payload recomendado

```json
{
  "message": "Hi, I need info",
  "metadata": {
    "language": "en",
    "tenantId": "...",
    "instanceId": "..."
  }
}
```

## Resultado esperado

- Si el usuario cambia de idioma en mitad de conversación, el motor puede adaptarse automáticamente.
- Si el frontend/dashboard ya conoce el idioma del usuario, puede forzarlo de forma determinista y evitar drift.
