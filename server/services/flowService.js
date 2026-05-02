// server/services/flowService.js
// Enterprise Conversation Engine (Phase 4)

async function executeFlow(flow, context) {
  let step = flow.start;
  console.log(`🌊 [FlowEngine] Iniciando flujo: ${flow.name} para ${context.phone}`);

  while (step) {
    try {
      switch (step.type) {
        case "message":
          // Lazy require to avoid circular dependencies
          const { getAdapter } = require('./adapterFactory');
          const adapter = getAdapter(context.botConfig, global.activeSessions);
          if (adapter) {
            await adapter.sendMessage(context.phone, step.content.text);
          }
          break;
        case "ai":
          const { generateResponse } = require('./alexBrain');
          const res = await generateResponse({ message: context.input, botConfig: context.botConfig });
          const adapterAI = require('./adapterFactory').getAdapter(context.botConfig, global.activeSessions);
          if (adapterAI) {
            await adapterAI.sendMessage(context.phone, res.text);
          }
          break;
        case "condition":
          step = evaluateCondition(step, context);
          continue;
      }
      step = step.next;
    } catch (err) {
      console.error(`❌ [FlowEngine] Error en paso ${step.type}:`, err.message);
      break;
    }
  }
}

function evaluateCondition(step, context) {
  const input = (context.input || '').toLowerCase();
  if (step.branches && step.branches[input]) {
    return step.branches[input];
  }
  return step.default;
}

module.exports = { executeFlow };
