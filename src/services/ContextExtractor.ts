// ContextExtractor.ts - Extracts context around coded segments
// For scientific reproducibility in qualitative research exports

export interface ExtractedContext {
  before: string;
  coded: string;
  after: string;
}

export interface PositionInfo {
  lineNumber: number;
  charPosition: number;
  wordPosition: number;
  paragraphNumber: number;
  sectionTitle?: string;
}

export type ContextLevel = 'none' | 'sentence' | 'narrow' | 'broad' | 'paragraph' | 'section' | 'custom';

export interface ContextOptions {
  level: ContextLevel;
  customWords?: number;
  customSentences?: number;
}

export class ContextExtractor {

  /**
   * Extract context around a coded segment
   */
  static extractContext(
    fullText: string,
    startPos: number,
    endPos: number,
    options: ContextOptions
  ): ExtractedContext {
    const coded = fullText.substring(startPos, endPos);

    if (options.level === 'none') {
      return { before: '', coded, after: '' };
    }

    switch (options.level) {
      case 'sentence':
        return this.extractBySentences(fullText, startPos, endPos, 1);
      case 'narrow':
        return this.extractByWords(fullText, startPos, endPos, 50);
      case 'broad':
        return this.extractByWords(fullText, startPos, endPos, 150);
      case 'paragraph':
        return this.extractByParagraphs(fullText, startPos, endPos, 1);
      case 'section':
        return this.extractBySection(fullText, startPos, endPos);
      case 'custom':
        if (options.customSentences) {
          return this.extractBySentences(fullText, startPos, endPos, options.customSentences);
        }
        return this.extractByWords(fullText, startPos, endPos, options.customWords || 50);
      default:
        return { before: '', coded, after: '' };
    }
  }

  /**
   * Extract context by word count
   */
  private static extractByWords(
    text: string,
    start: number,
    end: number,
    wordCount: number
  ): ExtractedContext {
    // Text before the coding
    const textBefore = text.substring(0, start);
    const wordsBeforeArray = textBefore.trim().split(/\s+/);
    const wordsBefore = wordsBeforeArray.slice(-wordCount).join(' ');

    // Text after the coding
    const textAfter = text.substring(end);
    const wordsAfterArray = textAfter.trim().split(/\s+/);
    const wordsAfter = wordsAfterArray.slice(0, wordCount).join(' ');

    return {
      before: wordsBefore.trim(),
      coded: text.substring(start, end),
      after: wordsAfter.trim()
    };
  }

  /**
   * Extract context by sentence count
   */
  private static extractBySentences(
    text: string,
    start: number,
    end: number,
    sentenceCount: number
  ): ExtractedContext {
    // Sentence regex for German and English
    const sentenceRegex = /[^.!?]*[.!?]+\s*/g;

    // Find all sentences with positions
    const sentences: { text: string; start: number; end: number }[] = [];
    let match;
    let lastEnd = 0;

    while ((match = sentenceRegex.exec(text)) !== null) {
      sentences.push({
        text: match[0].trim(),
        start: match.index,
        end: match.index + match[0].length
      });
      lastEnd = match.index + match[0].length;
    }

    // Handle text after last sentence
    if (lastEnd < text.length) {
      const remaining = text.substring(lastEnd).trim();
      if (remaining) {
        sentences.push({
          text: remaining,
          start: lastEnd,
          end: text.length
        });
      }
    }

    // Find sentences before and after the coding
    const sentencesBefore = sentences
      .filter(s => s.end <= start)
      .slice(-sentenceCount)
      .map(s => s.text)
      .join(' ');

    const sentencesAfter = sentences
      .filter(s => s.start >= end)
      .slice(0, sentenceCount)
      .map(s => s.text)
      .join(' ');

    return {
      before: sentencesBefore.trim(),
      coded: text.substring(start, end),
      after: sentencesAfter.trim()
    };
  }

  /**
   * Extract context by paragraphs
   */
  private static extractByParagraphs(
    text: string,
    start: number,
    end: number,
    paragraphCount: number
  ): ExtractedContext {
    // Split by double line breaks (paragraphs)
    const paragraphRegex = /\n\s*\n/g;
    const paragraphs: { text: string; start: number; end: number }[] = [];

    let lastEnd = 0;
    let match;

    while ((match = paragraphRegex.exec(text)) !== null) {
      if (match.index > lastEnd) {
        paragraphs.push({
          text: text.substring(lastEnd, match.index).trim(),
          start: lastEnd,
          end: match.index
        });
      }
      lastEnd = match.index + match[0].length;
    }

    // Add remaining text
    if (lastEnd < text.length) {
      paragraphs.push({
        text: text.substring(lastEnd).trim(),
        start: lastEnd,
        end: text.length
      });
    }

    // Find paragraph containing the coding
    let codingParagraphIndex = paragraphs.findIndex(
      p => start >= p.start && start < p.end
    );

    if (codingParagraphIndex === -1) {
      codingParagraphIndex = 0;
    }

    const before = paragraphs
      .slice(Math.max(0, codingParagraphIndex - paragraphCount), codingParagraphIndex)
      .map(p => p.text)
      .join('\n\n');

    const after = paragraphs
      .slice(codingParagraphIndex + 1, codingParagraphIndex + 1 + paragraphCount)
      .map(p => p.text)
      .join('\n\n');

    return {
      before: before.trim(),
      coded: text.substring(start, end),
      after: after.trim()
    };
  }

  /**
   * Extract entire section (until next heading)
   */
  private static extractBySection(
    text: string,
    start: number,
    end: number
  ): ExtractedContext {
    // Find headings (Markdown style or numbered)
    const headingRegex = /^(#{1,6}\s+.+|[0-9]+\.\s+.+|\*\*[^*]+\*\*)$/gm;
    const headings: { text: string; pos: number }[] = [];

    let match;
    while ((match = headingRegex.exec(text)) !== null) {
      headings.push({ text: match[0], pos: match.index });
    }

    // Find section boundaries
    let sectionStart = 0;
    let sectionEnd = text.length;

    for (let i = 0; i < headings.length; i++) {
      if (headings[i].pos <= start) {
        sectionStart = headings[i].pos;
      }
      if (headings[i].pos > start && headings[i].pos < sectionEnd) {
        sectionEnd = headings[i].pos;
        break;
      }
    }

    return {
      before: text.substring(sectionStart, start).trim(),
      coded: text.substring(start, end),
      after: text.substring(end, sectionEnd).trim()
    };
  }

  /**
   * Get line number for a position
   */
  static getLineNumber(text: string, position: number): number {
    return text.substring(0, position).split('\n').length;
  }

  /**
   * Get word position (word count from start)
   */
  static getWordPosition(text: string, position: number): number {
    return text.substring(0, position).trim().split(/\s+/).length;
  }

  /**
   * Get paragraph number
   */
  static getParagraphNumber(text: string, position: number): number {
    const beforeText = text.substring(0, position);
    return (beforeText.match(/\n\s*\n/g) || []).length + 1;
  }

  /**
   * Find the section title (heading) for a position
   */
  static findSectionTitle(text: string, position: number): string | null {
    // Markdown headings
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    let lastHeading: string | null = null;
    let match;

    while ((match = headingRegex.exec(text)) !== null) {
      if (match.index > position) break;
      lastHeading = match[1].trim();
    }

    // Also check for bold text as headings
    if (!lastHeading) {
      const boldRegex = /\*\*([^*]+)\*\*/g;
      while ((match = boldRegex.exec(text)) !== null) {
        if (match.index > position) break;
        // Only consider it a heading if it's at the start of a line
        const lineStart = text.lastIndexOf('\n', match.index) + 1;
        if (match.index === lineStart || text.substring(lineStart, match.index).trim() === '') {
          lastHeading = match[1].trim();
        }
      }
    }

    return lastHeading;
  }

  /**
   * Get complete position info for a coding
   */
  static getPositionInfo(text: string, position: number): PositionInfo {
    return {
      lineNumber: this.getLineNumber(text, position),
      charPosition: position,
      wordPosition: this.getWordPosition(text, position),
      paragraphNumber: this.getParagraphNumber(text, position),
      sectionTitle: this.findSectionTitle(text, position) || undefined
    };
  }

  /**
   * Find position of text in document (with fuzzy matching if exact not found)
   */
  static findTextPosition(
    documentText: string,
    searchText: string
  ): { start: number; end: number } | null {
    // Try exact match first
    const exactIndex = documentText.indexOf(searchText);
    if (exactIndex !== -1) {
      return { start: exactIndex, end: exactIndex + searchText.length };
    }

    // Try normalized match (ignore extra whitespace)
    const normalizedDoc = documentText.replace(/\s+/g, ' ');
    const normalizedSearch = searchText.replace(/\s+/g, ' ');
    const normalizedIndex = normalizedDoc.indexOf(normalizedSearch);

    if (normalizedIndex !== -1) {
      // Map back to original position
      let originalPos = 0;
      let normalizedPos = 0;

      while (normalizedPos < normalizedIndex && originalPos < documentText.length) {
        if (/\s/.test(documentText[originalPos])) {
          // Skip extra whitespace in original
          while (originalPos < documentText.length && /\s/.test(documentText[originalPos])) {
            originalPos++;
          }
          normalizedPos++;
        } else {
          originalPos++;
          normalizedPos++;
        }
      }

      return { start: originalPos, end: originalPos + searchText.length };
    }

    return null;
  }
}

export default ContextExtractor;
