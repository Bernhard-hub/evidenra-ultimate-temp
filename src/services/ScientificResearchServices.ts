// src/services/ScientificResearchServices.ts
// Wissenschaftlich fundierte Services für qualitative Forschung

import {
  ResearchMemo,
  MemoType,
  AIExplanation,
  BiasWarning,
  BiasType,
  ReflexivityStatement,
  SaturationAnalysis,
  MemberCheckingSession,
  AuditTrailEntry,
  QualityCriteriaReport
} from '../types/ResearchTypes';

// ============================================================================
// 1. MEMO SERVICE (Grounded Theory nach Glaser & Strauss, 1967)
// ============================================================================

export class MemoService {
  /**
   * Erstellt ein neues Forschungs-Memo
   */
  static createMemo(
    type: MemoType,
    title: string,
    content: string,
    author: string,
    relations?: {
      category?: string;
      segment?: string;
      document?: string;
      coding?: string;
    }
  ): ResearchMemo {
    return {
      id: `memo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      title,
      content,
      timestamp: new Date(),
      author,
      relatedToCategory: relations?.category,
      relatedToSegment: relations?.segment,
      relatedToDocument: relations?.document,
      relatedToCoding: relations?.coding,
      tags: [],
      isPrivate: type === 'reflexive', // Reflexive Memos sind default privat
      version: 1,
      editHistory: []
    };
  }

  /**
   * Aktualisiert ein Memo (mit Versionierung)
   */
  static updateMemo(memo: ResearchMemo, newContent: string, changes: string): ResearchMemo {
    return {
      ...memo,
      content: newContent,
      version: memo.version + 1,
      editHistory: [
        ...memo.editHistory,
        {
          timestamp: new Date(),
          changes
        }
      ]
    };
  }

  /**
   * Filtert Memos nach Typ
   */
  static filterByType(memos: ResearchMemo[], type: MemoType): ResearchMemo[] {
    return memos.filter(m => m.type === type);
  }

  /**
   * Findet Memos zu einer Kategorie
   */
  static getMemosForCategory(memos: ResearchMemo[], categoryId: string): ResearchMemo[] {
    return memos.filter(m => m.relatedToCategory === categoryId);
  }

  /**
   * Analysiert Memo-Dichte (Indikator für theoretische Tiefe)
   */
  static analyzeMemoDensity(memos: ResearchMemo[], categories: any[]): {
    averageMemosPerCategory: number;
    categoriesWithoutMemos: string[];
    wellDocumentedCategories: string[];
  } {
    const memosPerCategory = new Map<string, number>();

    categories.forEach(cat => {
      const count = memos.filter(m => m.relatedToCategory === cat.id).length;
      memosPerCategory.set(cat.id, count);
    });

    const average = Array.from(memosPerCategory.values()).reduce((a, b) => a + b, 0) / categories.length;
    const withoutMemos = categories.filter(c => (memosPerCategory.get(c.id) || 0) === 0).map(c => c.name);
    const wellDocumented = categories.filter(c => (memosPerCategory.get(c.id) || 0) >= 3).map(c => c.name);

    return {
      averageMemosPerCategory: average,
      categoriesWithoutMemos: withoutMemos,
      wellDocumentedCategories: wellDocumented
    };
  }

  /**
   * Generiert Memo-Report (für Methodenkapitel)
   */
  static generateMemoReport(memos: ResearchMemo[]): string {
    const byType = {
      theoretical: memos.filter(m => m.type === 'theoretical').length,
      methodological: memos.filter(m => m.type === 'methodological').length,
      reflexive: memos.filter(m => m.type === 'reflexive').length,
      analytical: memos.filter(m => m.type === 'analytical').length,
      ethical: memos.filter(m => m.type === 'ethical').length
    };

    return `
# Memo-Analyse

**Gesamt:** ${memos.length} Forschungs-Memos

**Nach Typ:**
- Theoretische Memos: ${byType.theoretical}
- Methodische Memos: ${byType.methodological}
- Reflexive Memos: ${byType.reflexive}
- Analytische Memos: ${byType.analytical}
- Ethische Memos: ${byType.ethical}

**Durchschnittliche Länge:** ${Math.round(memos.reduce((sum, m) => sum + m.content.length, 0) / memos.length)} Zeichen

**Memo-Dichte:** ${(memos.length / Math.max(1, memos.filter(m => m.relatedToCategory).length)).toFixed(2)} Memos pro Kategorie
    `.trim();
  }
}

// ============================================================================
// 2. EXPLAINABLE AI SERVICE
// ============================================================================

export class ExplainableAIService {
  /**
   * Extrahiert Erklärung aus KI-Antwort
   */
  static extractExplanation(
    aiResponse: string,
    originalPrompt: string,
    model: string
  ): AIExplanation {
    // Parse KI-Antwort für strukturierte Daten
    const explanation: AIExplanation = {
      decision: this.extractDecision(aiResponse),
      reasoning: this.extractReasoning(aiResponse),
      confidence: this.estimateConfidence(aiResponse),
      textEvidences: this.extractEvidences(aiResponse),
      alternativeInterpretations: this.extractAlternatives(aiResponse),
      limitations: this.identifyLimitations(model),
      uncertainties: this.extractUncertainties(aiResponse),
      model,
      timestamp: new Date(),
      tokenUsage: Math.ceil(aiResponse.length / 4)
    };

    return explanation;
  }

  private static extractDecision(response: string): string {
    // Suche nach Hauptentscheidung (z.B. Kategorie-Zuordnung)
    const patterns = [
      /Kategorie:\s*["']?([^"'\n]+)["']?/i,
      /Zuordnung:\s*["']?([^"'\n]+)["']?/i,
      /Klassifikation:\s*["']?([^"'\n]+)["']?/i
    ];

    for (const pattern of patterns) {
      const match = response.match(pattern);
      if (match) return match[1].trim();
    }

    return response.split('\n')[0].substring(0, 100);
  }

  private static extractReasoning(response: string): string[] {
    const reasoning: string[] = [];

    // Suche nach nummerierten Listen
    const numberedPattern = /\d+\.\s*([^\n]+)/g;
    let match;
    while ((match = numberedPattern.exec(response)) !== null) {
      reasoning.push(match[1].trim());
    }

    // Suche nach Bullet Points
    if (reasoning.length === 0) {
      const bulletPattern = /[-*•]\s*([^\n]+)/g;
      while ((match = bulletPattern.exec(response)) !== null) {
        reasoning.push(match[1].trim());
      }
    }

    // Fallback: Sätze extrahieren
    if (reasoning.length === 0) {
      const sentences = response.split(/[.!?]+/).filter(s => s.trim().length > 20);
      reasoning.push(...sentences.slice(0, 5).map(s => s.trim()));
    }

    return reasoning.slice(0, 10); // Max 10 Reasoning-Punkte
  }

  private static estimateConfidence(response: string): number {
    // Heuristik für Konfidenz-Schätzung
    const confidenceKeywords = {
      high: ['eindeutig', 'klar', 'offensichtlich', 'zweifelsfrei', 'definitiv', 'sicher'],
      medium: ['wahrscheinlich', 'vermutlich', 'tendenziell', 'eher'],
      low: ['möglicherweise', 'könnte', 'vielleicht', 'unsicher', 'unklar']
    };

    const lowerResponse = response.toLowerCase();

    const highCount = confidenceKeywords.high.filter(k => lowerResponse.includes(k)).length;
    const mediumCount = confidenceKeywords.medium.filter(k => lowerResponse.includes(k)).length;
    const lowCount = confidenceKeywords.low.filter(k => lowerResponse.includes(k)).length;

    if (highCount > lowCount) return 0.8 + (Math.min(highCount, 3) * 0.05);
    if (mediumCount > 0) return 0.6 + (Math.min(mediumCount, 2) * 0.1);
    if (lowCount > 0) return 0.4 - (Math.min(lowCount, 2) * 0.1);

    return 0.7; // Default
  }

  private static extractEvidences(response: string): AIExplanation['textEvidences'] {
    const evidences: AIExplanation['textEvidences'] = [];

    // Suche nach Zitaten
    const quotePatterns = [
      /"([^"]{20,200})"/g,
      /„([^„]{20,200})"/g,
      /['']([^'']{20,200})['']/g
    ];

    for (const pattern of quotePatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        evidences.push({
          quote: match[1].trim(),
          reason: 'Direkt zitiert als Evidence',
          weight: 0.8
        });
      }
    }

    return evidences.slice(0, 5); // Max 5 Evidenzen
  }

  private static extractAlternatives(response: string): AIExplanation['alternativeInterpretations'] {
    const alternatives: AIExplanation['alternativeInterpretations'] = [];

    // Suche nach alternativen Interpretationen
    const altPatterns = [
      /alternativ[^\n]*?:\s*([^\n]+)/gi,
      /auch möglich[^\n]*?:\s*([^\n]+)/gi,
      /könnte auch[^\n]*?:\s*([^\n]+)/gi
    ];

    for (const pattern of altPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        alternatives.push({
          category: match[1].trim(),
          probability: 0.3,
          reason: 'Vom KI-Modell als Alternative genannt'
        });
      }
    }

    return alternatives.slice(0, 3);
  }

  private static identifyLimitations(model: string): string[] {
    const limitations: string[] = [];

    if (model.includes('claude')) {
      limitations.push('KI-Modell trainiert hauptsächlich auf englischen Texten (mögliche sprachliche Biases)');
      limitations.push('Kultureller Kontext außerhalb westlicher Perspektiven möglicherweise eingeschränkt');
      limitations.push('Keine persönliche Erfahrung oder emotionales Verständnis');
    }

    if (model.includes('gpt')) {
      limitations.push('Training-Daten bis 2023 (keine aktuellen kulturellen Entwicklungen)');
      limitations.push('Mögliche Überrepräsentation nordamerikanischer Perspektiven');
    }

    limitations.push('Algorithmische Entscheidungen sind nicht 100% nachvollziehbar (Black-Box-Problem)');
    limitations.push('Keine Fähigkeit zur genuinen Empathie oder Lebenswelt-Verständnis');

    return limitations;
  }

  private static extractUncertainties(response: string): string[] {
    const uncertainties: string[] = [];
    const uncertaintyPatterns = [
      /unsicher[^\n]*/gi,
      /unklar[^\n]*/gi,
      /schwer zu sagen[^\n]*/gi,
      /kann nicht eindeutig[^\n]*/gi
    ];

    for (const pattern of uncertaintyPatterns) {
      const matches = response.match(pattern);
      if (matches) {
        uncertainties.push(...matches.map(m => m.trim()));
      }
    }

    return uncertainties.slice(0, 5);
  }

  /**
   * Generiert Human-Readable Explanation Report
   */
  static generateExplanationReport(explanation: AIExplanation): string {
    return `
# KI-Entscheidung: ${explanation.decision}

## Konfidenz: ${(explanation.confidence * 100).toFixed(0)}%

## Begründung:
${explanation.reasoning.map((r, i) => `${i + 1}. ${r}`).join('\n')}

## Text-Evidenzen:
${explanation.textEvidences.map(e => `- "${e.quote}" (Gewicht: ${e.weight})`).join('\n')}

${explanation.alternativeInterpretations.length > 0 ? `
## Alternative Interpretationen:
${explanation.alternativeInterpretations.map(a => `- ${a.category} (${(a.probability * 100).toFixed(0)}%): ${a.reason}`).join('\n')}
` : ''}

## Limitationen:
${explanation.limitations.map(l => `⚠️ ${l}`).join('\n')}

${explanation.uncertainties.length > 0 ? `
## Unsicherheiten:
${explanation.uncertainties.map(u => `❓ ${u}`).join('\n')}
` : ''}

---
*Generiert von: ${explanation.model}*
*Zeitpunkt: ${explanation.timestamp.toLocaleString()}*
    `.trim();
  }
}

// ============================================================================
// 3. BIAS DETECTION SERVICE (nach O'Neil, 2016; Noble, 2018)
// ============================================================================

export class BiasDetectionService {
  /**
   * Analysiert Projekt auf potenzielle Biases
   */
  static analyzeProject(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // 1. Selection Bias (Sampling)
    warnings.push(...this.detectSelectionBias(project));

    // 2. Confirmation Bias
    warnings.push(...this.detectConfirmationBias(project));

    // 3. Algorithmic Bias
    warnings.push(...this.detectAlgorithmicBias(project));

    // 4. Cultural Bias
    warnings.push(...this.detectCulturalBias(project));

    // 5. Linguistic Bias
    warnings.push(...this.detectLinguisticBias(project));

    return warnings;
  }

  private static detectSelectionBias(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // Prüfe Sampling-Diversität
    if (project.documents && project.documents.length < 5) {
      warnings.push({
        id: `bias_selection_${Date.now()}`,
        type: 'selection',
        severity: 'high',
        title: 'Kleine Stichprobe',
        description: 'Nur wenige Dokumente analysiert - Gefahr von Selection Bias',
        detectedAt: new Date(),
        evidence: [
          `Nur ${project.documents.length} Dokumente analysiert`,
          'Theoretische Sättigung möglicherweise nicht erreicht'
        ],
        mitigation: [
          {
            strategy: 'Stichprobe erweitern',
            implementation: 'Mindestens 10-15 Dokumente für robuste Analyse',
            priority: 'high'
          },
          {
            strategy: 'Purposive Sampling',
            implementation: 'Gezielt nach maximaler Variation sampeln',
            priority: 'high'
          }
        ],
        acknowledged: false,
        mitigated: false
      });
    }

    return warnings;
  }

  private static detectConfirmationBias(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // Prüfe auf einseitige Kodierung
    if (project.categories) {
      const allPositive = project.categories.every((c: any) =>
        c.name.toLowerCase().includes('positiv') ||
        c.name.toLowerCase().includes('erfolg') ||
        c.name.toLowerCase().includes('gut')
      );

      if (allPositive && project.categories.length > 3) {
        warnings.push({
          id: `bias_confirmation_${Date.now()}`,
          type: 'confirmation',
          severity: 'medium',
          title: 'Einseitige Kategorisierung',
          description: 'Alle Kategorien scheinen positiv - möglicher Confirmation Bias',
          detectedAt: new Date(),
          evidence: [
            'Keine negativen oder kritischen Kategorien gefunden',
            'Mögliche Überbetonung bestätigender Evidenz'
          ],
          mitigation: [
            {
              strategy: 'Negative Case Analysis',
              implementation: 'Gezielt nach widersprüchlichen Fällen suchen',
              priority: 'medium'
            },
            {
              strategy: 'Devil\'s Advocate',
              implementation: 'Bewusst gegen eigene Hypothesen argumentieren',
              priority: 'medium'
            }
          ],
          acknowledged: false,
          mitigated: false
        });
      }
    }

    return warnings;
  }

  private static detectAlgorithmicBias(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // Wenn KI verwendet wurde
    if (project.apiUsage && project.apiUsage.totalCalls > 0) {
      warnings.push({
        id: `bias_algorithmic_${Date.now()}`,
        type: 'algorithmic',
        severity: 'medium',
        title: 'KI-Modell Bias',
        description: 'KI-Modelle haben inhärente Biases aus Trainingsdaten',
        detectedAt: new Date(),
        evidence: [
          `${project.apiUsage.totalCalls} KI-API Calls durchgeführt`,
          'KI trainiert hauptsächlich auf englischen, westlichen Texten',
          'Mögliche Überrepräsentation dominanter kultureller Perspektiven'
        ],
        mitigation: [
          {
            strategy: 'Manuelle Validierung',
            implementation: 'Alle KI-Kategorisierungen manuell überprüfen',
            priority: 'high'
          },
          {
            strategy: 'Transparenz in Publikation',
            implementation: 'KI-Nutzung und potenzielle Biases explizit diskutieren',
            priority: 'high'
          },
          {
            strategy: 'Lokales Modell erwägen',
            implementation: 'Ollama für mehr Kontrolle über Modell-Biases',
            priority: 'low'
          }
        ],
        acknowledged: false,
        mitigated: false
      });
    }

    return warnings;
  }

  private static detectCulturalBias(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // Prüfe Sprache der Dokumente
    if (project.documents) {
      const nonEnglishDocs = project.documents.filter((d: any) =>
        d.language && d.language !== 'en'
      );

      if (nonEnglishDocs.length > 0) {
        warnings.push({
          id: `bias_cultural_${Date.now()}`,
          type: 'cultural',
          severity: 'medium',
          title: 'Kultureller Kontext',
          description: 'Nicht-englische Texte - KI-Modelle haben Limitationen',
          detectedAt: new Date(),
          evidence: [
            `${nonEnglishDocs.length} Dokumente in anderen Sprachen`,
            'KI-Modelle arbeiten primär auf Englisch optimiert'
          ],
          mitigation: [
            {
              strategy: 'Kulturelle Sensibilität',
              implementation: 'Kulturspezifische Nuancen manuell validieren',
              priority: 'high'
            },
            {
              strategy: 'Native Speaker Validation',
              implementation: 'Kategorisierungen von Muttersprachlern prüfen lassen',
              priority: 'medium'
            }
          ],
          acknowledged: false,
          mitigated: false
        });
      }
    }

    return warnings;
  }

  private static detectLinguisticBias(project: any): BiasWarning[] {
    const warnings: BiasWarning[] = [];

    // Prüfe auf Gender-Bias in Kategorien
    if (project.categories) {
      const genderBiasKeywords = ['männlich', 'weiblich', 'frauen', 'männer'];
      const hasGenderFocus = project.categories.some((c: any) =>
        genderBiasKeywords.some(k => c.name.toLowerCase().includes(k))
      );

      if (hasGenderFocus) {
        warnings.push({
          id: `bias_linguistic_${Date.now()}`,
          type: 'linguistic',
          severity: 'low',
          title: 'Gender-Sprache',
          description: 'Kategorien enthalten Gender-Begriffe - auf Stereotypisierung achten',
          detectedAt: new Date(),
          evidence: [
            'Gender-spezifische Kategorien gefunden'
          ],
          mitigation: [
            {
              strategy: 'Intersektionalität berücksichtigen',
              implementation: 'Gender nicht isoliert betrachten',
              priority: 'medium'
            }
          ],
          acknowledged: false,
          mitigated: false
        });
      }
    }

    return warnings;
  }

  /**
   * Generiert Bias-Report
   */
  static generateBiasReport(warnings: BiasWarning[]): string {
    const bySeverity = {
      critical: warnings.filter(w => w.severity === 'critical'),
      high: warnings.filter(w => w.severity === 'high'),
      medium: warnings.filter(w => w.severity === 'medium'),
      low: warnings.filter(w => w.severity === 'low')
    };

    return `
# Bias-Analyse Report

**Gesamt:** ${warnings.length} potenzielle Biases erkannt

## Nach Schweregrad:
- 🔴 Kritisch: ${bySeverity.critical.length}
- 🟠 Hoch: ${bySeverity.high.length}
- 🟡 Mittel: ${bySeverity.medium.length}
- 🟢 Niedrig: ${bySeverity.low.length}

## Erkannte Biases:

${warnings.map(w => `
### ${w.severity === 'critical' ? '🔴' : w.severity === 'high' ? '🟠' : w.severity === 'medium' ? '🟡' : '🟢'} ${w.title}
**Typ:** ${w.type}
**Beschreibung:** ${w.description}

**Evidenz:**
${w.evidence.map(e => `- ${e}`).join('\n')}

**Empfohlene Maßnahmen:**
${w.mitigation.map(m => `- [${m.priority.toUpperCase()}] ${m.strategy}: ${m.implementation}`).join('\n')}

${w.mitigated ? '✅ **Status:** Mitigiert - ' + (w.mitigationNote || '') : '❌ **Status:** Noch nicht adressiert'}
`).join('\n---\n')}
    `.trim();
  }
}

// Exportiere alle Services
export const ScientificServices = {
  Memo: MemoService,
  ExplainableAI: ExplainableAIService,
  BiasDetection: BiasDetectionService
};

export default ScientificServices;
