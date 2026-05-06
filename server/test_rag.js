require('dotenv').config();
const { ingestDocument } = require('./services/ragService');

async function testIngest() {
    console.log('--- TEST INGEST RAG ---');
    try {
        const result = await ingestDocument(
            'test_tenant',
            'test_instance',
            'test_file.txt',
            'Este es un contenido de prueba para verificar que el sistema RAG funciona correctamente.'
        );
        console.log('✅ Ingest Success:', result);
    } catch (err) {
        console.error('❌ Ingest Error:', err.message);
    }
    process.exit(0);
}

testIngest();
