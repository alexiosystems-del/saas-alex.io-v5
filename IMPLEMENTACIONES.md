# 🚀 PLAN DE IMPLEMENTACIONES: ALEX IO SAAS

Este documento centraliza el diagnóstico técnico, la hoja de ruta hacia un estándar SaaS Enterprise y el registro de los parches críticos aplicados.

---

## 1. 🔍 DIAGNÓSTICO: ESTÁNDAR SAAS DE PRIMER NIVEL
Para alcanzar la madurez operativa requerida para un SaaS serio, se han identificado los siguientes ejes de mejora prioritaria:

### 🛡️ Seguridad y Control de Acceso
*   **Estado**: Rutas expuestas directamente sin middleware de autenticación visible.
*   **Requerimiento**: Implementar JWT/RBAC por Tenant, Rate Limiting estricto (por IP/Tenant) y validación de esquemas con Zod en endpoints sensibles (`/connect`, pagos, webhooks).

### 💾 Persistencia de Negocio Completa
*   **Estado**: Dependencia de Maps en memoria para sesiones de WhatsApp.
*   **Requerimiento**: Migrar a un modelo de datos multi-tenant real en PostgreSQL/Supabase. Reconciliación automática de sesiones tras reinicios o despliegues.

### 💳 Facturación y Gestión Financiera
*   **Estado**: Flujo de checkout funcional pero sin capa de robustez (auditoría/antifraude).
*   **Requerimiento**: Sincronización source-of-truth entre Stripe y Supabase, gestión de idempotencia en transacciones y alertas de fallos en webhooks.

### 🧠 Confiabilidad de IA (SLO)
*   **Estado**: Fallback en código (Gemini -> OpenAI) pero sin control de costes ni cuotas.
*   **Requerimiento**: Implementar Circuit Breakers por proveedor, presupuestos mensuales por Tenant y políticas de degradación automática.

### 📊 Observabilidad y QA
*   **Estado**: Logs básicos.
*   **Requerimiento**: Integrar OpenTelemetry (tracing), Dashboards de latencia P99, y establecer un pipeline de CI con tests automatizados (Playwright/Supertest).

---

## 2. 🛠️ PARCHES CRÍTICOS APLICADOS (v2.0.4.11)

| Parche | Componente | Mejora Implementada |
| :--- | :--- | :--- |
| **01** | `Dashboard.js` | Sistema de Polling y recuperación de QR ante conexiones lentas. |
| **02** | `Pricing.js` | Integración del sistema de `fetchWithApiFallback`. |
| **03** | `api.js` | Localizador dinámico de Backend (Render/Vercel/Local) con reintento automático. |
| **04** | `supabaseClient.js` | Inicialización centralizada con Roles de Servicio para bypass de RLS en Backend. |
| **05** | `whatsappSaas.js` | Persistencia de estado de sesión en Supabase y lógica de reconexión (8 intentos). |

---

## 3. 🧠 MI VEREDICTO (Senior Analysis)
✅ **Cuestionario asistido por IA**: Es exactamente la solución correcta para el onboarding.
✅ **Estrategia de Negocio**: Wizard autoasistido + setup de pago opcional es el camino más eficiente para escalar.
✅ **Posicionamiento Técnico**: La base de proveedores y endpoints de configuración ya están listos para montar esta capa superior rápidamente.

---

## 4. 🌍 PROYECTO HISTÓRICO: PUENTES GLOBALES (8 Semanas Atrás)
Se ha identificado y reactivado el **Agente de Ventas Alex (v1.2)** como caso de uso para la SaaS.

### Funnel de Ventas Estratégico:
1.  **Filtro Técnico**: Cualificación inmediata del prospecto.
2.  **Brecha de Idioma**: Introducción de herramienta "TalkMe".
3.  **Filtro Invisible**: Auditoría ATS del currículum.
4.  **Cierre**: Agendamiento directo en Calendly para migración.

---

---

## 5. 🏗️ ARQUITECTURA HARDENED (v5.1)
Se ha implementado una arquitectura de inteligencia distribuida con **Circuit Breakers** y **Cuotas Proactivas**.

### Cascada de Inteligencia (SRE Ready)
1.  **Gemini 2.0 Flash**: Motor primario (Baja latencia).
2.  **MiniMax abab6.5s**: Primer fallback de alto rendimiento.
3.  **DeepSeek Chat**: Segundo fallback (Razonamiento).
4.  **OpenAI GPT-4o-mini**: Tercer fallback (Estabilidad).

### Gobernanza de Datos
- **Filtro de Seguridad**: Policy Engine determinístico (Prensa toxicidad y PII).
- **Aislamiento**: Middleware de Tenant forzado en todas las rutas de Base de Datos.
- **Idempotencia**: Registro de eventos de Stripe para evitar doble procesamiento.

---

## 6. 💳 DEFINICIÓN DE PLANES ENTERPRISE
Los planes han sido estandarizados y vinculados a los Circuit Breakers de IA.

| Plan | Precio | Bots | Mensajes/mes | Características |
| :--- | :--- | :--- | :--- | :--- |
| **STARTER** | $49 | 1 | 1,000 | IA Básica, WhatsApp Broadcast. |
| **PRO** | $149 | 5 | 10,000 | RAG, CRM Sync, Voice AI. |
| **ENTERPRISE** | $499 | 20 | 50,000 | Audit Logs, Redis Dedicado, Soporte Prioritario. |

---

## 📅 ROADMAP FINALIZADO (Fase 1 & 2)
*   [x] Seguridad Multi-tenant y Auth Middleware.
*   [x] Observabilidad SRE y Alerts (Slack/Discord).
*   [x] Resiliencia de Sesiones WhatsApp (Distributed Locking).
*   [x] Inteligencia en Cascada + MiniMax Integration.
*   [x] Facturación Idempotente y Quotas Hardened.
