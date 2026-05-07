const initiatorService = require('./initiatorProfileService');

/**
 * Context Assembler Service
 * Es el cerebro dinámico que construye el System Prompt final.
 */
class ContextAssembler {
    
    /**
     * Ensambla el prompt basado en la jerarquía BIC
     */
    async assemble(botConfig, message, history, metadata = {}) {
        const botId = botConfig.bot_id || botConfig.instanceId;
        
        // 1. Intentar obtener perfil BIC
        const bic = await initiatorService.getProfile(botId);
        
        // --- VALIDACIÓN DE PERFIL ---
        if (!bic) {
            return null; 
        }

        // 2. Construir Identidad (Capa A)
        let prompt = `Actúa como ${bic.bot_name}, un asistente experto en ${bic.business_type}.\n`;
        prompt += `Tu objetivo principal es: ${bic.main_goal}.\n`;
        prompt += `Propuesta de Valor: ${bic.value_prop}.\n`;
        prompt += `Tono de voz: ${bic.tone}.\n`;
        prompt += `CTA Principal: ${bic.primary_cta}.\n\n`;

        // 3. Reglas de Negocio (Persuasión ALEX Brain)
        prompt += `REGLAS DE CIERRE:\n`;
        prompt += `- Sé conciso (máximo 3 líneas).\n`;
        prompt += `- Solo una pregunta por mensaje.\n`;
        prompt += `- Guía siempre hacia el CTA: ${bic.primary_cta}.\n`;
        prompt += `- Si el usuario muestra interés, ofrece el link de acción inmediatamente.\n\n`;

        // 4. Capa de Idioma
        const lang = metadata.language || bic.base_language || 'es';
        prompt += `REGLA DE IDIOMA:\n`;
        prompt += `- Detecta el idioma del usuario.\n`;
        prompt += `- Responde siempre en el idioma del usuario.\n`;
        prompt += `- Idioma base configurado: ${lang}.\n\n`;

        return prompt;
    }

    /**
     * Shadow Mode: Compara el prompt nuevo contra el viejo para QA
     */
    async shadowCompare(legacyPrompt, newPrompt) {
        if (!newPrompt) return;
        // Aquí podríamos loguear el diff en una tabla de auditoría
        // console.log("BIC Shadow Audit: Prompts generados correctamente.");
    }
}

module.exports = new ContextAssembler();
