// server/services/automationService.js
// Enterprise Automation Engine (Phase 4)
const { executeFlow } = require('./flowService');

function triggerAutomation(eventType, context) {
  const rules = {
    new_lead: "welcome_flow",
    no_reply_24h: "followup_flow",
    high_intent: "sales_flow"
  };

  const flowName = rules[eventType];
  if (flowName) {
    console.log(`⚡ [Automation] Trigger: ${eventType} -> Ejecutando ${flowName}`);
    // In production, flows would be loaded from Supabase/Postgres
    // For now, we provide the hook for orchestration
  }
}

module.exports = { triggerAutomation };
