# Informe técnico — AlexBrain / Cascada IA

**Fecha:** 2026-05-05 (UTC)

## Resumen ejecutivo

AlexBrain sí contiene integración Claude/Anthropic, pero antes de este ajuste quedaba poco visible en dos lugares operativos:

1. El readiness check no validaba `ANTHROPIC_API_KEY`.
2. El dashboard Super Admin mostraba Anthropic en estado de APIs, pero no lo nombraba como Claude y no lo incluía en el bloque de consumo por modelo del detalle de bot.

Además, la cascada intentaba llamar proveedores aunque no tuvieran key configurada. Eso no detenía el sistema porque el `catch` continuaba con el siguiente proveedor, pero generaba errores innecesarios, latencia y ruido en logs.

## Estado real encontrado en `server/services/alexBrain.js`

### Claude sí existe

- Routing constitucional para razonamiento profundo: `claude-3-5-sonnet-20241022` si `ANTHROPIC_API_KEY` existe.
- Cascada runtime: proveedor `claude` con `claude-3-haiku-20240307`.
- Auditoría de compliance: Claude Sonnet (`claude-3-5-sonnet-20241022`).

### Riesgos detectados

- `routeToModel()` y `getOrchestratorFallback()` existen, pero el flujo principal `generateResponse()` usa una cascada propia basada en `chooseModel()`.
- La cascada incluía `gemini`, `gpt`, `claude`, `deepseek`, `minimax` aunque faltaran keys.
- Si `ANTHROPIC_API_KEY` no existe, Claude fallaba por request inválido y recién después continuaba al siguiente modelo.

## Ajustes aplicados

1. Se añadió `isCascadeProviderReady(providerId)` para validar key + circuit breaker por proveedor antes de armar la cascada.
2. Se añadió `getCascadeModelOrder(preferredModel)` para devolver:
   - orden total,
   - proveedores disponibles,
   - proveedores omitidos.
3. `generateResponse()` ahora omite proveedores no configurados o caídos por circuit breaker antes de llamarlos.
4. `getAiDiagnostics()` ahora expone el orden de cascada disponible/omitido para casos corto/medio.
5. Readiness check ahora valida `ANTHROPIC_API_KEY`.
6. Super Admin ahora muestra `Claude / Anthropic` y agrega consumo Claude en detalle de bot.

## URL del dashboard Super Admin

Frontend:

```text
https://whatsapp-fullstack-ylsx.onrender.com/#/superadmin
```

Login Super Admin:

```text
https://whatsapp-fullstack-ylsx.onrender.com/#/superadmin-login
```

Endpoint directo de diagnóstico IA:

```text
https://whatsapp-fullstack-ylsx.onrender.com/api/diagnostics/ai
```

## Variables necesarias para cascada completa

```text
GEMINI_API_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
DEEPSEEK_API_KEY
MINIMAX_API_KEY
MINIMAX_GROUP_ID
```

## Conclusión

Claude no estaba ausente del backend, pero sí faltaba validación operativa y visibilidad clara. Con los cambios aplicados, Claude/Anthropic queda visible en readiness, diagnóstico API y Super Admin, y la cascada evita llamadas inútiles a proveedores sin key.
