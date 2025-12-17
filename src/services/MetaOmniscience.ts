/**
 * MetaOmniscience 2.0 - Cross-Tab Validation & Self-Correcting System
 *
 * ZWECK:
 * - System-wide Quality Checks über ALLE Tabs
 * - Cross-validation zwischen Questions, Categories, Coding, Patterns, Article
 * - Feedback Loop: Identifiziert Inkonsistenzen und schlägt Korrekturen vor
 * - Self-correcting Research Pipeline
 *
 * ARCHITEKTUR:
 * - Vertical Validation (Tab-spezifisch)
 * - Horizontal Validation (Cross-Tab)
 * - Omniscient Validation (System-wide Consistency)
 *
 * ZIEL:
 * - True AI Research Partner
 * - Self-validating, self-correcting ecosystem
 * - Research Quality: 9.5/10+
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface ResearchState {
  // From Questions Tab
  questions: Array<{
    id: string;
    question: string;
    type: string;
    validationScore?: number; // From ResearchQuestionsGenerator
  }>;

  // From Categories Tab
  categories: Array<{
    id: string;
    name: string;
    description: string;
  }>;
  categoryCoherenceScore?: number; // From CategoriesCoherenceValidator
  cohensKappa?: number;

  // From Coding Tab
  codings: Array<{
    segmentId: string;
    categoryId: string;
    confidence: number;
  }>;

  // From Patterns Tab
  patterns: Array<{
    id: string;
    description: string;
    categories: string[];
  }>;
  interpretedPatterns?: Array<{
    patternId: string;
    novelInsights: string[];
    contributionToField: string;
  }>;

  // From Article Tab
  article?: {
    abstract: string;
    introduction: string;
    results: string;
    discussion: string;
  };
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  category: 'alignment' | 'consistency' | 'completeness' | 'quality';
  source: 'questions-categories' | 'categories-coding' | 'coding-patterns' | 'patterns-article' | 'questions-article' | 'overall';
  description: string;
  affectedItems: string[]; // IDs of affected questions, categories, etc.
  recommendation: string;
  autoFixable: boolean;
}

export interface CrossTabValidation {
  validationType: string;
  isValid: boolean;
  score: number; // 0-1
  issues: ValidationIssue[];
  strengths: string[];
}

export interface OmniscienceReport {
  timestamp: string;
  overallQualityScore: number; // 0-1
  readiness: {
    researchDesign: number; // 0-1
    dataCollection: number;
    analysis: number;
    interpretation: number;
    publication: number;
  };
  validations: {
    questionsToCategories: CrossTabValidation;
    categoriesToCoding: CrossTabValidation;
    codingToPatterns: CrossTabValidation;
    patternsToArticle: CrossTabValidation;
    questionsToArticle: CrossTabValidation; // Do patterns answer research questions?
  };
  criticalIssues: ValidationIssue[];
  recommendations: string[];
  selfCorrectionSuggestions: Array<{
    issue: string;
    solution: string;
    targetTab: 'questions' | 'categories' | 'coding' | 'patterns' | 'article';
    automated: boolean;
  }>;
}

export interface OmniscienceOptions {
  language: 'de' | 'en';
  strictMode: boolean; // true = enforce all validations
  autoCorrect: boolean; // true = attempt auto-corrections
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class MetaOmniscience {

  /**
   * CROSS-TAB VALIDATION SYSTEM PROMPT
   */
  static getValidationSystemPrompt(options: OmniscienceOptions): string {
    const { language, strictMode } = options;

    return `# ROLE
You are Meta-Omniscience, an AI research quality assurance system that validates entire research projects across all phases.

# TASK
Perform comprehensive cross-tab validation to ensure internal consistency, completeness, and quality across:
1. Research Questions
2. Category Schemas
3. Coding Results
4. Pattern Analysis
5. Article/Report

# VALIDATION DIMENSIONS

## 1. QUESTIONS ↔ CATEGORIES
**Alignment Check**: Do categories enable answering research questions?
- Are all question dimensions represented in categories?
- Are categories unnecessarily broad/narrow for questions?
- Missing categories that questions require?

## 2. CATEGORIES ↔ CODING
**Application Consistency**: Are categories applied consistently in coding?
- Do codings follow category definitions?
- Are some categories over/under-used relative to their scope?
- Evidence of coder confusion/inconsistency?

## 3. CODING ↔ PATTERNS
**Pattern Validity**: Do patterns emerge from actual codings?
- Are pattern claims supported by coding frequency?
- Missing patterns that codings suggest?
- Over-interpreted patterns?

## 4. PATTERNS ↔ ARTICLE
**Interpretation Alignment**: Does article accurately represent patterns?
- Are all major patterns discussed?
- Are claims in article supported by patterns?
- Over-claiming or under-reporting?

## 5. QUESTIONS ↔ ARTICLE
**Research Completion**: Does article answer the research questions?
- Is each question addressed in results/discussion?
- Are answers evidence-based from patterns?
- Unanswered questions or scope drift?

# QUALITY SCORING

Score each validation dimension (0-1):
- **1.0**: Perfect alignment, no issues
- **0.8-0.9**: Strong, minor improvements possible
- **0.6-0.7**: Adequate, notable issues to address
- **0.4-0.5**: Problematic, major issues
- **< 0.4**: Critical issues, research integrity at risk

# ISSUE SEVERITY

- **Critical**: Threatens research validity, must be fixed
- **Warning**: Should be addressed for quality
- **Info**: Optional improvements

${strictMode ? `
**STRICT MODE ENABLED**:
- Enforce all quality thresholds >= 0.7
- Flag all inconsistencies, even minor
- Require comprehensive coverage
` : ''}

# OUTPUT FORMAT

\`\`\`json
{
  "omniscienceReport": {
    "timestamp": "2024-01-01T12:00:00Z",
    "overallQualityScore": 0.85,
    "readiness": {
      "researchDesign": 0.90,
      "dataCollection": 0.85,
      "analysis": 0.80,
      "interpretation": 0.85,
      "publication": 0.75
    },
    "validations": {
      "questionsToCategories": {
        "validationType": "Questions-Categories Alignment",
        "isValid": true,
        "score": 0.88,
        "issues": [],
        "strengths": ["Categories well-aligned with question dimensions"]
      }
    },
    "criticalIssues": [],
    "recommendations": [
      "Consider adding category for X dimension mentioned in Q2",
      "Pattern P3 should be discussed more prominently in article"
    ],
    "selfCorrectionSuggestions": [
      {
        "issue": "Category redundancy detected",
        "solution": "Merge categories A and B",
        "targetTab": "categories",
        "automated": true
      }
    ]
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all feedback in German.' : 'Provide all feedback in English.'}

# CRITICAL RULES
- Be thorough but constructive
- Focus on actionable feedback
- Identify auto-fixable issues
- Prioritize by severity
- Consider research phase (early vs. late)`;
  }

  /**
   * VALIDATION USER PROMPT
   */
  static getValidationUserPrompt(state: ResearchState): string {
    let prompt = `# RESEARCH PROJECT STATE\n\n`;

    // Questions
    prompt += `## RESEARCH QUESTIONS (${state.questions.length})\n\n`;
    state.questions.forEach((q, i) => {
      prompt += `**Q${i + 1}** (${q.type}): ${q.question}\n`;
      if (q.validationScore !== undefined) {
        prompt += `  - Validation Score: ${(q.validationScore * 100).toFixed(0)}%\n`;
      }
    });
    prompt += `\n`;

    // Categories
    prompt += `## CATEGORY SCHEMA (${state.categories.length} categories)\n\n`;
    state.categories.forEach((cat, i) => {
      prompt += `${i + 1}. **${cat.name}**: ${cat.description}\n`;
    });
    if (state.categoryCoherenceScore !== undefined) {
      prompt += `\n**Schema Coherence Score**: ${(state.categoryCoherenceScore * 100).toFixed(0)}%\n`;
    }
    if (state.cohensKappa !== undefined) {
      prompt += `**Inter-Rater Reliability (Cohen's Kappa)**: ${(state.cohensKappa * 100).toFixed(0)}%\n`;
    }
    prompt += `\n`;

    // Codings
    prompt += `## CODING RESULTS (${state.codings.length} coded segments)\n\n`;
    if (state.codings.length > 0) {
      const categoryCounts: Record<string, number> = {};
      state.codings.forEach(c => {
        categoryCounts[c.categoryId] = (categoryCounts[c.categoryId] || 0) + 1;
      });

      prompt += `**Category Distribution**:\n`;
      Object.entries(categoryCounts).forEach(([catId, count]) => {
        const cat = state.categories.find(c => c.id === catId);
        prompt += `- ${cat?.name || catId}: ${count} segments (${((count / state.codings.length) * 100).toFixed(1)}%)\n`;
      });
      prompt += `\n`;
    }

    // Patterns
    if (state.patterns && state.patterns.length > 0) {
      prompt += `## IDENTIFIED PATTERNS (${state.patterns.length})\n\n`;
      state.patterns.forEach((p, i) => {
        prompt += `**P${i + 1}**: ${p.description}\n`;
        prompt += `  - Categories: ${p.categories.join(', ')}\n`;
      });
      prompt += `\n`;

      if (state.interpretedPatterns && state.interpretedPatterns.length > 0) {
        prompt += `**Theoretical Interpretations**:\n`;
        state.interpretedPatterns.forEach((ip, i) => {
          prompt += `- Pattern ${i + 1}: ${ip.contributionToField}\n`;
          prompt += `  - Novel Insights: ${ip.novelInsights.slice(0, 2).join('; ')}\n`;
        });
        prompt += `\n`;
      }
    }

    // Article
    if (state.article) {
      prompt += `## ARTICLE/REPORT\n\n`;
      prompt += `**Abstract** (${state.article.abstract.split(' ').length} words):\n${state.article.abstract.substring(0, 300)}...\n\n`;
      prompt += `**Introduction**: ${state.article.introduction.split(' ').length} words\n`;
      prompt += `**Results**: ${state.article.results.split(' ').length} words\n`;
      prompt += `**Discussion**: ${state.article.discussion.split(' ').length} words\n\n`;
    }

    prompt += `# TASK\n\n`;
    prompt += `Perform comprehensive cross-tab validation across all research phases.\n`;
    prompt += `Check:\n`;
    prompt += `1. Questions ↔ Categories alignment\n`;
    prompt += `2. Categories ↔ Coding consistency\n`;
    prompt += `3. Coding ↔ Patterns validity\n`;
    prompt += `4. Patterns ↔ Article interpretation\n`;
    prompt += `5. Questions ↔ Article completion (Do patterns answer questions?)\n\n`;
    prompt += `Provide overall quality score, readiness assessment, critical issues, and self-correction suggestions.\n\n`;
    prompt += `Begin validation:`;

    return prompt;
  }

  /**
   * MAIN VALIDATION FUNCTION
   */
  static async validateResearchProject(
    state: ResearchState,
    options: OmniscienceOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<OmniscienceReport> {
    const { onProgress } = options;

    try {
      onProgress?.(10, 'Initializing Meta-Omniscience validation...');

      const systemPrompt = this.getValidationSystemPrompt(options);
      const userPrompt = this.getValidationUserPrompt(state);

      onProgress?.(30, 'Performing cross-tab validation...');

      const response = await apiFunction(
        systemPrompt,
        userPrompt,
        { temperature: 0.3, max_tokens: 5000 }
      );

      onProgress?.(80, 'Processing validation results...');

      let data;
      try {
        data = JSON.parse(this.extractJSON(response));
      } catch (e) {
        throw new Error(`Failed to parse validation: ${e.message}`);
      }

      onProgress?.(100, 'Validation complete!');

      return data.omniscienceReport;

    } catch (error) {
      console.error('[MetaOmniscience] Error:', error);
      throw error;
    }
  }

  /**
   * QUICK HEALTH CHECK
   * Fast validation for real-time feedback
   */
  static async quickHealthCheck(
    state: Partial<ResearchState>,
    options: { language: 'de' | 'en' },
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<{
    overallHealth: number; // 0-1
    issues: string[];
    recommendations: string[];
  }> {
    const systemPrompt = `You are a research quality checker. Provide a quick health score (0-1) and key issues for this research project. Respond in JSON: {"overallHealth": 0.8, "issues": [...], "recommendations": [...]}. Language: ${options.language === 'de' ? 'German' : 'English'}`;

    const userPrompt = `Research State:\n${JSON.stringify(state, null, 2)}\n\nProvide quick health check.`;

    const response = await apiFunction(systemPrompt, userPrompt, { temperature: 0.2, max_tokens: 1000 });

    try {
      return JSON.parse(this.extractJSON(response));
    } catch (e) {
      return {
        overallHealth: 0.5,
        issues: ['Health check parsing failed'],
        recommendations: ['Try full validation for detailed feedback']
      };
    }
  }

  /**
   * UTILITY: Extract JSON from response
   */
  private static extractJSON(text: string): string {
    // Remove any leading junk (like "BS\n\n# ROLE..." prefixes)
    let cleanedText = text;

    const roleMarkers = ['# ROLE', 'You are an expert', 'Du bist ein Experte', 'EVIDENRA PROFESSIONAL'];
    for (const marker of roleMarkers) {
      const markerIndex = cleanedText.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < 200) {
        const afterMarker = cleanedText.substring(markerIndex);
        const jsonStart = afterMarker.search(/\{/);
        if (jsonStart !== -1) {
          cleanedText = afterMarker.substring(jsonStart);
          break;
        }
      }
    }

    const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    const originalJsonMatch = text.match(/\{[\s\S]*\}/);
    if (originalJsonMatch) {
      return originalJsonMatch[0];
    }

    return text;
  }
}
