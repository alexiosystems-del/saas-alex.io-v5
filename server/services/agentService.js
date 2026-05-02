// server/services/agentService.js
// Enterprise Autonomous Agents (Phase 5)

/**
 * Sales Agent: Decides business strategy for a lead
 */
async function salesAgent(leadData) {
    console.log(`🤖 [SalesAgent] Analizando lead: ${leadData.phone} (Score: ${leadData.score})`);
    
    if (leadData.score > 0.8) {
        return { action: 'offer_premium', message: "He detectado un gran interés. ¿Te gustaría ver una demo personalizada hoy mismo?" };
    } else if (leadData.score > 0.4) {
        return { action: 'nurturing', message: "Entiendo que estás explorando. Te envío este caso de éxito que podría ayudarte." };
    }
    
    return { action: 'wait', message: null };
}

/**
 * Optimizer Agent: Recommends model adjustments based on performance
 */
function optimizerAgent(cost, score) {
    if (cost > 0.05 && score > 0.8) {
        return { recommendation: 'switch_to_gemini', reason: 'High cost, high quality -> optimize margin' };
    }
    if (score < 0.6) {
        return { recommendation: 'use_gpt4_turbo', reason: 'Quality below threshold' };
    }
    return { recommendation: 'keep_current' };
}

/**
 * Expansion Agent: Detects new market opportunities
 */
function expansionAgent(language, location) {
    const markets = {
        'pt': 'Brasil / Portugal',
        'en': 'USA / UK / Global',
        'es': 'LATAM / España'
    };
    
    console.log(`🌍 [ExpansionAgent] Nuevo mercado detectado: ${markets[language] || 'Global'}`);
    return markets[language] || 'Global';
}

module.exports = { salesAgent, optimizerAgent, expansionAgent };
