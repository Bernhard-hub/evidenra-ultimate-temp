// src/services/ExpertCodingPrompts.ts

import { ExpertPersona } from './ExpertPersonaGenerator';
import { CodingCategory } from './ExpertPersonaGenerator';

export interface CodingPromptOptions {
  includeContext?: boolean;
  includeExamples?: boolean;
  strictMode?: boolean;
  requireRationale?: boolean;
  allowUncertainty?: boolean;
  maxTokens?: number;
}

export interface CodingResponse {
  category: string;
  confidence: number;
  rationale: string;
  alternativeConsideration?: string;
  uncertaintyFlag?: boolean;
  keyEvidence?: string[];
  theoreticalConnection?: string;
}

export interface PromptTemplate {
  systemMessage: string;
  userPrompt: string;
  constraints: string[];
  outputFormat: string;
}

export class ExpertCodingPrompts {

  /**
   * Generiert personalisierten Kodierungs-Prompt für einen spezifischen Experten
   */
  generatePersonalizedPrompt(
    expert: ExpertPersona,
    segment: string,
    categories: CodingCategory[],
    options: CodingPromptOptions = {}
  ): PromptTemplate {

    const opts = {
      includeContext: true,
      includeExamples: false,
      strictMode: false,
      requireRationale: true,
      allowUncertainty: true,
      maxTokens: 800,
      ...options
    };

    // System Message: Definiert die Expertenrolle
    const systemMessage = this.buildSystemMessage(expert, opts);

    // User Prompt: Die eigentliche Kodierungsaufgabe
    const userPrompt = this.buildUserPrompt(expert, segment, categories, opts);

    // Constraints: Spezifische Einschränkungen und Richtlinien
    const constraints = this.buildConstraints(expert, opts);

    // Output Format: Strukturierte Antwort
    const outputFormat = this.buildOutputFormat(expert, opts);

    return {
      systemMessage,
      userPrompt,
      constraints,
      outputFormat
    };
  }

  /**
   * Erstellt System Message mit Experten-Persona
   */
  private buildSystemMessage(expert: ExpertPersona, options: CodingPromptOptions): string {
    let system = `You are ${expert.name}, ${expert.title}.

PROFESSIONAL BACKGROUND:
${expert.background}

YOUR EXPERTISE AREAS:
${expert.expertise.map(area => `• ${area}`).join('\n')}

THEORETICAL FRAMEWORK:
You primarily work within ${expert.theoreticalLens} framework, which shapes how you interpret and analyze data.

ANALYTICAL APPROACH:
${expert.methodologicalApproach}

PROFESSIONAL FOCUS:
When analyzing qualitative data, you naturally focus on ${expert.codingFocus}.

IMPORTANT PROFESSIONAL CHARACTERISTICS:
• You have ${expert.yearsOfExperience} years of experience in ${expert.disciplinaryPerspective}
• Your research publications focus on: ${expert.publicationFocus.join(', ')}
• You ask key questions like: ${expert.keyQuestions.map(q => `"${q}"`).join(', ')}`;

    if (options.strictMode) {
      system += `\n\nSTRICT ANALYSIS MODE:
You are being extra careful and conservative in your analysis today. Only code when you are highly confident, and clearly indicate any uncertainty.`;
    }

    return system;
  }

  /**
   * Erstellt User Prompt mit Kodierungsaufgabe
   */
  private buildUserPrompt(
    expert: ExpertPersona,
    segment: string,
    categories: CodingCategory[],
    options: CodingPromptOptions
  ): string {
    let prompt = `TASK: Please analyze the following text segment and code it into ONE of the provided categories.

Remember: As ${expert.name}, you naturally emphasize ${expert.potentialBias} in your analysis, and you might not immediately notice ${expert.blindSpots}.

CODING CATEGORIES:
${categories.map(cat =>
  `• **${cat.name}**: ${cat.description}${cat.theoreticalBasis ? ` (Theoretical basis: ${cat.theoreticalBasis})` : ''}`
).join('\n')}

${options.includeExamples && categories.some(c => c.examples) ?
  `\nEXAMPLES:\n${categories.filter(c => c.examples?.length).map(cat =>
    `**${cat.name}**: ${cat.examples!.join('; ')}`
  ).join('\n')}` : ''}

TEXT SEGMENT TO CODE:
"${segment}"

ANALYTICAL APPROACH:
1. Read through your theoretical lens of ${expert.theoreticalLens}
2. Consider what aspects of ${expert.codingFocus} are present
3. Apply your ${expert.disciplinaryPerspective} expertise
4. Ask yourself: ${expert.keyQuestions[0] || 'What patterns do I see?'}`;

    if (options.includeContext) {
      prompt += `\n5. Consider what you might be missing due to your focus on ${expert.potentialBias}`;
    }

    return prompt;
  }

  /**
   * Erstellt Constraints für den Prompt
   */
  private buildConstraints(expert: ExpertPersona, options: CodingPromptOptions): string[] {
    const constraints: string[] = [];

    // Basis-Constraints
    constraints.push("You MUST choose exactly ONE category from the provided list");
    constraints.push(`Stay true to your ${expert.disciplinaryPerspective} perspective`);
    constraints.push("Base your decision on evidence visible in the text");

    // Confidence-basierte Constraints
    if (options.strictMode) {
      constraints.push("Only assign high confidence (>0.8) if you're certain based on your expertise");
      constraints.push("Flag uncertainty when the text doesn't clearly fit your analytical framework");
    }

    // Rationale Requirements
    if (options.requireRationale) {
      constraints.push(`Explain your reasoning from your ${expert.theoreticalLens} perspective`);
      constraints.push("Identify specific text elements that influenced your decision");
    }

    // Uncertainty Handling
    if (options.allowUncertainty) {
      constraints.push("It's acceptable to indicate lower confidence when unsure");
      constraints.push("Consider what another expert with different background might see");
    }

    // Bias Awareness
    constraints.push(`Be aware that you might overemphasize ${expert.potentialBias}`);
    constraints.push(`Remember you might miss aspects related to ${expert.blindSpots}`);

    return constraints;
  }

  /**
   * Definiert Output Format
   */
  private buildOutputFormat(expert: ExpertPersona, options: CodingPromptOptions): string {
    const baseFormat = {
      category: "chosen category name",
      confidence: "0.0-1.0 (your confidence in this coding decision)",
      rationale: `brief explanation from your ${expert.disciplinaryPerspective} perspective`
    };

    if (options.includeContext) {
      Object.assign(baseFormat, {
        alternativeConsideration: "category you might have chosen with different theoretical lens",
        theoreticalConnection: `how this connects to ${expert.theoreticalLens}`
      });
    }

    if (options.allowUncertainty) {
      Object.assign(baseFormat, {
        uncertaintyFlag: "true if you're uncertain about this coding",
        keyEvidence: "array of specific text phrases that influenced your decision"
      });
    }

    return `Respond with JSON:
{
${Object.entries(baseFormat).map(([key, desc]) => `  "${key}": "${desc}"`).join(',\n')}
}`;
  }

  /**
   * Generiert Konsens-Prompt für Experten-Diskussion
   */
  generateConsensusPrompt(
    experts: ExpertPersona[],
    segment: string,
    individualCodings: CodingResponse[],
    categories: CodingCategory[]
  ): string {
    const codingSummary = individualCodings.map((coding, i) =>
      `${experts[i].name} (${experts[i].disciplinaryPerspective}): ${coding.category} (${coding.confidence.toFixed(2)} confidence)
      Rationale: ${coding.rationale}`
    ).join('\n\n');

    return `You are moderating a coding discussion between three experts who have independently coded the same text segment.

TEXT SEGMENT:
"${segment}"

INDIVIDUAL CODINGS:
${codingSummary}

EXPERTS' BACKGROUNDS:
${experts.map(e => `• ${e.name}: ${e.theoreticalLens} perspective, focuses on ${e.codingFocus}`).join('\n')}

AVAILABLE CATEGORIES:
${categories.map(c => `• ${c.name}: ${c.description}`).join('\n')}

TASK: As a neutral moderator, analyze these different perspectives and provide:

1. **Agreement Level**: How much do these experts agree?
2. **Key Differences**: What caused the different interpretations?
3. **Synthesis**: What would be the most defensible coding considering all perspectives?
4. **Theoretical Insights**: What does this disagreement reveal about the complexity of the data?

Respond with JSON:
{
  "agreementLevel": "unanimous/majority/split",
  "consensusCategory": "most defensible category choice",
  "consensusConfidence": 0.0-1.0,
  "synthesisRationale": "explanation incorporating all perspectives",
  "keyDifferences": ["difference 1", "difference 2"],
  "theoreticalInsights": "what this reveals about the data complexity",
  "recommendedAction": "accept/review/reconsider"
}`;
  }

  /**
   * Generiert Kalibrierungs-Prompt für Training
   */
  generateCalibrationPrompt(
    expert: ExpertPersona,
    goldStandardSegments: Array<{
      text: string;
      correctCategory: string;
      explanation: string;
    }>,
    categories: CodingCategory[]
  ): string {
    const examples = goldStandardSegments.map((seg, i) =>
      `EXAMPLE ${i + 1}:
      Text: "${seg.text}"
      Correct Category: ${seg.correctCategory}
      Explanation: ${seg.explanation}`
    ).join('\n\n');

    return `Welcome ${expert.name}! You are about to begin coding training using your expertise in ${expert.theoreticalLens}.

TRAINING PURPOSE:
This calibration session will help you apply your ${expert.disciplinaryPerspective} background to our specific coding scheme.

YOUR ANALYTICAL STRENGTHS:
• You naturally focus on ${expert.codingFocus}
• Your ${expert.theoreticalLens} framework guides your interpretation
• You have deep expertise in ${expert.expertise.join(', ')}

AWARENESS POINTS:
• You might emphasize ${expert.potentialBias}
• Be alert to ${expert.blindSpots} that might be relevant

GOLD STANDARD EXAMPLES:
${examples}

CODING CATEGORIES:
${categories.map(c => `• **${c.name}**: ${c.description}`).join('\n')}

After reviewing these examples, please respond:
{
  "understanding": "confirmation that you understand the coding scheme",
  "alignmentNotes": "how these examples align with your theoretical perspective",
  "potentialChallenges": "aspects that might be challenging from your viewpoint",
  "readyToCode": true/false
}`;
  }

  /**
   * Generiert Post-Coding Reflexions-Prompt
   */
  generateReflectionPrompt(
    expert: ExpertPersona,
    codingSession: {
      segmentsCoded: number;
      averageConfidence: number;
      mostCommonCategory: string;
      uncertainCases: number;
    }
  ): string {
    return `${expert.name}, you have completed a coding session. Please reflect on your experience:

CODING SESSION SUMMARY:
• Segments coded: ${codingSession.segmentsCoded}
• Average confidence: ${codingSession.averageConfidence.toFixed(2)}
• Most frequently used category: ${codingSession.mostCommonCategory}
• Uncertain cases: ${codingSession.uncertainCases}

REFLECTION QUESTIONS:
From your ${expert.disciplinaryPerspective} perspective and ${expert.theoreticalLens} framework:

1. Were there patterns in the data that particularly stood out to you?
2. Which segments were most challenging to code and why?
3. Did you notice your tendency to focus on ${expert.codingFocus}?
4. What aspects of ${expert.blindSpots} might you have missed?
5. How did your ${expert.theoreticalLens} lens help or hinder the coding process?

Please respond with JSON:
{
  "observedPatterns": ["pattern 1", "pattern 2"],
  "challengingSituations": "description of difficult coding decisions",
  "biasAwareness": "how your ${expert.potentialBias} focus influenced coding",
  "missedAspects": "what you might have overlooked",
  "theoreticalInsights": "insights from your disciplinary perspective",
  "improvementSuggestions": "suggestions for coding scheme or process",
  "confidenceInCoding": 0.0-1.0
}`;
  }

  /**
   * Kombiniert Prompt-Template zu einem fertigen Prompt
   */
  combinePromptTemplate(template: PromptTemplate): string {
    let fullPrompt = template.systemMessage + '\n\n';
    fullPrompt += template.userPrompt + '\n\n';

    if (template.constraints.length > 0) {
      fullPrompt += `IMPORTANT CONSTRAINTS:\n${template.constraints.map(c => `• ${c}`).join('\n')}\n\n`;
    }

    fullPrompt += template.outputFormat;

    return fullPrompt;
  }

  /**
   * Validiert die Qualität eines generierten Prompts
   */
  validatePromptQuality(template: PromptTemplate): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
    score: number;
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let score = 100;

    // Check System Message
    if (template.systemMessage.length < 100) {
      issues.push("System message too short - may not provide sufficient context");
      score -= 10;
    }

    if (!template.systemMessage.includes('theoretical') && !template.systemMessage.includes('framework')) {
      suggestions.push("Consider emphasizing theoretical framework more prominently");
      score -= 5;
    }

    // Check User Prompt
    if (template.userPrompt.length < 200) {
      issues.push("User prompt may be too brief for complex coding task");
      score -= 10;
    }

    if (!template.userPrompt.includes('TEXT SEGMENT')) {
      issues.push("User prompt should clearly identify the text to be coded");
      score -= 15;
    }

    // Check Constraints
    if (template.constraints.length < 3) {
      suggestions.push("Consider adding more specific constraints for consistency");
      score -= 5;
    }

    // Check Output Format
    if (!template.outputFormat.includes('JSON')) {
      issues.push("Output format should specify structured response format");
      score -= 10;
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions,
      score: Math.max(0, score)
    };
  }

  /**
   * Generiert A/B Test Prompt Varianten
   */
  generatePromptVariants(
    expert: ExpertPersona,
    segment: string,
    categories: CodingCategory[],
    variantType: 'strict' | 'flexible' | 'theoretical' | 'practical'
  ): PromptTemplate[] {
    const baseOptions: CodingPromptOptions = {
      includeContext: true,
      includeExamples: false,
      strictMode: false,
      requireRationale: true,
      allowUncertainty: true
    };

    const variants: PromptTemplate[] = [];

    switch (variantType) {
      case 'strict':
        variants.push(
          this.generatePersonalizedPrompt(expert, segment, categories, {
            ...baseOptions,
            strictMode: true,
            allowUncertainty: false
          })
        );
        variants.push(
          this.generatePersonalizedPrompt(expert, segment, categories, {
            ...baseOptions,
            strictMode: false,
            allowUncertainty: true
          })
        );
        break;

      case 'theoretical':
        variants.push(
          this.generatePersonalizedPrompt(expert, segment, categories, {
            ...baseOptions,
            includeContext: true,
            includeExamples: false
          })
        );
        variants.push(
          this.generatePersonalizedPrompt(expert, segment, categories, {
            ...baseOptions,
            includeContext: false,
            includeExamples: true
          })
        );
        break;

      default:
        variants.push(this.generatePersonalizedPrompt(expert, segment, categories, baseOptions));
    }

    return variants;
  }
}

export default ExpertCodingPrompts;