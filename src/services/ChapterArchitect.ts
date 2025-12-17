// ╔═══════════════════════════════════════════════════════════════════════════╗
// ║  ADAPTIVE CHAPTER ORCHESTRATOR™ - Das absolute Novum in der              ║
// ║  wissenschaftlichen Kapitel-Generierung                                   ║
// ╠═══════════════════════════════════════════════════════════════════════════╣
// ║  🚀 REVOLUTIONÄRE FEATURES:                                               ║
// ║  • Intelligente Wortanzahl-Verteilung über alle Abschnitte                ║
// ║  • Dynamische Kapiteltiefe statt fixer Struktur                           ║
// ║  • Semantic Expansion statt simpler Wiederholung                          ║
// ║  • Adaptive Section Planning basierend auf akademischem Niveau            ║
// ║  • Visual Chapter Architecture Planner                                    ║
// ╚═══════════════════════════════════════════════════════════════════════════╝

/**
 * CHAPTER ARCHITECTURE TYPES
 */

export type AcademicLevel = 'bachelor' | 'master' | 'phd';
export type SectionDepth = 'shallow' | 'medium' | 'deep' | 'ultra-deep';
export type SectionImportance = 'low' | 'medium' | 'high' | 'critical';

/**
 * Struktur eines geplanten Abschnitts
 */
export interface PlannedSection {
  number: string;              // z.B. "1.1", "1.1.1", "1.1.1.1"
  title: string;               // Titel des Abschnitts
  depth: number;               // Tiefe (1 = Hauptkapitel, 2 = Unterkapitel, etc.)
  importance: SectionImportance;
  targetWords: number;         // Geplante Wortanzahl für diesen Abschnitt
  contentType: string;         // z.B. "introduction", "theory", "methodology"
  children: PlannedSection[];  // Unterabschnitte
  expansionStrategy: string;   // Wie soll dieser Abschnitt expandiert werden?
  semanticKeywords: string[];  // Schlüsselwörter für semantische Expansion
}

/**
 * Gesamt-Kapitel-Architektur
 */
export interface ChapterArchitecture {
  chapterNumber: number;
  chapterTitle: string;
  totalTargetWords: number;
  academicLevel: AcademicLevel;
  maxDepth: number;            // Maximale Tiefe der Struktur
  sections: PlannedSection[];
  estimatedQuality: number;    // 0-1: Geschätzte Qualität basierend auf Struktur
  balanceScore: number;        // 0-1: Wie gut ist die Wortverteilung balanciert?
}

/**
 * ADAPTIVE CHAPTER ORCHESTRATOR™
 *
 * Das revolutionäre System für intelligente Kapitelplanung
 */
export class ChapterArchitect {

  /**
   * 🎯 HAUPTFUNKTION: Erstellt eine intelligente Kapitel-Architektur
   * basierend auf Wortanzahl, akademischem Niveau und Thema
   */
  static planChapterArchitecture(
    chapterNumber: number,
    chapterTitle: string,
    targetWords: number,
    academicLevel: AcademicLevel,
    chapterType?: string
  ): ChapterArchitecture {

    // Bestimme optimale Tiefe basierend auf Wortanzahl und akademischem Niveau
    const maxDepth = this.calculateOptimalDepth(targetWords, academicLevel);

    // Erstelle intelligente Abschnitts-Struktur
    const sections = this.generateIntelligentStructure(
      chapterNumber,
      chapterTitle,
      targetWords,
      academicLevel,
      maxDepth,
      chapterType
    );

    // Berechne Qualitäts-Metriken
    const estimatedQuality = this.calculateQualityScore(sections, targetWords, academicLevel);
    const balanceScore = this.calculateBalanceScore(sections, targetWords);

    return {
      chapterNumber,
      chapterTitle,
      totalTargetWords: targetWords,
      academicLevel,
      maxDepth,
      sections,
      estimatedQuality,
      balanceScore
    };
  }

  /**
   * 📊 Berechnet optimale Tiefe basierend auf Wortanzahl
   *
   * INTELLIGENTE REGELN:
   * - < 1000 Wörter: Tiefe 2 (1.1, 1.2)
   * - 1000-2500 Wörter: Tiefe 3 (1.1.1, 1.1.2)
   * - 2500-5000 Wörter: Tiefe 4 (1.1.1.1, 1.1.1.2)
   * - > 5000 Wörter: Tiefe 5 (Ultra-Deep für PhD)
   *
   * PLUS Akademisches Niveau:
   * - Bachelor: -1 Tiefe
   * - Master: Standard
   * - PhD: +1 Tiefe
   */
  private static calculateOptimalDepth(targetWords: number, academicLevel: AcademicLevel): number {
    let baseDepth = 2;

    // Basis-Tiefe nach Wortanzahl
    if (targetWords < 1000) baseDepth = 2;
    else if (targetWords < 2500) baseDepth = 3;
    else if (targetWords < 5000) baseDepth = 4;
    else baseDepth = 5;

    // Anpassung nach akademischem Niveau
    if (academicLevel === 'bachelor') baseDepth = Math.max(2, baseDepth - 1);
    if (academicLevel === 'phd') baseDepth = Math.min(6, baseDepth + 1);

    return baseDepth;
  }

  /**
   * 🏗️ Generiert intelligente Kapitel-Struktur
   *
   * ADAPTIVE STRATEGIE:
   * 1. Analysiert Kapitel-Typ (Einleitung, Theorie, Methodik, etc.)
   * 2. Definiert Kern-Abschnitte basierend auf Best Practices
   * 3. Verteilt Wortanzahl intelligent basierend auf Wichtigkeit
   * 4. Expandiert kritische Bereiche mit Unterabschnitten
   */
  private static generateIntelligentStructure(
    chapterNumber: number,
    chapterTitle: string,
    targetWords: number,
    academicLevel: AcademicLevel,
    maxDepth: number,
    chapterType?: string
  ): PlannedSection[] {

    // Erkenne Kapitel-Typ aus Titel
    const detectedType = chapterType || this.detectChapterType(chapterTitle);

    // Hole Template basierend auf Typ
    const sections = this.getChapterTemplate(
      chapterNumber,
      chapterTitle,
      detectedType,
      academicLevel
    );

    // Verteile Wortanzahl intelligent
    this.distributeWordsIntelligently(sections, targetWords, maxDepth);

    // Expandiere Abschnitte basierend auf Tiefe
    this.expandSectionsAdaptively(sections, maxDepth, academicLevel);

    return sections;
  }

  /**
   * 🔍 Erkennt Kapitel-Typ aus Titel
   */
  private static detectChapterType(title: string): string {
    const lowercaseTitle = title.toLowerCase();

    if (lowercaseTitle.includes('einleitung') || lowercaseTitle.includes('introduction'))
      return 'introduction';
    if (lowercaseTitle.includes('theori') || lowercaseTitle.includes('theor'))
      return 'theory';
    if (lowercaseTitle.includes('methodik') || lowercaseTitle.includes('methode') || lowercaseTitle.includes('method'))
      return 'methodology';
    if (lowercaseTitle.includes('ergebnis') || lowercaseTitle.includes('result') || lowercaseTitle.includes('analys'))
      return 'results';
    if (lowercaseTitle.includes('diskussion') || lowercaseTitle.includes('discussion'))
      return 'discussion';
    if (lowercaseTitle.includes('fazit') || lowercaseTitle.includes('conclusion') || lowercaseTitle.includes('schluss'))
      return 'conclusion';

    return 'general';
  }

  /**
   * 📋 Liefert intelligente Templates für verschiedene Kapitel-Typen
   */
  private static getChapterTemplate(
    chapterNumber: number,
    chapterTitle: string,
    chapterType: string,
    academicLevel: AcademicLevel
  ): PlannedSection[] {

    const templates: Record<string, PlannedSection[]> = {
      introduction: [
        {
          number: `${chapterNumber}.1`,
          title: 'Problemstellung und Relevanz',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'problem_statement',
          children: [],
          expansionStrategy: 'research_gap_analysis',
          semanticKeywords: ['Problem', 'Forschungslücke', 'Relevanz', 'Motivation']
        },
        {
          number: `${chapterNumber}.2`,
          title: 'Forschungsfragen und Zielsetzung',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'research_questions',
          children: [],
          expansionStrategy: 'question_elaboration',
          semanticKeywords: ['Forschungsfrage', 'Hypothese', 'Zielsetzung', 'Erwartete Ergebnisse']
        },
        {
          number: `${chapterNumber}.3`,
          title: 'Aufbau der Arbeit',
          depth: 2,
          importance: 'medium',
          targetWords: 0,
          contentType: 'structure_overview',
          children: [],
          expansionStrategy: 'chapter_preview',
          semanticKeywords: ['Struktur', 'Kapitel', 'Aufbau', 'Gliederung']
        }
      ],

      theory: [
        {
          number: `${chapterNumber}.1`,
          title: 'Begriffliche Grundlagen',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'definitions',
          children: [],
          expansionStrategy: 'concept_definition',
          semanticKeywords: ['Definition', 'Begriff', 'Konzept', 'Grundlagen']
        },
        {
          number: `${chapterNumber}.2`,
          title: 'Theoretische Ansätze',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'theories',
          children: [],
          expansionStrategy: 'theory_comparison',
          semanticKeywords: ['Theorie', 'Ansatz', 'Modell', 'Framework']
        },
        {
          number: `${chapterNumber}.3`,
          title: 'Stand der Forschung',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'literature_review',
          children: [],
          expansionStrategy: 'literature_synthesis',
          semanticKeywords: ['Forschung', 'Literatur', 'Stand', 'Erkenntnisse']
        },
        {
          number: `${chapterNumber}.4`,
          title: 'Synthese und Forschungslücken',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'synthesis',
          children: [],
          expansionStrategy: 'gap_identification',
          semanticKeywords: ['Synthese', 'Forschungslücke', 'Integration', 'Konklusion']
        }
      ],

      methodology: [
        {
          number: `${chapterNumber}.1`,
          title: 'Forschungsdesign und Paradigma',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'research_design',
          children: [],
          expansionStrategy: 'paradigm_justification',
          semanticKeywords: ['Forschungsdesign', 'Paradigma', 'Ansatz', 'Philosophie']
        },
        {
          number: `${chapterNumber}.2`,
          title: 'Datenerhebung',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'data_collection',
          children: [],
          expansionStrategy: 'method_description',
          semanticKeywords: ['Datenerhebung', 'Methode', 'Verfahren', 'Instrument']
        },
        {
          number: `${chapterNumber}.3`,
          title: 'Datenauswertung',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'data_analysis',
          children: [],
          expansionStrategy: 'analysis_procedure',
          semanticKeywords: ['Auswertung', 'Analyse', 'Kodierung', 'Interpretation']
        },
        {
          number: `${chapterNumber}.4`,
          title: 'Gütekriterien und Ethik',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'quality_ethics',
          children: [],
          expansionStrategy: 'validity_discussion',
          semanticKeywords: ['Gütekriterien', 'Validität', 'Reliabilität', 'Ethik']
        }
      ],

      results: [
        {
          number: `${chapterNumber}.1`,
          title: 'Überblick über die Ergebnisse',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'results_overview',
          children: [],
          expansionStrategy: 'result_summary',
          semanticKeywords: ['Ergebnisse', 'Befunde', 'Überblick', 'Zusammenfassung']
        },
        {
          number: `${chapterNumber}.2`,
          title: 'Hauptbefunde',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'main_findings',
          children: [],
          expansionStrategy: 'finding_elaboration',
          semanticKeywords: ['Befund', 'Erkenntnis', 'Resultat', 'Beobachtung']
        },
        {
          number: `${chapterNumber}.3`,
          title: 'Interpretation und Diskussion',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'interpretation',
          children: [],
          expansionStrategy: 'theory_connection',
          semanticKeywords: ['Interpretation', 'Bedeutung', 'Diskussion', 'Implikation']
        }
      ],

      conclusion: [
        {
          number: `${chapterNumber}.1`,
          title: 'Zusammenfassung der Kernerkenntnisse',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'summary',
          children: [],
          expansionStrategy: 'key_findings_recap',
          semanticKeywords: ['Zusammenfassung', 'Kernerkenntnisse', 'Fazit', 'Ergebnisse']
        },
        {
          number: `${chapterNumber}.2`,
          title: 'Beantwortung der Forschungsfragen',
          depth: 2,
          importance: 'critical',
          targetWords: 0,
          contentType: 'answers',
          children: [],
          expansionStrategy: 'question_answering',
          semanticKeywords: ['Beantwortung', 'Forschungsfrage', 'Antwort', 'Lösung']
        },
        {
          number: `${chapterNumber}.3`,
          title: 'Implikationen und Ausblick',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'implications',
          children: [],
          expansionStrategy: 'future_research',
          semanticKeywords: ['Implikation', 'Praxis', 'Ausblick', 'Zukunft']
        },
        {
          number: `${chapterNumber}.4`,
          title: 'Limitationen',
          depth: 2,
          importance: 'high',
          targetWords: 0,
          contentType: 'limitations',
          children: [],
          expansionStrategy: 'limitation_reflection',
          semanticKeywords: ['Limitation', 'Einschränkung', 'Kritik', 'Grenzen']
        }
      ]
    };

    // Hole Template oder nutze General Template
    return templates[chapterType] || this.getGeneralTemplate(chapterNumber, chapterTitle);
  }

  /**
   * 🌐 Allgemeines Template für nicht-spezifische Kapitel
   */
  private static getGeneralTemplate(chapterNumber: number, chapterTitle: string): PlannedSection[] {
    return [
      {
        number: `${chapterNumber}.1`,
        title: 'Einführung',
        depth: 2,
        importance: 'high',
        targetWords: 0,
        contentType: 'introduction',
        children: [],
        expansionStrategy: 'context_setting',
        semanticKeywords: ['Einführung', 'Kontext', 'Hintergrund']
      },
      {
        number: `${chapterNumber}.2`,
        title: 'Hauptteil',
        depth: 2,
        importance: 'critical',
        targetWords: 0,
        contentType: 'main_content',
        children: [],
        expansionStrategy: 'topic_elaboration',
        semanticKeywords: ['Hauptteil', 'Kern', 'Analyse']
      },
      {
        number: `${chapterNumber}.3`,
        title: 'Zwischenfazit',
        depth: 2,
        importance: 'medium',
        targetWords: 0,
        contentType: 'conclusion',
        children: [],
        expansionStrategy: 'summary_transition',
        semanticKeywords: ['Fazit', 'Zusammenfassung', 'Überleitung']
      }
    ];
  }

  /**
   * 💡 INTELLIGENTE WORTVERTEILUNG
   *
   * Verteilt die Wortanzahl basierend auf:
   * 1. Wichtigkeit des Abschnitts (critical > high > medium > low)
   * 2. Anzahl der Abschnitte
   * 3. Akademisches Niveau
   */
  private static distributeWordsIntelligently(
    sections: PlannedSection[],
    totalWords: number,
    maxDepth: number
  ): void {

    // Berechne Gewichtungen basierend auf Wichtigkeit
    const weights: Record<SectionImportance, number> = {
      'critical': 1.5,
      'high': 1.2,
      'medium': 1.0,
      'low': 0.7
    };

    // Summe aller Gewichtungen
    const totalWeight = sections.reduce((sum, section) =>
      sum + weights[section.importance], 0
    );

    // Verteile Wörter proportional zu Gewichtungen
    let assignedWords = 0;
    sections.forEach((section, index) => {
      const weight = weights[section.importance];
      const proportion = weight / totalWeight;

      // Letzte Sektion bekommt den Rest, um Rundungsfehler auszugleichen
      if (index === sections.length - 1) {
        section.targetWords = totalWords - assignedWords;
      } else {
        section.targetWords = Math.round(totalWords * proportion);
        assignedWords += section.targetWords;
      }
    });
  }

  /**
   * 🌳 ADAPTIVE EXPANSION
   *
   * Expandiert Abschnitte basierend auf:
   * 1. Maximaler Tiefe
   * 2. Wortanzahl des Abschnitts
   * 3. Akademischem Niveau
   */
  private static expandSectionsAdaptively(
    sections: PlannedSection[],
    maxDepth: number,
    academicLevel: AcademicLevel
  ): void {

    sections.forEach(section => {
      // Nur expandieren wenn:
      // 1. Noch Platz für Tiefe vorhanden
      // 2. Abschnitt genug Wörter hat
      if (section.depth < maxDepth && section.targetWords >= 800) {

        // Berechne Anzahl Unterabschnitte basierend auf Wortanzahl
        const subsectionsCount = this.calculateSubsectionsCount(
          section.targetWords,
          section.depth,
          maxDepth,
          academicLevel
        );

        if (subsectionsCount > 0) {
          section.children = this.generateSubsections(
            section,
            subsectionsCount,
            academicLevel
          );

          // Verteile Wörter auf Unterabschnitte (80% für Kinder, 20% für Intro)
          const childrenWords = Math.floor(section.targetWords * 0.8);
          const introWords = section.targetWords - childrenWords;

          this.distributeWordsIntelligently(section.children, childrenWords, maxDepth);
          section.targetWords = introWords; // Rest für Einleitung des Abschnitts

          // Rekursiv Unterabschnitte expandieren
          this.expandSectionsAdaptively(section.children, maxDepth, academicLevel);
        }
      }
    });
  }

  /**
   * 🔢 Berechnet optimale Anzahl von Unterabschnitten
   */
  private static calculateSubsectionsCount(
    sectionWords: number,
    currentDepth: number,
    maxDepth: number,
    academicLevel: AcademicLevel
  ): number {

    // Keine Unterabschnitte wenn zu wenig Wörter oder maximale Tiefe erreicht
    if (sectionWords < 800 || currentDepth >= maxDepth) return 0;

    // Basis: 1 Unterabschnitt pro 500 Wörter
    let count = Math.floor(sectionWords / 500);

    // Begrenzungen
    count = Math.max(2, count); // Mindestens 2
    count = Math.min(5, count); // Maximal 5

    // Anpassung nach akademischem Niveau
    if (academicLevel === 'bachelor') count = Math.min(3, count);
    if (academicLevel === 'phd') count = Math.min(6, count);

    return count;
  }

  /**
   * 🏗️ Generiert intelligente Unterabschnitte
   */
  private static generateSubsections(
    parent: PlannedSection,
    count: number,
    academicLevel: AcademicLevel
  ): PlannedSection[] {

    const subsections: PlannedSection[] = [];

    // Generiere Unterabschnitte basierend auf Content-Type
    const titles = this.generateSubsectionTitles(parent.contentType, count, academicLevel);

    for (let i = 0; i < count; i++) {
      subsections.push({
        number: `${parent.number}.${i + 1}`,
        title: titles[i] || `Aspekt ${i + 1}`,
        depth: parent.depth + 1,
        importance: i === 0 ? 'high' : 'medium',
        targetWords: 0, // Wird später verteilt
        contentType: `${parent.contentType}_sub`,
        children: [],
        expansionStrategy: parent.expansionStrategy,
        semanticKeywords: parent.semanticKeywords
      });
    }

    return subsections;
  }

  /**
   * 📝 Generiert intelligente Unterabschnitts-Titel basierend auf Content-Type
   */
  private static generateSubsectionTitles(
    contentType: string,
    count: number,
    academicLevel: AcademicLevel
  ): string[] {

    const titleSets: Record<string, string[]> = {
      problem_statement: [
        'Ausgangssituation',
        'Problemdefinition',
        'Relevanz für die Forschung',
        'Forschungslücke',
        'Bedeutung für die Praxis'
      ],
      research_questions: [
        'Hauptforschungsfrage',
        'Teilforschungsfragen',
        'Hypothesen',
        'Erwartete Ergebnisse'
      ],
      definitions: [
        'Zentrale Begriffe',
        'Konzeptuelle Abgrenzung',
        'Operationalisierung',
        'Definitorische Einordnung'
      ],
      theories: [
        'Klassische Ansätze',
        'Moderne Entwicklungen',
        'Kritische Betrachtung',
        'Theoretische Integration'
      ],
      literature_review: [
        'Forschungsüberblick',
        'Zentrale Studien',
        'Methodische Ansätze',
        'Kritische Würdigung',
        'Forschungsdesiderate'
      ],
      research_design: [
        'Forschungsparadigma',
        'Methodologische Grundlagen',
        'Begründung des Designs',
        'Forschungsansatz'
      ],
      data_collection: [
        'Erhebungsinstrumente',
        'Stichprobenauswahl',
        'Durchführung',
        'Datenqualität'
      ],
      data_analysis: [
        'Analyseverfahren',
        'Kodierung und Kategorisierung',
        'Analytische Schritte',
        'Interpretationsprozess'
      ],
      main_findings: [
        'Erste Dimension',
        'Zweite Dimension',
        'Dritte Dimension',
        'Übergreifende Muster',
        'Besonderheiten'
      ]
    };

    const titles = titleSets[contentType] || [
      'Theoretischer Hintergrund',
      'Empirische Befunde',
      'Kritische Diskussion',
      'Implikationen',
      'Zusammenfassung'
    ];

    return titles.slice(0, count);
  }

  /**
   * 📊 Berechnet Qualitäts-Score basierend auf Struktur
   */
  private static calculateQualityScore(
    sections: PlannedSection[],
    targetWords: number,
    academicLevel: AcademicLevel
  ): number {

    let score = 0.5; // Basis-Score

    // Bonus für angemessene Anzahl von Abschnitten
    if (sections.length >= 3 && sections.length <= 5) score += 0.15;

    // Bonus für kritische Abschnitte
    const criticalCount = sections.filter(s => s.importance === 'critical').length;
    if (criticalCount >= 2) score += 0.1;

    // Bonus für Tiefe (aber nicht zu tief)
    const hasSubsections = sections.some(s => s.children.length > 0);
    if (hasSubsections) score += 0.15;

    // Bonus für semantische Keywords
    const totalKeywords = sections.reduce((sum, s) => sum + s.semanticKeywords.length, 0);
    if (totalKeywords >= 15) score += 0.1;

    return Math.min(1.0, score);
  }

  /**
   * ⚖️ Berechnet Balance-Score der Wortverteilung
   */
  private static calculateBalanceScore(
    sections: PlannedSection[],
    targetWords: number
  ): number {

    if (sections.length === 0) return 0;

    // Berechne durchschnittliche Wortanzahl pro Abschnitt
    const avgWords = targetWords / sections.length;

    // Berechne Standardabweichung
    const variance = sections.reduce((sum, section) => {
      const diff = section.targetWords - avgWords;
      return sum + (diff * diff);
    }, 0) / sections.length;

    const stdDev = Math.sqrt(variance);

    // Balance Score: Je niedriger die Standardabweichung, desto besser
    // Perfekter Score (1.0) bei stdDev = 0
    // Score sinkt linear mit steigender stdDev
    const maxAcceptableStdDev = avgWords * 0.5; // 50% Abweichung ist akzeptabel
    const balanceScore = Math.max(0, 1 - (stdDev / maxAcceptableStdDev));

    return balanceScore;
  }

  /**
   * 📐 Flatten: Wandelt verschachtelte Struktur in flache Liste um
   */
  static flattenSections(sections: PlannedSection[]): PlannedSection[] {
    const result: PlannedSection[] = [];

    function traverse(section: PlannedSection) {
      result.push(section);
      section.children.forEach(traverse);
    }

    sections.forEach(traverse);
    return result;
  }

  /**
   * 📊 Generiert visuellen Struktur-Baum (für UI-Darstellung)
   */
  static generateVisualTree(architecture: ChapterArchitecture): string {
    let tree = `📖 Kapitel ${architecture.chapterNumber}: ${architecture.chapterTitle}\n`;
    tree += `🎯 Gesamt: ${architecture.totalTargetWords} Wörter | ⭐ Qualität: ${(architecture.estimatedQuality * 100).toFixed(0)}% | ⚖️ Balance: ${(architecture.balanceScore * 100).toFixed(0)}%\n\n`;

    function renderSection(section: PlannedSection, indent: string = '') {
      const icon = section.importance === 'critical' ? '⚡' :
                   section.importance === 'high' ? '🔹' :
                   section.importance === 'medium' ? '▫️' : '·';

      tree += `${indent}${icon} ${section.number} ${section.title} (${section.targetWords} Wörter)\n`;

      if (section.children.length > 0) {
        section.children.forEach(child => renderSection(child, indent + '  '));
      }
    }

    architecture.sections.forEach(section => renderSection(section));

    return tree;
  }

  /**
   * 🎨 Exportiert Architektur als Markdown
   */
  static exportAsMarkdown(architecture: ChapterArchitecture): string {
    let md = `# Kapitel ${architecture.chapterNumber}: ${architecture.chapterTitle}\n\n`;
    md += `**Ziel-Wortanzahl:** ${architecture.totalTargetWords} Wörter\n`;
    md += `**Akademisches Niveau:** ${architecture.academicLevel}\n`;
    md += `**Maximale Tiefe:** ${architecture.maxDepth}\n`;
    md += `**Geschätzte Qualität:** ${(architecture.estimatedQuality * 100).toFixed(1)}%\n`;
    md += `**Balance-Score:** ${(architecture.balanceScore * 100).toFixed(1)}%\n\n`;

    md += `## Geplante Struktur\n\n`;

    function renderSection(section: PlannedSection, indent: string = '') {
      md += `${indent}- **${section.number} ${section.title}** (${section.targetWords} Wörter)\n`;
      md += `${indent}  - Wichtigkeit: ${section.importance}\n`;
      md += `${indent}  - Strategie: ${section.expansionStrategy}\n`;
      md += `${indent}  - Keywords: ${section.semanticKeywords.join(', ')}\n`;

      if (section.children.length > 0) {
        section.children.forEach(child => renderSection(child, indent + '  '));
      }
    }

    architecture.sections.forEach(section => renderSection(section));

    return md;
  }
}
