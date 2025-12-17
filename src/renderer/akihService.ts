// akihService.ts
// Complete AKIH Score Calculation Service based on the scientific documentation
// Version 3.0 - Quantum Enhanced

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
  documentCoverage: number;      // D1
  categoryQuality: number;        // D2
  codingDensity: number;         // D3
  reliability: number;           // D4
  validity: number;              // D5
  iterationDepth: number;        // D6
  patternRecognition: number;    // D7
  theoreticalSaturation: number; // D8
  metaIntelligence: number;      // D9
  publicationReadiness: number;  // D10
}

interface AKIHMultipliers {
  neuralEnhancement: number;     // NE
  quantumAmplification: number;  // QA
  confidenceIndex: number;       // CI
  patternRecognitionBonus: number; // PR
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

class AKIHService {
  // Dimension weights according to AKIH documentation
  private readonly weights = {
    documentCoverage: 0.12,
    categoryQuality: 0.15,
    codingDensity: 0.10,
    reliability: 0.13,
    validity: 0.13,
    iterationDepth: 0.08,
    patternRecognition: 0.10,
    theoreticalSaturation: 0.09,
    metaIntelligence: 0.05,
    publicationReadiness: 0.05
  };

  // Exponents for multipliers
  private readonly exponents = {
    alpha: 1.0,    // Base score
    beta: 0.3,     // Neural Enhancement
    gamma: 0.2,    // Quantum Amplification
    delta: 0.15,   // Confidence Index
    epsilon: 0.1   // Pattern Recognition Bonus
  };

  /**
   * Main calculation method
   */
  async calculateAKIHScore(project: Project): Promise<AKIHScore> {
    const startTime = performance.now();

    // Calculate all dimensions
    const dimensions = this.calculateDimensions(project);

    // Calculate multipliers
    const multipliers = this.calculateMultipliers(project, dimensions);

    // Calculate base score
    const baseScore = this.calculateBaseScore(dimensions);

    // Apply multipliers with exponents
    const total = this.applyMultipliers(baseScore, multipliers);

    // Calculate additional metrics
    const qualityMetrics = this.calculateQualityMetrics(project);
    const quantumFactors = this.calculateQuantumFactors(project);
    const publicationAssessment = this.assessPublication(total, dimensions);
    const recommendations = this.generateRecommendations(dimensions, total);

    const calculationTime = performance.now() - startTime;

    return {
      total: Math.min(100, total * 100), // Normalize to 0-100
      grade: this.calculateGrade(total * 100),
      dimensions,
      multipliers,
      baseScore,
      confidence: multipliers.confidenceIndex,
      neuralEnhancement: multipliers.neuralEnhancement,
      quantumFactors,
      patterns: this.extractPatterns(project),
      publication: publicationAssessment,
      qualityMetrics,
      recommendations,
      calculationTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate all 10 dimensions
   */
  private calculateDimensions(project: Project): AKIHDimensions {
    return {
      documentCoverage: this.calculateD1_DocumentCoverage(project),
      categoryQuality: this.calculateD2_CategoryQuality(project),
      codingDensity: this.calculateD3_CodingDensity(project),
      reliability: this.calculateD4_Reliability(project),
      validity: this.calculateD5_Validity(project),
      iterationDepth: this.calculateD6_IterationDepth(project),
      patternRecognition: this.calculateD7_PatternRecognition(project),
      theoreticalSaturation: this.calculateD8_TheoreticalSaturation(project),
      metaIntelligence: this.calculateD9_MetaIntelligence(project),
      publicationReadiness: this.calculateD10_PublicationReadiness(project)
    };
  }

  /**
   * D1: Document Coverage
   * Formula: D1 = min(1, n_docs / 10) × (1 + log(total_words / 10000))
   */
  private calculateD1_DocumentCoverage(project: Project): number {
    const nDocs = project.documents.length;
    const totalWords = project.documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0);

    if (nDocs === 0 || totalWords === 0) return 0;

    const docFactor = Math.min(1, nDocs / 10);
    const wordFactor = 1 + Math.log10(Math.max(1, totalWords / 10000));

    return Math.min(1, docFactor * wordFactor);
  }

  /**
   * D2: Category Quality
   * Formula: D2 = (n_categories / 12) × avg_confidence × (1 - overlap_ratio)
   */
  private calculateD2_CategoryQuality(project: Project): number {
    const nCategories = project.categories.length;
    if (nCategories === 0) return 0;

    // Calculate average confidence
    const avgConfidence = project.categories.reduce((sum, cat) =>
      sum + (cat.confidence || 0.8), 0) / nCategories;

    // Estimate overlap ratio (simplified - in real implementation would need semantic analysis)
    const overlapRatio = this.estimateCategoryOverlap(project.categories);

    const categoryFactor = Math.min(1, nCategories / 12);

    return categoryFactor * avgConfidence * (1 - overlapRatio);
  }

  /**
   * D3: Coding Density
   * Formula: D3 = tanh(n_codings / 100) × coverage_ratio
   */
  private calculateD3_CodingDensity(project: Project): number {
    const nCodings = project.codings.length;
    const totalWords = project.documents.reduce((sum, doc) => sum + (doc.wordCount || 0), 0);

    if (totalWords === 0) return 0;

    // Estimate coverage ratio
    const codedWords = nCodings * 20; // Assume average 20 words per coding
    const coverageRatio = Math.min(1, codedWords / totalWords);

    // Use tanh for saturation effect
    const densityFactor = Math.tanh(nCodings / 100);

    return densityFactor * coverageRatio;
  }

  /**
   * D4: Reliability (Inter-Rater Reliability)
   * Formula: D4 = (kappa + consensus_ratio) / 2
   */
  private calculateD4_Reliability(project: Project): number {
    const kappa = project.reliability?.kappa || 0;
    const consensusRatio = project.codings.filter(c => c.hasConsensus).length /
                           Math.max(1, project.codings.length);

    return (kappa + consensusRatio) / 2;
  }

  /**
   * D5: Validity
   * Based on theoretical alignment and coding consistency
   */
  private calculateD5_Validity(project: Project): number {
    if (project.codings.length === 0) return 0;

    // Calculate average confidence as proxy for validity
    const avgConfidence = project.codings.reduce((sum, c) => sum + c.confidence, 0) /
                         project.codings.length;

    // Check for temporal consistency (newer codings should have higher confidence)
    const temporalConsistency = this.calculateTemporalConsistency(project.codings);

    return (avgConfidence + temporalConsistency) / 2;
  }

  /**
   * D6: Iteration Depth
   * Based on number of analysis iterations
   */
  private calculateD6_IterationDepth(project: Project): number {
    const iterations = project.metaIterations || 1;
    // Logarithmic scale with diminishing returns
    return Math.min(1, Math.log10(iterations + 1) / Math.log10(10));
  }

  /**
   * D7: Pattern Recognition
   * Based on identified patterns in the data
   */
  private calculateD7_PatternRecognition(project: Project): number {
    const patterns = project.patterns || [];
    const nCategories = project.categories.length;

    if (nCategories === 0) return 0;

    // Expected patterns based on categories
    const expectedPatterns = (nCategories * (nCategories - 1)) / 2;
    const foundPatterns = patterns.length;

    return Math.min(1, foundPatterns / Math.max(1, expectedPatterns));
  }

  /**
   * D8: Theoretical Saturation
   * Point where no new categories emerge
   */
  private calculateD8_TheoreticalSaturation(project: Project): number {
    const nCodings = project.codings.length;
    const nCategories = project.categories.length;

    if (nCodings === 0 || nCategories === 0) return 0;

    // Saturation ratio: codings per category
    const saturationRatio = nCodings / nCategories;

    // Use sigmoid function for saturation curve
    return 1 / (1 + Math.exp(-0.1 * (saturationRatio - 30)));
  }

  /**
   * D9: Meta Intelligence
   * Self-reflective analysis capability
   */
  private calculateD9_MetaIntelligence(project: Project): number {
    // Check for meta-analysis indicators
    const hasIterations = (project.metaIterations || 0) > 1;
    const hasPatterns = (project.patterns?.length || 0) > 0;
    const hasReliability = project.reliability !== null;

    const metaScore = (hasIterations ? 0.4 : 0) +
                     (hasPatterns ? 0.3 : 0) +
                     (hasReliability ? 0.3 : 0);

    return metaScore;
  }

  /**
   * D10: Publication Readiness
   * Overall quality for academic publication
   */
  private calculateD10_PublicationReadiness(project: Project): number {
    const minDocs = project.documents.length >= 5;
    const minCategories = project.categories.length >= 5;
    const minCodings = project.codings.length >= 50;
    const hasReliability = (project.reliability?.kappa || 0) > 0.6;

    const readinessFactors = [
      minDocs ? 0.25 : 0,
      minCategories ? 0.25 : 0,
      minCodings ? 0.25 : 0,
      hasReliability ? 0.25 : 0
    ];

    return readinessFactors.reduce((sum, factor) => sum + factor, 0);
  }

  /**
   * Calculate multipliers
   */
  private calculateMultipliers(project: Project, dimensions: AKIHDimensions): AKIHMultipliers {
    return {
      neuralEnhancement: this.calculateNeuralEnhancement(project, dimensions),
      quantumAmplification: this.calculateQuantumAmplification(project),
      confidenceIndex: this.calculateConfidenceIndex(dimensions),
      patternRecognitionBonus: this.calculatePatternBonus(project)
    };
  }

  /**
   * Neural Enhancement Factor (NE)
   * Range: 1.0 - 2.0
   */
  private calculateNeuralEnhancement(project: Project, dimensions: AKIHDimensions): number {
    // Based on AI-assisted analysis depth
    const aiCoverage = project.codings.filter(c => c.confidence > 0.7).length /
                      Math.max(1, project.codings.length);

    const complexityFactor = Math.min(1, project.categories.length / 10);

    return 1.0 + (aiCoverage * complexityFactor);
  }

  /**
   * Quantum Amplification (QA)
   * Range: 1.0 - 1.5
   */
  private calculateQuantumAmplification(project: Project): number {
    // Simulated quantum factors
    const superposition = this.calculateSuperposition(project);
    const entanglement = this.calculateEntanglement(project);
    const coherence = this.calculateCoherence(project);

    return 1.0 + (0.5 * (superposition + entanglement + coherence) / 3);
  }

  /**
   * Confidence Index (CI)
   * Range: 0.5 - 1.0
   */
  private calculateConfidenceIndex(dimensions: AKIHDimensions): number {
    // Geometric mean of all dimensions
    const values = Object.values(dimensions);
    const product = values.reduce((prod, val) => prod * Math.max(0.01, val), 1);
    const geometricMean = Math.pow(product, 1 / values.length);

    return 0.5 + (0.5 * geometricMean);
  }

  /**
   * Pattern Recognition Bonus (PR)
   * Range: 1.0 - 1.3
   */
  private calculatePatternBonus(project: Project): number {
    const patterns = project.patterns || [];
    const expectedPatterns = Math.max(10, project.categories.length * 2);
    const ratio = Math.min(1, patterns.length / expectedPatterns);

    return 1.0 + (0.3 * ratio);
  }

  /**
   * Calculate base score from weighted dimensions
   */
  private calculateBaseScore(dimensions: AKIHDimensions): number {
    const weightedSum =
      this.weights.documentCoverage * dimensions.documentCoverage +
      this.weights.categoryQuality * dimensions.categoryQuality +
      this.weights.codingDensity * dimensions.codingDensity +
      this.weights.reliability * dimensions.reliability +
      this.weights.validity * dimensions.validity +
      this.weights.iterationDepth * dimensions.iterationDepth +
      this.weights.patternRecognition * dimensions.patternRecognition +
      this.weights.theoreticalSaturation * dimensions.theoreticalSaturation +
      this.weights.metaIntelligence * dimensions.metaIntelligence +
      this.weights.publicationReadiness * dimensions.publicationReadiness;

    return weightedSum;
  }

  /**
   * Apply multipliers with exponents
   */
  private applyMultipliers(baseScore: number, multipliers: AKIHMultipliers): number {
    return Math.pow(baseScore, this.exponents.alpha) *
           Math.pow(multipliers.neuralEnhancement, this.exponents.beta) *
           Math.pow(multipliers.quantumAmplification, this.exponents.gamma) *
           Math.pow(multipliers.confidenceIndex, this.exponents.delta) *
           Math.pow(multipliers.patternRecognitionBonus, this.exponents.epsilon);
  }

  /**
   * Calculate grade based on score
   */
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

  /**
   * Calculate quality metrics
   */
  private calculateQualityMetrics(project: Project): any {
    const totalCodings = project.codings.length;
    const consensusCodings = project.codings.filter(c => c.hasConsensus).length;
    const highConfidenceCodings = project.codings.filter(c => c.confidence > 0.8).length;

    const precision = totalCodings > 0 ? highConfidenceCodings / totalCodings : 0;
    const recall = totalCodings > 0 ? consensusCodings / totalCodings : 0;
    const f1Score = precision + recall > 0 ?
                    2 * (precision * recall) / (precision + recall) : 0;

    return {
      precision,
      recall,
      f1Score,
      accuracy: (precision + recall) / 2,
      cohenKappa: project.reliability?.kappa || 0,
      cronbachAlpha: this.estimateCronbachAlpha(project)
    };
  }

  /**
   * Calculate quantum factors
   */
  private calculateQuantumFactors(project: Project): any {
    const superposition = this.calculateSuperposition(project);
    const entanglement = this.calculateEntanglement(project);
    const coherence = this.calculateCoherence(project);
    const interference = this.calculateInterference(project);

    return {
      superposition,
      entanglement,
      coherence,
      interference,
      total: (superposition + entanglement + coherence + interference) / 4
    };
  }

  /**
   * Assess publication readiness
   */
  private assessPublication(score: number, dimensions: AKIHDimensions): any {
    const ready = score > 80;
    const level = score > 90 ? 'Top-Tier International' :
                  score > 80 ? 'Standard International' :
                  score > 70 ? 'National/Regional' :
                  'Conference/Workshop';

    const strengths = Object.entries(dimensions)
      .filter(([_, value]) => value > 0.7)
      .map(([key, value]) => ({
        dimension: key,
        score: value,
        level: value > 0.9 ? 'Exceptional' : value > 0.8 ? 'Strong' : 'Good'
      }));

    const weaknesses = Object.entries(dimensions)
      .filter(([_, value]) => value < 0.5)
      .map(([key, value]) => ({
        dimension: key,
        score: value,
        severity: value < 0.2 ? 'Critical' : value < 0.35 ? 'Major' : 'Minor'
      }));

    return {
      ready,
      level,
      targetJournals: this.suggestJournals(score),
      strengths,
      weaknesses,
      estimatedRevisionTime: this.estimateRevisionTime(weaknesses),
      publicationProbability: Math.min(0.95, score / 100)
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(dimensions: AKIHDimensions, totalScore: number): any[] {
    const recommendations = [];

    Object.entries(dimensions).forEach(([key, value]) => {
      if (value < 0.7) {
        recommendations.push({
          dimension: key,
          currentScore: value,
          targetScore: 0.8,
          priority: value < 0.3 ? 'Critical' : value < 0.5 ? 'High' : 'Medium',
          estimatedImpact: (0.8 - value) * this.weights[key as keyof typeof this.weights],
          actions: this.getImprovementActions(key, value)
        });
      }
    });

    return recommendations.sort((a, b) => b.estimatedImpact - a.estimatedImpact);
  }

  // Helper methods

  private estimateCategoryOverlap(categories: any[]): number {
    // Simplified overlap estimation
    const keywords = categories.flatMap(c => c.keywords || []);
    const uniqueKeywords = new Set(keywords);
    return keywords.length > 0 ? 1 - (uniqueKeywords.size / keywords.length) : 0;
  }

  private calculateTemporalConsistency(codings: any[]): number {
    if (codings.length < 2) return 1;

    const sortedCodings = [...codings].sort((a, b) =>
      new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );

    let consistencySum = 0;
    for (let i = 1; i < sortedCodings.length; i++) {
      if (sortedCodings[i].confidence >= sortedCodings[i-1].confidence) {
        consistencySum++;
      }
    }

    return consistencySum / (sortedCodings.length - 1);
  }

  private calculateSuperposition(project: Project): number {
    // Multiple interpretations per coding
    const multiInterpretations = project.codings.filter(c => c.confidence < 0.9 && c.confidence > 0.5).length;
    return Math.min(1, multiInterpretations / Math.max(1, project.codings.length));
  }

  private calculateEntanglement(project: Project): number {
    // Category interconnections
    const patterns = project.patterns || [];
    const categoryPairs = (project.categories.length * (project.categories.length - 1)) / 2;
    return categoryPairs > 0 ? Math.min(1, patterns.length / categoryPairs) : 0;
  }

  private calculateCoherence(project: Project): number {
    // Consistency across codings
    const avgConfidence = project.codings.reduce((sum, c) => sum + c.confidence, 0) /
                         Math.max(1, project.codings.length);
    return avgConfidence;
  }

  private calculateInterference(project: Project): number {
    // Pattern reinforcement
    const patterns = project.patterns || [];
    return Math.min(1, patterns.length / 20);
  }

  private extractPatterns(project: Project): any[] {
    // Extract and format patterns
    const patterns = project.patterns;
    if (!patterns || !Array.isArray(patterns)) {
      return [];
    }
    return patterns.slice(0, 20).map(p => ({
      type: p.type || 'discovered',
      category: p.category,
      count: p.count || 1,
      confidence: p.confidence || 0.8
    }));
  }

  private suggestJournals(score: number): string[] {
    if (score >= 95) return ['Nature', 'Science', 'Cell'];
    if (score >= 90) return ['Nature Methods', 'Nature Human Behaviour', 'PNAS'];
    if (score >= 85) return ['Journal of Mixed Methods Research', 'Qualitative Research', 'Research Methods'];
    if (score >= 80) return ['International Journal of Qualitative Methods', 'Qualitative Inquiry'];
    if (score >= 75) return ['Forum: Qualitative Social Research', 'Qualitative Research Journal'];
    return ['Conference Proceedings', 'Working Papers'];
  }

  private estimateRevisionTime(weaknesses: any[]): string {
    const criticalCount = weaknesses.filter(w => w.severity === 'Critical').length;
    const majorCount = weaknesses.filter(w => w.severity === 'Major').length;

    if (criticalCount > 2) return '3-6 months';
    if (criticalCount > 0 || majorCount > 3) return '1-3 months';
    if (majorCount > 0) return '2-4 weeks';
    return '1 week';
  }

  private estimateCronbachAlpha(project: Project): number {
    // Simplified Cronbach's alpha estimation
    const n = project.categories.length;
    if (n < 2) return 0;

    const avgCorrelation = 0.3; // Assumed average inter-item correlation
    return (n * avgCorrelation) / (1 + (n - 1) * avgCorrelation);
  }

  private getImprovementActions(dimension: string, currentScore: number): string[] {
    const actions: { [key: string]: string[] } = {
      documentCoverage: [
        'Add more documents to the analysis',
        'Include documents with higher word count',
        'Diversify document sources'
      ],
      categoryQuality: [
        'Refine category descriptions',
        'Reduce category overlap',
        'Validate categories with literature'
      ],
      codingDensity: [
        'Increase number of codings',
        'Improve text coverage',
        'Code more representative passages'
      ],
      reliability: [
        'Improve inter-rater agreement',
        'Increase consensus codings',
        'Conduct reliability training'
      ],
      validity: [
        'Enhance theoretical alignment',
        'Improve coding consistency',
        'Validate with expert review'
      ],
      iterationDepth: [
        'Conduct additional analysis iterations',
        'Refine categories iteratively',
        'Apply meta-intelligence analysis'
      ],
      patternRecognition: [
        'Identify more patterns',
        'Analyze co-occurrences',
        'Use advanced pattern detection'
      ],
      theoreticalSaturation: [
        'Continue coding until saturation',
        'Ensure adequate coverage per category',
        'Document saturation point'
      ],
      metaIntelligence: [
        'Apply meta-analysis techniques',
        'Conduct self-reflective analysis',
        'Document analytical decisions'
      ],
      publicationReadiness: [
        'Meet minimum requirements',
        'Improve overall quality',
        'Address reviewer concerns'
      ]
    };

    return actions[dimension] || ['Improve this dimension'];
  }
}

// Export singleton instance
export const akihService = new AKIHService();

// Export types for use in other files
export type { AKIHScore, AKIHDimensions, AKIHMultipliers, Project };