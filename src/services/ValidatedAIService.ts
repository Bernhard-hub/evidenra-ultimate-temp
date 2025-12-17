// src/services/ValidatedAIService.ts

import APIService, { APIMessage } from './APIService';
import CitationValidator, { CitationValidation } from './CitationValidator';
import HallucinationDetector, { HallucinationAnalysis } from './HallucinationDetector';

export interface ValidationMetadata {
  citations: (CitationValidation & { text: string })[];
  hallucinationAnalysis: HallucinationAnalysis;
  timestamp: string;
  overallScore: number;
  regenerated?: boolean;
  processingTime?: number;
}

export interface ValidatedContent {
  content: string;
  validation: ValidationMetadata;
  warnings: string[];
  requiresReview: boolean;
  confidence: number;
  originalPrompt?: string;
  model?: string;
  provider?: string;
}

export interface APISettings {
  provider: string;
  model: string;
  apiKey: string;
  maxTokens?: number;
}

export class ValidatedAIService {
  private citationValidator: CitationValidator;
  private hallucinationDetector: HallucinationDetector;

  // Cache für wiederholte Validierungen
  private validationCache: Map<string, ValidationMetadata> = new Map();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 Minuten

  constructor() {
    this.citationValidator = new CitationValidator();
    this.hallucinationDetector = new HallucinationDetector();
  }

  /**
   * Generiert validierten Inhalt mit automatischer Überprüfung
   */
  async generateValidatedContent(
    prompt: string,
    apiSettings: APISettings,
    options?: {
      strictMode?: boolean;
      maxRetries?: number;
      requireCitations?: boolean;
      confidenceThreshold?: number;
    }
  ): Promise<ValidatedContent> {
    const startTime = Date.now();
    const opts = {
      strictMode: false,
      maxRetries: 1,
      requireCitations: false,
      confidenceThreshold: 0.7,
      ...options
    };

    try {
      // 1. Erweiterten Prompt mit Validierungsanweisungen erstellen
      const enhancedPrompt = this.createValidationPrompt(prompt, opts.strictMode);

      // 2. Ersten Versuch der KI-Generierung
      let result = await APIService.callAPI(
        apiSettings.provider,
        apiSettings.model,
        apiSettings.apiKey,
        [{ role: 'user', content: enhancedPrompt }],
        apiSettings.maxTokens || 2000
      );

      if (!result.success) {
        throw new Error(result.error || 'AI generation failed');
      }

      // 3. Erste Validierung
      let validation = await this.validateContent(result.content);
      let attempts = 1;

      // 4. Bei hohem Risiko: Regenerierung mit strengeren Anweisungen
      while (
        this.shouldRegenerate(validation, opts.confidenceThreshold) &&
        attempts <= opts.maxRetries
      ) {
        console.warn(`High risk detected (attempt ${attempts}), regenerating with strict mode...`);

        const strictPrompt = this.createStrictPrompt(prompt, validation.hallucinationAnalysis);

        const strictResult = await APIService.callAPI(
          apiSettings.provider,
          apiSettings.model,
          apiSettings.apiKey,
          [{ role: 'user', content: strictPrompt }],
          apiSettings.maxTokens || 2000
        );

        if (strictResult.success) {
          result = strictResult;
          validation = await this.validateContent(result.content);
          validation.regenerated = true;
        }

        attempts++;
      }

      // 5. Finale Bewertung und Rückgabe
      const processingTime = Date.now() - startTime;
      validation.processingTime = processingTime;

      const validatedContent: ValidatedContent = {
        content: result.content,
        validation,
        warnings: this.extractWarnings(validation),
        requiresReview: validation.hallucinationAnalysis.action === 'REVIEW',
        confidence: validation.overallScore,
        originalPrompt: prompt,
        model: apiSettings.model,
        provider: apiSettings.provider
      };

      // 6. Zusätzliche Validierungen falls erforderlich
      if (opts.requireCitations && validation.citations.length === 0) {
        validatedContent.warnings.push('⚠️ No citations found - consider adding sources');
        validatedContent.confidence *= 0.8;
      }

      // 7. Cache-Update
      this.updateCache(prompt, validation);

      return validatedContent;

    } catch (error: any) {
      console.error('ValidatedAIService error:', error);
      throw new Error(`Validated content generation failed: ${error.message}`);
    }
  }

  /**
   * Validiert bereits vorhandenen Inhalt
   */
  async validateContent(content: string): Promise<ValidationMetadata> {
    // Cache-Check
    const cacheKey = this.getCacheKey(content);
    const cached = this.validationCache.get(cacheKey);

    if (cached && this.isCacheValid(cached)) {
      return cached;
    }

    const validation: ValidationMetadata = {
      citations: [],
      hallucinationAnalysis: this.hallucinationDetector.analyzeContent(content),
      timestamp: new Date().toISOString(),
      overallScore: 0
    };

    // 1. Zitationen extrahieren und validieren
    const citations = this.citationValidator.extractCitationsFromText(content);
    if (citations.length > 0) {
      const citationValidations = await this.citationValidator.validateCitations(citations);

      validation.citations = citations.map((text, index) => ({
        text,
        ...citationValidations[index]
      }));
    }

    // 2. Gesamt-Validierungsscore berechnen
    validation.overallScore = this.calculateOverallScore(validation);

    // Cache-Update
    this.validationCache.set(cacheKey, validation);

    return validation;
  }

  /**
   * Erstellt erweiterten Prompt mit Validierungsanweisungen
   */
  private createValidationPrompt(originalPrompt: string, strictMode: boolean = false): string {
    const baseInstructions = `
${originalPrompt}

WICHTIGE QUALITÄTSANFORDERUNGEN:
1. Verwende nur verifizierbare Informationen und echte Quellen
2. Füge DOI-Nummern hinzu wo möglich
3. Vermeide absolute Aussagen (immer, nie, alle, keine)
4. Gib Konfidenz-Level für Behauptungen an (hohe/mittlere/niedrige Konfidenz)
5. Markiere spekulative Inhalte klar mit Begriffen wie "möglicherweise", "könnte darauf hindeuten", "deutet an"
6. Verwende spezifische Zahlen nur wenn sicher, ansonsten Bereiche
7. Bei Unsicherheit über Fakten, gib explizit Unsicherheit an
8. Verwende konservative, wissenschaftliche Sprache`;

    if (strictMode) {
      return `${baseInstructions}

STRENGER MODUS - Zusätzliche Anforderungen:
- NUR verifizierbares Wissen verwenden
- KEINE Spekulationen oder Vermutungen
- Bei Unsicherheit: "Weitere Forschung erforderlich" angeben
- Konservative Formulierungen bevorzugen
- Übertreibungen und Superlative vermeiden`;
    }

    return baseInstructions;
  }

  /**
   * Erstellt strengen Prompt basierend auf erkannten Problemen
   */
  private createStrictPrompt(originalPrompt: string, analysis: HallucinationAnalysis): string {
    const detectedIssues = analysis.warnings
      .map(w => `- ${w.category}: ${w.issue || w.matches?.[0] || 'Pattern detected'}`)
      .join('\n');

    return `
${originalPrompt}

KRITISCH - Vorherige Antwort enthielt Halluzinationen. Bitte beachte:

1. Verwende NUR absolut verifizierbare Informationen
2. Zitiere NUR Publikationen, deren Existenz du sicher bist
3. Vermeide ALLE spekulativen Behauptungen
4. Verwende zurückhaltende Sprache ("könnte", "möglicherweise", "deutet an")
5. Bei Ungewissheit sage "weitere Forschung erforderlich"

Erkannte Probleme in vorheriger Antwort:
${detectedIssues}

WICHTIG: Priorität hat Genauigkeit über Vollständigkeit. Lieber weniger, aber korrekte Informationen.`;
  }

  /**
   * Berechnet Gesamt-Validierungsscore
   */
  private calculateOverallScore(validation: ValidationMetadata): number {
    // Citation Score (40% Gewichtung)
    let citationScore = 0.5; // Neutral wenn keine Zitationen
    if (validation.citations.length > 0) {
      const avgCitationConfidence = validation.citations
        .reduce((sum, c) => sum + c.confidence, 0) / validation.citations.length;
      citationScore = avgCitationConfidence;
    }

    // Hallucination Score (60% Gewichtung)
    const hallucinationScore = 1 - validation.hallucinationAnalysis.score;

    // Gewichteter Durchschnitt
    const overallScore = (citationScore * 0.4) + (hallucinationScore * 0.6);

    return Math.max(0, Math.min(1, overallScore));
  }

  /**
   * Prüft ob Regenerierung notwendig ist
   */
  private shouldRegenerate(validation: ValidationMetadata, threshold: number): boolean {
    return (
      validation.hallucinationAnalysis.action === 'REJECT' ||
      validation.overallScore < threshold ||
      validation.citations.some(c => !c.isValid && c.confidence < 0.3)
    );
  }

  /**
   * Extrahiert Warnungen aus Validierung
   */
  private extractWarnings(validation: ValidationMetadata): string[] {
    const warnings: string[] = [];

    // Citation Warnungen
    validation.citations.forEach(citation => {
      if (!citation.isValid) {
        warnings.push(`⚠️ Ungültige Zitation: ${citation.text}`);
      } else if (citation.confidence < 0.5) {
        warnings.push(`⚡ Verdächtige Zitation: ${citation.text}`);
      }
    });

    // Hallucination Warnungen
    if (validation.hallucinationAnalysis.score > 0.4) {
      warnings.push(`🚨 Inhaltszuverlässigkeit: ${validation.hallucinationAnalysis.interpretation}`);
    }

    // Top 3 kritischste Warnungen
    const criticalWarnings = validation.hallucinationAnalysis.warnings
      .filter(w => w.severity > 0.5)
      .sort((a, b) => b.severity - a.severity)
      .slice(0, 3);

    criticalWarnings.forEach(warning => {
      const example = warning.matches?.[0] || warning.issue || 'Pattern detected';
      warnings.push(`📝 ${warning.category}: ${example}`);
    });

    return warnings;
  }

  /**
   * Cache-Verwaltung
   */
  private getCacheKey(content: string): string {
    // Einfacher Hash für Cache-Key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  private isCacheValid(cached: ValidationMetadata): boolean {
    const age = Date.now() - new Date(cached.timestamp).getTime();
    return age < this.CACHE_DURATION;
  }

  private updateCache(prompt: string, validation: ValidationMetadata): void {
    const cacheKey = this.getCacheKey(prompt);
    this.validationCache.set(cacheKey, validation);

    // Cache-Größe begrenzen (max 100 Einträge)
    if (this.validationCache.size > 100) {
      const firstKey = this.validationCache.keys().next().value;
      this.validationCache.delete(firstKey);
    }
  }

  /**
   * Batch-Validierung für mehrere Texte
   */
  async validateBatch(
    contents: string[],
    options?: { parallel?: boolean }
  ): Promise<ValidationMetadata[]> {
    const opts = { parallel: true, ...options };

    if (opts.parallel) {
      const validationPromises = contents.map(content => this.validateContent(content));
      return Promise.all(validationPromises);
    } else {
      const results: ValidationMetadata[] = [];
      for (const content of contents) {
        const validation = await this.validateContent(content);
        results.push(validation);
      }
      return results;
    }
  }

  /**
   * Erstellt Validierungsbericht
   */
  generateValidationReport(validatedContent: ValidatedContent): string {
    const { validation, confidence, warnings } = validatedContent;

    let report = `# AI Content Validation Report\n\n`;

    // Übersicht
    report += `## Übersicht\n`;
    report += `- **Gesamt-Konfidenz:** ${(confidence * 100).toFixed(1)}%\n`;
    report += `- **Verarbeitungszeit:** ${validation.processingTime || 0}ms\n`;
    report += `- **Zitationen gefunden:** ${validation.citations.length}\n`;
    report += `- **Handlungsempfehlung:** ${validation.hallucinationAnalysis.action}\n\n`;

    // Warnungen
    if (warnings.length > 0) {
      report += `## Warnungen (${warnings.length})\n`;
      warnings.forEach(warning => report += `${warning}\n`);
      report += '\n';
    }

    // Hallucination Analysis
    report += this.hallucinationDetector.generateReport(validation.hallucinationAnalysis);

    // Citation Details
    if (validation.citations.length > 0) {
      report += `## Zitations-Analyse\n\n`;
      validation.citations.forEach((citation, i) => {
        report += `### Zitation ${i + 1}: ${citation.text}\n`;
        report += `- **Gültig:** ${citation.isValid ? '✅' : '❌'}\n`;
        report += `- **Konfidenz:** ${(citation.confidence * 100).toFixed(1)}%\n`;
        if (citation.crossRefVerified !== undefined) {
          report += `- **CrossRef:** ${citation.crossRefVerified ? '✅ Verifiziert' : '❌ Nicht gefunden'}\n`;
        }
        if (citation.doi) {
          report += `- **DOI:** ${citation.doi}\n`;
        }
        if (citation.warnings.length > 0) {
          report += `- **Warnungen:** ${citation.warnings.join(', ')}\n`;
        }
        report += '\n';
      });
    }

    return report;
  }

  /**
   * Bereinigt Cache (für Speicher-Management)
   */
  clearCache(): void {
    this.validationCache.clear();
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getCacheStats(): {
    size: number;
    memoryUsage: string;
    hitRate?: number;
  } {
    return {
      size: this.validationCache.size,
      memoryUsage: `${this.validationCache.size} entries`,
      // Hit rate könnte mit zusätzlicher Instrumentierung implementiert werden
    };
  }
}

export default ValidatedAIService;