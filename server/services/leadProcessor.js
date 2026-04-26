const { supabase } = require('./supabaseClient');
const OpenAI = require('openai');
const HubspotService = require('./hubspotService');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

/**
 * Analiza una conversación usando IA para extraer información de contacto e intención de compra.
 * @param {string} tenantId 
 * @param {string} instanceId 
 * @param {string} remoteJid 
 * @param {Array} messageHistory - Ej: [{ role: 'user', content: 'hola' }, ...]
 */
async function processLeadAsync(tenantId, instanceId, remoteJid, messageHistory) {
    if (!OPENAI_API_KEY) {
        console.warn('⚠️ [LeadProcessor] No OPENAI_API_KEY available. Skipping extraction.');
        return;
    }

    if (!supabase) {
        console.warn('⚠️ [LeadProcessor] Supabase no configurado. Skipping extraction.');
        return;
    }

    try {
        const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
        
        // Extraemos solo los últimos 10 mensajes para dar contexto al modelo
        const recentHistory = messageHistory.slice(-10).map(m => `${m.role}: ${m.content}`).join('\n');

        const systemPrompt = `
Eres un asistente de ventas experto analizando conversaciones de un chat. Tu objetivo es extraer la información clave del cliente y determinar su "Temperatura de Venta".
Analiza la siguiente conversación y extrae un JSON con este formato exacto:
{
  "is_lead": boolean (true si demostró interés real en un servicio o producto, false si solo saludó o es spam),
  "name": string (el nombre del cliente si lo mencionó, o "desconocido"),
  "email": string (el correo si lo mencionó, o null),
  "temperature": string ("HOT" si quiere comprar ya, "WARM" si tiene dudas pero está interesado, "COLD" si solo investiga o se queja),
  "summary": string (un resumen muy breve de 1 frase del interés del cliente)
}

Reglas: RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO.
        `;

        const response = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo', // Rápido y barato para extracción
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Conversación:\n${recentHistory}` }
            ],
            response_format: { type: "json_object" },
            temperature: 0.1
        });

        const extraction = JSON.parse(response.choices[0].message.content);
        console.log(`🤖 [LeadProcessor] Extracción IA para ${remoteJid}:`, JSON.stringify(extraction));

        // Calcular Lead Score básico (0-100)
        let score = 0;
        const temp = extraction.temperature || 'COLD';
        if (temp === 'HOT') score = 100;
        else if (temp === 'WARM') score = 60;
        else score = 20;
        
        if (!extraction.is_lead) score = Math.max(0, score - 50);

        // 1. Guardar en Supabase para analíticas internas
        const { error } = await supabase.from('leads').upsert({
            tenant_id: tenantId,
            instance_id: instanceId,
            remote_jid: remoteJid,
            is_lead: extraction.is_lead || false,
            name: extraction.name || 'desconocido',
            email: extraction.email || null,
            temperature: temp,
            score: score, // Añadimos score para el dashboard
            summary: extraction.summary || 'Sin interés claro detectado.',
            updated_at: new Date().toISOString()
        }, { onConflict: 'instance_id, remote_jid' });

        if (error) {
            console.error('❌ [LeadProcessor] Supabase Error:', error.message);
        } else {
            console.log(`🔥 [LeadProcessor] Lead analizado [Score: ${score}]: ${remoteJid}`);
        }

        // 2. Sincronizar con HubSpot si el bot tiene token configurado
        try {
            const { decrypt } = require('../utils/encryptionHelper');
            const sessionsTable = process.env.SUPABASE_SESSIONS_TABLE || 'whatsapp_sessions';

            // Obtener configuración de la instancia (token de HubSpot encriptado)
            const { data: session } = await supabase
                .from(sessionsTable)
                .select('credentials_encrypted')
                .eq('instance_id', instanceId)
                .single();

            let hubspotToken = null;
            if (session && session.credentials_encrypted) {
                try {
                    const decrypted = JSON.parse(decrypt(session.credentials_encrypted));
                    hubspotToken = decrypted.hubspotAccessToken;
                } catch (e) {
                    console.error('❌ [LeadProcessor] Decryption Error:', e.message);
                }
            }

            if (hubspotToken) {
                console.log(`📡 [HubSpot] Iniciando sincronización para ${remoteJid}...`);
                const phone = (remoteJid || '').split('@')[0];
                
                // Enriquecer el resumen con el score para HubSpot
                const enrichedLead = {
                    ...extraction,
                    summary: `[SCORE: ${score}] - ${extraction.summary}`
                };

                const res = await HubspotService.syncContact(phone, enrichedLead, hubspotToken);
                if (res) console.log(`✅ [HubSpot] Sincronización exitosa para ${phone} (Score: ${score})`);
                else console.warn(`⚠️ [HubSpot] Sincronización falló (posible token inválido o error en API)`);
            } else {
                console.log(`ℹ️ [LeadProcessor] No se encontró hubspotAccessToken para ${instanceId}.`);
            }
        } catch (hubError) {
            console.error('⚠️ [LeadProcessor] Hubspot Sync Error:', hubError.message);
        }

    } catch (e) {
        console.error('❌ [LeadProcessor] Error en análisis:', e.message);
    }
}

module.exports = { processLeadAsync };
