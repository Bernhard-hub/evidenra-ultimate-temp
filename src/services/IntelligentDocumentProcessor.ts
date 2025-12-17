/**
 * 🚀 INTELLIGENT DOCUMENT UNDERSTANDING (IDU) SYSTEM
 *
 * Revolutionary 6-Layer Document Processing Architecture
 * Designed for EVIDENRA Professional - World-Class Research Analysis
 *
 * Layers:
 * 1. Physical Extraction - Raw data with position, format, style
 * 2. Structural Analysis - Document hierarchy and organization
 * 3. Semantic Segmentation - Scientific sections identification
 * 4. Entity Recognition - Citations, authors, data, keywords
 * 5. Quality Assessment - Completeness, readability, scientific rigor
 * 6. Knowledge Graph - Relationships between concepts
 */

import pdfParse from './pdfParseIPC';

// Using IPC to Main Process for PDF processing (no Worker issues!)
// Main Process has full Node.js access, pdf-parse works natively there
console.log('📚 Using IPC-based PDF processing (Main Process)');

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface TextElement {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  isBold: boolean;
  isItalic: boolean;
  page: number;
}

export interface DocumentStructure {
  title: string | null;
  authors: string[];
  abstract: string | null;
  sections: Section[];
  references: Reference[];
  keywords: string[];
  metadata: DocumentMetadata;
}

export interface Section {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  level: number;
  startPage: number;
  endPage: number;
  paragraphs: Paragraph[];
  citations: Citation[];
  confidence: number;
}

export type SectionType =
  | 'title'
  | 'abstract'
  | 'introduction'
  | 'literature_review'
  | 'methodology'
  | 'results'
  | 'discussion'
  | 'conclusion'
  | 'references'
  | 'appendix'
  | 'unknown';

export interface Paragraph {
  text: string;
  startIndex: number;
  endIndex: number;
  sentenceCount: number;
  citations: Citation[];
}

export interface Citation {
  text: string;
  authors: string[];
  year: number | null;
  type: 'inline' | 'footnote' | 'endnote';
  position: number;
  isValid: boolean;
  referenceId: string | null;
}

export interface Reference {
  id: string;
  fullText: string;
  authors: string[];
  year: number | null;
  title: string | null;
  journal: string | null;
  doi: string | null;
  url: string | null;
  confidence: number;
}

export interface DocumentMetadata {
  fileName: string;
  fileSize: number;
  pageCount: number;
  wordCount: number;
  charCount: number;
  extractionDate: Date;
  processingTime: number;
  qualityScore: QualityScore;
  pdfMetadata?: any;
}

export interface QualityScore {
  overall: number; // 0-100
  textExtraction: number; // How well text was extracted
  structureClarity: number; // How clear the structure is
  citationCompleteness: number; // How complete citations are
  scientificRigor: number; // How scientific the document appears
  readability: number; // How readable the text is
  issues: string[];
  recommendations: string[];
}

export interface ProcessedDocument {
  raw: {
    fullText: string;
    elements: TextElement[];
    pageTexts: string[];
  };
  structure: DocumentStructure;
  quality: QualityScore;
  semantics: {
    mainTopics: string[];
    researchType: string;
    methodology: string[];
    findings: string[];
    limitations: string[];
  };
  stats: {
    avgWordsPerSentence: number;
    avgSentencesPerParagraph: number;
    citationDensity: number; // Citations per 1000 words
    sectionBalance: { [key: string]: number }; // Percentage per section
  };
}

// ============================================================================
// MAIN PROCESSOR CLASS
// ============================================================================

export class IntelligentDocumentProcessor {
  private static instance: IntelligentDocumentProcessor;

  private constructor() {}

  static getInstance(): IntelligentDocumentProcessor {
    if (!IntelligentDocumentProcessor.instance) {
      IntelligentDocumentProcessor.instance = new IntelligentDocumentProcessor();
    }
    return IntelligentDocumentProcessor.instance;
  }

  // ============================================================================
  // LAYER 1: PHYSICAL EXTRACTION
  // ============================================================================

  async processDocument(file: File): Promise<ProcessedDocument> {
    const startTime = Date.now();
    console.log(`🚀 IDU: Processing document "${file.name}"...`);

    try {
      // Layer 1: Physical Extraction
      const physicalData = await this.extractPhysicalData(file);
      console.log(`✅ Layer 1: Extracted ${physicalData.elements.length} text elements from ${physicalData.pageTexts.length} pages`);

      // Layer 2: Structural Analysis
      const structure = await this.analyzeStructure(physicalData);
      console.log(`✅ Layer 2: Identified ${structure.sections.length} sections`);

      // Layer 3: Semantic Segmentation
      const semantics = await this.performSemanticSegmentation(structure, physicalData);
      console.log(`✅ Layer 3: Extracted semantics - ${semantics.mainTopics.length} main topics`);

      // Layer 4: Entity Recognition (Citations, etc.)
      await this.recognizeEntities(structure, physicalData);
      console.log(`✅ Layer 4: Found ${structure.references.length} references`);

      // Layer 5: Quality Assessment
      const quality = await this.assessQuality(structure, physicalData);
      console.log(`✅ Layer 5: Quality score ${quality.overall}/100`);

      // Layer 6: Statistical Analysis
      const stats = this.calculateStatistics(structure, physicalData);

      const processingTime = Date.now() - startTime;

      const result: ProcessedDocument = {
        raw: {
          fullText: physicalData.fullText,
          elements: physicalData.elements,
          pageTexts: physicalData.pageTexts
        },
        structure: {
          ...structure,
          metadata: {
            ...structure.metadata,
            processingTime,
            extractionDate: new Date()
          }
        },
        quality,
        semantics,
        stats
      };

      console.log(`🎉 IDU: Document processed in ${processingTime}ms - Quality: ${quality.overall}/100`);

      return result;

    } catch (error) {
      console.error('❌ IDU: Document processing failed:', error);
      throw error;
    }
  }

  private async extractPhysicalData(file: File): Promise<{
    fullText: string;
    elements: TextElement[];
    pageTexts: string[];
    pdfMetadata: any;
  }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;

          // Use IPC-based PDF processing via Main Process
          const data = await pdfParse(arrayBuffer);

          // Extract text - pdf-parse v1.1.1 returns full text
          const fullText = data.text || '';
          const elements: TextElement[] = [];
          const pageTexts: string[] = [];

          // Get PDF metadata from pdf-parse v1.1.1
          const pdfMetadata = data.metadata || {};

          // Get page count from data
          const pageCount = data.numpages || 1;

          // Split text into estimated pages based on form feeds or length
          const textByPage = this.splitTextIntoPages(fullText, pageCount);

          // Create simplified TextElement objects from the text
          // Note: pdf-parse doesn't provide positioning data, so we create text-based elements
          let yPosition = 0;
          let currentPage = 1;

          for (const pageText of textByPage) {
            pageTexts.push(pageText);

            // Split page into sentences/paragraphs to create elements
            const lines = pageText.split('\n');

            lines.forEach((line, lineIndex) => {
              if (!line.trim()) return;

              // Create a simplified text element
              // Without PDF.js positioning, we estimate based on text analysis
              const element: TextElement = {
                text: line,
                x: 0, // No position data available from pdf-parse
                y: yPosition + (lineIndex * 12), // Estimated line height
                width: line.length * 6, // Estimated character width
                height: 12, // Estimated line height
                fontSize: this.estimateFontSize(line), // Heuristic based on text
                fontName: 'unknown',
                isBold: this.detectBold(line), // Simple heuristic
                isItalic: false,
                page: currentPage
              };

              elements.push(element);
            });

            yPosition += lines.length * 12;
            currentPage++;
          }

          console.log(`✅ Layer 1: Extracted ${elements.length} text elements from ${pageCount} pages`);

          resolve({
            fullText: fullText.trim(),
            elements,
            pageTexts,
            pdfMetadata
          });

        } catch (error) {
          console.error('pdf-parse extraction failed:', error);
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read PDF file'));
      reader.readAsArrayBuffer(file);
    });
  }

  // Helper: Split text into estimated pages
  private splitTextIntoPages(text: string, pageCount: number): string[] {
    // Try to split by form feed characters first
    if (text.includes('\f')) {
      return text.split('\f').filter(p => p.trim());
    }

    // Otherwise, split evenly by length
    const avgCharsPerPage = Math.ceil(text.length / pageCount);
    const pages: string[] = [];

    for (let i = 0; i < pageCount; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min(start + avgCharsPerPage, text.length);
      const pageText = text.substring(start, end);
      if (pageText.trim()) {
        pages.push(pageText);
      }
    }

    return pages.length > 0 ? pages : [text];
  }

  // Helper: Estimate font size based on text characteristics
  private estimateFontSize(text: string): number {
    // Heuristic: ALL CAPS or short lines might be headers (larger font)
    if (text === text.toUpperCase() && text.length < 50) {
      return 16;
    }
    // Check for common header patterns
    if (/^(Abstract|Introduction|Conclusion|References|Methods|Results|Discussion)/i.test(text)) {
      return 14;
    }
    // Default body text
    return 11;
  }

  // Helper: Detect bold text (simple heuristic)
  private detectBold(text: string): boolean {
    // Heuristic: Headers, section titles are often bold
    return /^(Abstract|Introduction|Conclusion|References|Methods|Results|Discussion|\d+\.|Chapter|Section)/i.test(text);
  }

  // ============================================================================
  // LAYER 2: STRUCTURAL ANALYSIS
  // ============================================================================

  private async analyzeStructure(physicalData: {
    fullText: string;
    elements: TextElement[];
    pageTexts: string[];
    pdfMetadata: any;
  }): Promise<DocumentStructure> {

    // Find title (usually largest font on first page)
    const title = this.extractTitle(physicalData.elements);

    // Find authors (usually below title)
    const authors = this.extractAuthors(physicalData.elements);

    // Find sections by analyzing font sizes and keywords
    const sections = this.extractSections(physicalData.elements, physicalData.fullText);

    // Find abstract
    const abstractSection = sections.find(s => s.type === 'abstract');
    const abstract = abstractSection?.content || null;

    // Find references section
    const referencesSection = sections.find(s => s.type === 'references');
    const references = referencesSection ? this.parseReferences(referencesSection.content) : [];

    // Extract keywords (from abstract or keyword section)
    const keywords = this.extractKeywords(abstract || physicalData.fullText.substring(0, 2000));

    const metadata: DocumentMetadata = {
      fileName: '',
      fileSize: 0,
      pageCount: physicalData.pageTexts.length,
      wordCount: physicalData.fullText.split(/\s+/).length,
      charCount: physicalData.fullText.length,
      extractionDate: new Date(),
      processingTime: 0,
      qualityScore: {
        overall: 0,
        textExtraction: 0,
        structureClarity: 0,
        citationCompleteness: 0,
        scientificRigor: 0,
        readability: 0,
        issues: [],
        recommendations: []
      },
      pdfMetadata: physicalData.pdfMetadata
    };

    return {
      title,
      authors,
      abstract,
      sections,
      references,
      keywords,
      metadata
    };
  }

  private extractTitle(elements: TextElement[]): string | null {
    // Find elements on first page
    const firstPageElements = elements.filter(e => e.page === 1);

    if (firstPageElements.length === 0) return null;

    // Find largest font size (likely title)
    const maxFontSize = Math.max(...firstPageElements.map(e => e.fontSize));

    // Get elements with largest font (or close to it)
    const titleElements = firstPageElements.filter(e =>
      e.fontSize >= maxFontSize * 0.9 &&
      e.y < 300 && // In upper portion of page
      e.text.length > 3
    );

    if (titleElements.length === 0) return null;

    // Combine title elements
    const title = titleElements
      .sort((a, b) => a.y - b.y)
      .map(e => e.text)
      .join(' ')
      .trim();

    return title.length > 5 ? title : null;
  }

  private extractAuthors(elements: TextElement[]): string[] {
    const firstPageElements = elements.filter(e => e.page === 1);

    // Look for author patterns (names, often in specific font or position)
    // This is a simplified heuristic - could be improved with ML
    const authorRegex = /^[A-Z][a-z]+\s+[A-Z][a-z]+/;

    const potentialAuthors = firstPageElements
      .filter(e => e.y < 400 && e.y > 100) // Below title area
      .filter(e => authorRegex.test(e.text))
      .map(e => e.text);

    return [...new Set(potentialAuthors)]; // Remove duplicates
  }

  private extractSections(elements: TextElement[], fullText: string): Section[] {
    const sections: Section[] = [];

    // Common section headers in scientific papers
    const sectionPatterns: { pattern: RegExp; type: SectionType }[] = [
      { pattern: /^Abstract$/i, type: 'abstract' },
      { pattern: /^(Introduction|Background)$/i, type: 'introduction' },
      { pattern: /^(Literature Review|Related Work|Theoretical Framework)$/i, type: 'literature_review' },
      { pattern: /^(Methodology|Methods|Materials and Methods)$/i, type: 'methodology' },
      { pattern: /^(Results|Findings)$/i, type: 'results' },
      { pattern: /^(Discussion|Analysis)$/i, type: 'discussion' },
      { pattern: /^(Conclusion|Conclusions)$/i, type: 'conclusion' },
      { pattern: /^(References|Bibliography|Works Cited)$/i, type: 'references' },
      { pattern: /^(Appendix|Appendices)$/i, type: 'appendix' }
    ];

    // Find potential section headers (larger fonts, bold, or specific keywords)
    const avgFontSize = elements.reduce((sum, e) => sum + e.fontSize, 0) / elements.length;
    const headerElements = elements.filter(e =>
      e.fontSize > avgFontSize * 1.2 ||
      e.isBold ||
      sectionPatterns.some(p => p.pattern.test(e.text.trim()))
    );

    // Group headers and extract sections
    for (let i = 0; i < headerElements.length; i++) {
      const header = headerElements[i];
      const nextHeader = headerElements[i + 1];

      // Determine section type
      let sectionType: SectionType = 'unknown';
      let confidence = 0.5;

      for (const { pattern, type } of sectionPatterns) {
        if (pattern.test(header.text.trim())) {
          sectionType = type;
          confidence = 0.9;
          break;
        }
      }

      // Extract content between headers
      const startIdx = elements.indexOf(header);
      const endIdx = nextHeader ? elements.indexOf(nextHeader) : elements.length;

      const sectionElements = elements.slice(startIdx + 1, endIdx);
      const content = sectionElements
        .map(e => e.text)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Parse paragraphs
      const paragraphs = this.parseParagraphs(content);

      const section: Section = {
        id: `section_${i}`,
        type: sectionType,
        title: header.text.trim(),
        content,
        level: 1, // Simplified - could detect nested sections
        startPage: header.page,
        endPage: nextHeader?.page || elements[elements.length - 1].page,
        paragraphs,
        citations: [], // Will be filled in Layer 4
        confidence
      };

      sections.push(section);
    }

    return sections;
  }

  private parseParagraphs(text: string): Paragraph[] {
    // Split by double newlines or sentence patterns
    const paragraphTexts = text.split(/\n\n+|\.\s{2,}/);

    const paragraphs: Paragraph[] = [];
    let currentIndex = 0;

    for (const pText of paragraphTexts) {
      const trimmed = pText.trim();
      if (trimmed.length < 20) continue; // Skip very short segments

      const sentences = trimmed.split(/[.!?]+\s+/);

      paragraphs.push({
        text: trimmed,
        startIndex: currentIndex,
        endIndex: currentIndex + trimmed.length,
        sentenceCount: sentences.length,
        citations: [] // Will be filled in Layer 4
      });

      currentIndex += trimmed.length;
    }

    return paragraphs;
  }

  private parseReferences(referencesText: string): Reference[] {
    // Split by common reference patterns
    const referenceLines = referencesText.split(/\n+/).filter(line => line.trim().length > 20);

    const references: Reference[] = [];

    referenceLines.forEach((line, index) => {
      // Extract year
      const yearMatch = line.match(/\((\d{4})\)|\b(\d{4})\b/);
      const year = yearMatch ? parseInt(yearMatch[1] || yearMatch[2]) : null;

      // Extract DOI
      const doiMatch = line.match(/doi:?\s*([^\s]+)/i);
      const doi = doiMatch ? doiMatch[1] : null;

      // Extract URL
      const urlMatch = line.match(/(https?:\/\/[^\s]+)/i);
      const url = urlMatch ? urlMatch[1] : null;

      // Extract authors (simplified - names before year)
      const authorsText = year ? line.split(year.toString())[0] : line.substring(0, 100);
      const authors = authorsText.match(/[A-Z][a-z]+,\s*[A-Z]\./g) || [];

      references.push({
        id: `ref_${index}`,
        fullText: line.trim(),
        authors: authors.map(a => a.trim()),
        year,
        title: null, // Could be extracted with more complex parsing
        journal: null,
        doi,
        url,
        confidence: year && authors.length > 0 ? 0.8 : 0.5
      });
    });

    return references;
  }

  private extractKeywords(text: string): string[] {
    // Look for explicit keywords section
    const keywordMatch = text.match(/keywords?:([^\n.]+)/i);
    if (keywordMatch) {
      return keywordMatch[1]
        .split(/[,;]/)
        .map(k => k.trim())
        .filter(k => k.length > 2);
    }

    // Fallback: extract frequent important words (simplified NLP)
    const words = text.toLowerCase().match(/\b[a-z]{5,}\b/g) || [];
    const frequency: { [key: string]: number } = {};

    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  // ============================================================================
  // LAYER 3: SEMANTIC SEGMENTATION
  // ============================================================================

  private async performSemanticSegmentation(
    structure: DocumentStructure,
    physicalData: any
  ): Promise<{
    mainTopics: string[];
    researchType: string;
    methodology: string[];
    findings: string[];
    limitations: string[];
  }> {
    const mainTopics = structure.keywords.slice(0, 5);

    // Determine research type
    const methodologySection = structure.sections.find(s => s.type === 'methodology');
    let researchType = 'qualitative';

    if (methodologySection) {
      const content = methodologySection.content.toLowerCase();
      if (content.includes('statistical') || content.includes('quantitative')) {
        researchType = 'quantitative';
      } else if (content.includes('mixed method')) {
        researchType = 'mixed-methods';
      }
    }

    // Extract methodology approaches
    const methodology: string[] = [];
    if (methodologySection) {
      const methods = ['interview', 'survey', 'experiment', 'observation', 'case study', 'ethnography'];
      methods.forEach(method => {
        if (methodologySection.content.toLowerCase().includes(method)) {
          methodology.push(method);
        }
      });
    }

    // Extract key findings
    const resultsSection = structure.sections.find(s => s.type === 'results');
    const findings: string[] = [];
    if (resultsSection) {
      // Extract sentences containing result indicators
      const sentences = resultsSection.content.match(/[^.!?]+[.!?]/g) || [];
      sentences.forEach(sentence => {
        if (/(found|showed|demonstrated|revealed|indicated|significant)/i.test(sentence)) {
          findings.push(sentence.trim().substring(0, 200));
        }
      });
    }

    // Extract limitations
    const limitations: string[] = [];
    const discussionSection = structure.sections.find(s => s.type === 'discussion');
    if (discussionSection) {
      const sentences = discussionSection.content.match(/[^.!?]+[.!?]/g) || [];
      sentences.forEach(sentence => {
        if (/(limitation|constrain|challenge|weakness)/i.test(sentence)) {
          limitations.push(sentence.trim().substring(0, 200));
        }
      });
    }

    return {
      mainTopics,
      researchType,
      methodology,
      findings: findings.slice(0, 5),
      limitations: limitations.slice(0, 3)
    };
  }

  // ============================================================================
  // LAYER 4: ENTITY RECOGNITION
  // ============================================================================

  private async recognizeEntities(structure: DocumentStructure, physicalData: any): Promise<void> {
    // Find citations in each section
    const citationPatterns = [
      /\(([A-Z][a-z]+(?:\s+(?:et al\.|&|and)\s+[A-Z][a-z]+)?),?\s+(\d{4})\)/g, // (Author, 2020)
      /\[(\d+)\]/g, // [1]
      /\((\d+)\)/g // (1)
    ];

    structure.sections.forEach(section => {
      const citations: Citation[] = [];

      citationPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(section.content)) !== null) {
          const citation: Citation = {
            text: match[0],
            authors: match[1] ? [match[1]] : [],
            year: match[2] ? parseInt(match[2]) : null,
            type: 'inline',
            position: match.index,
            isValid: false,
            referenceId: null
          };

          // Try to match with references
          if (citation.authors.length > 0 && citation.year) {
            const matchingRef = structure.references.find(ref =>
              ref.year === citation.year &&
              ref.authors.some(author => citation.authors.includes(author))
            );

            if (matchingRef) {
              citation.isValid = true;
              citation.referenceId = matchingRef.id;
            }
          }

          citations.push(citation);
        }
      });

      section.citations = citations;

      // Also add citations to paragraphs
      section.paragraphs.forEach(paragraph => {
        paragraph.citations = citations.filter(c =>
          c.position >= paragraph.startIndex && c.position <= paragraph.endIndex
        );
      });
    });
  }

  // ============================================================================
  // LAYER 5: QUALITY ASSESSMENT
  // ============================================================================

  private async assessQuality(structure: DocumentStructure, physicalData: any): Promise<QualityScore> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // 1. Text Extraction Quality
    const textExtraction = physicalData.elements.length > 100 ? 95 : 50;
    if (textExtraction < 70) {
      issues.push('Low text extraction quality - document may be image-based');
      recommendations.push('Consider using OCR preprocessing');
    }

    // 2. Structure Clarity
    const hasAbstract = structure.sections.some(s => s.type === 'abstract');
    const hasIntro = structure.sections.some(s => s.type === 'introduction');
    const hasMethod = structure.sections.some(s => s.type === 'methodology');
    const hasResults = structure.sections.some(s => s.type === 'results');
    const hasConclusion = structure.sections.some(s => s.type === 'conclusion');
    const hasReferences = structure.sections.some(s => s.type === 'references');

    const structureScore = [hasAbstract, hasIntro, hasMethod, hasResults, hasConclusion, hasReferences]
      .filter(Boolean).length / 6 * 100;

    if (!hasAbstract) recommendations.push('Document should have an abstract');
    if (!hasMethod) recommendations.push('Methodology section not clearly identified');
    if (!hasReferences) issues.push('No references section found');

    // 3. Citation Completeness
    const totalCitations = structure.sections.reduce((sum, s) => sum + s.citations.length, 0);
    const validCitations = structure.sections.reduce(
      (sum, s) => sum + s.citations.filter(c => c.isValid).length,
      0
    );

    const citationCompleteness = totalCitations > 0 ? (validCitations / totalCitations * 100) : 0;

    if (citationCompleteness < 50) {
      issues.push('Many citations could not be matched to references');
      recommendations.push('Check reference formatting consistency');
    }

    // 4. Scientific Rigor
    const hasLiteratureReview = structure.sections.some(s => s.type === 'literature_review');
    const citationDensity = totalCitations / (structure.metadata.wordCount / 1000);

    let scientificRigor = 50;
    if (hasMethod) scientificRigor += 20;
    if (hasLiteratureReview) scientificRigor += 15;
    if (citationDensity > 5) scientificRigor += 15; // At least 5 citations per 1000 words

    if (citationDensity < 3) {
      recommendations.push('Consider increasing citation density for better scientific rigor');
    }

    // 5. Readability
    const avgWordsPerSentence = this.calculateAvgWordsPerSentence(structure);
    const readability = avgWordsPerSentence > 20 ? 60 : 85; // Penalize overly complex sentences

    if (avgWordsPerSentence > 25) {
      recommendations.push('Consider simplifying sentences for better readability');
    }

    // Overall score
    const overall = Math.round(
      (textExtraction + structureScore + citationCompleteness + scientificRigor + readability) / 5
    );

    return {
      overall,
      textExtraction: Math.round(textExtraction),
      structureClarity: Math.round(structureScore),
      citationCompleteness: Math.round(citationCompleteness),
      scientificRigor: Math.round(scientificRigor),
      readability: Math.round(readability),
      issues,
      recommendations
    };
  }

  // ============================================================================
  // LAYER 6: STATISTICAL ANALYSIS
  // ============================================================================

  private calculateStatistics(structure: DocumentStructure, physicalData: any): {
    avgWordsPerSentence: number;
    avgSentencesPerParagraph: number;
    citationDensity: number;
    sectionBalance: { [key: string]: number };
  } {
    const avgWordsPerSentence = this.calculateAvgWordsPerSentence(structure);

    const totalParagraphs = structure.sections.reduce((sum, s) => sum + s.paragraphs.length, 0);
    const totalSentences = structure.sections.reduce(
      (sum, s) => sum + s.paragraphs.reduce((pSum, p) => pSum + p.sentenceCount, 0),
      0
    );
    const avgSentencesPerParagraph = totalParagraphs > 0 ? totalSentences / totalParagraphs : 0;

    const totalCitations = structure.sections.reduce((sum, s) => sum + s.citations.length, 0);
    const citationDensity = (totalCitations / structure.metadata.wordCount) * 1000;

    // Calculate section balance
    const sectionBalance: { [key: string]: number } = {};
    const totalWords = structure.metadata.wordCount;

    structure.sections.forEach(section => {
      const sectionWords = section.content.split(/\s+/).length;
      const percentage = (sectionWords / totalWords) * 100;
      sectionBalance[section.type] = Math.round(percentage * 10) / 10;
    });

    return {
      avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
      avgSentencesPerParagraph: Math.round(avgSentencesPerParagraph * 10) / 10,
      citationDensity: Math.round(citationDensity * 10) / 10,
      sectionBalance
    };
  }

  private calculateAvgWordsPerSentence(structure: DocumentStructure): number {
    let totalWords = 0;
    let totalSentences = 0;

    structure.sections.forEach(section => {
      section.paragraphs.forEach(paragraph => {
        const words = paragraph.text.split(/\s+/).length;
        totalWords += words;
        totalSentences += paragraph.sentenceCount;
      });
    });

    return totalSentences > 0 ? totalWords / totalSentences : 0;
  }
}

export default IntelligentDocumentProcessor;
