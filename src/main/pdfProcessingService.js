/**
 * PDF Processing Service - Main Process
 *
 * Handles PDF extraction in the Main Process where Node.js modules work natively.
 * No Worker issues, full access to fs, zlib, etc.
 */

const pdfParse = require('pdf-parse');

console.log('📚 PDF Processing Service loaded in Main Process');

/**
 * Process PDF buffer and extract text + metadata
 * @param {Buffer} buffer - PDF file buffer
 * @returns {Promise<Object>} Extracted data with text, metadata, pages
 */
async function processPDF(buffer) {
  try {
    console.log(`📄 Processing PDF in Main Process (${buffer.length} bytes)...`);

    // Use pdf-parse v1.1.1 - works perfectly in Node.js Main Process
    const data = await pdfParse(buffer);

    const result = {
      text: data.text || '',
      numpages: data.numpages || 0,
      metadata: data.metadata || {},
      info: data.info || {},
      version: data.version || '',
    };

    console.log(`✅ PDF processed successfully: ${result.numpages} pages, ${result.text.length} chars`);

    return result;
  } catch (error) {
    console.error('❌ PDF processing error in Main Process:', error);
    throw new Error(`PDF processing failed: ${error.message}`);
  }
}

module.exports = {
  processPDF,
};
