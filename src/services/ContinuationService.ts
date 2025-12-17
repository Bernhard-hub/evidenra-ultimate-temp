/**
 * Continuation Service - COMPLETION GUARANTEE
 *
 * REVOLUTION PHASE 2: Never truncate reports again!
 *
 * Ensures ALL reports reach their target word count without truncation.
 *
 * Strategy:
 * 1. Monitor output for truncation signals
 * 2. Automatically continue generation with context
 * 3. Seamlessly merge continuations
 * 4. Track progress toward target word count
 * 5. Maximum 5 continuation attempts (safety limit)
 *
 * Features:
 * - Automatic truncation detection
 * - Context-aware continuation prompts
 * - Seamless content merging
 * - Word count tracking
 * - Safety limits to prevent infinite loops
 */

import APIService from './APIService';

export interface ContinuationConfig {
  targetWords: number;
  maxContinuations: number; // Default: 5
  minWordsPerContinuation: number; // Default: 500
  truncationSignals: string[]; // Phrases indicating truncation
  genesisAPIWrapper?: any; // 🧬 GENESIS: Optional Genesis wrapper for learning
  genesisContext?: { // 🧬 GENESIS: Context for prompt evolution
    operation: string;
    category: string;
  };
}

export interface ContinuationResult {
  success: boolean;
  content: string;
  wordCount: number;
  continuationsMade: number;
  targetReached: boolean;
  cost: number;
  error?: string;
}

export class ContinuationService {

  /**
   * Default truncation signals (AI indicates it's stopping mid-flow)
   */
  private static readonly DEFAULT_TRUNCATION_SIGNALS = [
    '[Fortsetzung folgt]',
    '[Continued in next response]',
    '[To be continued]',
    '... (gekürzt)',
    '... (truncated)',
    '... [CONTINUE]',
    'Die Analyse wird fortgesetzt',
    'This analysis continues'
  ];

  /**
   * Generate content with automatic continuation until target reached
   */
  static async generateWithContinuation(
    apiSettings: { provider: string; model: string; apiKey: string },
    initialMessages: Array<{ role: string; content: string }>,
    targetWords: number,
    tokenLimit: number,
    config?: Partial<ContinuationConfig>,
    onProgress?: (status: string, currentWords: number, targetWords: number) => void
  ): Promise<ContinuationResult> {

    const finalConfig: ContinuationConfig = {
      targetWords,
      maxContinuations: config?.maxContinuations || 5,
      minWordsPerContinuation: config?.minWordsPerContinuation || 500,
      truncationSignals: config?.truncationSignals || this.DEFAULT_TRUNCATION_SIGNALS
    };

    let fullContent = '';
    let totalCost = 0;
    let continuationCount = 0;
    let currentWordCount = 0;

    // Conversation history for context
    const messages = [...initialMessages];

    console.log(`🔄 Continuation Service: Starting generation (target: ${targetWords} words)`);

    while (currentWordCount < targetWords && continuationCount <= finalConfig.maxContinuations) {

      const isInitial = continuationCount === 0;
      const isContinuation = continuationCount > 0;

      // Progress update
      if (onProgress) {
        const status = isInitial
          ? 'Initial generation'
          : `Continuation ${continuationCount}/${finalConfig.maxContinuations}`;
        onProgress(status, currentWordCount, targetWords);
      }

      console.log(
        isContinuation
          ? `🔄 Continuation ${continuationCount}: Current ${currentWordCount}/${targetWords} words`
          : `🚀 Initial generation: Target ${targetWords} words`
      );

      // 🧬 GENESIS: Use Genesis wrapper if available for learning & optimization
      const result = finalConfig.genesisAPIWrapper && finalConfig.genesisContext
        ? await finalConfig.genesisAPIWrapper.callWithGenesis({
            operation: finalConfig.genesisContext.operation,
            category: `${finalConfig.genesisContext.category}_continuation_${continuationCount}`,
            apiSettings: apiSettings,
            messages: messages,
            context: {
              targetWords,
              currentWords: currentWordCount,
              continuationNumber: continuationCount,
              isContinuation
            },
            APIService: APIService
          })
        : await APIService.callAPI(
            apiSettings.provider,
            apiSettings.model,
            apiSettings.apiKey,
            messages,
            tokenLimit
          );

      if (!result.success) {
        return {
          success: false,
          content: fullContent,
          wordCount: currentWordCount,
          continuationsMade: continuationCount,
          targetReached: false,
          cost: totalCost,
          error: result.error || 'Generation failed'
        };
      }

      // Add generated content
      const newContent = result.content || '';
      fullContent += (fullContent && isContinuation ? '\n\n' : '') + newContent;
      currentWordCount = this.countWords(fullContent);
      totalCost += result.cost || 0;

      console.log(`✅ Generated ${this.countWords(newContent)} words (total: ${currentWordCount}/${targetWords})`);

      // Check if target reached
      if (currentWordCount >= targetWords) {
        console.log(`🎯 Target reached: ${currentWordCount}/${targetWords} words`);
        return {
          success: true,
          content: fullContent,
          wordCount: currentWordCount,
          continuationsMade: continuationCount,
          targetReached: true,
          cost: totalCost
        };
      }

      // Check for truncation signals
      const isTruncated = this.detectTruncation(newContent, finalConfig.truncationSignals);

      // Check if continuation is needed
      const wordsGenerated = this.countWords(newContent);
      const needsContinuation =
        isTruncated ||
        currentWordCount < targetWords &&
        wordsGenerated >= finalConfig.minWordsPerContinuation;

      if (!needsContinuation) {
        console.log(`⚠️ Generation stopped without truncation signal. Words: ${wordsGenerated}`);
        break;
      }

      // Prepare continuation
      if (continuationCount >= finalConfig.maxContinuations) {
        console.log(`⚠️ Max continuations (${finalConfig.maxContinuations}) reached`);
        break;
      }

      continuationCount++;

      // Add assistant's response to conversation
      messages.push({
        role: 'assistant',
        content: newContent
      });

      // Create continuation prompt
      const continuationPrompt = this.createContinuationPrompt(
        targetWords,
        currentWordCount,
        continuationCount
      );

      messages.push({
        role: 'user',
        content: continuationPrompt
      });

      console.log(`📝 Continuation prompt: "${continuationPrompt.substring(0, 100)}..."`);
    }

    // Final result
    const targetReached = currentWordCount >= targetWords;

    return {
      success: true,
      content: fullContent,
      wordCount: currentWordCount,
      continuationsMade: continuationCount,
      targetReached,
      cost: totalCost
    };
  }

  /**
   * Detect truncation signals in content
   */
  private static detectTruncation(content: string, signals: string[]): boolean {
    const lowerContent = content.toLowerCase();

    for (const signal of signals) {
      if (lowerContent.includes(signal.toLowerCase())) {
        console.log(`🔍 Truncation signal detected: "${signal}"`);
        return true;
      }
    }

    // Additional heuristic: Content ends mid-sentence
    const lastChars = content.trim().slice(-10);
    if (!lastChars.match(/[.!?]["']?$/) && content.length > 500) {
      console.log(`🔍 Truncation detected: Content ends mid-sentence`);
      return true;
    }

    return false;
  }

  /**
   * Create continuation prompt
   */
  private static createContinuationPrompt(
    targetWords: number,
    currentWords: number,
    continuationNumber: number
  ): string {

    const remainingWords = targetWords - currentWords;
    const progress = (currentWords / targetWords * 100).toFixed(0);

    return `🔄 CONTINUATION ${continuationNumber} REQUIRED

**Current Progress**: ${currentWords}/${targetWords} words (${progress}%)
**Remaining**: ${remainingWords} words needed

**CRITICAL INSTRUCTIONS**:
1. ✅ Continue EXACTLY where you left off - DO NOT repeat previous content
2. ✅ Maintain the same writing style, tone, and academic level
3. ✅ Continue the current section/argument seamlessly
4. ✅ Write AT LEAST ${Math.min(remainingWords, 2000)} more words
5. ✅ Do NOT write "[Fortsetzung folgt]" or similar - just continue writing
6. ✅ Do NOT summarize or conclude until ${targetWords} words are reached

**Continue now with the next ${remainingWords} words:**`;
  }

  /**
   * Count words in text
   */
  private static countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Generate with continuation for phase-based reports (EXTENDED mode)
   */
  static async generatePhaseWithContinuation(
    apiSettings: { provider: string; model: string; apiKey: string },
    phaseName: string,
    phaseMessages: Array<{ role: string; content: string }>,
    targetWords: number,
    tokenLimit: number,
    onProgress?: (status: string) => void
  ): Promise<ContinuationResult> {

    if (onProgress) {
      onProgress(`Generating ${phaseName}...`);
    }

    return this.generateWithContinuation(
      apiSettings,
      phaseMessages,
      targetWords,
      tokenLimit,
      {
        maxContinuations: 3, // Phases should be more concise
        minWordsPerContinuation: 1000
      },
      (status, current, target) => {
        if (onProgress) {
          onProgress(`${phaseName}: ${status} (${current}/${target} words)`);
        }
      }
    );
  }

  /**
   * Validate continuation result
   */
  static validateContinuationResult(result: ContinuationResult): {
    isValid: boolean;
    warnings: string[];
    recommendations: string[];
  } {

    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if target reached
    if (!result.targetReached) {
      warnings.push(`Target word count not reached: ${result.wordCount}/${result.continuationsMade} (${((result.wordCount / result.continuationsMade) * 100).toFixed(0)}%)`);
    }

    // Check continuation count
    if (result.continuationsMade > 3) {
      warnings.push(`High number of continuations (${result.continuationsMade}) may indicate token limit too low`);
      recommendations.push('Consider increasing token limit for smoother generation');
    }

    // Check if no continuations but target not reached
    if (result.continuationsMade === 0 && !result.targetReached) {
      warnings.push('Generation stopped without reaching target and without continuations');
      recommendations.push('Content may have been truncated - review for completeness');
    }

    const isValid = warnings.length === 0 || result.targetReached;

    return {
      isValid,
      warnings,
      recommendations
    };
  }

  /**
   * Generate summary of continuation process
   */
  static generateContinuationSummary(result: ContinuationResult): string {
    const validation = this.validateContinuationResult(result);

    return `# Continuation Report

**Status**: ${result.success ? '✅ Success' : '❌ Failed'}
**Target Reached**: ${result.targetReached ? '✅ Yes' : '⚠️ No'}

## Statistics
- **Final Word Count**: ${result.wordCount.toLocaleString()}
- **Target Words**: ${result.success ? result.wordCount.toLocaleString() : 'N/A'}
- **Continuations Made**: ${result.continuationsMade}
- **Total Cost**: $${result.cost?.toFixed(4) || '0.0000'}

## Validation
${validation.isValid ? '✅ Generation completed successfully' : '⚠️ Issues detected'}

${validation.warnings.length > 0 ? `### Warnings\n${validation.warnings.map(w => `- ${w}`).join('\n')}` : ''}

${validation.recommendations.length > 0 ? `### Recommendations\n${validation.recommendations.map(r => `- ${r}`).join('\n')}` : ''}

${result.error ? `### Error\n\`\`\`\n${result.error}\n\`\`\`` : ''}
`;
  }
}
