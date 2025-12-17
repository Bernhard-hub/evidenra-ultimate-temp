// 🎯 AKIH-Enhanced Scientific Article Service
// Enhanced scientific article generation with full AKIH methodology integration

import APIService from '../../services/APIService';
import { AKIHMethodology } from '../../services/AKIHMethodology';
import AKIHScoreService from './AKIHScoreService';
import type { ProjectData } from '../../types';

export interface ScientificArticleOptions {
  language: 'de' | 'en';
  mode: 'ENHANCED' | 'COMPREHENSIVE';
  includeAKIHReport: boolean;
  targetWordCount: number;
  useAIGeneration: boolean; // NEW: AI-powered vs template-based
  includeMethodology: boolean;
  includeVisualizations: boolean;
}

export interface ScientificArticleResult {
  success: boolean;
  content?: string;
  wordCount?: number;
  cost?: number;
  akihScore?: number;
  error?: string;
  metadata?: {
    mode: string;
    documentsAnalyzed: number;
    categoriesAnalyzed: number;
    patternsIdentified: number;
  };
}

/**
 * 🌟 AKIH-Enhanced Scientific Article Service
 *
 * Generates high-quality scientific articles with:
 * ✅ Real AKIH methodology integration (not simplified)
 * ✅ AI-powered content generation with meta-prompts
 * ✅ Template-based data-driven reports (fast)
 * ✅ Full project data integration
 * ✅ Anti-hallucination protocols
 */
export class ScientificArticleService_AKIH {

  /**
   * 📊 Generate Scientific Article with AKIH Methodology
   */
  static async generateArticle(
    project: ProjectData,
    apiSettings: { provider: string; model: string; apiKey: string },
    options: ScientificArticleOptions,
    onStatusUpdate?: (status: string) => void
  ): Promise<ScientificArticleResult> {

    try {
      // 1️⃣ Calculate REAL AKIH Score (not simplified!)
      onStatusUpdate?.('📊 Calculating AKIH Score...');
      const akihScore = AKIHMethodology.calculateAKIHScore(project);
      const scoreSummary = AKIHScoreService.getScoreSummary(akihScore, options.language);

      // 2️⃣ Choose generation method
      if (options.useAIGeneration) {
        // AI-powered generation with meta-prompts
        return await this.generateAIPoweredArticle(
          project,
          akihScore,
          scoreSummary,
          apiSettings,
          options,
          onStatusUpdate
        );
      } else {
        // Template-based data-driven report (fast, no API costs)
        return this.generateDataDrivenReport(
          project,
          akihScore,
          scoreSummary,
          options
        );
      }

    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  }

  /**
   * 🤖 AI-Powered Article Generation with Meta-Prompts
   */
  private static async generateAIPoweredArticle(
    project: ProjectData,
    akihScore: any,
    scoreSummary: any,
    apiSettings: any,
    options: ScientificArticleOptions,
    onStatusUpdate?: (status: string) => void
  ): Promise<ScientificArticleResult> {

    const lang = options.language;
    let totalCost = 0;

    // STAGE 1: Meta-Analysis
    onStatusUpdate?.('🧠 Stage 1: Analyzing project data...');

    const metaPrompt = this.createMetaAnalysisPrompt(project, akihScore, options);
    const metaResult = await this.callAPI(apiSettings, metaPrompt, 20000);

    if (!metaResult.success) {
      return {
        success: false,
        error: `Meta-analysis failed: ${metaResult.error}`
      };
    }

    totalCost += metaResult.cost || 0;

    // STAGE 2: Generate Article
    onStatusUpdate?.('✍️ Stage 2: Generating scientific article...');

    const articlePrompt = this.createArticleGenerationPrompt(
      project,
      akihScore,
      metaResult.content || '',
      options
    );

    const maxTokens = Math.min(
      Math.ceil(options.targetWordCount * 2.2 * 1.5),
      50000
    );

    const articleResult = await this.callAPI(apiSettings, articlePrompt, maxTokens);

    if (!articleResult.success) {
      return {
        success: false,
        error: `Article generation failed: ${articleResult.error}`
      };
    }

    totalCost += articleResult.cost || 0;

    // 3️⃣ Add AKIH Report if requested
    let finalContent = articleResult.content || '';

    if (options.includeAKIHReport) {
      onStatusUpdate?.('⭐ Adding AKIH Quality Report...');
      const akihReport = AKIHMethodology.generateMethodologyReport(project);
      finalContent += `\n\n---\n\n# ${lang === 'de' ? 'AKIH Qualitätsbericht' : 'AKIH Quality Report'}\n\n${akihReport}`;
    }

    const wordCount = finalContent.split(/\s+/).length;

    return {
      success: true,
      content: finalContent,
      wordCount,
      cost: totalCost,
      akihScore: akihScore.totalScore,
      metadata: {
        mode: 'AI-Powered',
        documentsAnalyzed: project.documents?.length || 0,
        categoriesAnalyzed: project.categories?.length || 0,
        patternsIdentified: project.patterns?.length || 0
      }
    };
  }

  /**
   * 📄 Template-Based Data-Driven Report (Fast, No API Costs)
   */
  private static generateDataDrivenReport(
    project: ProjectData,
    akihScore: any,
    scoreSummary: any,
    options: ScientificArticleOptions
  ): ScientificArticleResult {

    const lang = options.language;
    const documents = project.documents || [];
    const categories = project.categories || [];
    const codings = project.codings || [];
    const patterns = project.patterns || [];

    // Build comprehensive data-driven report
    let report = '';

    // Header
    report += lang === 'de'
      ? `# Wissenschaftlicher Forschungsbericht\n\n`
      : `# Scientific Research Report\n\n`;

    report += `**${lang === 'de' ? 'Projekt' : 'Project'}:** ${project.name || 'Unbenannt'}\n`;
    report += `**${lang === 'de' ? 'Methodik' : 'Methodology'}:** AKIH v1.0 (AI-gestützte Kodierende Inhaltsanalyse Hybrid)\n`;
    report += `**${lang === 'de' ? 'Generiert' : 'Generated'}:** ${new Date().toLocaleString(lang === 'de' ? 'de-DE' : 'en-US')}\n\n`;

    report += `---\n\n`;

    // Executive Summary
    report += `## ${lang === 'de' ? 'Executive Summary' : 'Executive Summary'}\n\n`;
    report += `### ${lang === 'de' ? 'AKIH Qualitätsscore' : 'AKIH Quality Score'}\n\n`;
    report += `- **${lang === 'de' ? 'Gesamtscore' : 'Total Score'}:** ${akihScore.totalScore.toFixed(1)}/100 ${scoreSummary.qualityIcon}\n`;
    report += `- **${lang === 'de' ? 'Qualitätsstufe' : 'Quality Level'}:** ${scoreSummary.quality}\n`;
    report += `- **${lang === 'de' ? 'Publikationsreife' : 'Publication Readiness'}:** ${akihScore.qualityLevel === 'excellent' || akihScore.qualityLevel === 'good' ? '✅' : '⚠️'} ${akihScore.qualityLevel === 'excellent' || akihScore.qualityLevel === 'good' ? (lang === 'de' ? 'Bereit' : 'Ready') : (lang === 'de' ? 'Verbesserungen empfohlen' : 'Improvements recommended')}\n\n`;

    // Project Statistics
    report += `### ${lang === 'de' ? 'Projektstatistik' : 'Project Statistics'}\n\n`;
    report += `- **${lang === 'de' ? 'Dokumente' : 'Documents'}:** ${documents.length}\n`;
    report += `- **${lang === 'de' ? 'Analysierte Dokumente' : 'Analyzed Documents'}:** ${akihScore.metrics.analyzedDocuments}\n`;
    report += `- **${lang === 'de' ? 'Gesamtwortanzahl' : 'Total Word Count'}:** ${documents.reduce((sum, d) => sum + (d.wordCount || 0), 0).toLocaleString()}\n`;
    report += `- **${lang === 'de' ? 'Kategorien' : 'Categories'}:** ${categories.length}\n`;
    report += `- **${lang === 'de' ? 'Kodierungen' : 'Codings'}:** ${codings.length} (${akihScore.metrics.validatedCodings} ${lang === 'de' ? 'validiert' : 'validated'})\n`;
    report += `- **${lang === 'de' ? 'Identifizierte Muster' : 'Identified Patterns'}:** ${patterns.length}\n\n`;

    // Quality Metrics
    report += `### ${lang === 'de' ? 'Qualitätsmetriken' : 'Quality Metrics'}\n\n`;
    scoreSummary.components.forEach((comp: any) => {
      const status = comp.status === 'excellent' ? '🟢' : comp.status === 'good' ? '🔵' : comp.status === 'warning' ? '🟡' : '🔴';
      report += `- ${status} **${comp.name}:** ${comp.percentage}\n`;
    });
    report += `\n`;

    // Methodology
    if (options.includeMethodology) {
      report += `---\n\n## ${lang === 'de' ? 'Methodik' : 'Methodology'}\n\n`;
      report += lang === 'de'
        ? `Diese Studie verwendet die **AKIH-Methodik** (AI-gestützte Kodierende Inhaltsanalyse Hybrid), eine innovative Kombination aus AI-unterstützter qualitativer Inhaltsanalyse und regelgeleiteter menschlicher Interaktion.\n\n`
        : `This study employs the **AKIH Methodology** (AI-Assisted Hybrid Coding Content Analysis), an innovative combination of AI-supported qualitative content analysis and rule-guided human interaction.\n\n`;

      report += `### ${lang === 'de' ? 'Forschungsansatz' : 'Research Approach'}\n\n`;
      report += lang === 'de'
        ? `- **Kodierungsqualität:** Precision ${(akihScore.precision * 100).toFixed(1)}%, Recall ${(akihScore.recall * 100).toFixed(1)}%\n`
        : `- **Coding Quality:** Precision ${(akihScore.precision * 100).toFixed(1)}%, Recall ${(akihScore.recall * 100).toFixed(1)}%\n`;
      report += lang === 'de'
        ? `- **Theoretische Sättigung:** ${(akihScore.saturation * 100).toFixed(1)}% erreicht\n`
        : `- **Theoretical Saturation:** ${(akihScore.saturation * 100).toFixed(1)}% achieved\n`;
      report += lang === 'de'
        ? `- **Datenabdeckung:** ${(akihScore.coverage * 100).toFixed(1)}% der Dokumente analysiert\n`
        : `- **Data Coverage:** ${(akihScore.coverage * 100).toFixed(1)}% of documents analyzed\n`;
      report += `\n`;
    }

    // Category Analysis
    report += `---\n\n## ${lang === 'de' ? 'Kategorienanalyse' : 'Category Analysis'}\n\n`;
    categories.forEach((cat, idx) => {
      const catCodings = codings.filter(c => c.categoryId === cat.id);
      const significance = catCodings.length / Math.max(codings.length, 1);
      const significanceLabel = significance > 0.3 ? (lang === 'de' ? 'Hoch' : 'High') : significance > 0.15 ? (lang === 'de' ? 'Mittel' : 'Medium') : (lang === 'de' ? 'Niedrig' : 'Low');

      report += `### ${idx + 1}. ${cat.name}\n\n`;
      if (cat.description) {
        report += `${cat.description}\n\n`;
      }
      report += `- **${lang === 'de' ? 'Kodierungen' : 'Codings'}:** ${catCodings.length}\n`;
      report += `- **${lang === 'de' ? 'Signifikanz' : 'Significance'}:** ${significanceLabel} (${(significance * 100).toFixed(1)}%)\n`;

      // Sample quotes
      const sampleQuotes = catCodings.slice(0, 3);
      if (sampleQuotes.length > 0) {
        report += `- **${lang === 'de' ? 'Beispielzitate' : 'Sample Quotes'}:**\n`;
        sampleQuotes.forEach(coding => {
          const text = coding.text || '';
          const truncated = text.length > 150 ? text.substring(0, 150) + '...' : text;
          report += `  - "${truncated}"\n`;
        });
      }
      report += `\n`;
    });

    // Patterns
    if (patterns.length > 0) {
      report += `---\n\n## ${lang === 'de' ? 'Emergente Muster' : 'Emergent Patterns'}\n\n`;
      patterns.forEach((pattern, idx) => {
        report += `${idx + 1}. **${pattern.pattern || pattern.name}**\n`;
        report += `   - ${lang === 'de' ? 'Häufigkeit' : 'Frequency'}: ${pattern.count || 'N/A'}\n`;
        report += `   - ${lang === 'de' ? 'Stärke' : 'Strength'}: ${pattern.strength || pattern.confidence || 'N/A'}\n`;
        if (pattern.description) {
          report += `   - ${pattern.description}\n`;
        }
        report += `\n`;
      });
    }

    // Document Insights
    report += `---\n\n## ${lang === 'de' ? 'Dokumentenanalyse' : 'Document Analysis'}\n\n`;
    const topDocs = documents.slice(0, Math.min(10, documents.length));
    topDocs.forEach((doc, idx) => {
      const docCodings = codings.filter(c => c.documentId === doc.id);
      report += `### ${lang === 'de' ? 'Dokument' : 'Document'} ${idx + 1}: ${doc.name}\n\n`;
      report += `- **${lang === 'de' ? 'Wortanzahl' : 'Word Count'}:** ${doc.wordCount || 0}\n`;
      report += `- **${lang === 'de' ? 'Kodierungen' : 'Codings'}:** ${docCodings.length}\n`;

      // Key topics from codings
      const docCategories = [...new Set(docCodings.map(c => {
        const cat = categories.find(cat => cat.id === c.categoryId);
        return cat?.name || 'Unbekannt';
      }))];

      if (docCategories.length > 0) {
        report += `- **${lang === 'de' ? 'Hauptthemen' : 'Key Topics'}:** ${docCategories.slice(0, 5).join(', ')}\n`;
      }
      report += `\n`;
    });

    // Suggestions
    if (scoreSummary.suggestions.length > 0) {
      report += `---\n\n## ${lang === 'de' ? 'Verbesserungsvorschläge' : 'Improvement Suggestions'}\n\n`;
      scoreSummary.suggestions.forEach((suggestion: string, idx: number) => {
        report += `${idx + 1}. ${suggestion}\n`;
      });
      report += `\n`;
    }

    // AKIH Report
    if (options.includeAKIHReport) {
      const akihReport = AKIHMethodology.generateMethodologyReport(project);
      report += `\n\n---\n\n# ${lang === 'de' ? 'AKIH Detailbericht' : 'AKIH Detailed Report'}\n\n${akihReport}`;
    }

    // Footer
    report += `\n\n---\n\n`;
    report += `*${lang === 'de' ? 'Generiert mit' : 'Generated with'} EVIDENRA Professional v1.0 - AKIH Methodology*\n`;

    const wordCount = report.split(/\s+/).length;

    return {
      success: true,
      content: report,
      wordCount,
      cost: 0, // Template-based, no API costs
      akihScore: akihScore.totalScore,
      metadata: {
        mode: 'Data-Driven Template',
        documentsAnalyzed: akihScore.metrics.analyzedDocuments,
        categoriesAnalyzed: categories.length,
        patternsIdentified: patterns.length
      }
    };
  }

  /**
   * 🧠 Create Meta-Analysis Prompt
   */
  private static createMetaAnalysisPrompt(
    project: ProjectData,
    akihScore: any,
    options: ScientificArticleOptions
  ): any[] {

    const lang = options.language;
    const dataContext = this.createDataContext(project, akihScore);

    return [
      {
        role: 'system',
        content: lang === 'de'
          ? `Du bist ein Meta-Analyst für wissenschaftliche Forschung. Analysiere die Projektdaten und erstelle einen strukturierten Plan für einen wissenschaftlichen Artikel.`
          : `You are a meta-analyst for scientific research. Analyze the project data and create a structured plan for a scientific article.`
      },
      {
        role: 'user',
        content: `${dataContext}

## ${lang === 'de' ? 'AUFGABE' : 'TASK'}:
${lang === 'de' ? 'Analysiere die Daten und erstelle einen detaillierten Plan für einen wissenschaftlichen Artikel.' : 'Analyze the data and create a detailed plan for a scientific article.'}

**${lang === 'de' ? 'Anforderungen' : 'Requirements'}:**
1. ${lang === 'de' ? 'Identifiziere die 5-7 wichtigsten Erkenntnisse' : 'Identify the 5-7 key findings'}
2. ${lang === 'de' ? 'Bestimme theoretische Bezüge' : 'Determine theoretical connections'}
3. ${lang === 'de' ? 'Strukturiere die Argumentation' : 'Structure the argumentation'}
4. ${lang === 'de' ? 'Plane Sektionen und Inhalte' : 'Plan sections and content'}

**${lang === 'de' ? 'Format' : 'Format'}:**
- ${lang === 'de' ? 'Haupterkenntnisse' : 'Key Findings'}: [Liste]
- ${lang === 'de' ? 'Theoretische Perspektive' : 'Theoretical Perspective'}: [Beschreibung]
- ${lang === 'de' ? 'Artikelstruktur' : 'Article Structure'}: [Sektionen]
- ${lang === 'de' ? 'Datenschwerpunkte' : 'Data Focus'}: [Kategorien/Muster]`
      }
    ];
  }

  /**
   * ✍️ Create Article Generation Prompt
   */
  private static createArticleGenerationPrompt(
    project: ProjectData,
    akihScore: any,
    metaAnalysis: string,
    options: ScientificArticleOptions
  ): any[] {

    const lang = options.language;
    const dataContext = this.createDataContext(project, akihScore);

    return [
      {
        role: 'system',
        content: lang === 'de'
          ? `Du bist ein Experte für wissenschaftliches Schreiben. Schreibe einen wissenschaftlichen Artikel basierend auf dem Meta-Analyse-Plan.

🎯 ANTI-HALLUCINATION PROTOCOL:
- Verwende NUR Daten aus dem bereitgestellten Kontext
- KEINE erfundenen Statistiken, Zitate oder Beispiele
- Jede Behauptung muss durch Projektdaten belegt sein

📊 AKIH Score: ${akihScore.totalScore.toFixed(1)}/100`
          : `You are an expert in scientific writing. Write a scientific article based on the meta-analysis plan.

🎯 ANTI-HALLUCINATION PROTOCOL:
- Use ONLY data from provided context
- NO fabricated statistics, quotes or examples

📊 AKIH Score: ${akihScore.totalScore.toFixed(1)}/100`
      },
      {
        role: 'user',
        content: `# ${lang === 'de' ? 'META-ANALYSE PLAN' : 'META-ANALYSIS PLAN'}:
${metaAnalysis}

---

# ${lang === 'de' ? 'PROJEKTDATEN' : 'PROJECT DATA'}:
${dataContext}

---

## ${lang === 'de' ? 'ANWEISUNG' : 'INSTRUCTION'}:
${lang === 'de' ? `Schreibe JETZT einen vollständigen wissenschaftlichen Artikel mit MINDESTENS ${options.targetWordCount} Wörtern.` : `Write NOW a complete scientific article with AT LEAST ${options.targetWordCount} words.`}

**${lang === 'de' ? 'WICHTIG' : 'IMPORTANT'}:**
- ${lang === 'de' ? 'Folge dem Meta-Analyse-Plan' : 'Follow the meta-analysis plan'}
- ${lang === 'de' ? 'Verwende nur Daten aus dem Kontext' : 'Use only data from context'}
- ${lang === 'de' ? 'Wissenschaftlicher Stil' : 'Scientific style'}
- ${lang === 'de' ? 'Vollständige Ausformulierung' : 'Complete elaboration'}

${lang === 'de' ? 'Beginne JETZT:' : 'Begin NOW:'}`
      }
    ];
  }

  /**
   * 📊 Create comprehensive data context
   */
  private static createDataContext(project: ProjectData, akihScore: any): string {
    const documents = project.documents || [];
    const categories = project.categories || [];
    const codings = project.codings || [];
    const patterns = project.patterns || [];

    return `# ${project.name || 'Unbenannt'}

## AKIH SCORE: ${akihScore.totalScore.toFixed(1)}/100
- Precision: ${(akihScore.precision * 100).toFixed(1)}%
- Recall: ${(akihScore.recall * 100).toFixed(1)}%
- Saturation: ${(akihScore.saturation * 100).toFixed(1)}%
- Coverage: ${(akihScore.coverage * 100).toFixed(1)}%

## STATISTIK:
- Dokumente: ${documents.length}
- Kategorien: ${categories.length}
- Kodierungen: ${codings.length}
- Validiert: ${akihScore.metrics.validatedCodings}
- Muster: ${patterns.length}

## KATEGORIEN:
${categories.map((cat, i) => {
  const catCodings = codings.filter(c => c.categoryId === cat.id);
  return `${i + 1}. ${cat.name} (${catCodings.length} Kodierungen)${cat.description ? ': ' + cat.description : ''}`;
}).join('\n')}

## MUSTER:
${patterns.map((p, i) => `${i + 1}. ${p.pattern || p.name} (${p.count || 'N/A'})`).join('\n') || 'Keine Muster'}`;
  }

  /**
   * 🌐 Call API helper
   */
  private static async callAPI(
    apiSettings: any,
    messages: any[],
    maxTokens: number
  ): Promise<{ success: boolean; content?: string; cost?: number; error?: string }> {
    try {
      const result = await APIService.callAPI(
        apiSettings.provider,
        apiSettings.model,
        apiSettings.apiKey,
        messages,
        maxTokens
      );

      return {
        success: result.success,
        content: result.content,
        cost: result.cost,
        error: result.error
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error)
      };
    }
  }
}

export default ScientificArticleService_AKIH;
