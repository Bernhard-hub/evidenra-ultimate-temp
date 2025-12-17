/**
 * Smart Segment Selector
 *
 * Uses AI to intelligently select the most relevant segments for coding
 * based on research questions and categories, dramatically reducing
 * the number of segments to code while maintaining quality.
 *
 * Reduces 193 segments → ~50 relevant segments
 */

export interface SegmentWithMetadata {
  id: string;
  text: string;
  documentId: string;
  documentName: string;
  position: number; // Position in document
}

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface SelectionCriteria {
  researchQuestions: string[];
  categories: Category[];
  maxSegments: number; // Maximum number of segments to select (default: 50)
  language: 'de' | 'en';
}

export interface SegmentSelection {
  selectedSegments: SegmentWithMetadata[];
  reasoning: string; // Why these segments were chosen
  totalReduction: string; // e.g., "193 → 47 segments (75.6% reduction)"
}

// Type for API function passed from App.tsx
export type APIFunction = (systemPrompt: string, userPrompt: string, options: any) => Promise<string>;

export class SmartSegmentSelector {
  private apiFunction: APIFunction;

  constructor(apiFunction: APIFunction) {
    this.apiFunction = apiFunction;
  }

  /**
   * Select the most relevant segments for coding using AI analysis
   */
  async selectRelevantSegments(
    allSegments: SegmentWithMetadata[],
    criteria: SelectionCriteria,
    onProgress?: (progress: number, message: string) => void
  ): Promise<SegmentSelection> {
    const startTime = Date.now();
    onProgress?.(10, criteria.language === 'de' ? 'Analysiere Segmente...' : 'Analyzing segments...');

    // Prepare segment summaries (first 200 chars of each)
    const segmentSummaries = allSegments.map((seg, idx) => ({
      index: idx,
      id: seg.id,
      documentName: seg.documentName,
      preview: seg.text.substring(0, 200) + (seg.text.length > 200 ? '...' : ''),
      wordCount: seg.text.split(/\s+/).length
    }));

    onProgress?.(30, criteria.language === 'de' ? 'KI analysiert Relevanz...' : 'AI analyzing relevance...');

    // Build prompt for AI to select segments
    const prompt = this.buildSelectionPrompt(segmentSummaries, criteria);

    try {
      const systemPrompt = criteria.language === 'de'
        ? 'Du bist ein Experte für qualitative Forschung und Segment-Auswahl.'
        : 'You are an expert in qualitative research and segment selection.';

      const response = await this.apiFunction(systemPrompt, prompt, {
        temperature: 0.3, // Lower temperature for more consistent selection
        max_tokens: 4000
      });

      onProgress?.(70, criteria.language === 'de' ? 'Verarbeite Auswahl...' : 'Processing selection...');

      // Parse AI response to get selected segment indices
      const selectedIndices = this.parseSelectionResponse(response);

      // Filter segments based on AI selection
      const selectedSegments = selectedIndices
        .filter(idx => idx >= 0 && idx < allSegments.length)
        .map(idx => allSegments[idx]);

      // If AI selected too many, truncate to maxSegments
      const finalSegments = selectedSegments.slice(0, criteria.maxSegments);

      const reductionPercent = ((1 - finalSegments.length / allSegments.length) * 100).toFixed(1);
      const totalReduction = `${allSegments.length} → ${finalSegments.length} ${criteria.language === 'de' ? 'Segmente' : 'segments'} (${reductionPercent}% ${criteria.language === 'de' ? 'Reduzierung' : 'reduction'})`;

      onProgress?.(100, criteria.language === 'de' ? 'Auswahl abgeschlossen!' : 'Selection completed!');

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`✅ Smart Segment Selection completed in ${duration}s: ${totalReduction}`);

      return {
        selectedSegments: finalSegments,
        reasoning: this.extractReasoning(response),
        totalReduction
      };

    } catch (error: any) {
      console.error('❌ Smart Segment Selection failed:', error);
      throw new Error(`Segment selection failed: ${error.message}`);
    }
  }

  /**
   * Build prompt for AI to select relevant segments
   */
  private buildSelectionPrompt(
    segmentSummaries: any[],
    criteria: SelectionCriteria
  ): string {
    const { researchQuestions, categories, maxSegments, language } = criteria;

    if (language === 'de') {
      return `# AUFGABE: Intelligente Segment-Auswahl für Qualitative Kodierung

Du bist ein Experte für qualitative Forschung. Wähle die ${maxSegments} RELEVANTESTEN Segmente aus, die für die folgenden Forschungsfragen und Kategorien kodiert werden sollten.

## FORSCHUNGSFRAGEN:
${researchQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## KODIER-KATEGORIEN:
${categories.map(c => `• **${c.name}**: ${c.description || 'Keine Beschreibung'}`).join('\n')}

## VERFÜGBARE SEGMENTE (${segmentSummaries.length} insgesamt):
${segmentSummaries.map(s => `[${s.index}] (Dokument: ${s.documentName}, ${s.wordCount} Wörter)\n${s.preview}`).join('\n\n')}

## DEINE AUFGABE:
1. Analysiere jedes Segment auf Relevanz für die Forschungsfragen und Kategorien
2. Wähle die ${maxSegments} informativsten, vielfältigsten und aussagekräftigsten Segmente aus
3. Priorisiere Segmente, die:
   - Direkt auf Forschungsfragen eingehen
   - Zu mehreren Kategorien passen könnten
   - Reichhaltige, detaillierte Informationen enthalten
   - Unterschiedliche Perspektiven repräsentieren
4. Vermeide redundante oder wenig aussagekräftige Segmente

## ANTWORT-FORMAT:
Antworte NUR mit einer JSON-Struktur. WICHTIG: Verwende keine Zeilenumbrüche oder Sonderzeichen in den String-Werten.

\`\`\`json
{
  "selectedIndices": [0, 5, 12, 18, ...],
  "reasoning": "Kurze einzeilige Begründung ohne Zeilenumbrüche"
}
\`\`\`

Die "selectedIndices" sollten die Array-Indices der ausgewählten Segmente sein.
WICHTIG: Wähle maximal ${maxSegments} Segmente aus.`;
    } else {
      return `# TASK: Intelligent Segment Selection for Qualitative Coding

You are an expert in qualitative research. Select the ${maxSegments} MOST RELEVANT segments that should be coded for the following research questions and categories.

## RESEARCH QUESTIONS:
${researchQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

## CODING CATEGORIES:
${categories.map(c => `• **${c.name}**: ${c.description || 'No description'}`).join('\n')}

## AVAILABLE SEGMENTS (${segmentSummaries.length} total):
${segmentSummaries.map(s => `[${s.index}] (Document: ${s.documentName}, ${s.wordCount} words)\n${s.preview}`).join('\n\n')}

## YOUR TASK:
1. Analyze each segment for relevance to research questions and categories
2. Select the ${maxSegments} most informative, diverse, and meaningful segments
3. Prioritize segments that:
   - Directly address research questions
   - Could fit multiple categories
   - Contain rich, detailed information
   - Represent different perspectives
4. Avoid redundant or uninformative segments

## RESPONSE FORMAT:
Respond ONLY with a JSON structure. IMPORTANT: Use no line breaks or special characters in string values.

\`\`\`json
{
  "selectedIndices": [0, 5, 12, 18, ...],
  "reasoning": "Brief single-line reasoning without line breaks"
}
\`\`\`

The "selectedIndices" should be the array indices of selected segments.
IMPORTANT: Select a maximum of ${maxSegments} segments.`;
    }
  }

  /**
   * Parse AI response to extract selected segment indices
   */
  private parseSelectionResponse(response: string): number[] {
    try {
      // Remove code fences if present
      let cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Extract JSON from response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      let jsonStr = jsonMatch[0];

      // Clean up JSON: Replace problematic characters with spaces (don't escape them)
      // This is safer than trying to escape, as it won't break JSON structure
      jsonStr = jsonStr
        .replace(/\r\n/g, ' ')  // Windows line breaks → space
        .replace(/\n/g, ' ')     // Unix line breaks → space
        .replace(/\r/g, ' ')     // Old Mac line breaks → space
        .replace(/\t/g, ' ')     // Tabs → space
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, ''); // Other control chars (keep \n and \t out)

      const parsed = JSON.parse(jsonStr);

      if (!Array.isArray(parsed.selectedIndices)) {
        throw new Error('selectedIndices is not an array');
      }

      return parsed.selectedIndices.filter((idx: any) => typeof idx === 'number');
    } catch (error: any) {
      console.error('Failed to parse selection response:', error);
      console.log('Raw response (first 500 chars):', response.substring(0, 500));
      // Fallback: try to extract numbers from response
      const numbers = response.match(/\d+/g)?.map(n => parseInt(n)) || [];
      return numbers.slice(0, 50); // Take first 50 numbers as indices
    }
  }

  /**
   * Extract reasoning from AI response
   */
  private extractReasoning(response: string): string {
    try {
      // Remove code fences if present
      let cleanedResponse = response.replace(/```json\s*/g, '').replace(/```\s*/g, '');

      // Extract JSON from response
      const jsonMatch = cleanedResponse.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        let jsonStr = jsonMatch[0];

        // Clean up JSON: Replace problematic characters with spaces
        jsonStr = jsonStr
          .replace(/\r\n/g, ' ')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\t/g, ' ')
          .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '');

        const parsed = JSON.parse(jsonStr);
        return parsed.reasoning || 'AI selected the most relevant segments based on research questions and categories.';
      }
    } catch (error) {
      // Ignore parsing errors
    }
    return 'AI selected the most relevant segments based on research questions and categories.';
  }
}

export default SmartSegmentSelector;
