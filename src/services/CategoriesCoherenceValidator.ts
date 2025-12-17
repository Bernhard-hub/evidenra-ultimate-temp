/**
 * CategoriesCoherenceValidator - Metaprompt System für Kategorie-Schema-Validierung
 *
 * ZWECK:
 * - Validiert Kategorie-Schemata gegen 12 Kohärenz-Dimensionen
 * - Findet Redundanzen und Überlappungen
 * - Validiert Hierarchien und Abstraktionsebenen
 * - Generiert Coding Guidelines für Inter-Rater-Reliability
 * - Behandelt Boundary Cases systematisch
 *
 * ZIEL:
 * - Inter-Rater-Reliability von 0.68 auf 0.85+ verbessern
 * - Kategorie-Qualität von 5/10 auf 8.5/10 erhöhen
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface Category {
  id: string;
  name: string;
  description?: string;
  parent?: string; // ID of parent category for hierarchical schemas
  level?: number; // Hierarchy level (0 = top level)
  examples?: string[]; // Example texts that fit this category
  keywords?: string[]; // Keywords associated with this category
}

export interface CoherenceCriteria {
  mutualExclusivity: number;      // 0-1: Are categories non-overlapping?
  collectiveExhaustiveness: number; // 0-1: Do categories cover all cases?
  granularityConsistency: number;  // 0-1: Is abstraction level consistent?
  hierarchyLogic: number;          // 0-1: Is hierarchy logically sound?
  namingClarity: number;           // 0-1: Are category names clear?
  descriptionQuality: number;      // 0-1: Are descriptions sufficient?
  boundaryDefinition: number;      // 0-1: Are boundaries well-defined?
  theoreticalAlignment: number;    // 0-1: Alignment with theory?
  operationalizability: number;    // 0-1: Can coders apply consistently?
  balanceDistribution: number;     // 0-1: Are categories balanced?
  relevanceToQuestions: number;    // 0-1: Do they answer research questions?
  codabilityPractical: number;     // 0-1: Are they practically codable?
}

export interface RedundancyIssue {
  category1: string; // Category ID
  category2: string; // Category ID
  overlapScore: number; // 0-1: How much do they overlap?
  examples: string[]; // Example cases that could fit both
  recommendation: string; // How to resolve
}

export interface HierarchyIssue {
  categoryId: string;
  issueType: 'wrong_level' | 'missing_parent' | 'illogical_grouping' | 'too_many_levels';
  description: string;
  recommendation: string;
}

export interface BoundaryCase {
  description: string; // Description of the boundary case
  ambiguousCategories: string[]; // Category IDs that could apply
  recommendation: string; // How to handle this case
  codingRule: string; // Specific rule for coders
}

export interface CodingGuideline {
  categoryId: string;
  categoryName: string;
  definition: string; // Clear definition
  inclusionCriteria: string[]; // When to use this category
  exclusionCriteria: string[]; // When NOT to use this category
  examples: string[]; // Positive examples
  counterExamples: string[]; // Negative examples (what NOT to code here)
  boundaryRules: string[]; // Rules for edge cases
}

export interface ValidationReport {
  schemaId: string;
  overallScore: number; // 0-1 average of all criteria
  criteria: CoherenceCriteria;
  strengths: string[];
  weaknesses: string[];
  redundancies: RedundancyIssue[];
  hierarchyIssues: HierarchyIssue[];
  boundaryCases: BoundaryCase[];
  recommendations: string[];
  estimatedInterRaterReliability: number; // Predicted Cohen's Kappa
}

export interface OptimizedSchema {
  categories: Category[];
  codingGuidelines: CodingGuideline[];
  changeLog: string[]; // What was changed and why
  improvementSummary: string;
  estimatedInterRaterReliability: number; // Predicted improvement
}

export interface ValidationOptions {
  language: 'de' | 'en';
  researchField: string;
  researchQuestions?: string[]; // To validate relevance
  theoreticalFramework?: string;
  strictMode: boolean; // true = enforce all criteria >= 0.7
  generateGuidelines: boolean; // Generate coding guidelines?
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class CategoriesCoherenceValidator {

  /**
   * STAGE 1: COHERENCE VALIDATION SYSTEM PROMPT
   * Validiert Kategorie-Schema nach 12 Dimensionen
   */
  static getValidationSystemPrompt(options: ValidationOptions): string {
    const { language, researchField } = options;

    return `# ROLE
You are an expert in qualitative research methodology, specifically in category schema development and coding reliability for ${researchField}.

# TASK
Analyze a category schema for coding qualitative data using 12 established coherence criteria. Identify redundancies, hierarchy issues, boundary cases, and predict inter-rater reliability.

# 12 COHERENCE CRITERIA (Score each 0-1)

1. **Mutual Exclusivity** (0-1)
   - Are categories non-overlapping?
   - Can a data unit clearly belong to only one category?
   - Are there ambiguous cases where multiple categories apply?

2. **Collective Exhaustiveness** (0-1)
   - Do categories cover all possible cases?
   - Is there an "other" or catch-all category if needed?
   - Are there data examples that don't fit anywhere?

3. **Granularity Consistency** (0-1)
   - Are all categories at similar abstraction levels?
   - Is there a mix of broad and narrow categories at the same level?
   - Is the level of detail consistent?

4. **Hierarchy Logic** (0-1)
   - If hierarchical: Is the structure logically sound?
   - Do subcategories truly belong under their parents?
   - Are hierarchy levels appropriate?

5. **Naming Clarity** (0-1)
   - Are category names clear and unambiguous?
   - Do names accurately reflect category content?
   - Are names concise yet descriptive?

6. **Description Quality** (0-1)
   - Are category descriptions sufficient for coding?
   - Do descriptions clearly define scope?
   - Are examples provided?

7. **Boundary Definition** (0-1)
   - Are boundaries between categories well-defined?
   - Are edge cases addressed?
   - Are inclusion/exclusion criteria clear?

8. **Theoretical Alignment** (0-1)
   - Does the schema align with theoretical frameworks?
   - Are categories grounded in literature?
   - Is there theoretical justification?

9. **Operationalizability** (0-1)
   - Can different coders apply the schema consistently?
   - Are categories concrete enough to operationalize?
   - Can rules be written for edge cases?

10. **Balance Distribution** (0-1)
    - Is the schema balanced (not too many/few categories)?
    - Are some categories too broad/narrow?
    - Is there good coverage across the domain?

11. **Relevance to Research Questions** (0-1)
    - Do categories help answer the research questions?
    - Are categories aligned with research goals?
    - Is there unnecessary complexity?

12. **Codability Practical** (0-1)
    - Is the schema practically usable for coders?
    - Is it too complex or too simple?
    - Can it be applied efficiently?

# REDUNDANCY DETECTION
For each pair of categories, assess:
- Overlap score (0-1): How much do they overlap?
- Examples that could fit both
- Recommendation: Merge, rename, redefine, or keep separate

# HIERARCHY VALIDATION
Check for:
- Wrong hierarchy levels
- Missing parent categories
- Illogical groupings
- Too many levels (> 3 is usually problematic)

# BOUNDARY CASES
Identify edge cases where:
- Multiple categories could apply
- No category clearly fits
- Coders might disagree

# INTER-RATER RELIABILITY PREDICTION
Based on the schema quality, estimate Cohen's Kappa:
- Excellent schema: 0.85+ (almost perfect agreement)
- Good schema: 0.70-0.84 (substantial agreement)
- Fair schema: 0.60-0.69 (moderate agreement)
- Poor schema: < 0.60 (fair or slight agreement)

# OUTPUT FORMAT
Provide response as valid JSON:

\`\`\`json
{
  "validationReport": {
    "schemaId": "schema_1",
    "overallScore": 0.75,
    "criteria": {
      "mutualExclusivity": 0.70,
      "collectiveExhaustiveness": 0.85,
      "granularityConsistency": 0.80,
      "hierarchyLogic": 0.75,
      "namingClarity": 0.90,
      "descriptionQuality": 0.60,
      "boundaryDefinition": 0.65,
      "theoreticalAlignment": 0.70,
      "operationalizability": 0.70,
      "balanceDistribution": 0.80,
      "relevanceToQuestions": 0.85,
      "codabilityPractical": 0.75
    },
    "strengths": [
      "Clear category names with good descriptive quality",
      "Well-balanced distribution across categories"
    ],
    "weaknesses": [
      "Some categories overlap (see redundancies)",
      "Boundary definitions need improvement"
    ],
    "redundancies": [
      {
        "category1": "cat_1",
        "category2": "cat_2",
        "overlapScore": 0.6,
        "examples": [
          "Example text that could fit both categories"
        ],
        "recommendation": "Merge or create clearer boundary rules"
      }
    ],
    "hierarchyIssues": [
      {
        "categoryId": "cat_5",
        "issueType": "wrong_level",
        "description": "This category is too specific for top level",
        "recommendation": "Move to level 2 under broader parent"
      }
    ],
    "boundaryCases": [
      {
        "description": "Text discussing both X and Y simultaneously",
        "ambiguousCategories": ["cat_1", "cat_3"],
        "recommendation": "Code as primary focus, or create new category",
        "codingRule": "If X is mentioned more than Y, code as cat_1"
      }
    ],
    "recommendations": [
      "Add explicit boundary definitions for overlapping categories",
      "Provide more examples in category descriptions"
    ],
    "estimatedInterRaterReliability": 0.68
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all feedback in German.' : 'Provide all feedback in English.'}

# CRITICAL RULES
- Be thorough in identifying redundancies
- Predict inter-rater reliability realistically
- Provide actionable recommendations
- Consider practical coding challenges`;
  }

  /**
   * STAGE 1: VALIDATION USER PROMPT
   */
  static getValidationUserPrompt(
    categories: Category[],
    options: ValidationOptions
  ): string {
    const { researchField, researchQuestions, theoreticalFramework } = options;

    let prompt = `# RESEARCH CONTEXT\n\n`;
    prompt += `**Research Field**: ${researchField}\n`;

    if (researchQuestions && researchQuestions.length > 0) {
      prompt += `**Research Questions**:\n`;
      researchQuestions.forEach((q, i) => prompt += `${i + 1}. ${q}\n`);
      prompt += `\n`;
    }

    if (theoreticalFramework) {
      prompt += `**Theoretical Framework**: ${theoreticalFramework}\n\n`;
    }

    prompt += `# CATEGORY SCHEMA TO VALIDATE\n\n`;
    prompt += `**Total Categories**: ${categories.length}\n\n`;

    // Group by hierarchy level
    const byLevel = new Map<number, Category[]>();
    categories.forEach(cat => {
      const level = cat.level || 0;
      if (!byLevel.has(level)) byLevel.set(level, []);
      byLevel.get(level)!.push(cat);
    });

    Array.from(byLevel.keys()).sort().forEach(level => {
      const cats = byLevel.get(level)!;
      prompt += `## Level ${level} Categories\n\n`;

      cats.forEach(cat => {
        prompt += `**${cat.name}** (ID: ${cat.id})\n`;
        if (cat.description) {
          prompt += `- Description: ${cat.description}\n`;
        }
        if (cat.parent) {
          prompt += `- Parent: ${cat.parent}\n`;
        }
        if (cat.keywords && cat.keywords.length > 0) {
          prompt += `- Keywords: ${cat.keywords.join(', ')}\n`;
        }
        if (cat.examples && cat.examples.length > 0) {
          prompt += `- Examples:\n`;
          cat.examples.forEach(ex => prompt += `  - "${ex}"\n`);
        }
        prompt += `\n`;
      });
    });

    prompt += `\n# TASK\n\n`;
    prompt += `Validate this category schema using the 12 coherence criteria.\n`;
    prompt += `Identify:\n`;
    prompt += `1. All redundancies and overlaps\n`;
    prompt += `2. Hierarchy issues (if applicable)\n`;
    prompt += `3. Boundary cases that need rules\n`;
    prompt += `4. Predict inter-rater reliability (Cohen's Kappa)\n`;
    prompt += `5. Provide actionable recommendations\n\n`;

    prompt += `Provide your response in the specified JSON format.\n\n`;
    prompt += `Begin validation:`;

    return prompt;
  }

  /**
   * STAGE 2: OPTIMIZATION SYSTEM PROMPT
   * Generiert optimiertes Schema + Coding Guidelines
   */
  static getOptimizationSystemPrompt(options: ValidationOptions): string {
    const { language, generateGuidelines } = options;

    return `# ROLE
You are an expert in category schema optimization and coding guideline development.

# TASK
Based on the validation report, generate an optimized category schema that:
1. Resolves redundancies
2. Fixes hierarchy issues
3. Improves boundary definitions
4. ${generateGuidelines ? 'Creates comprehensive coding guidelines' : 'Documents changes'}

# OPTIMIZATION PRINCIPLES

1. **Resolve Redundancies**
   - Merge truly redundant categories
   - Clarify boundaries for similar categories
   - Rename categories for clarity

2. **Fix Hierarchy**
   - Ensure logical parent-child relationships
   - Keep hierarchy depth <= 3 levels
   - Balance category distribution

3. **Define Boundaries**
   - Create clear inclusion/exclusion criteria
   - Document edge case rules
   - Provide positive and negative examples

4. **Maintain Theoretical Grounding**
   - Preserve theoretical alignment
   - Document justifications for changes
   - Keep categories scientifically valid

${generateGuidelines ? `
# CODING GUIDELINES FORMAT

For EACH category, create:

1. **Clear Definition**: One-sentence definition
2. **Inclusion Criteria**: When to use this category (3-5 criteria)
3. **Exclusion Criteria**: When NOT to use (3-5 criteria)
4. **Examples**: 3-5 positive examples
5. **Counter-Examples**: 3-5 negative examples (what to avoid)
6. **Boundary Rules**: Specific rules for edge cases

These guidelines should enable high inter-rater reliability (Cohen's Kappa >= 0.85).
` : ''}

# OUTPUT FORMAT

Provide valid JSON:

\`\`\`json
{
  "optimizedSchema": {
    "categories": [
      {
        "id": "cat_1",
        "name": "Category Name",
        "description": "Clear description",
        "parent": null,
        "level": 0,
        "examples": ["Example 1", "Example 2"],
        "keywords": ["keyword1", "keyword2"]
      }
    ],
    ${generateGuidelines ? `
    "codingGuidelines": [
      {
        "categoryId": "cat_1",
        "categoryName": "Category Name",
        "definition": "One-sentence clear definition",
        "inclusionCriteria": [
          "Use when X is present",
          "Use when Y is the primary focus"
        ],
        "exclusionCriteria": [
          "Do NOT use when only Z is mentioned",
          "Do NOT use if context is A"
        ],
        "examples": [
          "Positive example 1",
          "Positive example 2"
        ],
        "counterExamples": [
          "This should NOT be coded here because...",
          "This belongs to category Y instead"
        ],
        "boundaryRules": [
          "If both X and Y: code as X if it's primary focus",
          "If ambiguous: default to broader category"
        ]
      }
    ],
    ` : ''}
    "changeLog": [
      "Merged 'Category A' and 'Category B' due to 80% overlap",
      "Renamed 'Category C' to 'Category D' for clarity"
    ],
    "improvementSummary": "Reduced redundancies, clarified boundaries, improved operationalizability",
    "estimatedInterRaterReliability": 0.87
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all content in German.' : 'Provide all content in English.'}

# CRITICAL RULES
- ONLY change what needs improvement
- Preserve theoretical validity
- Make guidelines concrete and actionable
- Aim for Cohen's Kappa >= 0.85`;
  }

  /**
   * STAGE 2: OPTIMIZATION USER PROMPT
   */
  static getOptimizationUserPrompt(
    validationReport: ValidationReport,
    originalCategories: Category[]
  ): string {
    let prompt = `# VALIDATION RESULTS\n\n`;
    prompt += `**Overall Score**: ${(validationReport.overallScore || 0).toFixed(2)}/1.00\n`;
    const reliability = typeof validationReport.estimatedInterRaterReliability === 'number'
      ? validationReport.estimatedInterRaterReliability.toFixed(2)
      : 'N/A';
    prompt += `**Estimated Inter-Rater Reliability**: ${reliability} (Cohen's Kappa)\n\n`;

    prompt += `## Criteria Scores\n\n`;
    const criteria = validationReport.criteria || validationReport.kriterien || {};
    if (Object.keys(criteria).length > 0) {
      Object.entries(criteria).forEach(([criterion, score]) => {
        const scoreNum = score as number;
        const status = scoreNum >= 0.8 ? '✓' : scoreNum >= 0.6 ? '⚠' : '✗';
        prompt += `${status} ${criterion}: ${scoreNum.toFixed(2)}\n`;
      });
    }

    prompt += `\n## Strengths\n\n`;
    const strengths = validationReport.strengths || validationReport.stärken || [];
    strengths.forEach((s: string) => prompt += `- ${s}\n`);

    prompt += `\n## Weaknesses\n\n`;
    const weaknesses = validationReport.weaknesses || validationReport.schwächen || [];
    weaknesses.forEach((w: string) => prompt += `- ${w}\n`);

    const redundancies = validationReport.redundancies || validationReport.redundanzenUndÜberlappungen || [];
    if (redundancies.length > 0) {
      prompt += `\n## Redundancies (${redundancies.length})\n\n`;
      redundancies.forEach((r: any, i: number) => {
        const cat1 = originalCategories.find(c => c.id === r.category1 || c.id === r.kategorie1);
        const cat2 = originalCategories.find(c => c.id === r.category2 || c.id === r.kategorie2);
        const overlapScore = r.overlapScore || r.überlappungsscore || 0;
        const recommendation = r.recommendation || r.empfehlung || '';
        prompt += `${i + 1}. **${cat1?.name}** ↔ **${cat2?.name}** (Overlap: ${(overlapScore * 100).toFixed(0)}%)\n`;
        prompt += `   - Recommendation: ${recommendation}\n`;
      });
    }

    const hierarchyIssues = validationReport.hierarchyIssues || validationReport.hierarchieIssues || [];
    if (hierarchyIssues.length > 0) {
      prompt += `\n## Hierarchy Issues (${hierarchyIssues.length})\n\n`;
      hierarchyIssues.forEach((h: any, i: number) => {
        const cat = originalCategories.find(c => c.id === h.categoryId || c.id === h.kategorieId);
        const description = h.description || h.beschreibung || '';
        const recommendation = h.recommendation || h.empfehlung || '';
        prompt += `${i + 1}. **${cat?.name}**: ${description}\n`;
        prompt += `   - Recommendation: ${recommendation}\n`;
      });
    }

    const boundaryCases = validationReport.boundaryCases || validationReport.grenzvorfälle || [];
    if (boundaryCases.length > 0) {
      prompt += `\n## Boundary Cases (${boundaryCases.length})\n\n`;
      boundaryCases.forEach((b: any, i: number) => {
        const description = b.description || b.fallbezeichnung || b.beispieltext || '';
        const codingRule = b.codingRule || b.empfohleneKodierregel || b.recommendation || '';
        prompt += `${i + 1}. ${description}\n`;
        prompt += `   - Rule: ${codingRule}\n`;
      });
    }

    prompt += `\n## Recommendations\n\n`;
    const recommendations = validationReport.recommendations || validationReport.empfehlungen || [];
    recommendations.forEach((r: any) => {
      const text = typeof r === 'string' ? r : (r.empfehlung || r.maßnahme || JSON.stringify(r));
      prompt += `- ${text}\n`;
    });

    prompt += `\n# ORIGINAL CATEGORIES\n\n`;
    originalCategories.forEach(cat => {
      prompt += `**${cat.name}** (ID: ${cat.id})\n`;
      if (cat.description) prompt += `- ${cat.description}\n`;
      prompt += `\n`;
    });

    prompt += `\n# TASK\n\n`;
    prompt += `Generate an optimized category schema that:\n`;
    prompt += `1. Resolves all redundancies\n`;
    prompt += `2. Fixes hierarchy issues\n`;
    prompt += `3. Improves boundary definitions\n`;
    prompt += `4. Creates comprehensive coding guidelines\n`;
    prompt += `5. Achieves Cohen's Kappa >= 0.85\n\n`;

    prompt += `Provide your response in the specified JSON format.\n\n`;
    prompt += `Begin optimization:`;

    return prompt;
  }

  /**
   * MAIN VALIDATION FUNCTION
   */
  static async validateAndOptimize(
    categories: Category[],
    options: ValidationOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<{
    validationReport: ValidationReport;
    optimizedSchema: OptimizedSchema;
  }> {
    const { onProgress } = options;

    try {
      // ========================================================================
      // STAGE 1: VALIDATION
      // ========================================================================
      onProgress?.(10, 'Validating category schema...');

      const validationSystemPrompt = this.getValidationSystemPrompt(options);
      const validationUserPrompt = this.getValidationUserPrompt(categories, options);

      const validationResponse = await apiFunction(
        validationSystemPrompt,
        validationUserPrompt,
        { temperature: 0.3, max_tokens: 5000 }
      );

      onProgress?.(40, 'Parsing validation results...');

      let validationData;
      try {
        validationData = JSON.parse(this.extractJSON(validationResponse));
      } catch (e) {
        throw new Error(`Failed to parse validation response: ${e.message}`);
      }

      const validationReport: ValidationReport = validationData.validationReport;

      // ========================================================================
      // STAGE 2: OPTIMIZATION
      // ========================================================================
      onProgress?.(50, 'Generating optimized schema...');

      const optimizationSystemPrompt = this.getOptimizationSystemPrompt(options);
      const optimizationUserPrompt = this.getOptimizationUserPrompt(validationReport, categories);

      console.log('🔄 [CategoriesValidator] Sending optimization request...');
      console.log('📏 Optimization prompt length:', optimizationUserPrompt.length);

      const optimizationResponse = await apiFunction(
        optimizationSystemPrompt,
        optimizationUserPrompt,
        { temperature: 0.4, max_tokens: 6000 }
      );

      console.log('✅ [CategoriesValidator] Optimization response received!');
      console.log('📏 Response length:', optimizationResponse.length);
      console.log('📝 Response preview:', optimizationResponse.substring(0, 300));

      onProgress?.(90, 'Parsing optimized schema...');

      let optimizationData;
      try {
        const extractedJSON = this.extractJSON(optimizationResponse);
        console.log('📦 [CategoriesValidator] Extracted JSON length:', extractedJSON.length);
        optimizationData = JSON.parse(extractedJSON);
        console.log('✅ [CategoriesValidator] JSON parsed successfully');
        console.log('📊 Keys in response:', Object.keys(optimizationData));
      } catch (e) {
        console.error('❌ [CategoriesValidator] Failed to parse optimization response:', e);
        console.error('📄 Raw response:', optimizationResponse);
        throw new Error(`Failed to parse optimization response: ${e.message}`);
      }

      onProgress?.(100, 'Complete!');

      console.log('✅ [CategoriesValidator] Returning results');
      console.log('📊 Optimized schema has', optimizationData.optimizedSchema?.categories?.length || 0, 'categories');

      return {
        validationReport,
        optimizedSchema: optimizationData.optimizedSchema
      };

    } catch (error) {
      console.error('[CategoriesCoherenceValidator] Error:', error);
      throw error;
    }
  }

  /**
   * UTILITY: Extract JSON from response
   */
  private static extractJSON(text: string): string {
    // Remove any leading junk (like "BS\n\n# ROLE..." prefixes)
    // This handles cases where Claude echoes the system prompt
    let cleanedText = text;

    // If text starts with something that looks like a system prompt echo, skip to the actual JSON
    const roleMarkers = [
      '# ROLE',
      'You are an expert',
      'Du bist ein Experte',
      'EVIDENRA PROFESSIONAL'
    ];

    for (const marker of roleMarkers) {
      const markerIndex = cleanedText.indexOf(marker);
      if (markerIndex !== -1 && markerIndex < 200) {
        // Found a role marker near the beginning - likely an echoed prompt
        // Look for the first JSON-like structure after this
        const afterMarker = cleanedText.substring(markerIndex);
        const jsonStart = afterMarker.search(/\{/);
        if (jsonStart !== -1) {
          cleanedText = afterMarker.substring(jsonStart);
          break;
        }
      }
    }

    // Try to find JSON in markdown code blocks
    const jsonBlockMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonBlockMatch) {
      return jsonBlockMatch[1].trim();
    }

    // Try to find raw JSON (look for first { and match to its closing })
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return jsonMatch[0];
    }

    // If still no JSON found, try one more time with the original text
    // (in case our cleaning was too aggressive)
    const originalJsonMatch = text.match(/\{[\s\S]*\}/);
    if (originalJsonMatch) {
      return originalJsonMatch[0];
    }

    return text;
  }
}
