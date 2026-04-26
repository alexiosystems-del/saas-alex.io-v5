const { PDFParse } = require('pdf-parse');

async function extractTextFromPDF(buffer) {
    let parser = null;
    try {
        parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        // Basic cleanup: remove excessive whitespace
        return (data.text || '').replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.error('Error parsing PDF:', error);
        throw new Error('Failed to extract text from PDF');
    } finally {
        if (parser) {
            await parser.destroy().catch(() => null);
        }
    }
}

module.exports = { extractTextFromPDF };
