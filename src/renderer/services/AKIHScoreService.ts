// 🎯 AKIH Score Service for UI Integration
// Provides AKIH scoring and validation for the renderer process

import { AKIHMethodology, AKIHScoreComponents, AKIHValidationResult } from '../../services/AKIHMethodology';
import type { ProjectData, Coding } from '../../types';

/**
 * Service für UI-Integration des AKIH-Scores
 *
 * Bietet:
 * - AKIH Score Berechnung für Projekt-Dashboards
 * - Kodierungs-Validierung mit visuellen Rückmeldungen
 * - Qualitäts-Indikatoren für UI-Komponenten
 */
export class AKIHScoreService {

  /**
   * 📊 Berechnet AKIH Score für Projekt
   */
  static calculateScore(projectData: ProjectData): AKIHScoreComponents {
    return AKIHMethodology.calculateAKIHScore(projectData);
  }

  /**
   * 🔍 Validiert eine einzelne Kodierung
   */
  static validateCoding(
    coding: Coding,
    projectData: ProjectData,
    validator: 'human' | 'ai' | 'consensus' = 'human'
  ): AKIHValidationResult {
    return AKIHMethodology.validateCoding(coding, projectData, validator);
  }

  /**
   * 📋 Generiert Methodologie-Bericht als Markdown
   */
  static generateReport(projectData: ProjectData): string {
    return AKIHMethodology.generateMethodologyReport(projectData);
  }

  /**
   * 🎨 Gibt Farbe für Score zurück (für UI-Visualisierung)
   */
  static getScoreColor(score: number): string {
    if (score >= 85) return '#10b981'; // green-500 (excellent)
    if (score >= 70) return '#3b82f6'; // blue-500 (good)
    if (score >= 55) return '#f59e0b'; // amber-500 (acceptable)
    return '#ef4444'; // red-500 (insufficient)
  }

  /**
   * 📈 Gibt Icon für Qualitätsstufe zurück
   */
  static getQualityIcon(qualityLevel: string): string {
    switch (qualityLevel) {
      case 'excellent': return '⭐';
      case 'good': return '✅';
      case 'acceptable': return '⚠️';
      case 'insufficient': return '❌';
      default: return '❓';
    }
  }

  /**
   * 📝 Gibt deutschen Text für Qualitätsstufe zurück
   */
  static getQualityText(qualityLevel: string, language: 'de' | 'en' = 'de'): string {
    if (language === 'de') {
      switch (qualityLevel) {
        case 'excellent': return 'Exzellent';
        case 'good': return 'Gut';
        case 'acceptable': return 'Akzeptabel';
        case 'insufficient': return 'Unzureichend';
        default: return 'Unbekannt';
      }
    } else {
      switch (qualityLevel) {
        case 'excellent': return 'Excellent';
        case 'good': return 'Good';
        case 'acceptable': return 'Acceptable';
        case 'insufficient': return 'Insufficient';
        default: return 'Unknown';
      }
    }
  }

  /**
   * 💡 Gibt Verbesserungsvorschläge basierend auf Score-Komponenten
   */
  static getSuggestions(score: AKIHScoreComponents, language: 'de' | 'en' = 'de'): string[] {
    const suggestions: string[] = [];

    if (language === 'de') {
      // Kodierungsqualität
      if (score.precision < 0.7) {
        suggestions.push('Mehr Kodierungen validieren (aktuell: ' + (score.precision * 100).toFixed(1) + '%)');
      }
      if (score.recall < 0.6) {
        suggestions.push('Mehr Kodierungen hinzufügen (durchschnittlich ' + score.metrics.averageCodingsPerCategory.toFixed(1) + ' pro Kategorie)');
      }
      if (score.consistency < 0.7) {
        suggestions.push('Konsistenz der Kodierung überprüfen (IRR: ' + (score.consistency * 100).toFixed(1) + '%)');
      }

      // Theoretische Sättigung
      if (score.saturation < 0.6) {
        suggestions.push('Weitere Dokumente analysieren um theoretische Sättigung zu erreichen');
      }
      if (score.coverage < 0.8) {
        suggestions.push((score.metrics.totalDocuments - score.metrics.analyzedDocuments) + ' Dokumente noch nicht analysiert');
      }

      // Methodische Rigorosität
      if (score.integration < 0.6) {
        suggestions.push('Mehr Musteranalysen durchführen um Kategorien zu vernetzen');
      }
      if (score.traceability < 0.7) {
        suggestions.push('Kategorienbeschreibungen und Kodierungstexte verbessern');
      }
      if (score.reflexivity < 0.5) {
        suggestions.push('Reflexivitäts-Statements zur Forscher-Positionierung hinzufügen');
      }
    } else {
      // English suggestions
      if (score.precision < 0.7) {
        suggestions.push('Validate more codings (currently: ' + (score.precision * 100).toFixed(1) + '%)');
      }
      if (score.recall < 0.6) {
        suggestions.push('Add more codings (average ' + score.metrics.averageCodingsPerCategory.toFixed(1) + ' per category)');
      }
      if (score.consistency < 0.7) {
        suggestions.push('Improve coding consistency (IRR: ' + (score.consistency * 100).toFixed(1) + '%)');
      }

      if (score.saturation < 0.6) {
        suggestions.push('Analyze more documents to reach theoretical saturation');
      }
      if (score.coverage < 0.8) {
        suggestions.push((score.metrics.totalDocuments - score.metrics.analyzedDocuments) + ' documents not yet analyzed');
      }

      if (score.integration < 0.6) {
        suggestions.push('Perform more pattern analysis to connect categories');
      }
      if (score.traceability < 0.7) {
        suggestions.push('Improve category descriptions and coding texts');
      }
      if (score.reflexivity < 0.5) {
        suggestions.push('Add reflexivity statements for researcher positioning');
      }
    }

    return suggestions;
  }

  /**
   * 📊 Gibt zusammenfassende Statistiken für Dashboard zurück
   */
  static getScoreSummary(score: AKIHScoreComponents, language: 'de' | 'en' = 'de'): {
    totalScore: number;
    quality: string;
    qualityIcon: string;
    color: string;
    components: Array<{
      name: string;
      value: number;
      percentage: string;
      status: 'excellent' | 'good' | 'warning' | 'poor';
    }>;
    suggestions: string[];
  } {
    const components = [
      {
        name: language === 'de' ? 'Precision (Genauigkeit)' : 'Precision',
        value: score.precision,
        percentage: (score.precision * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.precision)
      },
      {
        name: language === 'de' ? 'Recall (Vollständigkeit)' : 'Recall',
        value: score.recall,
        percentage: (score.recall * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.recall)
      },
      {
        name: language === 'de' ? 'Consistency (Konsistenz)' : 'Consistency',
        value: score.consistency,
        percentage: (score.consistency * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.consistency)
      },
      {
        name: language === 'de' ? 'Saturation (Sättigung)' : 'Saturation',
        value: score.saturation,
        percentage: (score.saturation * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.saturation)
      },
      {
        name: language === 'de' ? 'Coverage (Abdeckung)' : 'Coverage',
        value: score.coverage,
        percentage: (score.coverage * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.coverage)
      },
      {
        name: language === 'de' ? 'Integration (Vernetzung)' : 'Integration',
        value: score.integration,
        percentage: (score.integration * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.integration)
      },
      {
        name: language === 'de' ? 'Traceability (Nachvollziehbarkeit)' : 'Traceability',
        value: score.traceability,
        percentage: (score.traceability * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.traceability)
      },
      {
        name: language === 'de' ? 'Reflexivity (Reflexivität)' : 'Reflexivity',
        value: score.reflexivity,
        percentage: (score.reflexivity * 100).toFixed(1) + '%',
        status: this.getComponentStatus(score.reflexivity)
      }
    ];

    return {
      totalScore: score.totalScore,
      quality: this.getQualityText(score.qualityLevel, language),
      qualityIcon: this.getQualityIcon(score.qualityLevel),
      color: this.getScoreColor(score.totalScore),
      components,
      suggestions: this.getSuggestions(score, language)
    };
  }

  /**
   * 🎯 Bestimmt Status einer Komponente
   */
  private static getComponentStatus(value: number): 'excellent' | 'good' | 'warning' | 'poor' {
    if (value >= 0.85) return 'excellent';
    if (value >= 0.70) return 'good';
    if (value >= 0.55) return 'warning';
    return 'poor';
  }

  /**
   * 🔄 Batch-Validierung mehrerer Kodierungen
   */
  static validateMultipleCodings(
    codings: Coding[],
    projectData: ProjectData,
    validator: 'human' | 'ai' | 'consensus' = 'ai'
  ): AKIHValidationResult[] {
    return codings.map(coding =>
      this.validateCoding(coding, projectData, validator)
    );
  }

  /**
   * 📈 Berechnet Trend (Vergleich mit vorherigem Score)
   */
  static calculateTrend(currentScore: number, previousScore: number): {
    change: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
    icon: string;
  } {
    const change = currentScore - previousScore;
    const percentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(change) > 1) { // Nur signifikante Änderungen
      trend = change > 0 ? 'up' : 'down';
    }

    const icon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️';

    return {
      change: Math.round(change * 100) / 100,
      percentage: Math.round(percentage * 100) / 100,
      trend,
      icon
    };
  }
}

export default AKIHScoreService;
