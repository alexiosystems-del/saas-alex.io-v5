const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const { logInfo, logError } = require('../utils/logger');

class CentralLogger {
    static async log(level, source, message, metadata = {}) {
        const logEntry = {
            level,
            source,
            message,
            metadata: JSON.stringify(metadata),
            created_at: new Date().toISOString()
        };

        // Output al stdout siempre
        if (level === 'error') logError(`[${source}] ${message}`, metadata);
        else logInfo(`[${source}] ${message}`, metadata);

        // Envío asíncrono a Supabase si está habilitado
        if (isSupabaseEnabled) {
            // Se asume que existe la tabla 'system_logs' o similar. 
            // Si no, podríamos enviarlo vía RPC o a una API de observabilidad como DataDog/NewRelic
            supabase.from('system_logs').insert(logEntry).catch(e => {
                // Silently ignore DB log failures to avoid loops
                // console.warn('Failed to centralize log:', e.message);
            });
        }
    }

    static info(source, message, metadata) {
        return this.log('info', source, message, metadata);
    }

    static error(source, message, metadata) {
        return this.log('error', source, message, metadata);
    }

    static warn(source, message, metadata) {
        return this.log('warn', source, message, metadata);
    }
}

module.exports = CentralLogger;
