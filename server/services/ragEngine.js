/**
 * RAG ENGINE
 */
const { aiRouter } = require('./aiRouter');

async function vectorSearch(question) {
    // Mock vector search
    return [
        { content: "Información relevante sobre el negocio." },
        { content: "Horarios de atención: 9am a 6pm." }
    ];
}

async function rag(question) {
    const docs = await vectorSearch(question);
    const context = docs.map(d => d.content).join("\n");

    const prompt = `Context:\n${context}\n\nUser:\n${question}`;
    return aiRouter(prompt);
}

module.exports = { rag, vectorSearch };
