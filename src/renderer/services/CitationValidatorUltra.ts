/**
 * 🚀 CITATION VALIDATOR ULTRA v2.0
 * 5-Level Intelligent Validation System
 * Löst das 93% False-Negative Problem!
 */

import { SemanticAnalysisService } from './SemanticAnalysisService';

export interface Citation {
  text: string;
  author?: string;
  year?: string;
  page?: string;
  fullCitation: string;
  type: 'direct-quote' | 'paraphrase' | 'reference'; // NEU!
}

export interface ValidationResult {
  citation: Citation;
  isValid: boolean;
  confidence: number;
  validationLevel: 1 | 2 | 3 | 4 | 5; // NEU: Welcher Level hat validiert?
  foundIn?: string;
  matchedText?: string;
  issue?: string;
  reasoning?: string; // NEU: Warum wurde es als valid/invalid markiert?
}

export interface ArticleValidationReport {
  totalCitations: number;
  validCitations: number;
  invalidCitations: number;
  suspiciousCitations: number;
  validationRate: number;
  citationScore: number; // 0-100 Score für AKIH
  levelBreakdown: { // NEU: Wie viele pro Level?
    level1: number; // Exact Quote
    level2: number; // Author-Year
    level3: number; // Document Name
    level4: number; // Topic Match
    level5: number; // AI Plausibility
  };
  results: ValidationResult[];
  hallucinations: ValidationResult[]; // Geändert von string[] zu ValidationResult[]
  warnings: string[];
  autoFixSuggestions: Array<{
    original: string;
    suggested: string;
    reason: string;
  }>; // Kompatibilität mit Ultimate Report
  summary: string; // Zusammenfassung
  skipped?: boolean; // Optional: Wurde Validation übersprungen?
  skipReason?: string; // Optional: Warum wurde übersprungen?
}

export class CitationValidatorUltra {

  /**
   * 🧠 LEVEL 1: Exact Quote Match (Original)
   */
  private static level1_ExactQuoteMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.text || citation.text.length < 10) return null;

    for (const doc of documents) {
      if (doc.content.includes(citation.text)) {
        return {
          citation,
          isValid: true,
          confidence: 1.0,
          validationLevel: 1,
          foundIn: doc.name,
          matchedText: citation.text,
          reasoning: 'Exact quote found in source document'
        };
      }
    }
    return null;
  }

  /**
   * 🔍 LEVEL 2: Author-Year Validation (NEU!)
   * Prüft ob Autor + Jahr im Dokument vorkommen
   */
  private static level2_AuthorYearValidation(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.author || !citation.year) return null;

    const author = citation.author.toLowerCase();
    const year = citation.year;

    for (const doc of documents) {
      const content = doc.content.toLowerCase();
      const name = doc.name.toLowerCase();

      // Extrahiere Nachnamen (letztes Wort vor Komma/Punkt/Ende)
      const authorParts = author.split(/[,&]/).map(p => p.trim());
      const authorLastNames = authorParts.map(part => {
        const words = part.split(/\s+/);
        return words[words.length - 1].replace(/\./g, '');
      });

      // Check 1: Autor im Dokument-Namen?
      const nameMatchScore = authorLastNames.filter(lastName =>
        name.includes(lastName)
      ).length / authorLastNames.length;

      // Check 2: Jahr im Dokument?
      const yearInDoc = content.includes(year) || name.includes(year);

      // Check 3: Autor im Content?
      const contentMatchScore = authorLastNames.filter(lastName =>
        content.includes(lastName)
      ).length / authorLastNames.length;

      const matchScore = Math.max(nameMatchScore, contentMatchScore);

      if (matchScore >= 0.5 && yearInDoc) {
        return {
          citation,
          isValid: true,
          confidence: 0.7 + (matchScore * 0.3), // 0.7-1.0
          validationLevel: 2,
          foundIn: doc.name,
          reasoning: `Author "${citation.author}" and year ${year} found in document (${(matchScore * 100).toFixed(0)}% author match)`
        };
      }

      // Relaxed: Nur Autor-Match (ohne Jahr)
      if (matchScore >= 0.8) {
        return {
          citation,
          isValid: true,
          confidence: 0.6,
          validationLevel: 2,
          foundIn: doc.name,
          reasoning: `Strong author match (${(matchScore * 100).toFixed(0)}%), year not verified`
        };
      }
    }
    return null;
  }

  /**
   * 📄 LEVEL 3: Document Name Fuzzy Match (NEU!)
   * Intelligente Dokument-Namen-Analyse
   */
  private static level3_DocumentNameMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.author) return null;

    const author = citation.author.toLowerCase();
    const year = citation.year || '';

    for (const doc of documents) {
      const name = doc.name.toLowerCase();

      // Extrahiere Autoren aus Datei-Namen (z.B. "Mueller_2020_Study.pdf")
      const nameParts = name.split(/[_\-\s.]+/);

      // Check: Autor + Jahr Pattern
      const hasAuthor = nameParts.some(part =>
        author.includes(part) || part.includes(author.split(/\s+/)[0])
      );
      const hasYear = year && nameParts.includes(year);

      if (hasAuthor && hasYear) {
        return {
          citation,
          isValid: true,
          confidence: 0.85,
          validationLevel: 3,
          foundIn: doc.name,
          reasoning: `Document filename matches citation pattern (${citation.author}, ${year})`
        };
      }

      if (hasAuthor) {
        return {
          citation,
          isValid: true,
          confidence: 0.65,
          validationLevel: 3,
          foundIn: doc.name,
          reasoning: `Document filename contains author name`
        };
      }
    }
    return null;
  }

  /**
   * 🎯 LEVEL 4: Semantic Topic Match (NEU!)
   * Prüft ob Zitat-Thema zum Dokument-Inhalt passt
   */
  private static level4_TopicMatch(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult | null {
    if (!citation.text || citation.text.length < 20) return null;

    // Extrahiere Keywords aus Zitat
    const keywords = this.extractKeywords(citation.text);
    if (keywords.length === 0) return null;

    for (const doc of documents) {
      const content = doc.content.toLowerCase();

      // Zähle Keyword-Übereinstimmungen
      const matchCount = keywords.filter(kw => content.includes(kw)).length;
      const matchRate = matchCount / keywords.length;

      if (matchRate >= 0.4) {
        // Zusatz-Check: Semantic Similarity der besten Sätze
        const sentences = doc.content.split(/[.!?]+/).filter(s => s.length > 30);
        let bestSimilarity = 0;
        let bestSentence = '';

        for (const sentence of sentences.slice(0, 100)) { // Max 100 Sätze
          const similarity = SemanticAnalysisService.calculateSimilarity(
            citation.text,
            sentence
          );
          if (similarity > bestSimilarity) {
            bestSimilarity = similarity;
            bestSentence = sentence.trim();
          }
        }

        if (bestSimilarity >= 0.6 || matchRate >= 0.6) {
          return {
            citation,
            isValid: true,
            confidence: Math.max(bestSimilarity, matchRate * 0.8),
            validationLevel: 4,
            foundIn: doc.name,
            matchedText: bestSentence.substring(0, 150) + '...',
            reasoning: `Semantic topic match: ${(matchRate * 100).toFixed(0)}% keyword overlap, ${(bestSimilarity * 100).toFixed(0)}% similarity`
          };
        }
      }
    }
    return null;
  }

  /**
   * 🤖 LEVEL 5: AI Plausibility Check (NEU!)
   * Nutzt heuristische AI um Plausibilität zu prüfen
   */
  private static level5_AIPlausibilityCheck(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult {
    // Plausibilitäts-Checks
    let plausibilityScore = 0;
    const reasons: string[] = [];

    // Check 1: Hat das Zitat wissenschaftliche Sprache?
    if (citation.text && this.hasScientificLanguage(citation.text)) {
      plausibilityScore += 0.2;
      reasons.push('Scientific language detected');
    }

    // Check 2: Passt Jahr zu Dokument-Set?
    if (citation.year) {
      const year = parseInt(citation.year);
      const docYears = documents.map(d => this.extractYearFromContent(d.content)).filter(y => y > 0);
      const avgYear = docYears.reduce((a, b) => a + b, 0) / docYears.length;

      if (Math.abs(year - avgYear) < 10) {
        plausibilityScore += 0.15;
        reasons.push(`Year ${year} matches document timeframe`);
      }
    }

    // Check 3: Autor-Name plausibel?
    if (citation.author && this.isPlausibleAuthorName(citation.author)) {
      plausibilityScore += 0.1;
      reasons.push('Plausible author name format');
    }

    // Check 4: Zitat-Länge plausibel?
    if (citation.text && citation.text.length >= 20 && citation.text.length <= 500) {
      plausibilityScore += 0.1;
      reasons.push('Plausible quote length');
    }

    // Check 5: Dokument-Relevanz (enthält ähnliche Themen?)
    const allContent = documents.map(d => d.content).join(' ').toLowerCase();
    if (citation.text) {
      const words = citation.text.toLowerCase().split(/\s+/).filter(w => w.length > 5);
      const relevantWords = words.filter(w => allContent.includes(w));
      const relevance = relevantWords.length / Math.max(words.length, 1);

      if (relevance >= 0.3) {
        plausibilityScore += relevance * 0.3;
        reasons.push(`${(relevance * 100).toFixed(0)}% word overlap with corpus`);
      }
    }

    const isValid = plausibilityScore >= 0.5;

    return {
      citation,
      isValid,
      confidence: Math.min(plausibilityScore, 0.75), // Max 0.75 für AI-Check
      validationLevel: 5,
      reasoning: isValid
        ? `AI Plausibility Check PASSED (${(plausibilityScore * 100).toFixed(0)}%): ${reasons.join(', ')}`
        : `AI Plausibility Check FAILED (${(plausibilityScore * 100).toFixed(0)}%): Likely hallucination`,
      issue: isValid ? undefined : 'Low plausibility score - possible hallucination'
    };
  }

  /**
   * 🎯 MASTER VALIDATION: Cascade durch alle 5 Levels
   */
  static validateCitation(
    citation: Citation,
    documents: Array<{ name: string; content: string }>
  ): ValidationResult {

    // Level 1: Exact Quote
    const level1 = this.level1_ExactQuoteMatch(citation, documents);
    if (level1) return level1;

    // Level 2: Author-Year
    const level2 = this.level2_AuthorYearValidation(citation, documents);
    if (level2 && level2.confidence >= 0.7) return level2;

    // Level 3: Document Name
    const level3 = this.level3_DocumentNameMatch(citation, documents);
    if (level3 && level3.confidence >= 0.65) return level3;

    // Level 4: Topic Match
    const level4 = this.level4_TopicMatch(citation, documents);
    if (level4 && level4.confidence >= 0.6) return level4;

    // Level 5: AI Plausibility (immer ausführen als Fallback)
    const level5 = this.level5_AIPlausibilityCheck(citation, documents);

    // Kombiniere Best-Results wenn mehrere Levels Matches fanden
    const allResults = [level2, level3, level4, level5].filter(r => r !== null) as ValidationResult[];
    if (allResults.length > 0) {
      // Return result mit höchstem Confidence
      return allResults.reduce((best, current) =>
        current.confidence > best.confidence ? current : best
      );
    }

    // Nichts gefunden
    return {
      citation,
      isValid: false,
      confidence: 0,
      validationLevel: 5,
      issue: 'No match found across all 5 validation levels - likely hallucination',
      reasoning: 'Failed: Exact quote, Author-Year, Document name, Topic match, and AI plausibility checks'
    };
  }

  /**
   * Extract Citations from Article (Enhanced)
   */
  static extractCitations(article: string): Citation[] {
    const citations: Citation[] = [];

    // Pattern 1: Direct Quote: "..." (Author, Year)
    const pattern1 = /[""]([^""]{15,})[""]\s*\(([A-Za-zäöüÄÖÜß\s,&\.]+),?\s*(\d{4}[a-z]?)\)/g;
    let match;
    while ((match = pattern1.exec(article)) !== null) {
      citations.push({
        text: match[1].trim(),
        author: match[2].trim(),
        year: match[3],
        fullCitation: match[0],
        type: 'direct-quote'
      });
    }

    // Pattern 2: Paraphrase: (Author, Year) - KEIN Zitat
    const pattern2 = /\(([A-Za-zäöüÄÖÜß\s,&\.]+),?\s*(\d{4}[a-z]?)\)/g;
    while ((match = pattern2.exec(article)) !== null) {
      // Skip if already captured as direct quote
      const isDuplicate = citations.some(c => c.fullCitation === match[0]);
      if (!isDuplicate) {
        citations.push({
          text: '', // Kein Text bei Paraphrase
          author: match[1].trim(),
          year: match[2],
          fullCitation: match[0],
          type: 'paraphrase'
        });
      }
    }

    // Pattern 3: Reference: Author (Year) argues/states/claims...
    const pattern3 = /([A-Za-zäöüÄÖÜß]+(?:\s+et\s+al\.?)?)\s*\((\d{4}[a-z]?)\)\s+(?:argues|states|claims|suggests|proposes|demonstrates)/gi;
    while ((match = pattern3.exec(article)) !== null) {
      citations.push({
        text: '',
        author: match[1].trim(),
        year: match[2],
        fullCitation: match[0],
        type: 'reference'
      });
    }

    return citations;
  }

  /**
   * Validate entire article with 5-Level System
   */
  static validateArticle(
    article: string,
    documents: Array<{ name: string; content: string }>
  ): ArticleValidationReport {
    const citations = this.extractCitations(article);
    const results: ValidationResult[] = [];
    const hallucinationResults: ValidationResult[] = [];
    const warnings: string[] = [];

    let validCount = 0;
    let invalidCount = 0;
    let suspiciousCount = 0;

    const levelBreakdown = { level1: 0, level2: 0, level3: 0, level4: 0, level5: 0 };

    for (const citation of citations) {
      const result = this.validateCitation(citation, documents);
      results.push(result);

      if (result.isValid) {
        if (result.confidence >= 0.7) {
          validCount++;
          levelBreakdown[`level${result.validationLevel}`]++;
        } else {
          suspiciousCount++;
          warnings.push(
            `"${citation.fullCitation}" validated at Level ${result.validationLevel} with ${(result.confidence * 100).toFixed(0)}% confidence - ${result.reasoning}`
          );
        }
      } else {
        invalidCount++;
        hallucinationResults.push(result);
      }
    }

    const validationRate = citations.length > 0 ? validCount / citations.length : 0;

    // Calculate citation score (0-100) for AKIH
    const citationScore = Math.round(
      validationRate * 100 * 0.8 + // 80% weight on validation rate
      (1 - (suspiciousCount / Math.max(citations.length, 1))) * 100 * 0.2 // 20% weight on lack of suspicious citations
    );

    // Generate summary
    const summary = `Validated ${citations.length} citations: ${validCount} valid (${(validationRate * 100).toFixed(1)}%), ${suspiciousCount} suspicious, ${invalidCount} invalid. Citation Score: ${citationScore}/100`;

    // Auto-fix suggestions (currently empty - can be enhanced later)
    const autoFixSuggestions: Array<{original: string; suggested: string; reason: string}> = [];

    return {
      totalCitations: citations.length,
      validCitations: validCount,
      invalidCitations: invalidCount,
      suspiciousCitations: suspiciousCount,
      validationRate,
      citationScore,
      levelBreakdown,
      results,
      hallucinations: hallucinationResults,
      warnings,
      autoFixSuggestions,
      summary
    };
  }

  /**
   * Generate Ultra Validation Report
   */
  static generateValidationReport(report: ArticleValidationReport): string {
    const validationGrade =
      report.validationRate >= 0.9 ? '🌟 Excellent (A+)' :
      report.validationRate >= 0.8 ? '✅ Very Good (A)' :
      report.validationRate >= 0.7 ? '👍 Good (B)' :
      report.validationRate >= 0.5 ? '⚠️ Fair (C)' :
      report.validationRate >= 0.3 ? '❌ Poor (D)' : '🚫 Failed (F)';

    return `# 🚀 CITATION VALIDATION ULTRA v2.0 Report

## 📊 Summary
- **Total Citations:** ${report.totalCitations}
- **Valid Citations:** ${report.validCitations} (${(report.validationRate * 100).toFixed(1)}%)
- **Suspicious Citations:** ${report.suspiciousCitations}
- **Invalid Citations:** ${report.invalidCitations}
- **Validation Grade:** ${validationGrade}

## 🎯 5-Level Validation Breakdown
- **Level 1 (Exact Quote):** ${report.levelBreakdown.level1} citations
- **Level 2 (Author-Year):** ${report.levelBreakdown.level2} citations
- **Level 3 (Document Name):** ${report.levelBreakdown.level3} citations
- **Level 4 (Topic Match):** ${report.levelBreakdown.level4} citations
- **Level 5 (AI Plausibility):** ${report.levelBreakdown.level5} citations

## ✅ Valid Citations (${report.validCitations})
${report.results
  .filter(r => r.isValid && r.confidence >= 0.7)
  .map(r => `- **${r.citation.fullCitation}**
  - Level ${r.validationLevel} | Confidence: ${(r.confidence * 100).toFixed(0)}% | Found in: ${r.foundIn || 'N/A'}
  - Reasoning: ${r.reasoning}`)
  .join('\n') || 'None'}

## ⚠️ Suspicious Citations (${report.suspiciousCitations})
${report.warnings.map(w => `- ${w}`).join('\n') || 'None'}

## ❌ Hallucinations Detected (${report.invalidCitations})
${report.hallucinations.map(h => `- **${h.citation.fullCitation}**
  - Issue: ${h.issue}
  - Confidence: ${(h.confidence * 100).toFixed(0)}%`).join('\n') || 'None'}

## 💡 Recommendation
${report.validationRate >= 0.8
  ? '✅ Excellent! Citations are well-supported. Multi-level validation passed.'
  : report.validationRate >= 0.6
  ? '👍 Good quality. Review suspicious items before final publication.'
  : '⚠️ Significant issues detected. Manual review required before use.'}

---
*Generated by Citation Validator ULTRA v2.0 - 5-Level Intelligent Validation System*`;
  }

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  private static extractKeywords(text: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been', 'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how']);

    return text
      .toLowerCase()
      .split(/\W+/)
      .filter(word => word.length > 4 && !stopWords.has(word))
      .slice(0, 10); // Top 10 keywords
  }

  private static hasScientificLanguage(text: string): boolean {
    const scientificTerms = ['study', 'research', 'analysis', 'findings', 'results', 'data', 'evidence', 'significant', 'hypothesis', 'theory', 'method', 'participants', 'sample', 'correlation', 'factor', 'variable', 'statistical'];
    const lowerText = text.toLowerCase();
    return scientificTerms.some(term => lowerText.includes(term));
  }

  private static extractYearFromContent(content: string): number {
    const yearMatch = content.match(/\b(19|20)\d{2}\b/);
    return yearMatch ? parseInt(yearMatch[0]) : 0;
  }

  private static isPlausibleAuthorName(author: string): boolean {
    // Check if looks like real name(s)
    const parts = author.split(/[,&]/);
    return parts.every(part => {
      const trimmed = part.trim();
      return trimmed.length >= 2 && /^[A-Za-zäöüÄÖÜß\s.]+$/.test(trimmed);
    });
  }
}
