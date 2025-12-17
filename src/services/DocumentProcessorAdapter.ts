/**
 * Document Processor Adapter
 * Bridges the new IntelligentDocumentProcessor with the legacy DocumentProcessor interface
 * for backward compatibility
 */

import { IntelligentDocumentProcessor, ProcessedDocument as IDUProcessedDocument } from './IntelligentDocumentProcessor';
import { DocumentProcessor, ProcessedDocument as LegacyProcessedDocument } from './DocumentProcessor';

/**
 * Adapter that converts IDU output to legacy format
 * This allows the new system to work with existing code
 */
export class DocumentProcessorAdapter {
  private static instance: DocumentProcessorAdapter;
  private iduProcessor: IntelligentDocumentProcessor;
  private legacyProcessor: DocumentProcessor;

  private constructor() {
    this.iduProcessor = IntelligentDocumentProcessor.getInstance();
    this.legacyProcessor = DocumentProcessor.getInstance();
  }

  static getInstance(): DocumentProcessorAdapter {
    if (!DocumentProcessorAdapter.instance) {
      DocumentProcessorAdapter.instance = new DocumentProcessorAdapter();
    }
    return DocumentProcessorAdapter.instance;
  }

  /**
   * Process file with the new IDU system and return in legacy format
   */
  async processFile(file: File): Promise<LegacyProcessedDocument> {
    try {
      // Use new IDU system
      const iduResult = await this.iduProcessor.processDocument(file);

      // Convert to legacy format
      const legacyResult: LegacyProcessedDocument = {
        content: iduResult.raw.fullText,
        wordCount: iduResult.structure.metadata.wordCount,
        type: 'pdf',
        metadata: {
          // Legacy fields
          extractionQuality: this.mapQualityToLegacy(iduResult.quality.overall),
          fileSize: iduResult.structure.metadata.fileSize,
          pages: iduResult.structure.metadata.pageCount,

          // NEW: Enhanced data from IDU system
          title: iduResult.structure.title || undefined,
          authors: iduResult.structure.authors.length > 0 ? iduResult.structure.authors : undefined,
          abstract: iduResult.structure.abstract || undefined,
          keywords: iduResult.structure.keywords.length > 0 ? iduResult.structure.keywords : undefined,

          // Quality metrics
          qualityScore: iduResult.quality.overall,
          qualityBreakdown: {
            textExtraction: iduResult.quality.textExtraction,
            structureClarity: iduResult.quality.structureClarity,
            citationCompleteness: iduResult.quality.citationCompleteness,
            scientificRigor: iduResult.quality.scientificRigor,
            readability: iduResult.quality.readability
          },

          // Scientific metadata
          researchType: iduResult.semantics.researchType,
          methodology: iduResult.semantics.methodology,

          // Structure info
          sectionCount: iduResult.structure.sections.length,
          referenceCount: iduResult.structure.references.length,
          citationDensity: iduResult.stats.citationDensity,

          // Issues and recommendations
          issues: iduResult.quality.issues,
          recommendations: iduResult.quality.recommendations,

          // Full IDU result for advanced features
          _iduResult: iduResult
        }
      };

      console.log(`✅ IDU Adapter: Processed "${file.name}" - Quality: ${iduResult.quality.overall}/100`);

      return legacyResult;

    } catch (error) {
      console.warn('IDU processing failed, falling back to legacy processor:', error);

      // Fallback to legacy processor
      return await this.legacyProcessor.processFile(file);
    }
  }

  /**
   * Map IDU quality score (0-100) to legacy quality enum
   */
  private mapQualityToLegacy(score: number): 'full' | 'partial' | 'none' {
    if (score >= 80) return 'full';
    if (score >= 50) return 'partial';
    return 'none';
  }

  /**
   * Get full IDU result from legacy metadata (if available)
   */
  getIDUResult(legacyMetadata: any): IDUProcessedDocument | null {
    return legacyMetadata?._iduResult || null;
  }

  /**
   * Check if a document was processed with the IDU system
   */
  hasIDUData(legacyMetadata: any): boolean {
    return !!legacyMetadata?._iduResult;
  }
}

export default DocumentProcessorAdapter;
