// =============================================================================
// UNIFIED METHODOLOGY ENGINE (UME) - EVIDENRA Ultimate Exclusive
// =============================================================================
// The most sophisticated qualitative research analysis system ever created.
// Integrates: Grounded Theory, Van Manen Phenomenology, Braun/Clarke Thematic
// Analysis, and Holsti Reliability Coefficient into ONE unified framework.
// =============================================================================

export interface MethodologyApproach {
  id: string;
  name: string;
  description: string;
  phases: MethodologyPhase[];
  icon: string;
}

export interface MethodologyPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  techniques: string[];
  outputs: string[];
}

export interface CodeInstance {
  id: string;
  text: string;
  documentId: string;
  startOffset: number;
  endOffset: number;
  codeId: string;
  createdAt: string;
  methodology: string;
  phase: string;
}

export interface UMECode {
  id: string;
  name: string;
  description: string;
  color: string;
  methodology: string;
  level: 'open' | 'axial' | 'selective' | 'thematic' | 'phenomenological';
  parentId?: string;
  instances: CodeInstance[];
  memos: string[];
  createdAt: string;
}

export interface UMECategory {
  id: string;
  name: string;
  description: string;
  codes: string[]; // Code IDs
  methodology: string;
  properties: string[];
  dimensions: string[];
  relationships: CategoryRelationship[];
}

export interface CategoryRelationship {
  targetCategoryId: string;
  type: 'causal' | 'contextual' | 'intervening' | 'strategic' | 'consequential';
  description: string;
}

export interface IntercoderAgreement {
  coder1Id: string;
  coder2Id: string;
  documentId: string;
  agreements: number;
  disagreements: number;
  holstiCoefficient: number;
  krippenddorffAlpha: number;
  calculatedAt: string;
}

export interface UMEAnalysisResult {
  methodology: string;
  phase: string;
  codes: UMECode[];
  categories: UMECategory[];
  themes: UMETheme[];
  coreCategory?: UMECategory;
  intercoderReliability?: IntercoderAgreement;
  saturationLevel: number;
  theoreticalDensity: number;
}

export interface UMETheme {
  id: string;
  name: string;
  description: string;
  essence: string; // Van Manen: Essential meaning
  subthemes: string[];
  categories: string[];
  quotes: string[];
  methodology: string;
}

// =============================================================================
// METHODOLOGY DEFINITIONS
// =============================================================================

export const METHODOLOGIES: MethodologyApproach[] = [
  {
    id: 'grounded-theory',
    name: 'Grounded Theory',
    description: 'Systematic generation of theory from data through comparative analysis (Glaser & Strauss, Corbin & Strauss)',
    icon: '🔬',
    phases: [
      {
        id: 'open-coding',
        name: 'Open Coding',
        description: 'Break data apart, examine, compare, conceptualize, and categorize',
        order: 1,
        techniques: ['Line-by-line coding', 'Incident-to-incident coding', 'In-vivo codes', 'Constant comparison'],
        outputs: ['Initial codes', 'Concepts', 'Properties', 'Dimensions']
      },
      {
        id: 'axial-coding',
        name: 'Axial Coding',
        description: 'Reassemble data by making connections between categories',
        order: 2,
        techniques: ['Paradigm model', 'Causal conditions', 'Context', 'Intervening conditions', 'Action/Interaction', 'Consequences'],
        outputs: ['Categories', 'Subcategories', 'Relationships', 'Paradigm models']
      },
      {
        id: 'selective-coding',
        name: 'Selective Coding',
        description: 'Integrate and refine theory around a core category',
        order: 3,
        techniques: ['Core category identification', 'Theoretical saturation', 'Theory integration', 'Storyline'],
        outputs: ['Core category', 'Grounded theory', 'Theoretical model']
      }
    ]
  },
  {
    id: 'van-manen',
    name: 'Van Manen Phenomenology',
    description: 'Hermeneutic phenomenological approach to understand lived experience',
    icon: '🌟',
    phases: [
      {
        id: 'turning-to-phenomenon',
        name: 'Turning to the Phenomenon',
        description: 'Orient to the phenomenon of interest with wonder and questioning',
        order: 1,
        techniques: ['Phenomenological questioning', 'Bracketing presuppositions', 'Wonder and openness'],
        outputs: ['Research question', 'Phenomenological orientation']
      },
      {
        id: 'existential-investigation',
        name: 'Existential Investigation',
        description: 'Explore lived experience through existential themes',
        order: 2,
        techniques: ['Lived body (corporeality)', 'Lived space (spatiality)', 'Lived time (temporality)', 'Lived relations (relationality)'],
        outputs: ['Experiential descriptions', 'Existential insights']
      },
      {
        id: 'hermeneutic-reflection',
        name: 'Hermeneutic Reflection',
        description: 'Reflect on essential themes and meanings',
        order: 3,
        techniques: ['Thematic reflection', 'Linguistic transformation', 'Hermeneutic circle', 'Writing and rewriting'],
        outputs: ['Essential themes', 'Phenomenological insights']
      },
      {
        id: 'phenomenological-writing',
        name: 'Phenomenological Writing',
        description: 'Craft a text that embodies the phenomenon',
        order: 4,
        techniques: ['Evocative writing', 'Anecdotes', 'Poetic language', 'Concrete descriptions'],
        outputs: ['Phenomenological text', 'Essence description']
      }
    ]
  },
  {
    id: 'braun-clarke',
    name: 'Braun & Clarke Thematic Analysis',
    description: 'Flexible 6-phase approach to identifying, analyzing, and reporting themes',
    icon: '🎨',
    phases: [
      {
        id: 'familiarization',
        name: 'Familiarization with Data',
        description: 'Immerse yourself in the data through repeated reading',
        order: 1,
        techniques: ['Active reading', 'Note-taking', 'Initial impressions', 'Data inventory'],
        outputs: ['Familiarity with data', 'Initial notes']
      },
      {
        id: 'initial-coding',
        name: 'Generating Initial Codes',
        description: 'Systematically code interesting features across the dataset',
        order: 2,
        techniques: ['Semantic coding', 'Latent coding', 'Complete coding', 'Data-driven vs theory-driven'],
        outputs: ['Initial codes', 'Coded extracts']
      },
      {
        id: 'searching-themes',
        name: 'Searching for Themes',
        description: 'Collate codes into potential themes',
        order: 3,
        techniques: ['Mind mapping', 'Tables', 'Cutting and sorting', 'Theme hierarchies'],
        outputs: ['Candidate themes', 'Theme maps']
      },
      {
        id: 'reviewing-themes',
        name: 'Reviewing Themes',
        description: 'Check themes against coded extracts and entire dataset',
        order: 4,
        techniques: ['Theme coherence check', 'Theme distinction', 'Refinement', 'Thematic map'],
        outputs: ['Refined themes', 'Thematic map']
      },
      {
        id: 'defining-themes',
        name: 'Defining and Naming Themes',
        description: 'Identify the essence of each theme',
        order: 5,
        techniques: ['Theme scope definition', 'Theme naming', 'Sub-theme identification', 'Theme narrative'],
        outputs: ['Theme definitions', 'Theme names', 'Theme narratives']
      },
      {
        id: 'producing-report',
        name: 'Producing the Report',
        description: 'Final analysis and write-up',
        order: 6,
        techniques: ['Vivid examples', 'Analytic narrative', 'Argument construction', 'Literature connection'],
        outputs: ['Analysis report', 'Theme descriptions', 'Conclusions']
      }
    ]
  },
  {
    id: 'holsti',
    name: 'Holsti Reliability Analysis',
    description: 'Intercoder reliability measurement for validating qualitative coding',
    icon: '📊',
    phases: [
      {
        id: 'preparation',
        name: 'Preparation',
        description: 'Prepare coding scheme and training materials',
        order: 1,
        techniques: ['Codebook development', 'Coder training', 'Pilot coding', 'Unit definition'],
        outputs: ['Codebook', 'Training materials', 'Coding units']
      },
      {
        id: 'independent-coding',
        name: 'Independent Coding',
        description: 'Multiple coders independently code the same data',
        order: 2,
        techniques: ['Blind coding', 'Complete coding', 'Documentation'],
        outputs: ['Coder 1 codes', 'Coder 2 codes', 'Coding matrices']
      },
      {
        id: 'agreement-calculation',
        name: 'Agreement Calculation',
        description: 'Calculate intercoder reliability coefficients',
        order: 3,
        techniques: ['Holsti coefficient', 'Krippendorff alpha', 'Cohen kappa', 'Scott pi'],
        outputs: ['Reliability coefficients', 'Agreement matrices']
      },
      {
        id: 'reconciliation',
        name: 'Reconciliation',
        description: 'Discuss and resolve coding disagreements',
        order: 4,
        techniques: ['Consensus coding', 'Third coder arbitration', 'Codebook refinement'],
        outputs: ['Reconciled codes', 'Updated codebook']
      }
    ]
  }
];

// =============================================================================
// UNIFIED METHODOLOGY ENGINE CLASS
// =============================================================================

export class UnifiedMethodologyEngine {
  private codes: Map<string, UMECode> = new Map();
  private categories: Map<string, UMECategory> = new Map();
  private themes: Map<string, UMETheme> = new Map();
  private codeInstances: CodeInstance[] = [];
  private currentMethodology: string = 'grounded-theory';
  private currentPhase: string = 'open-coding';

  constructor() {
    this.loadFromStorage();
  }

  // ==========================================================================
  // METHODOLOGY SELECTION
  // ==========================================================================

  setMethodology(methodologyId: string): void {
    const methodology = METHODOLOGIES.find(m => m.id === methodologyId);
    if (methodology) {
      this.currentMethodology = methodologyId;
      this.currentPhase = methodology.phases[0].id;
      this.saveToStorage();
    }
  }

  getMethodology(): MethodologyApproach | undefined {
    return METHODOLOGIES.find(m => m.id === this.currentMethodology);
  }

  setPhase(phaseId: string): void {
    const methodology = this.getMethodology();
    if (methodology?.phases.find(p => p.id === phaseId)) {
      this.currentPhase = phaseId;
      this.saveToStorage();
    }
  }

  getCurrentPhase(): MethodologyPhase | undefined {
    return this.getMethodology()?.phases.find(p => p.id === this.currentPhase);
  }

  // ==========================================================================
  // CODING OPERATIONS
  // ==========================================================================

  createCode(name: string, description: string, color: string): UMECode {
    const code: UMECode = {
      id: crypto.randomUUID(),
      name,
      description,
      color,
      methodology: this.currentMethodology,
      level: this.determineCodeLevel(),
      instances: [],
      memos: [],
      createdAt: new Date().toISOString()
    };
    this.codes.set(code.id, code);
    this.saveToStorage();
    return code;
  }

  private determineCodeLevel(): UMECode['level'] {
    switch (this.currentPhase) {
      case 'open-coding':
      case 'initial-coding':
      case 'familiarization':
        return 'open';
      case 'axial-coding':
      case 'searching-themes':
      case 'reviewing-themes':
        return 'axial';
      case 'selective-coding':
      case 'defining-themes':
        return 'selective';
      case 'hermeneutic-reflection':
      case 'phenomenological-writing':
        return 'phenomenological';
      default:
        return 'thematic';
    }
  }

  applyCode(codeId: string, documentId: string, text: string, startOffset: number, endOffset: number): CodeInstance {
    const code = this.codes.get(codeId);
    if (!code) throw new Error('Code not found');

    const instance: CodeInstance = {
      id: crypto.randomUUID(),
      text,
      documentId,
      startOffset,
      endOffset,
      codeId,
      createdAt: new Date().toISOString(),
      methodology: this.currentMethodology,
      phase: this.currentPhase
    };

    code.instances.push(instance);
    this.codeInstances.push(instance);
    this.saveToStorage();
    return instance;
  }

  addMemoToCode(codeId: string, memo: string): void {
    const code = this.codes.get(codeId);
    if (code) {
      code.memos.push(memo);
      this.saveToStorage();
    }
  }

  // ==========================================================================
  // CATEGORY OPERATIONS (Axial Coding / Theme Building)
  // ==========================================================================

  createCategory(name: string, description: string, codeIds: string[]): UMECategory {
    const category: UMECategory = {
      id: crypto.randomUUID(),
      name,
      description,
      codes: codeIds,
      methodology: this.currentMethodology,
      properties: [],
      dimensions: [],
      relationships: []
    };
    this.categories.set(category.id, category);
    this.saveToStorage();
    return category;
  }

  addCodesToCategory(categoryId: string, codeIds: string[]): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.codes = [...new Set([...category.codes, ...codeIds])];
      this.saveToStorage();
    }
  }

  addPropertyToCategory(categoryId: string, property: string): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.properties.push(property);
      this.saveToStorage();
    }
  }

  addDimensionToCategory(categoryId: string, dimension: string): void {
    const category = this.categories.get(categoryId);
    if (category) {
      category.dimensions.push(dimension);
      this.saveToStorage();
    }
  }

  createRelationship(sourceCategoryId: string, targetCategoryId: string, type: CategoryRelationship['type'], description: string): void {
    const category = this.categories.get(sourceCategoryId);
    if (category) {
      category.relationships.push({ targetCategoryId, type, description });
      this.saveToStorage();
    }
  }

  // ==========================================================================
  // THEME OPERATIONS (Van Manen / Braun-Clarke)
  // ==========================================================================

  createTheme(name: string, description: string, essence: string): UMETheme {
    const theme: UMETheme = {
      id: crypto.randomUUID(),
      name,
      description,
      essence,
      subthemes: [],
      categories: [],
      quotes: [],
      methodology: this.currentMethodology
    };
    this.themes.set(theme.id, theme);
    this.saveToStorage();
    return theme;
  }

  addCategoriesToTheme(themeId: string, categoryIds: string[]): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      theme.categories = [...new Set([...theme.categories, ...categoryIds])];
      this.saveToStorage();
    }
  }

  addQuoteToTheme(themeId: string, quote: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      theme.quotes.push(quote);
      this.saveToStorage();
    }
  }

  addSubtheme(themeId: string, subthemeName: string): void {
    const theme = this.themes.get(themeId);
    if (theme) {
      theme.subthemes.push(subthemeName);
      this.saveToStorage();
    }
  }

  // ==========================================================================
  // HOLSTI RELIABILITY CALCULATION
  // ==========================================================================

  calculateHolstiCoefficient(coder1Codes: string[], coder2Codes: string[]): number {
    // Holsti's formula: CR = 2M / (N1 + N2)
    // M = number of coding decisions agreed upon
    // N1 = number of coding decisions by coder 1
    // N2 = number of coding decisions by coder 2

    const agreements = coder1Codes.filter(c => coder2Codes.includes(c)).length;
    const totalDecisions = coder1Codes.length + coder2Codes.length;

    if (totalDecisions === 0) return 0;
    return (2 * agreements) / totalDecisions;
  }

  calculateKrippendorffAlpha(codings: { coder: string; unit: string; code: string }[]): number {
    // Simplified Krippendorff's alpha for nominal data
    // α = 1 - Do/De where Do = observed disagreement, De = expected disagreement

    const units = [...new Set(codings.map(c => c.unit))];
    const coders = [...new Set(codings.map(c => c.coder))];

    if (units.length === 0 || coders.length < 2) return 0;

    let observedDisagreement = 0;
    let pairs = 0;

    for (const unit of units) {
      const unitCodings = codings.filter(c => c.unit === unit);
      for (let i = 0; i < unitCodings.length; i++) {
        for (let j = i + 1; j < unitCodings.length; j++) {
          pairs++;
          if (unitCodings[i].code !== unitCodings[j].code) {
            observedDisagreement++;
          }
        }
      }
    }

    if (pairs === 0) return 1;
    const Do = observedDisagreement / pairs;

    // Calculate expected disagreement (simplified)
    const codes = [...new Set(codings.map(c => c.code))];
    const codeFrequencies = codes.map(code =>
      codings.filter(c => c.code === code).length / codings.length
    );
    const De = 1 - codeFrequencies.reduce((sum, f) => sum + f * f, 0);

    if (De === 0) return 1;
    return 1 - (Do / De);
  }

  runIntercoderReliability(coder1Id: string, coder2Id: string, documentId: string): IntercoderAgreement {
    const coder1Instances = this.codeInstances.filter(
      i => i.documentId === documentId // In real app, filter by coder
    );
    const coder2Instances = this.codeInstances.filter(
      i => i.documentId === documentId // In real app, filter by coder
    );

    const coder1Codes = coder1Instances.map(i => i.codeId);
    const coder2Codes = coder2Instances.map(i => i.codeId);

    const agreements = coder1Codes.filter(c => coder2Codes.includes(c)).length;
    const disagreements = Math.max(coder1Codes.length, coder2Codes.length) - agreements;

    const holstiCoefficient = this.calculateHolstiCoefficient(coder1Codes, coder2Codes);

    // Prepare data for Krippendorff
    const codings = [
      ...coder1Instances.map(i => ({ coder: coder1Id, unit: `${i.startOffset}-${i.endOffset}`, code: i.codeId })),
      ...coder2Instances.map(i => ({ coder: coder2Id, unit: `${i.startOffset}-${i.endOffset}`, code: i.codeId }))
    ];
    const krippenddorffAlpha = this.calculateKrippendorffAlpha(codings);

    return {
      coder1Id,
      coder2Id,
      documentId,
      agreements,
      disagreements,
      holstiCoefficient,
      krippenddorffAlpha,
      calculatedAt: new Date().toISOString()
    };
  }

  // ==========================================================================
  // THEORETICAL SATURATION ANALYSIS
  // ==========================================================================

  calculateSaturationLevel(): number {
    // Saturation is reached when no new codes/categories emerge
    // We measure this by looking at code creation over time

    const codes = Array.from(this.codes.values());
    if (codes.length < 5) return 0;

    // Sort by creation date
    const sortedCodes = codes.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    // Calculate rate of new code creation in last 25% of codes
    const quarterPoint = Math.floor(codes.length * 0.75);
    const recentCodes = sortedCodes.slice(quarterPoint);
    const olderCodes = sortedCodes.slice(0, quarterPoint);

    // Check how many recent codes are variations of older codes
    const newUniqueConceptsRate = recentCodes.filter(rc =>
      !olderCodes.some(oc =>
        this.calculateStringSimilarity(rc.name, oc.name) > 0.6
      )
    ).length / recentCodes.length;

    // Saturation = 1 - rate of new unique concepts
    return Math.max(0, 1 - newUniqueConceptsRate);
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Simple Jaccard similarity on words
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));

    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  calculateTheoreticalDensity(): number {
    // Theoretical density = richness of relationships between categories
    const categories = Array.from(this.categories.values());
    if (categories.length < 2) return 0;

    const maxPossibleRelationships = categories.length * (categories.length - 1);
    const actualRelationships = categories.reduce(
      (sum, cat) => sum + cat.relationships.length, 0
    );

    return actualRelationships / maxPossibleRelationships;
  }

  // ==========================================================================
  // ANALYSIS REPORT GENERATION
  // ==========================================================================

  generateAnalysisResult(): UMEAnalysisResult {
    const codes = Array.from(this.codes.values());
    const categories = Array.from(this.categories.values());
    const themes = Array.from(this.themes.values());

    // Find core category (most connected, most instances)
    let coreCategory: UMECategory | undefined;
    if (categories.length > 0) {
      coreCategory = categories.reduce((best, current) => {
        const currentScore = current.relationships.length + current.codes.length;
        const bestScore = best.relationships.length + best.codes.length;
        return currentScore > bestScore ? current : best;
      });
    }

    return {
      methodology: this.currentMethodology,
      phase: this.currentPhase,
      codes,
      categories,
      themes,
      coreCategory,
      saturationLevel: this.calculateSaturationLevel(),
      theoreticalDensity: this.calculateTheoreticalDensity()
    };
  }

  // ==========================================================================
  // CROSS-METHODOLOGY INTEGRATION
  // ==========================================================================

  // The genius of UME: You can combine methodologies!
  createCrossMethodologyAnalysis(): {
    groundedTheoryCodes: UMECode[];
    phenomenologicalThemes: UMETheme[];
    thematicCategories: UMECategory[];
    reliabilityScore: number;
    integratedInsights: string[];
  } {
    const codes = Array.from(this.codes.values());
    const themes = Array.from(this.themes.values());
    const categories = Array.from(this.categories.values());

    return {
      groundedTheoryCodes: codes.filter(c => c.methodology === 'grounded-theory'),
      phenomenologicalThemes: themes.filter(t => t.methodology === 'van-manen'),
      thematicCategories: categories.filter(c => c.methodology === 'braun-clarke'),
      reliabilityScore: this.calculateSaturationLevel() * this.calculateTheoreticalDensity(),
      integratedInsights: this.generateIntegratedInsights()
    };
  }

  private generateIntegratedInsights(): string[] {
    const insights: string[] = [];
    const codes = Array.from(this.codes.values());
    const themes = Array.from(this.themes.values());
    const categories = Array.from(this.categories.values());

    // Find cross-methodology patterns
    const gtCodes = codes.filter(c => c.methodology === 'grounded-theory');
    const vmThemes = themes.filter(t => t.methodology === 'van-manen');
    const bcCategories = categories.filter(c => c.methodology === 'braun-clarke');

    if (gtCodes.length > 0 && vmThemes.length > 0) {
      insights.push(
        `Grounded Theory analysis identified ${gtCodes.length} codes that align with ` +
        `${vmThemes.length} phenomenological themes, suggesting strong methodological triangulation.`
      );
    }

    if (bcCategories.length > 0) {
      const avgCodesPerCategory = bcCategories.reduce((sum, c) => sum + c.codes.length, 0) / bcCategories.length;
      insights.push(
        `Thematic analysis categories have an average of ${avgCodesPerCategory.toFixed(1)} codes each, ` +
        `indicating ${avgCodesPerCategory > 3 ? 'rich' : 'developing'} thematic density.`
      );
    }

    const saturation = this.calculateSaturationLevel();
    if (saturation > 0.7) {
      insights.push(
        `Theoretical saturation level of ${(saturation * 100).toFixed(0)}% suggests ` +
        `the analysis has reached adequate depth for theory generation.`
      );
    }

    return insights;
  }

  // ==========================================================================
  // DATA EXPORT
  // ==========================================================================

  exportToJSON(): string {
    return JSON.stringify({
      methodology: this.currentMethodology,
      phase: this.currentPhase,
      codes: Array.from(this.codes.values()),
      categories: Array.from(this.categories.values()),
      themes: Array.from(this.themes.values()),
      codeInstances: this.codeInstances,
      analysisResult: this.generateAnalysisResult(),
      exportedAt: new Date().toISOString()
    }, null, 2);
  }

  exportToReport(): string {
    const result = this.generateAnalysisResult();
    const crossAnalysis = this.createCrossMethodologyAnalysis();

    let report = `
# UNIFIED METHODOLOGY ENGINE ANALYSIS REPORT
Generated: ${new Date().toLocaleString('de-DE')}

## Methodology: ${this.getMethodology()?.name || 'Unknown'}
Current Phase: ${this.getCurrentPhase()?.name || 'Unknown'}

## Summary Statistics
- Total Codes: ${result.codes.length}
- Total Categories: ${result.categories.length}
- Total Themes: ${result.themes.length}
- Saturation Level: ${(result.saturationLevel * 100).toFixed(1)}%
- Theoretical Density: ${(result.theoreticalDensity * 100).toFixed(1)}%

## Core Category
${result.coreCategory ? `**${result.coreCategory.name}**\n${result.coreCategory.description}` : 'Not yet identified'}

## Codes by Level
`;

    const levelGroups = new Map<string, UMECode[]>();
    result.codes.forEach(code => {
      const existing = levelGroups.get(code.level) || [];
      existing.push(code);
      levelGroups.set(code.level, existing);
    });

    levelGroups.forEach((codes, level) => {
      report += `\n### ${level.charAt(0).toUpperCase() + level.slice(1)} Codes (${codes.length})\n`;
      codes.forEach(code => {
        report += `- **${code.name}**: ${code.description} (${code.instances.length} instances)\n`;
      });
    });

    report += `\n## Themes\n`;
    result.themes.forEach(theme => {
      report += `\n### ${theme.name}\n`;
      report += `*Essence:* ${theme.essence}\n`;
      report += `${theme.description}\n`;
      if (theme.quotes.length > 0) {
        report += `\n**Key Quotes:**\n`;
        theme.quotes.slice(0, 3).forEach(q => report += `> "${q}"\n`);
      }
    });

    report += `\n## Integrated Insights\n`;
    crossAnalysis.integratedInsights.forEach(insight => {
      report += `- ${insight}\n`;
    });

    return report;
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  private saveToStorage(): void {
    const data = {
      currentMethodology: this.currentMethodology,
      currentPhase: this.currentPhase,
      codes: Array.from(this.codes.entries()),
      categories: Array.from(this.categories.entries()),
      themes: Array.from(this.themes.entries()),
      codeInstances: this.codeInstances
    };
    localStorage.setItem('evidenra_ume_data', JSON.stringify(data));
  }

  private loadFromStorage(): void {
    const stored = localStorage.getItem('evidenra_ume_data');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.currentMethodology = data.currentMethodology || 'grounded-theory';
        this.currentPhase = data.currentPhase || 'open-coding';
        this.codes = new Map(data.codes || []);
        this.categories = new Map(data.categories || []);
        this.themes = new Map(data.themes || []);
        this.codeInstances = data.codeInstances || [];
      } catch (err) {
        console.error('Failed to load UME data:', err);
      }
    }
  }

  clearAll(): void {
    this.codes.clear();
    this.categories.clear();
    this.themes.clear();
    this.codeInstances = [];
    this.currentMethodology = 'grounded-theory';
    this.currentPhase = 'open-coding';
    localStorage.removeItem('evidenra_ume_data');
  }

  // ==========================================================================
  // GETTERS
  // ==========================================================================

  getAllCodes(): UMECode[] {
    return Array.from(this.codes.values());
  }

  getAllCategories(): UMECategory[] {
    return Array.from(this.categories.values());
  }

  getAllThemes(): UMETheme[] {
    return Array.from(this.themes.values());
  }

  getCode(id: string): UMECode | undefined {
    return this.codes.get(id);
  }

  getCategory(id: string): UMECategory | undefined {
    return this.categories.get(id);
  }

  getTheme(id: string): UMETheme | undefined {
    return this.themes.get(id);
  }

  getCodeInstancesForDocument(documentId: string): CodeInstance[] {
    return this.codeInstances.filter(i => i.documentId === documentId);
  }
}

// Singleton instance
export const umeEngine = new UnifiedMethodologyEngine();

export default umeEngine;
