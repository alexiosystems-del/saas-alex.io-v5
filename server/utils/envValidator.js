/**
 * EnvValidator
 * FASE 0: Asegura que el servidor no arranque en Producción si faltan variables críticas.
 */

function validateEnv() {
    // Si estamos en desarrollo, no forzamos todas las reglas estrictas (opcional)
    const isProd = process.env.NODE_ENV === 'production';

    const requiredKeys = [
        'SUPABASE_URL',
        'JWT_SECRET',
        'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
    ];

    if (isProd) {
        // En producción necesitamos explícitamente las claves de orígenes y acceso privilegiado
        requiredKeys.push('ALLOWED_ORIGINS');
        requiredKeys.push('SUPABASE_SERVICE_ROLE_KEY');
    }

    const missing = [];

    for (const key of requiredKeys) {
        if (!process.env[key] || process.env[key].trim() === '') {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        console.error('===========================================================');
        console.error('🚨 BOOT FAILURE: Faltan variables de entorno críticas.');
        console.error('El servidor no puede arrancar de forma segura (Phase 0 Hardening).');
        console.error('Agrega las siguientes variables en tu entorno/Render:');
        missing.forEach(m => console.error(`  - ${m}`));
        console.error('===========================================================');
        
        // Fail fast
        process.exit(1);
    }

    console.log('✅ [BOOT VALIDATION] Variables críticas verificadas con éxito.');
}

module.exports = { validateEnv };
