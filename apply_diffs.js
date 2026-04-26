const fs = require('fs');

// --- Docs ---
let plan = fs.readFileSync('docs/PLAN_MULTICANAL_ENTERPRISE_V1.md', 'utf8');
plan = plan.replace('## Sprint 4 — Discord + Reddit [✅ COMPLETADO]', '## Sprint 4 — Discord + Reddit + ManyChat [✅ COMPLETADO]');
plan = plan.replace('- [x] Adapters `discordAdapter.js`, `discordAPI.js` y `redditAPI.js` implementados.', '- [x] Adapters `discordAdapter.js`, `discordAPI.js`, `redditAPI.js` y puente `manychatAPI.js` implementados.');
plan = plan.replace('**Exit criteria:** roundtrip estable para Discord y Reddit. [Alcanzado]', '**Exit criteria:** roundtrip estable para Discord, Reddit y ManyChat. [Alcanzado]');
plan = plan.replace('## Sprint 5 — SRE Hardening & Observability V1 [✅ COMPLETADO]', '## Sprint 5 — SRE Hardening & Observability V1 [🚧 EN PROGRESO]');
plan = plan.replace('- [x] Control in-memory de latencias y SLAs por canal (`GET /metrics/:instance_id/:channel`).', '- [ ] Control in-memory de latencias y SLAs por canal (`GET /metrics/:instance_id/:channel`).');
plan = plan.replace('- [x] `server/services/observability.js` implementado para trackear de forma granular eventos (inbound, outbound, success, errors) embebido en `messageRouter`.', '- [ ] `server/services/observability.js` para trackear de forma granular eventos (inbound, outbound, success, errors) embebido en `messageRouter`.');
plan = plan.replace('- [x] `server/utils/pager.js` configurado dinámicamente (`PAGER_PROVIDER`) para enrutar incidencias a Slack o Discord.', '- [ ] `server/utils/pager.js` configurado dinámicamente (`PAGER_PROVIDER`) para enrutar incidencias a Slack o Discord.');
plan = plan.replace('- [x] Cierre de Bloqueantes críticos: Implementación final de `whatsapp_auth_state` (persistencia Baileys) y constrain única estricta de `prompt_versiones`.', '- [ ] Cierre de bloqueantes críticos: implementación final de `whatsapp_auth_state` (persistencia Baileys) y constraint única estricta de `prompt_versiones`.');
plan = plan.replace('**Exit criteria:** SLO por canal monitoreado 100% y migraciones críticas consolidadas. [Alcanzado]', '**Exit criteria:** SLO por canal monitoreado 100% y migraciones críticas consolidadas. [Pendiente]');

if (!plan.includes('¿Qué falta para una SaaS “unicornio”')) {
    plan += `\n\n---\n\n## 8) ¿Qué falta para una SaaS “unicornio” (enfoque ejecutable)?\n\nPara pasar de producto sólido a escala unicornio, faltan 5 frentes de ejecución estricta:\n\n1. **Go-To-Market repetible (no solo producto)**\n   - Definir 1 ICP prioritario (ej. clínicas high-ticket o e-commerce mid-market).\n   - Cerrar playbook de adquisición por canal (paid + partners + outbound).\n   - Medir CAC payback por cohorte mensual (objetivo < 6 meses).\n\n2. **Retención y expansión (motor financiero real)**\n   - Instrumentar métricas de retención por logo y por ingreso (GRR/NRR).\n   - Diseñar expansión por add-ons enterprise (SRE, compliance, voice, seats).\n   - Objetivo de referencia: NRR > 120% y churn logo enterprise < 2% mensual.\n\n3. **Confiabilidad enterprise certificable**\n   - SLO por canal con error budget y runbooks operativos por severidad.\n   - On-call formal 24/7 con postmortems y acciones correctivas trazables.\n   - Hardening de seguridad: cifrado end-to-end de secretos, rotación de credenciales y auditoría.\n\n4. **Gobernanza de datos e IA (riesgo controlado)**\n   - Evaluaciones automáticas de calidad de respuesta (precision/helpfulness/hallucination).\n   - Guardrails por industria (médico/legal/financiero) con políticas por tenant.\n   - Compliance objetivo: SOC 2 Type II + GDPR/CCPA según mercado.\n\n5. **Disciplina de escala y capital**\n   - Forecast financiero de 24 meses con escenarios base/agresivo/conservador.\n   - Unit economics saludables: margen bruto SaaS > 75% y burn multiple competitivo.\n   - Cadencia mensual de Board KPIs: ARR, NRR, CAC payback, churn, uptime, incidentes críticos.\n\n**Definición operativa de “listo para escalar agresivo”:** crecimiento sostenido > 10% MoM, NRR > 120%, uptime >= 99.9%, y playbook comercial replicable en al menos 2 verticales.\n`;
}
fs.writeFileSync('docs/PLAN_MULTICANAL_ENTERPRISE_V1.md', plan);

// --- webhooks-multi.js ---
let webhooks = fs.readFileSync('server/routes/webhooks-multi.js', 'utf8');
webhooks = webhooks.replace(
    /const stdMessage = messageRouterModule\.createStandardizedMessage\('web', senderId, text, metadata\);/g,
    `const enrichedMetadata = {
            ...(metadata || {}),
            instanceId: metadata?.instanceId || metadata?.instance_id || req.query.instanceId || req.body.instanceId || 'multi_web_default'
        };
        const stdMessage = messageRouterModule.createStandardizedMessage('web', senderId, text, enrichedMetadata);`
);
webhooks = webhooks.replace(
    /const resolvedId = await resolveInstanceId\('messenger', pageId\);/g,
    `const resolvedId = await resolveInstanceId('messenger', pageId);\n                const fallbackInstanceId = req.query.instanceId || req.body?.instanceId;`
);
webhooks = webhooks.replace(
    /\{ instanceId: resolvedId \|\| 'multi_messenger_default', pageId \}/g,
    `{ instanceId: resolvedId || fallbackInstanceId || 'multi_messenger_default', pageId }`
);
webhooks = webhooks.replace(
    /const resolvedId = await resolveInstanceId\('instagram', igId\);/g,
    `const resolvedId = await resolveInstanceId('instagram', igId);\n                const fallbackInstanceId = req.query.instanceId || req.body?.instanceId;`
);
webhooks = webhooks.replace(
    /\{ instanceId: resolvedId \|\| 'multi_instagram_default', pageId: igId \}/g,
    `{ instanceId: resolvedId || fallbackInstanceId || 'multi_instagram_default', pageId: igId }`
);
fs.writeFileSync('server/routes/webhooks-multi.js', webhooks);

// --- messageRouter.js ---
let router = fs.readFileSync('server/services/messageRouter.js', 'utf8');
if (!router.includes('const detectUserLanguage')) {
    router = router.replace(
        /const handleIncomingMessage = async/g,
        `const detectUserLanguage = (text = '') => {
    const sample = String(text || '').trim();
    if (!sample) return 'es';
    if (/[¿¡]|(?:\\b(hola|gracias|por favor|necesito|quiero|ayuda|precio|campaña)\\b)/i.test(sample)) return 'es';
    return 'en';
};

const handleIncomingMessage = async`
    );
}
router = router.replace(
    /const instanceId = msg\.metadata\?\.instanceId \|\| `multi_\$\{msg\.platform\}_\$\{msg\.metadata\?\.pageId \|\| msg\.senderId\}`;/g,
    `const instanceId = msg.metadata?.instanceId || msg.metadata?.instance_id || msg.metadata?.botId || \`multi_\${msg.platform}_\${msg.metadata?.pageId || msg.senderId}\`;
    const userLang = detectUserLanguage(msg.text);`
);
router = router.replace(
    /system_prompt: 'Eres ALEX IO, asistente virtual inteligente\. Estás respondiendo desde ' \+ msg\.platform,/g,
    `system_prompt: \`Eres ALEX IO, asistente virtual inteligente. Estás respondiendo desde \${msg.platform}. Responde SIEMPRE en el idioma del usuario. Si el usuario escribe en inglés, responde en inglés. Si escribe en español, responde en español.\`,`
);
router = router.replace(
    /const fallback = 'Lo siento, estoy teniendo problemas técnicos en este momento\.';/g,
    `const fallback = userLang === 'en'
            ? 'Sorry, I am having a temporary technical issue. Please try again in a moment.'
            : 'Lo siento, estoy teniendo problemas técnicos en este momento. Inténtalo nuevamente en unos segundos.';`
);
fs.writeFileSync('server/services/messageRouter.js', router);

// --- whatsappSaas.js ---
let saas = fs.readFileSync('server/services/whatsappSaas.js', 'utf8');
saas = saas.replace(
    /dialogApiKey: session\.dialog_api_key\n\s*};\n\s*}\n\s*\} catch \(_\) \{ \}/g,
    `dialogApiKey: session.dialog_api_key,
                        credentials: {
                            apiUrl: session.meta_api_url,
                            phoneNumberId: session.meta_phone_number_id,
                            accessToken: session.meta_access_token,
                            dialogApiKey: session.dialog_api_key
                        }
                    };
                }
            } catch (_) { }`
);
saas = saas.replace(
    /provider: session\.provider \|\| 'baileys',/g,
    `instanceId: session.instance_id,
                        provider: session.provider || 'baileys',`
);
saas = saas.replace(
    /config = JSON\.parse\(fs\.readFileSync\(configPath, 'utf8'\)\);\n\s*\} else \{/g,
    `config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
                if (!config.instanceId) config.instanceId = instanceId;
            } else {`
);
saas = saas.replace(
    /\/\/ Asignar el envío asíncronamente en background/g,
    `if (!config.instanceId) config.instanceId = instanceId;

        // Asignar el envío asíncronamente en background`
);
fs.writeFileSync('server/services/whatsappSaas.js', saas);

console.log('Patch success!');
