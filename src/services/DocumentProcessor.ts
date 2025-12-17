/**
 * DocumentProcessor - PDF and Document Processing Service
 *
 * Uses pdfjs-dist for reliable PDF text extraction in the renderer process.
 * Ported from evidenra-professional v1 (working version).
 * FORCE REBUILD: Worker disabled for Electron
 */

import pdfParse from './pdfParseIPC';

// Using IPC to Main Process for PDF processing (no Worker issues!)
// Main Process has full Node.js access, pdf-parse works natively there
console.log('📚 Using IPC-based PDF processing (Main Process - Legacy Processor)');

export interface ProcessedDocument {
  content: string;
  wordCount: number;
  type: string;
  metadata?: any;
}

export class DocumentProcessor {
  private static instance: DocumentProcessor;

  private constructor() {
    // Singleton
  }

  static getInstance(): DocumentProcessor {
    if (!DocumentProcessor.instance) {
      DocumentProcessor.instance = new DocumentProcessor();
    }
    return DocumentProcessor.instance;
  }

  async processFile(file: File): Promise<ProcessedDocument> {
    const fileType = file.type || file.name.split('.').pop()?.toLowerCase() || '';

    if (fileType.includes('pdf') || file.name.endsWith('.pdf')) {
      return await this.processPDF(file);
    } else if (fileType.includes('docx') || file.name.endsWith('.docx')) {
      return await this.processDOCX(file);
    } else if (fileType.includes('json') || file.name.endsWith('.json')) {
      return await this.processJSON(file);
    } else if (fileType.includes('csv') || file.name.endsWith('.csv')) {
      return await this.processCSV(file);
    } else {
      return await this.processText(file);
    }
  }

  async processPDF(file: File): Promise<ProcessedDocument> {
    // Use pdf-parse directly - no fallback needed
    return await this.processPDFWithPdfParse(file);
  }

  async processPDFWithPdfParse(file: File): Promise<ProcessedDocument> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Use IPC-based PDF processing via Main Process
          const data = await pdfParse(arrayBuffer);

          // Extract text - pdf-parse v1.1.1 returns full text
          const fullText = data.text || '';

          const metadata = {
            pages: data.numpages || 0,
            extractionQuality: 'full' as string,
            fileSize: file.size,
            // pdf-parse v1.1.1 metadata
            title: data.metadata?.title || data.info?.Title || '',
            author: data.metadata?.author || data.info?.Author || '',
            subject: data.metadata?.subject || data.info?.Subject || '',
            keywords: data.metadata?.keywords || data.info?.Keywords || '',
            creator: data.metadata?.creator || data.info?.Creator || '',
            producer: data.metadata?.producer || data.info?.Producer || '',
            creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : null,
            modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : null
          };

          // Validate extraction
          if (fullText.length < 50) {
            resolve({
              content: `⚠️ PDF Processing Notice for "${file.name}":

The PDF appears to be:
• Empty or contains minimal text
• Image-based (scanned document)
• Password protected
• Corrupted

Solutions:
1. For scanned PDFs: Use OCR software first
2. For protected PDFs: Remove password protection
3. For corrupted files: Try repairing the PDF

File Details:
• Pages: ${metadata.pages}
• Size: ${(file.size / 1024).toFixed(1)} KB`,
              wordCount: 0,
              type: 'pdf',
              metadata: {
                ...metadata,
                extractionQuality: 'none'
              }
            });
            return;
          }

          resolve({
            content: fullText,
            wordCount: fullText.split(/\s+/).filter(w => w.length > 0).length,
            type: 'pdf',
            metadata
          });

        } catch (error: any) {
          console.error('pdf-parse processing error:', error);
          reject(new Error(`PDF processing failed: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  async processDOCX(file: File): Promise<ProcessedDocument> {
    // Simple DOCX processing (placeholder - can be enhanced with mammoth.js)
    return {
      content: `DOCX processing not fully implemented yet for "${file.name}". Please convert to PDF or TXT.`,
      wordCount: 0,
      type: 'docx',
      metadata: { fileSize: file.size }
    };
  }

  async processJSON(file: File): Promise<ProcessedDocument> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const parsed = JSON.parse(content);
          const text = JSON.stringify(parsed, null, 2);

          resolve({
            content: text,
            wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
            type: 'json',
            metadata: { fileSize: file.size }
          });
        } catch (error: any) {
          reject(new Error(`JSON parsing failed: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read JSON file'));
      reader.readAsText(file);
    });
  }

  async processCSV(file: File): Promise<ProcessedDocument> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          resolve({
            content,
            wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
            type: 'csv',
            metadata: { fileSize: file.size }
          });
        } catch (error: any) {
          reject(new Error(`CSV processing failed: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  }

  async processText(file: File): Promise<ProcessedDocument> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;

          resolve({
            content,
            wordCount: content.split(/\s+/).filter(w => w.length > 0).length,
            type: 'text',
            metadata: { fileSize: file.size }
          });
        } catch (error: any) {
          reject(new Error(`Text processing failed: ${error.message}`));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }
}

export default DocumentProcessor;
