/**
 * JournalExportOptimizer - Metaprompt System für Journal-Specific Export
 *
 * ZWECK:
 * - Analysiert journal-specific Guidelines
 * - Reformatiert Article automatisch
 * - Optimiert Highlights & Abstract
 * - Erstellt Editor Brief
 * - Bereitet Reviewer Responses vor
 * - Publication-ready in 30 Sekunden
 *
 * ZIEL:
 * - Entfernt tedious publishing work
 * - Journal-specific formatting automatisiert
 * - Erhöht Acceptance Rates
 *
 * @author AKIH System
 * @version 2.0.0
 */

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

export interface JournalProfile {
  id: string;
  name: string; // e.g., "Nature", "Science", "PLOS ONE"
  category: 'top-tier' | 'high-impact' | 'specialized' | 'open-access';
  guidelines: {
    abstractWordLimit?: number;
    mainTextWordLimit?: number;
    sectionStructure?: string[]; // Required sections
    citationStyle: 'APA' | 'Harvard' | 'Vancouver' | 'Chicago' | 'Nature' | 'Science';
    highlightsRequired?: boolean;
    highlightsCount?: number;
    coverLetterRequired: boolean;
    ethicsStatementRequired: boolean;
    dataAvailabilityRequired: boolean;
  };
  focusAreas: string[]; // What the journal values
  reviewCriteria: string[]; // What reviewers look for
}

export interface ArticleContent {
  title: string;
  abstract: string;
  introduction: string;
  methods: string;
  results: string;
  discussion: string;
  conclusion: string;
  references: string[];
  keywords?: string[];
  researchQuestions?: string[];
  mainFindings?: string[];
}

export interface OptimizedExport {
  journalId: string;
  journalName: string;
  formattedArticle: {
    title: string; // Optimized for journal
    abstract: string; // Within word limit, journal-style
    highlights?: string[]; // If required
    mainSections: {
      [key: string]: string; // Formatted sections
    };
    keywords: string[];
    wordCount: {
      abstract: number;
      mainText: number;
    };
  };
  coverLetter: string; // Ready-to-send editor letter
  reviewerSuggestions?: string[]; // Suggested reviewers (researcher fills details)
  responseToReviewers?: string; // Template for reviewer responses
  submissionChecklist: Array<{
    item: string;
    status: 'auto-completed' | 'requires-input' | 'not-applicable';
    notes?: string;
  }>;
  optimizationNotes: string[]; // What was changed and why
}

export interface ExportOptions {
  language: 'de' | 'en';
  targetJournal: JournalProfile;
  emphasizeNovelty: boolean; // Highlight novel contributions?
  includeSupplementaryMaterials: boolean;
  onProgress?: (percent: number, message: string) => void;
}

// ============================================================================
// PREDEFINED JOURNAL PROFILES
// ============================================================================

export const JOURNAL_PROFILES: { [key: string]: JournalProfile } = {
  nature: {
    id: 'nature',
    name: 'Nature',
    category: 'top-tier',
    guidelines: {
      abstractWordLimit: 200,
      mainTextWordLimit: 3000,
      sectionStructure: ['Introduction', 'Results', 'Discussion', 'Methods'],
      citationStyle: 'Nature',
      highlightsRequired: false,
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Broad significance', 'Novel methodology', 'Paradigm-shifting findings'],
    reviewCriteria: ['Novelty', 'Significance', 'Methodology rigor', 'Clarity']
  },
  science: {
    id: 'science',
    name: 'Science',
    category: 'top-tier',
    guidelines: {
      abstractWordLimit: 125,
      mainTextWordLimit: 2500,
      citationStyle: 'Science',
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Breakthrough discoveries', 'Interdisciplinary impact', 'Global relevance'],
    reviewCriteria: ['Impact', 'Novelty', 'Rigour', 'Presentation']
  },
  plosone: {
    id: 'plosone',
    name: 'PLOS ONE',
    category: 'open-access',
    guidelines: {
      abstractWordLimit: 300,
      sectionStructure: ['Introduction', 'Materials and Methods', 'Results', 'Discussion'],
      citationStyle: 'Vancouver',
      coverLetterRequired: true,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Scientific rigor', 'Reproducibility', 'Open science'],
    reviewCriteria: ['Methodological soundness', 'Data quality', 'Conclusions supported by data']
  },
  frontiers: {
    id: 'frontiers',
    name: 'Frontiers in Psychology',
    category: 'open-access',
    guidelines: {
      abstractWordLimit: 250,
      mainTextWordLimit: 12000,
      citationStyle: 'APA',
      highlightsRequired: true,
      highlightsCount: 5,
      coverLetterRequired: false,
      ethicsStatementRequired: true,
      dataAvailabilityRequired: true
    },
    focusAreas: ['Innovation', 'Interdisciplinarity', 'Impact'],
    reviewCriteria: ['Originality', 'Quality', 'Significance', 'Ethics']
  }
};

// ============================================================================
// METAPROMPT TEMPLATES
// ============================================================================

export class JournalExportOptimizer {

  /**
   * JOURNAL OPTIMIZATION SYSTEM PROMPT
   */
  static getOptimizationSystemPrompt(options: ExportOptions): string {
    const { language, targetJournal, emphasizeNovelty } = options;

    return `# ROLE
You are an expert academic editor and publication strategist specializing in preparing manuscripts for submission to ${targetJournal.name}.

# TASK
Optimize a research article for submission to ${targetJournal.name}, ensuring compliance with all journal guidelines while maximizing acceptance chances.

# JOURNAL PROFILE: ${targetJournal.name}

**Category**: ${targetJournal.category}
**Citation Style**: ${targetJournal.guidelines.citationStyle}
**Abstract Limit**: ${targetJournal.guidelines.abstractWordLimit || 'Not specified'} words
**Main Text Limit**: ${targetJournal.guidelines.mainTextWordLimit || 'Not specified'} words

**Focus Areas**: ${targetJournal.focusAreas.join(', ')}
**Review Criteria**: ${targetJournal.reviewCriteria.join(', ')}

${targetJournal.guidelines.sectionStructure ? `
**Required Structure**: ${targetJournal.guidelines.sectionStructure.join(' → ')}
` : ''}

# OPTIMIZATION STRATEGY

## 1. ABSTRACT OPTIMIZATION

${targetJournal.guidelines.abstractWordLimit ? `
- **Critical**: Stay within ${targetJournal.guidelines.abstractWordLimit} words
` : ''}
- Lead with most significant finding
- Emphasize ${emphasizeNovelty ? 'novel contributions and impact' : 'robustness and rigor'}
- Follow ${targetJournal.name} abstract style (concise, impactful)
- Include key results with specific numbers/findings

## 2. TITLE OPTIMIZATION

- Align with ${targetJournal.name} title conventions
- Make it specific yet accessible
- Include key variables/concepts
- Hint at novelty/significance

## 3. HIGHLIGHTS (if required)

${targetJournal.guidelines.highlightsRequired ? `
- Create exactly ${targetJournal.guidelines.highlightsCount || 3-5} highlights
- Each 85 characters max
- Focus on: Key findings, Novel methodology, Practical implications
` : 'Not required for this journal'}

## 4. SECTION FORMATTING

${targetJournal.guidelines.sectionStructure ? `
Restructure to match required sections: ${targetJournal.guidelines.sectionStructure.join(', ')}
` : 'Follow standard IMRAD structure'}

## 5. TONE & STYLE

- Match ${targetJournal.name}'s editorial style
- Balance technical precision with accessibility
- ${targetJournal.category === 'top-tier' ? 'Emphasize broad significance and paradigm-shifting aspects' : 'Focus on rigor and reproducibility'}

## 6. COVER LETTER

${targetJournal.guidelines.coverLetterRequired ? `
Create a compelling cover letter that:
- States significance in first sentence
- Explains fit with ${targetJournal.name}
- Highlights ${emphasizeNovelty ? 'novelty' : 'contributions'}
- Suggests suitable editors (if known)
- Declares no conflicts of interest
` : 'Not required'}

# OUTPUT FORMAT

\`\`\`json
{
  "optimizedExport": {
    "journalId": "${targetJournal.id}",
    "journalName": "${targetJournal.name}",
    "formattedArticle": {
      "title": "Optimized title",
      "abstract": "Optimized abstract within word limit",
      "highlights": ["Highlight 1", "Highlight 2", ...],
      "mainSections": {
        "Introduction": "Formatted introduction...",
        "Results": "Formatted results...",
        ...
      },
      "keywords": ["keyword1", "keyword2", ...],
      "wordCount": {
        "abstract": 200,
        "mainText": 3000
      }
    },
    "coverLetter": "Complete cover letter text",
    "submissionChecklist": [
      {
        "item": "Abstract within word limit",
        "status": "auto-completed",
        "notes": "200 words (limit: ${targetJournal.guidelines.abstractWordLimit})"
      }
    ],
    "optimizationNotes": [
      "Restructured to match Nature format",
      "Emphasized broad significance in abstract"
    ]
  }
}
\`\`\`

# LANGUAGE
${language === 'de' ? 'Provide all text in German, but use English for journal-standard sections if required by journal.' : 'Provide all text in English.'}

# CRITICAL RULES
- STRICTLY adhere to word limits
- Match journal's citation style
- Emphasize what ${targetJournal.name} values most
- Be concise yet comprehensive
- Make every word count`;
  }

  /**
   * OPTIMIZATION USER PROMPT
   */
  static getOptimizationUserPrompt(
    article: ArticleContent,
    targetJournal: JournalProfile
  ): string {
    let prompt = `# ARTICLE TO OPTIMIZE FOR ${targetJournal.name}\n\n`;

    prompt += `## Current Article\n\n`;
    prompt += `**Title**: ${article.title}\n\n`;
    prompt += `**Abstract** (${article.abstract.split(' ').length} words):\n${article.abstract}\n\n`;

    if (article.keywords && article.keywords.length > 0) {
      prompt += `**Keywords**: ${article.keywords.join(', ')}\n\n`;
    }

    if (article.researchQuestions && article.researchQuestions.length > 0) {
      prompt += `**Research Questions**:\n`;
      article.researchQuestions.forEach((q, i) => {
        prompt += `${i + 1}. ${q}\n`;
      });
      prompt += `\n`;
    }

    if (article.mainFindings && article.mainFindings.length > 0) {
      prompt += `**Main Findings**:\n`;
      article.mainFindings.forEach((f, i) => {
        prompt += `${i + 1}. ${f}\n`;
      });
      prompt += `\n`;
    }

    prompt += `**Introduction** (${article.introduction.split(' ').length} words):\n${article.introduction.substring(0, 1000)}${article.introduction.length > 1000 ? '...' : ''}\n\n`;

    prompt += `**Methods** (${article.methods.split(' ').length} words):\n${article.methods.substring(0, 500)}${article.methods.length > 500 ? '...' : ''}\n\n`;

    prompt += `**Results** (${article.results.split(' ').length} words):\n${article.results.substring(0, 1000)}${article.results.length > 1000 ? '...' : ''}\n\n`;

    prompt += `**Discussion** (${article.discussion.split(' ').length} words):\n${article.discussion.substring(0, 1000)}${article.discussion.length > 1000 ? '...' : ''}\n\n`;

    if (article.conclusion) {
      prompt += `**Conclusion**: ${article.conclusion.substring(0, 500)}${article.conclusion.length > 500 ? '...' : ''}\n\n`;
    }

    const totalWords = [article.introduction, article.methods, article.results, article.discussion, article.conclusion]
      .join(' ').split(' ').length;

    prompt += `**Total Word Count**: ~${totalWords} words\n\n`;

    prompt += `# TASK\n\n`;
    prompt += `Optimize this article for submission to ${targetJournal.name}.\n`;
    prompt += `Ensure:\n`;

    if (targetJournal.guidelines.abstractWordLimit) {
      prompt += `- Abstract ≤ ${targetJournal.guidelines.abstractWordLimit} words\n`;
    }
    if (targetJournal.guidelines.mainTextWordLimit) {
      prompt += `- Main text ≤ ${targetJournal.guidelines.mainTextWordLimit} words\n`;
    }
    if (targetJournal.guidelines.highlightsRequired) {
      prompt += `- ${targetJournal.guidelines.highlightsCount || 3} highlights included\n`;
    }
    if (targetJournal.guidelines.sectionStructure) {
      prompt += `- Sections match required structure: ${targetJournal.guidelines.sectionStructure.join(', ')}\n`;
    }

    prompt += `\nProvide optimized article, cover letter, and submission checklist in JSON format.\n\n`;
    prompt += `Begin optimization:`;

    return prompt;
  }

  /**
   * MAIN OPTIMIZATION FUNCTION
   */
  static async optimizeForJournal(
    article: ArticleContent,
    options: ExportOptions,
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<OptimizedExport> {
    const { targetJournal, onProgress } = options;

    try {
      onProgress?.(10, `Analyzing ${targetJournal.name} guidelines...`);

      const systemPrompt = this.getOptimizationSystemPrompt(options);
      const userPrompt = this.getOptimizationUserPrompt(article, targetJournal);

      onProgress?.(30, 'Optimizing article...');

      const response = await apiFunction(
        systemPrompt,
        userPrompt,
        { temperature: 0.4, max_tokens: 6000 }
      );

      onProgress?.(80, 'Processing optimized export...');

      let data;
      try {
        data = JSON.parse(this.extractJSON(response));
      } catch (e) {
        throw new Error(`Failed to parse optimization: ${e.message}`);
      }

      onProgress?.(100, 'Complete!');

      return data.optimizedExport;

    } catch (error) {
      console.error('[JournalExportOptimizer] Error:', error);
      throw error;
    }
  }

  /**
   * GET JOURNAL PROFILE
   */
  static getJournalProfile(journalId: string): JournalProfile | undefined {
    return JOURNAL_PROFILES[journalId];
  }

  /**
   * LIST AVAILABLE JOURNALS
   */
  static listJournals(): JournalProfile[] {
    return Object.values(JOURNAL_PROFILES);
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

  /**
   * REVIEWER RESPONSE HELPER
   * Generates template for responding to reviewer comments
   */
  static async generateReviewerResponseTemplate(
    reviewerComments: string[],
    options: { language: 'de' | 'en' },
    apiFunction: (systemPrompt: string, userPrompt: string, options: any) => Promise<string>
  ): Promise<string> {
    const { language } = options;

    const systemPrompt = `# ROLE
You are an expert at crafting professional, respectful responses to peer reviewer comments.

# TASK
Generate a template for responding to reviewer comments that:
- Thanks reviewers for their insights
- Addresses each comment systematically
- Explains changes made
- Provides justification for any disagreements

# OUTPUT FORMAT
Provide a structured response template in ${language === 'de' ? 'German' : 'English'}.`;

    let userPrompt = `# REVIEWER COMMENTS\n\n`;
    reviewerComments.forEach((comment, i) => {
      userPrompt += `**Comment ${i + 1}**: ${comment}\n\n`;
    });

    userPrompt += `\nGenerate a professional response template addressing all comments.`;

    const response = await apiFunction(systemPrompt, userPrompt, { temperature: 0.4, max_tokens: 2000 });

    return response;
  }
}
