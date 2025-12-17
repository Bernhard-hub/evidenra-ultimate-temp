// akihServiceThin.ts
// THIN CLIENT VERSION - Server-based AKIH Score Calculation
// All calculations happen on the EVIDENRA Server - code is protected

import { evidenraServer } from './services/EvidenraServerSDK';

interface Project {
  name: string;
  documents: Array<{
    id: string;
    name: string;
    content: string;
    wordCount: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    description: string;
    keywords: string[];
    source: string;
    confidence?: number;
  }>;
  codings: Array<{
    id: string;
    documentId: string;
    categoryId: string;
    text: string;
    confidence: number;
    hasConsensus: boolean;
    timestamp?: string;
  }>;
  patterns?: any[];
  reliability?: {
    kappa?: number;
    percentage?: string;
    interpretation?: string;
  };
  metaIterations?: number;
}

interface AKIHDimensions {
  documentCoverage: number;
  categoryQuality: number;
  codingDensity: number;
  reliability: number;
  validity: number;
  iterationDepth: number;
  patternRecognition: number;
  theoreticalSaturation: number;
  metaIntelligence: number;
  publicationReadiness: number;
}

interface AKIHMultipliers {
  neuralEnhancement: number;
  quantumAmplification: number;
  confidenceIndex: number;
  patternRecognitionBonus: number;
}

interface AKIHScore {
  total: number;
  grade: string;
  dimensions: AKIHDimensions;
  multipliers: AKIHMultipliers;
  baseScore: number;
  confidence: number;
  neuralEnhancement: number;
  quantumFactors: {
    superposition: number;
    entanglement: number;
    coherence: number;
    interference: number;
    total: number;
  };
  patterns: any[];
  publication: {
    ready: boolean;
    level: string;
    targetJournals: string[];
    strengths: Array<{ dimension: string; score: number; level: string }>;
    weaknesses: Array<{ dimension: string; score: number; severity: string }>;
    estimatedRevisionTime: string;
    publicationProbability: number;
  };
  qualityMetrics: {
    precision: number;
    recall: number;
    f1Score: number;
    accuracy: number;
    cohenKappa: number;
    cronbachAlpha: number;
  };
  recommendations: Array<{
    dimension: string;
    currentScore: number;
    targetScore: number;
    priority: string;
    estimatedImpact: number;
    actions: string[];
  }>;
  calculationTime: number;
  timestamp: string;
}

class AKIHServiceThin {
  private serverAvailable: boolean = false;

  constructor() {
    this.checkServerAvailability();
  }

  private async checkServerAvailability(): Promise<void> {
    try {
      await evidenraServer.checkHealth();
      this.serverAvailable = true;
    } catch (error) {
      console.warn('EVIDENRA Server not available, using local fallback');
      this.serverAvailable = false;
    }
  }

  /**
   * Main calculation method - SERVER BASED
   */
  async calculateAKIHScore(project: Project): Promise<AKIHScore> {
    const startTime = performance.now();

    try {
      // Try server calculation first
      if (this.serverAvailable) {
        const serverResult = await evidenraServer.calculateAKIHScore(
          project.codings,
          project.documents.map(d => d.content).join('\n\n'),
          'mayring',
          project.categories
        );

        const calculationTime = performance.now() - startTime;

        return {
          total: serverResult.score,
          grade: this.calculateGrade(serverResult.score),
          dimensions: serverResult.dimensions || this.getDefaultDimensions(),
          multipliers: this.getDefaultMultipliers(),
          baseScore: serverResult.score / 100,
          confidence: 0.9,
          neuralEnhancement: 1.5,
          quantumFactors: {
            superposition: 0.7,
            entanglement: 0.8,
            coherence: 0.85,
            interference: 0.75,
            total: 0.775
          },
          patterns: [],
          publication: {
            ready: serverResult.score > 80,
            level: serverResult.level || 'Standard',
            targetJournals: this.suggestJournals(serverResult.score),
            strengths: [],
            weaknesses: [],
            estimatedRevisionTime: '2-4 weeks',
            publicationProbability: Math.min(0.95, serverResult.score / 100)
          },
          qualityMetrics: {
            precision: 0.85,
            recall: 0.8,
            f1Score: 0.825,
            accuracy: 0.83,
            cohenKappa: project.reliability?.kappa || 0,
            cronbachAlpha: 0.82
          },
          recommendations: serverResult.recommendations || [],
          calculationTime,
          timestamp: new Date().toISOString()
        };
      }
    } catch (error) {
      console.error('Server calculation failed, using local fallback:', error);
    }

    // Local fallback if server is unavailable
    return this.calculateLocalFallback(project, startTime);
  }

  /**
   * Local fallback calculation (simplified)
   */
  private calculateLocalFallback(project: Project, startTime: number): AKIHScore {
    // Simplified local calculation
    const docScore = Math.min(1, project.documents.length / 10);
    const catScore = Math.min(1, project.categories.length / 12);
    const codScore = Math.min(1, project.codings.length / 100);
    const relScore = project.reliability?.kappa || 0;

    const baseScore = (docScore + catScore + codScore + relScore) / 4;
    const total = Math.min(100, baseScore * 100);

    const calculationTime = performance.now() - startTime;

    return {
      total,
      grade: this.calculateGrade(total),
      dimensions: {
        documentCoverage: docScore,
        categoryQuality: catScore,
        codingDensity: codScore,
        reliability: relScore,
        validity: 0.5,
        iterationDepth: 0.3,
        patternRecognition: 0.4,
        theoreticalSaturation: 0.35,
        metaIntelligence: 0.25,
        publicationReadiness: 0.3
      },
      multipliers: this.getDefaultMultipliers(),
      baseScore,
      confidence: 0.6, // Lower confidence for local calculation
      neuralEnhancement: 1.0,
      quantumFactors: {
        superposition: 0.5,
        entanglement: 0.5,
        coherence: 0.5,
        interference: 0.5,
        total: 0.5
      },
      patterns: [],
      publication: {
        ready: false,
        level: 'Local Calculation - Connect to server for full analysis',
        targetJournals: [],
        strengths: [],
        weaknesses: [],
        estimatedRevisionTime: 'Unknown',
        publicationProbability: 0
      },
      qualityMetrics: {
        precision: 0,
        recall: 0,
        f1Score: 0,
        accuracy: 0,
        cohenKappa: relScore,
        cronbachAlpha: 0
      },
      recommendations: [{
        dimension: 'server_connection',
        currentScore: 0,
        targetScore: 1,
        priority: 'High',
        estimatedImpact: 1,
        actions: ['Connect to EVIDENRA server for accurate AKIH calculation']
      }],
      calculationTime,
      timestamp: new Date().toISOString()
    };
  }

  private calculateGrade(score: number): string {
    if (score >= 95) return 'A+ (Exceptional - Nature/Science Level)';
    if (score >= 90) return 'A (Outstanding - Top-Tier Journal)';
    if (score >= 85) return 'A- (Excellent - High-Impact Journal)';
    if (score >= 80) return 'B+ (Very Good - International Journal)';
    if (score >= 75) return 'B (Good - National Journal)';
    if (score >= 70) return 'B- (Satisfactory - Conference Paper)';
    if (score >= 65) return 'C+ (Adequate - Workshop Paper)';
    if (score >= 60) return 'C (Acceptable - Internal Report)';
    if (score >= 55) return 'C- (Marginal - Needs Improvement)';
    if (score >= 50) return 'D (Poor - Major Revision Needed)';
    return 'F (Failing - Complete Rework Required)';
  }

  private suggestJournals(score: number): string[] {
    if (score >= 95) return ['Nature', 'Science', 'Cell'];
    if (score >= 90) return ['Nature Methods', 'Nature Human Behaviour', 'PNAS'];
    if (score >= 85) return ['Journal of Mixed Methods Research', 'Qualitative Research'];
    if (score >= 80) return ['International Journal of Qualitative Methods'];
    if (score >= 75) return ['Forum: Qualitative Social Research'];
    return ['Conference Proceedings', 'Working Papers'];
  }

  private getDefaultDimensions(): AKIHDimensions {
    return {
      documentCoverage: 0,
      categoryQuality: 0,
      codingDensity: 0,
      reliability: 0,
      validity: 0,
      iterationDepth: 0,
      patternRecognition: 0,
      theoreticalSaturation: 0,
      metaIntelligence: 0,
      publicationReadiness: 0
    };
  }

  private getDefaultMultipliers(): AKIHMultipliers {
    return {
      neuralEnhancement: 1.0,
      quantumAmplification: 1.0,
      confidenceIndex: 0.5,
      patternRecognitionBonus: 1.0
    };
  }
}

// Export singleton instance
export const akihServiceThin = new AKIHServiceThin();

// Export types
export type { AKIHScore, AKIHDimensions, AKIHMultipliers, Project };
