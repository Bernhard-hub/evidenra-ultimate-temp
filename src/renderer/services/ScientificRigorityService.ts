// ScientificRigorityService.ts - Integration wissenschaftlicher Rigorosität in Berichte
// 🔬 Extrahiert und formatiert Memos, Reflexivität und wissenschaftliche Rigorosität für Reports

export interface ResearchNote {
  id: string;
  content: string;
  timestamp: string;
  category?: string;
  type: 'observation' | 'reflection' | 'decision' | 'insight';
}

export interface ResearchMemo {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  linkedCodings?: string[];
  linkedCategories?: string[];
  type: 'theoretical' | 'methodological' | 'analytical' | 'reflexive';
}

export interface ReflexivityEntry {
  id: string;
  timestamp: string;
  preAssumptions: string;
  reflectionContent: string;
  methodologicalDecision?: string;
  impact: 'low' | 'medium' | 'high';
}

export interface ScientificRigorityScores {
  hermeneuticDepth: number;
  epistemologicalRigor: number;
  methodologicalCoherence: number;
  theoreticalSaturation: number;
  reflexiveAuthenticity: number;
  emergentComplexity: number;
  transformativePotential: number;
  narrativeCoherence: number;
  contextualEmbedding: number;
  intersubjektiveValidität: number;
  totalScore: number;
  grade: string;
}

export interface ScientificRigorityData {
  notes: ResearchNote[];
  memos: ResearchMemo[];
  reflexivityLog: ReflexivityEntry[];
  scores: ScientificRigorityScores;
  summary: RigoritySummary;
}

export interface RigoritySummary {
  totalNotes: number;
  totalMemos: number;
  totalReflexivityEntries: number;
  memosByType: { [key: string]: number };
  notesByType: { [key: string]: number };
  highImpactDecisions: number;
  overallRigorityLevel: 'Exzellent' | 'Gut' | 'Befriedigend' | 'Verbesserungswürdig';
  strengths: string[];
  improvements: string[];
}

export class ScientificRigorityService {

  /**
   * Extrahiert wissenschaftliche Rigorositätsdaten aus dem Projekt
   */
  static extractRigorityData(project: any): ScientificRigorityData {
    const notes = this.extractNotes(project);
    const memos = this.extractMemos(project);
    const reflexivityLog = this.extractReflexivityLog(project);
    const scores = this.calculateRigorityScores(project, notes, memos, reflexivityLog);
    const summary = this.generateSummary(notes, memos, reflexivityLog, scores);

    return {
      notes,
      memos,
      reflexivityLog,
      scores,
      summary
    };
  }

  /**
   * Extrahiert Forschungsnotizen
   */
  private static extractNotes(project: any): ResearchNote[] {
    const notes: ResearchNote[] = [];

    // Aus research.notes
    if (project?.research?.notes && Array.isArray(project.research.notes)) {
      project.research.notes.forEach((note: any, index: number) => {
        notes.push({
          id: note.id || `note-${index}`,
          content: note.content || note.text || '',
          timestamp: note.timestamp || note.dateCreated || new Date().toISOString(),
          category: note.category || 'general',
          type: this.categorizeNoteType(note.content || note.text || '')
        });
      });
    }

    return notes;
  }

  /**
   * Extrahiert Forschungsmemos
   */
  private static extractMemos(project: any): ResearchMemo[] {
    const memos: ResearchMemo[] = [];

    // Aus research.memos
    if (project?.research?.memos && Array.isArray(project.research.memos)) {
      project.research.memos.forEach((memo: any, index: number) => {
        memos.push({
          id: memo.id || `memo-${index}`,
          title: memo.title || `Memo ${index + 1}`,
          content: memo.content || memo.text || '',
          timestamp: memo.timestamp || memo.dateCreated || new Date().toISOString(),
          linkedCodings: memo.linkedCodings || [],
          linkedCategories: memo.linkedCategories || [],
          type: this.categorizeMemoType(memo.content || memo.text || '', memo.type)
        });
      });
    }

    return memos;
  }

  /**
   * Extrahiert Reflexivitätseinträge
   */
  private static extractReflexivityLog(project: any): ReflexivityEntry[] {
    const entries: ReflexivityEntry[] = [];

    // Aus research.reflexivityLog
    if (project?.research?.reflexivityLog && Array.isArray(project.research.reflexivityLog)) {
      project.research.reflexivityLog.forEach((entry: any, index: number) => {
        entries.push({
          id: entry.id || `reflexivity-${index}`,
          timestamp: entry.timestamp || new Date().toISOString(),
          preAssumptions: entry.preAssumptions || entry.assumptions || '',
          reflectionContent: entry.reflectionContent || entry.reflection || entry.content || '',
          methodologicalDecision: entry.methodologicalDecision || entry.decision || undefined,
          impact: this.assessImpact(entry)
        });
      });
    }

    return entries;
  }

  /**
   * Berechnet wissenschaftliche Rigorositäts-Scores
   */
  private static calculateRigorityScores(
    project: any,
    notes: ResearchNote[],
    memos: ResearchMemo[],
    reflexivityLog: ReflexivityEntry[]
  ): ScientificRigorityScores {

    // Verwende existierende Scores falls vorhanden
    if (project?.rigorityScores) {
      return project.rigorityScores;
    }

    // Berechne Basis-Scores
    const metaIterations = project?.metaIterations || 0;
    const hasMetadata = Boolean(project?.metadata?.researcher);
    const documentsCount = project?.documents?.length || 0;
    const categoriesCount = project?.categories?.length || 0;
    const codingsCount = project?.codings?.length || 0;

    // Reflexive Authentizität basierend auf Memos und Notizen
    const reflexiveAuthenticity = this.calculateReflexiveAuthenticity(
      metaIterations, hasMetadata, notes.length, memos.length, reflexivityLog.length
    );

    // Hermeneutische Tiefe basierend auf Kategorien und Kodierungen
    const hermeneuticDepth = this.calculateHermeneuticDepth(
      categoriesCount, codingsCount, documentsCount
    );

    // Epistemologische Rigorosität
    const epistemologicalRigor = this.calculateEpistemologicalRigor(
      memos.filter(m => m.type === 'methodological').length,
      reflexivityLog.filter(r => r.methodologicalDecision).length
    );

    // Methodologische Kohärenz
    const methodologicalCoherence = this.calculateMethodologicalCoherence(
      memos.filter(m => m.type === 'methodological').length,
      categoriesCount > 0 ? codingsCount / categoriesCount : 0
    );

    // Theoretische Sättigung
    const theoreticalSaturation = this.calculateTheoreticalSaturation(
      categoriesCount, codingsCount, memos.filter(m => m.type === 'theoretical').length
    );

    // Emergente Komplexität
    const emergentComplexity = this.calculateEmergentComplexity(
      project?.patterns?.length || 0, categoriesCount
    );

    // Transformatives Potenzial
    const transformativePotential = this.calculateTransformativePotential(
      notes.filter(n => n.type === 'insight').length,
      memos.filter(m => m.type === 'analytical').length
    );

    // Narrative Kohärenz
    const narrativeCoherence = this.calculateNarrativeCoherence(memos.length, notes.length);

    // Kontextuelle Einbettung
    const contextualEmbedding = this.calculateContextualEmbedding(documentsCount, hasMetadata);

    // Intersubjektive Validität
    const intersubjektiveValidität = this.calculateIntersubjektiveValidität(
      reflexivityLog.length, metaIterations
    );

    // Gesamtscore berechnen (gewichtet)
    const weights = {
      hermeneuticDepth: 0.15,
      epistemologicalRigor: 0.12,
      methodologicalCoherence: 0.12,
      theoreticalSaturation: 0.10,
      reflexiveAuthenticity: 0.08,
      emergentComplexity: 0.10,
      transformativePotential: 0.08,
      narrativeCoherence: 0.08,
      contextualEmbedding: 0.09,
      intersubjektiveValidität: 0.08
    };

    const totalScore =
      hermeneuticDepth * weights.hermeneuticDepth +
      epistemologicalRigor * weights.epistemologicalRigor +
      methodologicalCoherence * weights.methodologicalCoherence +
      theoreticalSaturation * weights.theoreticalSaturation +
      reflexiveAuthenticity * weights.reflexiveAuthenticity +
      emergentComplexity * weights.emergentComplexity +
      transformativePotential * weights.transformativePotential +
      narrativeCoherence * weights.narrativeCoherence +
      contextualEmbedding * weights.contextualEmbedding +
      intersubjektiveValidität * weights.intersubjektiveValidität;

    const normalizedTotal = totalScore * 100;

    return {
      hermeneuticDepth,
      epistemologicalRigor,
      methodologicalCoherence,
      theoreticalSaturation,
      reflexiveAuthenticity,
      emergentComplexity,
      transformativePotential,
      narrativeCoherence,
      contextualEmbedding,
      intersubjektiveValidität,
      totalScore: normalizedTotal,
      grade: this.getGrade(normalizedTotal)
    };
  }

  /**
   * Generiert Zusammenfassung der Rigorositätsdaten
   */
  private static generateSummary(
    notes: ResearchNote[],
    memos: ResearchMemo[],
    reflexivityLog: ReflexivityEntry[],
    scores: ScientificRigorityScores
  ): RigoritySummary {

    // Memos nach Typ zählen
    const memosByType: { [key: string]: number } = {};
    memos.forEach(m => {
      memosByType[m.type] = (memosByType[m.type] || 0) + 1;
    });

    // Notizen nach Typ zählen
    const notesByType: { [key: string]: number } = {};
    notes.forEach(n => {
      notesByType[n.type] = (notesByType[n.type] || 0) + 1;
    });

    // High-Impact-Entscheidungen zählen
    const highImpactDecisions = reflexivityLog.filter(r => r.impact === 'high').length;

    // Stärken und Verbesserungen identifizieren
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (scores.reflexiveAuthenticity > 0.7) {
      strengths.push('Hohe reflexive Authentizität durch umfangreiche Dokumentation');
    } else if (scores.reflexiveAuthenticity < 0.4) {
      improvements.push('Mehr Forschungsreflexionen und Memos hinzufügen');
    }

    if (scores.methodologicalCoherence > 0.7) {
      strengths.push('Starke methodologische Kohärenz');
    } else if (scores.methodologicalCoherence < 0.4) {
      improvements.push('Methodologische Entscheidungen besser dokumentieren');
    }

    if (scores.theoreticalSaturation > 0.7) {
      strengths.push('Gute theoretische Sättigung erreicht');
    } else if (scores.theoreticalSaturation < 0.4) {
      improvements.push('Mehr theoretische Memos und Kategorienreflexionen hinzufügen');
    }

    if (memos.length > 5) {
      strengths.push(`${memos.length} analytische Memos dokumentiert`);
    }

    if (reflexivityLog.length > 3) {
      strengths.push(`${reflexivityLog.length} Reflexivitätseinträge zeigen kritische Selbstreflexion`);
    }

    // Gesamtniveau bestimmen
    let overallLevel: RigoritySummary['overallRigorityLevel'];
    if (scores.totalScore >= 80) {
      overallLevel = 'Exzellent';
    } else if (scores.totalScore >= 60) {
      overallLevel = 'Gut';
    } else if (scores.totalScore >= 40) {
      overallLevel = 'Befriedigend';
    } else {
      overallLevel = 'Verbesserungswürdig';
    }

    return {
      totalNotes: notes.length,
      totalMemos: memos.length,
      totalReflexivityEntries: reflexivityLog.length,
      memosByType,
      notesByType,
      highImpactDecisions,
      overallRigorityLevel: overallLevel,
      strengths,
      improvements
    };
  }

  /**
   * Formatiert Rigorositätsdaten für Berichtsintegration
   */
  static formatForReport(data: ScientificRigorityData, language: string = 'de'): string {
    if (language === 'de') {
      return this.formatGerman(data);
    }
    return this.formatEnglish(data);
  }

  private static formatGerman(data: ScientificRigorityData): string {
    let report = `## Wissenschaftliche Rigorosität & Reflexivität

### Zusammenfassung
- **Gesamtbewertung:** ${data.summary.overallRigorityLevel} (${data.scores.totalScore.toFixed(1)}/100)
- **Forschungsnotizen:** ${data.summary.totalNotes}
- **Analytische Memos:** ${data.summary.totalMemos}
- **Reflexivitätseinträge:** ${data.summary.totalReflexivityEntries}
- **High-Impact-Entscheidungen:** ${data.summary.highImpactDecisions}

### Rigorositäts-Dimensionen
| Dimension | Score | Bewertung |
|-----------|-------|-----------|
| Hermeneutische Tiefe | ${(data.scores.hermeneuticDepth * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.hermeneuticDepth)} |
| Epistemologische Rigorosität | ${(data.scores.epistemologicalRigor * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.epistemologicalRigor)} |
| Methodologische Kohärenz | ${(data.scores.methodologicalCoherence * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.methodologicalCoherence)} |
| Theoretische Sättigung | ${(data.scores.theoreticalSaturation * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.theoreticalSaturation)} |
| Reflexive Authentizität | ${(data.scores.reflexiveAuthenticity * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.reflexiveAuthenticity)} |
| Emergente Komplexität | ${(data.scores.emergentComplexity * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.emergentComplexity)} |
| Transformatives Potenzial | ${(data.scores.transformativePotential * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.transformativePotential)} |
| Narrative Kohärenz | ${(data.scores.narrativeCoherence * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.narrativeCoherence)} |
| Kontextuelle Einbettung | ${(data.scores.contextualEmbedding * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.contextualEmbedding)} |
| Intersubjektive Validität | ${(data.scores.intersubjektiveValidität * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.intersubjektiveValidität)} |
`;

    // Stärken hinzufügen
    if (data.summary.strengths.length > 0) {
      report += `\n### Stärken\n`;
      data.summary.strengths.forEach(s => {
        report += `- ✓ ${s}\n`;
      });
    }

    // Verbesserungsvorschläge hinzufügen
    if (data.summary.improvements.length > 0) {
      report += `\n### Verbesserungsvorschläge\n`;
      data.summary.improvements.forEach(i => {
        report += `- → ${i}\n`;
      });
    }

    // Memos nach Typ
    if (data.summary.totalMemos > 0) {
      report += `\n### Analytische Memos nach Typ\n`;
      Object.entries(data.summary.memosByType).forEach(([type, count]) => {
        const typeLabel = {
          'theoretical': 'Theoretisch',
          'methodological': 'Methodologisch',
          'analytical': 'Analytisch',
          'reflexive': 'Reflexiv'
        }[type] || type;
        report += `- ${typeLabel}: ${count}\n`;
      });
    }

    // Ausgewählte Memos
    if (data.memos.length > 0) {
      report += `\n### Ausgewählte Forschungsmemos\n`;
      data.memos.slice(0, 5).forEach((memo, i) => {
        report += `\n**${i + 1}. ${memo.title}** (${memo.type})\n`;
        report += `> ${memo.content.substring(0, 300)}${memo.content.length > 300 ? '...' : ''}\n`;
      });
    }

    // Reflexivitätsprotokoll
    if (data.reflexivityLog.length > 0) {
      report += `\n### Reflexivitätsprotokoll\n`;
      data.reflexivityLog.slice(0, 3).forEach((entry, i) => {
        report += `\n**Reflexion ${i + 1}** (Impact: ${entry.impact})\n`;
        if (entry.preAssumptions) {
          report += `- *Vorannahmen:* ${entry.preAssumptions.substring(0, 150)}...\n`;
        }
        report += `- *Reflexion:* ${entry.reflectionContent.substring(0, 200)}...\n`;
        if (entry.methodologicalDecision) {
          report += `- *Methodologische Entscheidung:* ${entry.methodologicalDecision}\n`;
        }
      });
    }

    return report;
  }

  private static formatEnglish(data: ScientificRigorityData): string {
    return `## Scientific Rigor & Reflexivity

### Summary
- **Overall Assessment:** ${data.summary.overallRigorityLevel} (${data.scores.totalScore.toFixed(1)}/100)
- **Research Notes:** ${data.summary.totalNotes}
- **Analytical Memos:** ${data.summary.totalMemos}
- **Reflexivity Entries:** ${data.summary.totalReflexivityEntries}

### Rigority Dimensions
| Dimension | Score | Rating |
|-----------|-------|--------|
| Hermeneutic Depth | ${(data.scores.hermeneuticDepth * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.hermeneuticDepth)} |
| Epistemological Rigor | ${(data.scores.epistemologicalRigor * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.epistemologicalRigor)} |
| Methodological Coherence | ${(data.scores.methodologicalCoherence * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.methodologicalCoherence)} |
| Theoretical Saturation | ${(data.scores.theoreticalSaturation * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.theoreticalSaturation)} |
| Reflexive Authenticity | ${(data.scores.reflexiveAuthenticity * 100).toFixed(1)}% | ${this.getScoreLabel(data.scores.reflexiveAuthenticity)} |
`;
  }

  // Helper Methoden
  private static categorizeNoteType(content: string): ResearchNote['type'] {
    const lower = content.toLowerCase();
    if (lower.includes('reflexion') || lower.includes('reflection') || lower.includes('bedenk')) {
      return 'reflection';
    }
    if (lower.includes('entscheid') || lower.includes('decision') || lower.includes('beschloss')) {
      return 'decision';
    }
    if (lower.includes('erkenntnis') || lower.includes('insight') || lower.includes('entdeck')) {
      return 'insight';
    }
    return 'observation';
  }

  private static categorizeMemoType(content: string, existingType?: string): ResearchMemo['type'] {
    if (existingType && ['theoretical', 'methodological', 'analytical', 'reflexive'].includes(existingType)) {
      return existingType as ResearchMemo['type'];
    }
    const lower = content.toLowerCase();
    if (lower.includes('theor') || lower.includes('konzept') || lower.includes('framework')) {
      return 'theoretical';
    }
    if (lower.includes('method') || lower.includes('vorgehen') || lower.includes('verfahren')) {
      return 'methodological';
    }
    if (lower.includes('reflexi') || lower.includes('selbst') || lower.includes('kritisch')) {
      return 'reflexive';
    }
    return 'analytical';
  }

  private static assessImpact(entry: any): ReflexivityEntry['impact'] {
    if (entry.impact && ['low', 'medium', 'high'].includes(entry.impact)) {
      return entry.impact;
    }
    // Heuristik basierend auf Inhalt
    const content = (entry.reflectionContent || entry.content || '').toLowerCase();
    if (content.includes('fundamental') || content.includes('grundlegend') || content.includes('wesentlich')) {
      return 'high';
    }
    if (content.includes('anpass') || content.includes('änder') || content.includes('modifiz')) {
      return 'medium';
    }
    return 'low';
  }

  private static calculateReflexiveAuthenticity(
    iterations: number, hasMetadata: boolean, notesCount: number, memosCount: number, reflexivityCount: number
  ): number {
    const iterationScore = Math.min(1, iterations / 3) * 0.2;
    const metadataScore = hasMetadata ? 0.15 : 0.05;
    const notesScore = Math.min(1, notesCount / 10) * 0.2;
    const memosScore = Math.min(1, memosCount / 5) * 0.25;
    const reflexivityScore = Math.min(1, reflexivityCount / 3) * 0.2;
    return iterationScore + metadataScore + notesScore + memosScore + reflexivityScore;
  }

  private static calculateHermeneuticDepth(categories: number, codings: number, documents: number): number {
    if (documents === 0) return 0;
    const categoryDepth = Math.min(1, categories / 10) * 0.4;
    const codingDensity = Math.min(1, (codings / documents) / 20) * 0.4;
    const coverage = Math.min(1, documents / 20) * 0.2;
    return categoryDepth + codingDensity + coverage;
  }

  private static calculateEpistemologicalRigor(methodMemos: number, methodDecisions: number): number {
    const memoScore = Math.min(1, methodMemos / 3) * 0.6;
    const decisionScore = Math.min(1, methodDecisions / 2) * 0.4;
    return memoScore + decisionScore;
  }

  private static calculateMethodologicalCoherence(methodMemos: number, codingsPerCategory: number): number {
    const memoScore = Math.min(1, methodMemos / 3) * 0.5;
    const balanceScore = Math.min(1, codingsPerCategory / 10) * 0.5;
    return memoScore + balanceScore;
  }

  private static calculateTheoreticalSaturation(categories: number, codings: number, theoreticalMemos: number): number {
    const categoryScore = Math.min(1, categories / 8) * 0.4;
    const codingScore = Math.min(1, codings / 50) * 0.3;
    const memoScore = Math.min(1, theoreticalMemos / 3) * 0.3;
    return categoryScore + codingScore + memoScore;
  }

  private static calculateEmergentComplexity(patterns: number, categories: number): number {
    const patternScore = Math.min(1, patterns / 10) * 0.6;
    const categoryScore = Math.min(1, categories / 8) * 0.4;
    return patternScore + categoryScore;
  }

  private static calculateTransformativePotential(insights: number, analyticalMemos: number): number {
    const insightScore = Math.min(1, insights / 5) * 0.5;
    const memoScore = Math.min(1, analyticalMemos / 3) * 0.5;
    return insightScore + memoScore;
  }

  private static calculateNarrativeCoherence(memos: number, notes: number): number {
    const memoScore = Math.min(1, memos / 5) * 0.6;
    const noteScore = Math.min(1, notes / 10) * 0.4;
    return memoScore + noteScore;
  }

  private static calculateContextualEmbedding(documents: number, hasMetadata: boolean): number {
    const docScore = Math.min(1, documents / 20) * 0.7;
    const metaScore = hasMetadata ? 0.3 : 0.1;
    return docScore + metaScore;
  }

  private static calculateIntersubjektiveValidität(reflexivity: number, iterations: number): number {
    const reflexivityScore = Math.min(1, reflexivity / 5) * 0.6;
    const iterationScore = Math.min(1, iterations / 3) * 0.4;
    return reflexivityScore + iterationScore;
  }

  private static getGrade(score: number): string {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    return 'F';
  }

  private static getScoreLabel(score: number): string {
    if (score >= 0.8) return 'Exzellent';
    if (score >= 0.6) return 'Gut';
    if (score >= 0.4) return 'Befriedigend';
    if (score >= 0.2) return 'Ausbaufähig';
    return 'Verbesserungswürdig';
  }
}
