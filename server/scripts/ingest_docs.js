/**
 * ingest_docs.js — Script para subir las guías de configuración al sistema RAG
 * 
 * Uso: node server/scripts/ingest_docs.js
 * 
 * Requiere:
 * - OPENAI_API_KEY (para generar embeddings)
 * - SUPABASE_URL + SUPABASE_SERVICE_KEY (para guardar en document_chunks)
 * 
 * Los documentos se suben al tenant_superadmin para que estén disponibles globalmente.
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const { ingestDocument, deleteDocument } = require('../services/ragService');

const TENANT_ID = 'tenant_superadmin';
const INSTANCE_ID = 'global_docs'; // Accesible para todas las instancias

const DOCS = [
    {
        file: path.join(__dirname, '..', '..', 'docs', 'manychat_blueprint.md'),
        name: 'Guía de Configuración ManyChat (Instagram/Facebook)'
    },
    {
        file: path.join(__dirname, '..', '..', 'docs', 'tiktok_setup.md'),
        name: 'Guía de Configuración TikTok'
    },
    {
        file: path.join(__dirname, '..', '..', 'docs', 'discord_setup.md'),
        name: 'Guía de Configuración Discord'
    }
];

async function main() {
    console.log('📚 Iniciando ingesta de documentación al sistema RAG...\n');

    for (const doc of DOCS) {
        try {
            // 1. Leer el archivo
            if (!fs.existsSync(doc.file)) {
                console.error(`❌ Archivo no encontrado: ${doc.file}`);
                continue;
            }
            const text = fs.readFileSync(doc.file, 'utf-8');
            console.log(`📄 Procesando: ${doc.name} (${text.length} caracteres)`);

            // 2. Borrar versión anterior (si existe)
            try {
                await deleteDocument(TENANT_ID, INSTANCE_ID, doc.name);
                console.log(`   🗑️  Versión anterior eliminada`);
            } catch { /* no existía */ }

            // 3. Ingestar (chunking + embeddings + guardado)
            const result = await ingestDocument(TENANT_ID, INSTANCE_ID, doc.name, text);
            console.log(`   ✅ ${result.savedChunks}/${result.totalChunks} chunks guardados\n`);

        } catch (err) {
            console.error(`❌ Error procesando ${doc.name}:`, err.message);
        }
    }

    console.log('🎉 Ingesta completada. Las guías están disponibles para la IA.');
    process.exit(0);
}

main().catch(err => {
    console.error('💥 Error fatal:', err);
    process.exit(1);
});
