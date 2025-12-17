// src/renderer/components/ThesisWritingTab.tsx
// UI-KOMPONENTE FÜR MASTER THESIS GENERATOR
// ================================================================================

import React, { useState, useEffect } from 'react';
import { MasterThesisGenerator, type ChapterContext, type CompleteChapter, type GenerationOptions } from '../../services/MasterThesisGenerator';
import { VisualChapterArchitect } from './VisualChapterArchitect';
import { ChapterArchitect, type ChapterArchitecture } from '../../services/ChapterArchitect';

// ================================================================================
// TYPE DEFINITIONS - Research Data Integration
// ================================================================================

interface DocumentType {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  wordCount?: number;
  uploaded: string;
  originalFile?: File;
  metadata?: {
    pages?: number;
    extractionQuality?: 'full' | 'partial' | 'failed';
  };
}

interface Code {
  id: string;
  label: string;
  description?: string;
  color?: string;
  category?: string;
}

interface Coding {
  id: string;
  documentId: string;
  documentName?: string;
  codeId: string;
  codeLabel?: string;
  text: string;
  startIndex?: number;
  endIndex?: number;
  pageNumber?: number;
  context?: string;
  memo?: string;
}

interface Analysis {
  id: string;
  type: string;
  content: string;
  timestamp: string;
  metadata?: any;
}

interface MetaIntelligence {
  stage1?: { completed: boolean; optimizedPrompts?: string[] };
  stage2?: {
    completed: boolean;
    enhancedAnalysis?: {
      themes: string[];
      patterns: string[];
      insights: string[];
      recommendations: string[]
    }
  };
  stage3?: { completed: boolean };
  stage4?: { completed: boolean };
}

interface ThesisWritingTabProps {
  apiProvider: string;
  apiModel: string;
  apiKey: string;
  language: 'de' | 'en';

  // ✅ FORSCHUNGSDATEN-INTEGRATION
  documents?: DocumentType[];
  researchQuestions?: string[];
  codes?: Code[];
  codings?: Coding[];
  analysis?: Analysis[];
  metaIntelligence?: MetaIntelligence;
}

export const ThesisWritingTab: React.FC<ThesisWritingTabProps> = ({
  apiProvider,
  apiModel,
  apiKey,
  language,
  // Forschungsdaten
  documents = [],
  researchQuestions = [],
  codes = [],
  codings = [],
  analysis = [],
  metaIntelligence
}) => {
  // 🔍 DEBUG: Component mounted
  console.log('🎓 ThesisWritingTab RENDERED', {
    apiProvider,
    apiModel,
    hasApiKey: !!apiKey,
    language,
    documentsCount: documents?.length || 0
  });

  // State Management
  const [thesisTitle, setThesisTitle] = useState('');
  const [thesisTopic, setThesisTopic] = useState('');
  const [outline, setOutline] = useState(''); // NEU: Gliederung
  const [parsedChapters, setParsedChapters] = useState<Array<{number: string, title: string}>>([]);
  const [chapterNumber, setChapterNumber] = useState(1);
  const [chapterTitle, setChapterTitle] = useState('');
  const [targetWords, setTargetWords] = useState(3000);
  const [previousChaptersSummary, setPreviousChaptersSummary] = useState('');
  const [researchQuestionsText, setResearchQuestionsText] = useState('');
  const [methodology, setMethodology] = useState('');
  const [theoreticalFramework, setTheoreticalFramework] = useState('');
  const [keyReferences, setKeyReferences] = useState('');

  const [academicLevel, setAcademicLevel] = useState<'bachelor' | 'master' | 'phd'>('master');
  const [citationStyle, setCitationStyle] = useState<'APA' | 'Harvard' | 'IEEE' | 'Chicago'>('APA');
  const [strictMode, setStrictMode] = useState(false); // ⚠️ Default AUS (verhindert Endlosschleifen)
  const [maxRetries, setMaxRetries] = useState(1); // ⚠️ Default 1 (nicht 3)

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedChapter, setGeneratedChapter] = useState<CompleteChapter | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [progressDetails, setProgressDetails] = useState('');

  // 🏗️ ADAPTIVE CHAPTER ARCHITECT STATE
  const [chapterArchitecture, setChapterArchitecture] = useState<ChapterArchitecture | null>(null);
  const [showArchitect, setShowArchitect] = useState(false);

  // Claude Bridge Extension Status
  const [bridgeConnected, setBridgeConnected] = useState(false);
  const [bridgePort, setBridgePort] = useState<number | null>(null);
  const [bridgeCheckInterval, setBridgeCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [bridgeChecking, setBridgeChecking] = useState(false);

  // Translations
  const t = {
    de: {
      title: 'Wissenschaftliche Arbeit schreiben',
      subtitle: 'Generiere vollständige Kapitel für deine Masterarbeit - OHNE Platzhalter',
      basicInfo: 'Grundinformationen',
      thesisTitle: 'Titel der Arbeit',
      thesisTitlePlaceholder: 'z.B. Qualitative Forschung in der Bildungswissenschaft',
      thesisTopic: 'Themengebiet',
      thesisTopicPlaceholder: 'z.B. Forschungsmethoden, Epistemologie',
      chapterInfo: 'Kapitel-Information',
      chapterNumber: 'Kapitel-Nummer',
      chapterTitle: 'Kapitel-Titel',
      chapterTitlePlaceholder: 'z.B. Theoretischer Rahmen',
      targetWords: 'Ziel-Wortanzahl',
      contextInfo: 'Kontext (Optional)',
      previousChapters: 'Zusammenfassung vorheriger Kapitel',
      previousChaptersPlaceholder: 'Kapitel 1 behandelte...',
      researchQuestions: 'Forschungsfragen (eine pro Zeile)',
      researchQuestionsPlaceholder: 'Welche Methoden eignen sich?\nWie erfolgt die Analyse?',
      methodology: 'Methodischer Ansatz',
      methodologyPlaceholder: 'z.B. Grounded Theory, Phänomenologie',
      theoreticalFramework: 'Theoretischer Rahmen',
      theoreticalFrameworkPlaceholder: 'z.B. Konstruktivismus, Interpretativismus',
      keyReferences: 'Wichtige Quellen (eine pro Zeile)',
      keyReferencesPlaceholder: 'Autor (Jahr). Titel\nAutor (Jahr). Titel',
      outlineSection: 'GLIEDERUNG ERSTELLEN',
      outline: 'Gliederung der Arbeit',
      outlinePlaceholder: '1. Einleitung\n2. Theoretischer Rahmen\n   2.1 ...\n   2.2 ...\n3. Methodik\n...',
      generateOutline: 'Gliederung automatisch generieren',
      generatingOutline: 'Generiere Gliederung...',
      selectChapter: 'Kapitel aus Gliederung auswählen:',
      clickToSelect: 'Klicken zum Auswählen',
      noChapters: 'Keine Kapitel gefunden. Erstelle zuerst eine Gliederung.',
      settings: 'Einstellungen',
      academicLevel: 'Akademisches Niveau',
      citationStyle: 'Zitierweise',
      strictMode: 'Strict Mode (MUSS 100% vollständig sein)',
      maxRetries: 'Max. Versuche bei Platzhaltern',
      generateButton: 'KAPITEL GENERIEREN',
      generating: 'Generiere...',
      results: 'Ergebnis',
      wordCount: 'Wortanzahl',
      quality: 'Qualität',
      completeness: 'Vollständigkeit',
      placeholders: 'Platzhalter gefunden',
      downloadMarkdown: 'Als Markdown herunterladen',
      downloadText: 'Als Text herunterladen',
      copyToClipboard: 'In Zwischenablage kopieren',
      downloadWithBibliography: 'Mit Literaturverzeichnis herunterladen',
      validationReport: 'Validierungsbericht',
      recommendations: 'Empfehlungen',
      chapterContent: 'Kapitel-Inhalt',
      abstract: 'Abstract',
      sections: 'Abschnitte',
      // Smart-Fill
      researchData: 'Forschungsdaten verfügbar',
      autoFillAll: 'Alle Felder automatisch befüllen',
      fillQuestions: 'Forschungsfragen übernehmen',
      fillTheory: 'Theoretischen Rahmen übernehmen',
      fillMethod: 'Methodologie übernehmen',
      fillReferences: 'Literatur übernehmen',
      fillSummary: 'Zusammenfassung generieren',
      dataStats: 'Datenübersicht',
      documentsCount: 'Dokumente',
      questionsCount: 'Forschungsfragen',
      codesCount: 'Kategorien',
      codingsCount: 'Kodierungen',
      metaAvailable: 'Meta-Analyse verfügbar',
      // Claude Bridge
      claudeBridge: 'Claude Max Bridge',
      bridgeConnected: 'Extension verbunden',
      bridgeDisconnected: 'Extension nicht verbunden',
      bridgeInstallHelp: 'Extension installieren',
      bridgePort: 'WebSocket Port',
      useClaudeMax: 'Claude Max verwenden (kein API-Key nötig)',
      bridgeRefresh: 'Status aktualisieren',
      bridgeChecking: 'Prüfe...'
    },
    en: {
      title: 'Write Scientific Work',
      subtitle: 'Generate complete chapters for your thesis - WITHOUT placeholders',
      basicInfo: 'Basic Information',
      thesisTitle: 'Thesis Title',
      thesisTitlePlaceholder: 'e.g. Qualitative Research in Educational Science',
      thesisTopic: 'Topic Area',
      thesisTopicPlaceholder: 'e.g. Research Methods, Epistemology',
      chapterInfo: 'Chapter Information',
      chapterNumber: 'Chapter Number',
      chapterTitle: 'Chapter Title',
      chapterTitlePlaceholder: 'e.g. Theoretical Framework',
      targetWords: 'Target Word Count',
      contextInfo: 'Context (Optional)',
      previousChapters: 'Summary of Previous Chapters',
      previousChaptersPlaceholder: 'Chapter 1 covered...',
      researchQuestions: 'Research Questions (one per line)',
      researchQuestionsPlaceholder: 'Which methods are suitable?\nHow is the analysis conducted?',
      methodology: 'Methodological Approach',
      methodologyPlaceholder: 'e.g. Grounded Theory, Phenomenology',
      theoreticalFramework: 'Theoretical Framework',
      theoreticalFrameworkPlaceholder: 'e.g. Constructivism, Interpretivism',
      keyReferences: 'Key References (one per line)',
      keyReferencesPlaceholder: 'Author (Year). Title\nAuthor (Year). Title',
      outlineSection: 'CREATE OUTLINE',
      outline: 'Thesis Outline',
      outlinePlaceholder: '1. Introduction\n2. Theoretical Framework\n   2.1 ...\n   2.2 ...\n3. Methodology\n...',
      generateOutline: 'Generate outline automatically',
      generatingOutline: 'Generating outline...',
      selectChapter: 'Select chapter from outline:',
      clickToSelect: 'Click to select',
      noChapters: 'No chapters found. Create an outline first.',
      settings: 'Settings',
      academicLevel: 'Academic Level',
      citationStyle: 'Citation Style',
      strictMode: 'Strict Mode (MUST be 100% complete)',
      maxRetries: 'Max. Retries on Placeholders',
      generateButton: 'GENERATE CHAPTER',
      generating: 'Generating...',
      results: 'Results',
      wordCount: 'Word Count',
      quality: 'Quality',
      completeness: 'Completeness',
      placeholders: 'Placeholders Found',
      downloadMarkdown: 'Download as Markdown',
      downloadText: 'Download as Text',
      copyToClipboard: 'Copy to Clipboard',
      downloadWithBibliography: 'Download with Bibliography',
      validationReport: 'Validation Report',
      recommendations: 'Recommendations',
      chapterContent: 'Chapter Content',
      abstract: 'Abstract',
      sections: 'Sections',
      // Smart-Fill
      researchData: 'Research Data Available',
      autoFillAll: 'Auto-Fill All Fields',
      fillQuestions: 'Import Research Questions',
      fillTheory: 'Import Theoretical Framework',
      fillMethod: 'Import Methodology',
      fillReferences: 'Import References',
      fillSummary: 'Generate Summary',
      dataStats: 'Data Overview',
      documentsCount: 'Documents',
      questionsCount: 'Research Questions',
      codesCount: 'Categories',
      codingsCount: 'Codings',
      metaAvailable: 'Meta-Analysis Available',
      // Claude Bridge
      claudeBridge: 'Claude Max Bridge',
      bridgeConnected: 'Extension Connected',
      bridgeDisconnected: 'Extension Not Connected',
      bridgeInstallHelp: 'Install Extension',
      bridgePort: 'WebSocket Port',
      useClaudeMax: 'Use Claude Max (no API key needed)',
      bridgeRefresh: 'Refresh Status',
      bridgeChecking: 'Checking...'
    }
  };

  const labels = t[language];

  // ================================================================================
  // CLAUDE BRIDGE - Extension Status Monitoring
  // ================================================================================

  // Prüft Bridge Status (kann manuell oder automatisch aufgerufen werden)
  const checkBridgeStatus = async () => {
    if (typeof window !== 'undefined' && (window as any).electronAPI?.bridgeIsConnected) {
      setBridgeChecking(true);
      try {
        const result = await (window as any).electronAPI.bridgeIsConnected();
        // Extract 'connected' property from result object
        const connected = typeof result === 'object' ? result.connected : result;
        setBridgeConnected(!!connected);

        if (connected) {
          const portResult = await (window as any).electronAPI.bridgeGetPort();
          const port = typeof portResult === 'object' ? portResult.port : portResult;
          setBridgePort(port);
        }
      } catch (error) {
        console.error('Bridge status check failed:', error);
        setBridgeConnected(false);
      } finally {
        setBridgeChecking(false);
      }
    }
  };

  // Manueller Refresh Button Handler
  const handleRefreshBridgeStatus = () => {
    checkBridgeStatus();
  };

  useEffect(() => {
    // Initial Check
    checkBridgeStatus();

    // Poll alle 3 Sekunden
    const interval = setInterval(checkBridgeStatus, 3000);
    setBridgeCheckInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  // Parse outline to extract chapters
  useEffect(() => {
    if (!outline) {
      setParsedChapters([]);
      return;
    }

    const chapters: Array<{number: string, title: string}> = [];
    const lines = outline.split('\n');

    lines.forEach(line => {
      // Match main chapters (e.g., "1. Einleitung" or "2. Theoretischer Rahmen")
      // Ignore sub-chapters (e.g., "2.1 ...")
      const match = line.match(/^(\d+)\.\s+(.+)/);
      if (match) {
        chapters.push({
          number: match[1],
          title: match[2].trim()
        });
      }
    });

    setParsedChapters(chapters);
  }, [outline]);

  // ================================================================================
  // SMART-FILL FUNCTIONS - Auto-Übernahme von Forschungsdaten
  // ================================================================================

  /**
   * Übernimmt Forschungsfragen aus dem Projekt
   */
  const fillResearchQuestions = () => {
    if (researchQuestions && researchQuestions.length > 0) {
      setResearchQuestionsText(researchQuestions.join('\n'));
    }
  };

  /**
   * Generiert theoretischen Rahmen aus Meta-Intelligence
   */
  const fillTheoreticalFramework = () => {
    if (metaIntelligence?.stage2?.enhancedAnalysis?.themes) {
      const themes = metaIntelligence.stage2.enhancedAnalysis.themes;
      setTheoreticalFramework(themes.join(', '));
    }
  };

  /**
   * Generiert Methodologie aus Codes/Kategorien
   */
  const fillMethodology = () => {
    if (codes && codes.length > 0) {
      const methodCategories = codes
        .filter(c => c.category?.toLowerCase().includes('method') || c.label?.toLowerCase().includes('method'))
        .map(c => c.label);

      if (methodCategories.length > 0) {
        setMethodology(methodCategories.join(', '));
      } else {
        // Fallback: Nutze erste 3-5 Kategorien als methodische Ansätze
        setMethodology(codes.slice(0, 5).map(c => c.label).join(', '));
      }
    }
  };

  /**
   * Generiert Literaturverweise aus hochgeladenen Dokumenten
   */
  const fillKeyReferences = () => {
    if (documents && documents.length > 0) {
      const references = documents.map(doc => {
        // Extrahiere Autor/Jahr aus Dateinamen (wenn möglich)
        const match = doc.name.match(/([A-Za-zäöüÄÖÜß]+)\s*\((\d{4})\)/);
        if (match) {
          return `${match[1]} (${match[2]}). ${doc.name}`;
        }
        return doc.name;
      });
      setKeyReferences(references.join('\n'));
    }
  };

  /**
   * Generiert Zusammenfassung aus Codings und Meta-Intelligence
   */
  const fillPreviousSummary = () => {
    let summary = '';

    // Pattern aus Meta-Intelligence
    if (metaIntelligence?.stage2?.enhancedAnalysis?.patterns) {
      const patterns = metaIntelligence.stage2.enhancedAnalysis.patterns;
      if (patterns.length > 0) {
        summary += `Erkannte Muster:\n${patterns.map(p => `• ${p}`).join('\n')}\n\n`;
      }
    }

    // Insights aus Meta-Intelligence
    if (metaIntelligence?.stage2?.enhancedAnalysis?.insights) {
      const insights = metaIntelligence.stage2.enhancedAnalysis.insights;
      if (insights.length > 0) {
        summary += `Zentrale Erkenntnisse:\n${insights.map(i => `• ${i}`).join('\n')}\n\n`;
      }
    }

    // Top-Codes aus Kodierungen
    if (codings && codings.length > 0) {
      const codeCounts = new Map<string, number>();
      codings.forEach(coding => {
        const label = coding.codeLabel || 'Unbekannt';
        codeCounts.set(label, (codeCounts.get(label) || 0) + 1);
      });

      const topCodes = Array.from(codeCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([label, count]) => `• ${label} (${count} Kodierungen)`);

      if (topCodes.length > 0) {
        summary += `Häufigste Kategorien:\n${topCodes.join('\n')}`;
      }
    }

    setPreviousChaptersSummary(summary);
  };

  /**
   * SMART AUTO-FILL - Alle Felder automatisch befüllen
   */
  const autoFillAll = () => {
    fillResearchQuestions();
    fillTheoreticalFramework();
    fillMethodology();
    fillKeyReferences();
    fillPreviousSummary();
  };

  // ================================================================================
  // ERWEITERTE KONTEXT-GENERIERUNG MIT ZITATEN
  // ================================================================================

  /**
   * Generiert einen erweiterten Kontext mit echten Zitaten aus Codings
   * Dieser wird zusätzlich zum User-Input an die AI übergeben
   */
  const generateEnhancedContext = (): string => {
    let enhancedContext = '';

    // 1. Zitate nach Code-Kategorie gruppiert
    if (codings && codings.length > 0 && codes && codes.length > 0) {
      enhancedContext += '\n\n=== KODIERTE TEXTSTELLEN AUS DER FORSCHUNG ===\n';

      codes.slice(0, 10).forEach(code => {
        const codedTexts = codings.filter(c => c.codeId === code.id);

        if (codedTexts.length > 0) {
          enhancedContext += `\n## ${code.label}`;
          if (code.description) enhancedContext += ` - ${code.description}`;
          enhancedContext += '\n';

          // Top 3 Zitate für diese Kategorie
          codedTexts.slice(0, 3).forEach((coding, idx) => {
            const docName = coding.documentName || documents?.find(d => d.id === coding.documentId)?.name || 'Quelle unbekannt';
            enhancedContext += `\n"${coding.text.substring(0, 200)}..." (${docName})`;
            if (coding.memo) {
              enhancedContext += `\nMemo: ${coding.memo}`;
            }
            enhancedContext += '\n';
          });
        }
      });
    }

    // 2. Dokumenten-Zusammenfassungen
    if (documents && documents.length > 0) {
      enhancedContext += '\n\n=== ANALYSIERTE DOKUMENTE ===\n';
      documents.forEach(doc => {
        enhancedContext += `\n- ${doc.name}`;
        if (doc.wordCount) enhancedContext += ` (${doc.wordCount} Wörter)`;
        if (doc.metadata?.pages) enhancedContext += ` (${doc.metadata.pages} Seiten)`;

        // Anzahl Kodierungen für dieses Dokument
        const docCodings = codings?.filter(c => c.documentId === doc.id).length || 0;
        if (docCodings > 0) {
          enhancedContext += ` - ${docCodings} Kodierungen`;
        }
        enhancedContext += '\n';
      });
    }

    // 3. Meta-Analysen
    if (metaIntelligence?.stage2?.enhancedAnalysis) {
      const analysis = metaIntelligence.stage2.enhancedAnalysis;

      if (analysis.themes && analysis.themes.length > 0) {
        enhancedContext += '\n\n=== IDENTIFIZIERTE THEMEN ===\n';
        analysis.themes.forEach(theme => {
          enhancedContext += `• ${theme}\n`;
        });
      }

      if (analysis.patterns && analysis.patterns.length > 0) {
        enhancedContext += '\n\n=== ERKANNTE MUSTER ===\n';
        analysis.patterns.forEach(pattern => {
          enhancedContext += `• ${pattern}\n`;
        });
      }
    }

    return enhancedContext;
  };

  /**
   * Zählt verfügbare Forschungsdaten für Info-Karte
   */
  const getResearchDataStats = () => {
    return {
      documents: documents?.length || 0,
      researchQuestions: researchQuestions?.length || 0,
      codes: codes?.length || 0,
      codings: codings?.length || 0,
      hasMetaIntelligence: !!metaIntelligence?.stage2?.completed
    };
  };

  // Handler: Generate Chapter via Claude Max Bridge
  const handleGenerateViaBridge = async () => {
    setIsGenerating(true);
    setError(null);
    setProgressPercent(0);
    setProgress(language === 'de' ? 'Verbinde mit Claude Max...' : 'Connecting to Claude Max...');
    setProgressDetails('');

    try {
      console.log('🔌 Starte Kapitel-Generierung via Claude Max Bridge');

      // Generiere erweiterten Kontext aus Forschungsdaten
      const enhancedContext = generateEnhancedContext();

      // Kombiniere User-Input mit automatisch generierten Kontext
      const combinedSummary = previousChaptersSummary
        ? `${previousChaptersSummary}\n\n${enhancedContext}`
        : enhancedContext || '';

      // Erstelle detaillierten Prompt für Claude (nur mit tatsächlich vorhandenen Werten)
      let promptParts = [];

      promptParts.push('Du bist ein erfahrener wissenschaftlicher Autor. Bitte schreibe ein Kapitel für eine Masterarbeit mit folgenden Vorgaben:\n');
      promptParts.push(`**Titel der Arbeit:** ${thesisTitle}\n`);

      if (thesisTopic && thesisTopic.trim()) {
        promptParts.push(`**Thema:** ${thesisTopic}\n`);
      }

      promptParts.push(`\n**Kapitel ${chapterNumber}: ${chapterTitle}**\n`);
      promptParts.push(`\n**Zielumfang:** ~${targetWords} Wörter\n`);

      if (researchQuestionsText && researchQuestionsText.trim()) {
        promptParts.push(`\n**Forschungsfragen:**\n${researchQuestionsText}\n`);
      }

      if (methodology && methodology.trim()) {
        promptParts.push(`\n**Methodologie:**\n${methodology}\n`);
      }

      if (theoreticalFramework && theoreticalFramework.trim()) {
        promptParts.push(`\n**Theoretischer Rahmen:**\n${theoreticalFramework}\n`);
      }

      if (keyReferences && keyReferences.trim()) {
        promptParts.push(`\n**Wichtige Referenzen:**\n${keyReferences}\n`);
      }

      if (combinedSummary && combinedSummary.trim()) {
        promptParts.push(`\n**Kontext aus bisherigen Kapiteln und Forschungsdaten:**\n${combinedSummary}\n`);
      }

      promptParts.push('\n**Anforderungen:**\n');
      promptParts.push(`- Akademisches Niveau: ${academicLevel}\n`);
      promptParts.push(`- Zitierstil: ${citationStyle}\n`);
      promptParts.push(`- Sprache: ${language === 'de' ? 'Deutsch' : 'English'}\n`);
      promptParts.push(strictMode
        ? '- Verwende AUSSCHLIESSLICH die angegebenen Daten und Referenzen\n'
        : '- Du darfst zusätzliche wissenschaftliche Quellen einbeziehen\n'
      );

      promptParts.push('\nBitte strukturiere das Kapitel mit:\n');
      promptParts.push('1. Einleitung\n');
      promptParts.push('2. Hauptteil (mit Unterabschnitten)\n');
      promptParts.push('3. Zwischenfazit/Überleitung\n');
      promptParts.push('\nSchreibe das Kapitel in wissenschaftlichem Stil mit angemessenen Zitationen.');

      const prompt = promptParts.join('');

      setProgress(language === 'de' ? 'Sende Anfrage an Claude...' : 'Sending request to Claude...');
      setProgressPercent(20);

      // Sende Request über Bridge
      const projectData = {
        prompt: prompt,
        context: {
          thesisTitle,
          chapterNumber,
          chapterTitle,
          targetWords
        }
      };

      console.log('📤 Sende Request an Claude Bridge:', projectData);

      if (typeof window !== 'undefined' && (window as any).electronAPI?.bridgeGenerateReport) {
        setProgress(language === 'de' ? 'Claude arbeitet...' : 'Claude is working...');
        setProgressPercent(50);

        const response = await (window as any).electronAPI.bridgeGenerateReport(projectData, 'thesis-chapter');

        console.log('📥 Antwort von Claude erhalten:', response);

        // Check if response is successful
        if (!response || !response.success) {
          throw new Error(response?.error || 'Bridge not implemented or returned no content');
        }

        setProgressPercent(90);
        setProgress(language === 'de' ? 'Verarbeite Antwort...' : 'Processing response...');

        // Extract content from response
        const content = typeof response === 'string' ? response : (response.content || response.text || '');

        if (!content || typeof content !== 'string') {
          throw new Error('Bridge returned invalid response format');
        }

        // Parse die Antwort und erstelle CompleteChapter-Objekt
        const wordCount = content.split(/\s+/).length;
        const hasPlaceholders = /\[.*?\]|TODO|PLACEHOLDER|XXX/.test(content);
        const placeholderMatches = content.match(/\[.*?\]|TODO|PLACEHOLDER|XXX/g) || [];

        const chapter: CompleteChapter = {
          chapterNumber: chapterNumber,
          chapterTitle: chapterTitle,
          abstract: content.substring(0, 200) + '...', // Erste 200 Zeichen als Abstract
          sections: [{
            sectionNumber: `${chapterNumber}.1`,
            sectionTitle: chapterTitle,
            content: content,
            wordCount: wordCount,
            containsPlaceholders: hasPlaceholders
          }],
          totalWordCount: wordCount,
          isComplete: !hasPlaceholders,
          qualityScore: hasPlaceholders ? 0.7 : 1.0,
          generatedAt: new Date().toISOString(),
          validationReport: {
            hasPlaceholders: hasPlaceholders,
            placeholderCount: placeholderMatches.length,
            placeholderLocations: placeholderMatches,
            meetsWordCount: wordCount >= 3000,
            actualWordCount: wordCount,
            targetWordCount: 3000,
            completenessRate: hasPlaceholders ? 0.7 : 1.0,
            recommendations: hasPlaceholders
              ? ['Bridge-generiertes Kapitel - Bitte auf Platzhalter prüfen']
              : ['Kapitel erscheint vollständig']
          }
        };

        setGeneratedChapter(chapter);
        setProgressPercent(100);
        setProgress(language === 'de' ? '✅ Kapitel erfolgreich generiert!' : '✅ Chapter generated successfully!');

      } else {
        throw new Error('Bridge API nicht verfügbar');
      }

    } catch (error: any) {
      console.error('❌ Fehler bei Bridge-Generierung:', error);
      setError(error.message || 'Fehler bei der Generierung via Claude Max Bridge');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handler: Generate Chapter
  const handleGenerate = async () => {
    // Validation
    if (!thesisTitle || !chapterTitle) {
      setError(language === 'de' ? 'Bitte Titel und Kapitel-Titel eingeben' : 'Please enter title and chapter title');
      return;
    }

    // Prüfe ob Claude Bridge verfügbar ist oder API Key konfiguriert
    if (!bridgeConnected && !apiKey) {
      setError(language === 'de'
        ? 'Bitte Claude Max Bridge verbinden ODER API-Schlüssel in Einstellungen konfigurieren'
        : 'Please connect Claude Max Bridge OR configure API key in settings');
      return;
    }

    // Wenn Bridge verbunden ist, nutze diese (kein API Key nötig)
    if (bridgeConnected) {
      console.log('🔌 Nutze Claude Max Bridge für Kapitel-Generierung');
      await handleGenerateViaBridge();
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgressPercent(0);
    setProgress(language === 'de' ? 'Starte Kapitel-Generierung...' : 'Starting chapter generation...');
    setProgressDetails('');

    try {
      // ✅ Generiere erweiterten Kontext aus Forschungsdaten
      console.log('🔍 Generiere erweiterten Kontext aus Forschungsdaten...');
      console.log('📊 Verfügbare Daten:', {
        documents: documents?.length || 0,
        researchQuestions: researchQuestions?.length || 0,
        codes: codes?.length || 0,
        codings: codings?.length || 0
      });

      const enhancedContext = generateEnhancedContext();
      console.log('✅ Erweiterter Kontext generiert:', enhancedContext.length, 'Zeichen');

      // Kombiniere User-Input mit automatisch generierten Kontext
      const combinedSummary = previousChaptersSummary
        ? `${previousChaptersSummary}\n\n${enhancedContext}`
        : enhancedContext || undefined;

      console.log('📝 Kombinierter Summary:', combinedSummary?.length || 0, 'Zeichen');

      // Prepare context
      const context: ChapterContext = {
        thesisTitle,
        thesisTopic,
        chapterNumber,
        chapterTitle,
        targetWords,
        previousChaptersSummary: combinedSummary,
        researchQuestions: researchQuestionsText ? researchQuestionsText.split('\n').filter(q => q.trim()) : undefined,
        methodology: methodology || undefined,
        theoreticalFramework: theoreticalFramework || undefined,
        keyReferences: keyReferences ? keyReferences.split('\n').filter(r => r.trim()) : undefined
      };

      const options: Partial<GenerationOptions> = {
        language,
        academicLevel,
        citationStyle,
        strictMode,
        maxRetries
      };

      setProgress(language === 'de' ? 'Generiere Kapitel-Gliederung...' : 'Generating chapter outline...');

      console.log('🚀 Starte API-Call für Kapitel-Generierung...');
      console.log('⚙️ API Settings:', { provider: apiProvider, model: apiModel, hasKey: !!apiKey });

      const chapter = await MasterThesisGenerator.generateCompleteChapter(
        context,
        { provider: apiProvider, model: apiModel, apiKey },
        {
          ...options,
          onProgress: (percent, message, details) => {
            setProgressPercent(percent);
            setProgress(message);
            setProgressDetails(details || '');
            console.log(`📊 Progress: ${percent}% - ${message}${details ? ` (${details})` : ''}`);
          }
        }
      );

      console.log('✅ Kapitel erfolgreich generiert!', chapter);
      setGeneratedChapter(chapter);
      setProgress(language === 'de' ? '✅ Kapitel erfolgreich generiert!' : '✅ Chapter generated successfully!');

    } catch (err) {
      console.error('❌ Chapter generation error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        error: err
      });
      setError(err instanceof Error ? err.message : 'Unknown error');
      setProgress('');
    } finally {
      console.log('🏁 Generation abgeschlossen (isGenerating -> false)');
      setIsGenerating(false);
    }
  };

  // Handler: Generate Outline
  const handleGenerateOutline = async () => {
    // Validation
    if (!thesisTitle && !thesisTopic) {
      setError(language === 'de'
        ? 'Bitte mindestens Titel oder Thema eingeben'
        : 'Please enter at least title or topic');
      return;
    }

    try {
      // Generate structured outline based on available information
      const sections: string[] = [];

      // Standard academic thesis structure
      sections.push('1. Einleitung');
      sections.push('   1.1 Problemstellung und Forschungsfrage');
      sections.push('   1.2 Zielsetzung der Arbeit');
      sections.push('   1.3 Aufbau der Arbeit');

      sections.push('\n2. Theoretischer Rahmen');
      if (theoreticalFramework) {
        sections.push(`   2.1 ${theoreticalFramework}`);
        sections.push('   2.2 Stand der Forschung');
      } else {
        sections.push('   2.1 Begriffliche Grundlagen');
        sections.push('   2.2 Theoretische Ansätze');
        sections.push('   2.3 Stand der Forschung');
      }

      sections.push('\n3. Methodik');
      if (methodology) {
        sections.push(`   3.1 ${methodology}`);
        sections.push('   3.2 Datenerhebung');
        sections.push('   3.3 Datenauswertung');
      } else {
        sections.push('   3.1 Forschungsdesign');
        sections.push('   3.2 Methoden der Datenerhebung');
        sections.push('   3.3 Methoden der Datenauswertung');
      }

      // Add research questions as analysis chapters if available
      if (researchQuestionsText && researchQuestionsText.trim()) {
        const questions = researchQuestionsText.split('\n').filter(q => q.trim());
        if (questions.length > 0) {
          sections.push('\n4. Empirische Analyse');
          questions.forEach((q, idx) => {
            const cleanQ = q.replace(/^[-•*]\s*/, '').trim();
            sections.push(`   4.${idx + 1} ${cleanQ}`);
          });
        } else {
          sections.push('\n4. Ergebnisse und Diskussion');
          sections.push('   4.1 Darstellung der Ergebnisse');
          sections.push('   4.2 Interpretation der Ergebnisse');
          sections.push('   4.3 Diskussion');
        }
      } else {
        sections.push('\n4. Ergebnisse und Diskussion');
        sections.push('   4.1 Darstellung der Ergebnisse');
        sections.push('   4.2 Interpretation der Ergebnisse');
        sections.push('   4.3 Diskussion');
      }

      sections.push('\n5. Fazit und Ausblick');
      sections.push('   5.1 Zusammenfassung der wichtigsten Ergebnisse');
      sections.push('   5.2 Implikationen');
      sections.push('   5.3 Limitationen');
      sections.push('   5.4 Ausblick für zukünftige Forschung');

      sections.push('\nLiteraturverzeichnis');

      if (documents && documents.length > 0) {
        sections.push('Anhang');
      }

      const generatedOutline = sections.join('\n');
      setOutline(generatedOutline);

      console.log('✅ Gliederung generiert');
    } catch (err) {
      console.error('❌ Outline generation error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Handler: Download Markdown
  const handleDownloadMarkdown = () => {
    if (!generatedChapter) return;

    const markdown = MasterThesisGenerator.exportAsMarkdown(generatedChapter);
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${generatedChapter.chapterNumber}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Download Plain Text
  const handleDownloadText = () => {
    if (!generatedChapter) return;

    const text = MasterThesisGenerator.exportAsPlainText(generatedChapter);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${generatedChapter.chapterNumber}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handler: Copy to Clipboard
  const handleCopyToClipboard = () => {
    if (!generatedChapter) return;

    const markdown = MasterThesisGenerator.exportAsMarkdown(generatedChapter);
    navigator.clipboard.writeText(markdown).then(() => {
      alert(language === 'de' ? 'In Zwischenablage kopiert!' : 'Copied to clipboard!');
    });
  };

  // Handler: Reset State (bei Problemen)
  const handleReset = () => {
    setIsGenerating(false);
    setError(null);
    setProgress('');
    setProgressPercent(0);
    setProgressDetails('');
    console.log('🔄 State zurückgesetzt');
  };

  // Handler: Download with Bibliography
  const handleDownloadWithBibliography = () => {
    if (!generatedChapter) return;

    const markdownWithBibliography = MasterThesisGenerator.exportWithBibliography(
      generatedChapter,
      documents || [],
      citationStyle
    );

    const blob = new Blob([markdownWithBibliography], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chapter-${generatedChapter.chapterNumber}-with-bibliography.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl p-6 border border-white/10 backdrop-blur-xl">
        <h1 className="text-3xl font-bold text-white mb-2">🎓 {labels.title}</h1>
        <p className="text-gray-300">{labels.subtitle}</p>
      </div>

      {/* 🔌 Claude Bridge Status Card */}
      <div className={`rounded-2xl p-4 border backdrop-blur-xl ${
        bridgeConnected
          ? 'bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-blue-500/10 border-green-500/30'
          : 'bg-gradient-to-r from-orange-500/10 via-yellow-500/10 to-red-500/10 border-orange-500/30'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${bridgeConnected ? 'bg-green-400 animate-pulse' : 'bg-orange-400'}`}></div>
            <div>
              <h3 className="text-sm font-semibold text-white">🔌 {labels.claudeBridge}</h3>
              <p className="text-xs text-gray-400">
                {bridgeConnected ? labels.bridgeConnected : labels.bridgeDisconnected}
                {bridgePort && ` (Port: ${bridgePort})`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshBridgeStatus}
              disabled={bridgeChecking}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                bridgeConnected
                  ? 'bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300'
                  : 'bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/50 text-orange-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {bridgeChecking ? labels.bridgeChecking : `🔄 ${labels.bridgeRefresh}`}
            </button>
            {!bridgeConnected && (
              <div className="text-xs px-3 py-1.5 bg-orange-500/20 border border-orange-500/50 rounded-lg text-orange-300">
                {language === 'de' ? 'Siehe browser-extensions/INSTALLATION.md' : 'See browser-extensions/INSTALLATION.md'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ Research Data Card - NEU! */}
      {(() => {
        const stats = getResearchDataStats();
        const hasData = stats.documents > 0 || stats.codes > 0 || stats.codings > 0;

        if (hasData) {
          return (
            <div className="bg-gradient-to-r from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-green-500/30 backdrop-blur-xl">
              <h2 className="text-xl font-semibold text-white mb-4">
                📊 {labels.researchData}
              </h2>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.documents}</div>
                  <div className="text-xs text-gray-400">{labels.documentsCount}</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.researchQuestions}</div>
                  <div className="text-xs text-gray-400">{labels.questionsCount}</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">{stats.codes}</div>
                  <div className="text-xs text-gray-400">{labels.codesCount}</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{stats.codings}</div>
                  <div className="text-xs text-gray-400">{labels.codingsCount}</div>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {stats.hasMetaIntelligence ? '✓' : '✗'}
                  </div>
                  <div className="text-xs text-gray-400">{labels.metaAvailable}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-2">
                <button
                  onClick={autoFillAll}
                  className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-xl font-semibold transition-all"
                >
                  🚀 {labels.autoFillAll}
                </button>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <button
                    onClick={fillResearchQuestions}
                    disabled={stats.researchQuestions === 0}
                    className="py-2 px-3 bg-purple-600/50 hover:bg-purple-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {labels.fillQuestions}
                  </button>
                  <button
                    onClick={fillTheoreticalFramework}
                    disabled={!stats.hasMetaIntelligence}
                    className="py-2 px-3 bg-blue-600/50 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {labels.fillTheory}
                  </button>
                  <button
                    onClick={fillMethodology}
                    disabled={stats.codes === 0}
                    className="py-2 px-3 bg-cyan-600/50 hover:bg-cyan-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {labels.fillMethod}
                  </button>
                  <button
                    onClick={fillKeyReferences}
                    disabled={stats.documents === 0}
                    className="py-2 px-3 bg-yellow-600/50 hover:bg-yellow-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {labels.fillReferences}
                  </button>
                  <button
                    onClick={fillPreviousSummary}
                    disabled={stats.codings === 0 && !stats.hasMetaIntelligence}
                    className="py-2 px-3 bg-green-600/50 hover:bg-green-600 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {labels.fillSummary}
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}

      {/* Form Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Form */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4">📋 {labels.basicInfo}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.thesisTitle}</label>
                <input
                  type="text"
                  value={thesisTitle}
                  onChange={(e) => setThesisTitle(e.target.value)}
                  placeholder={labels.thesisTitlePlaceholder}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.thesisTopic}</label>
                <input
                  type="text"
                  value={thesisTopic}
                  onChange={(e) => setThesisTopic(e.target.value)}
                  placeholder={labels.thesisTopicPlaceholder}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Context Information */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4">🔍 {labels.contextInfo}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.previousChapters}</label>
                <textarea
                  value={previousChaptersSummary}
                  onChange={(e) => setPreviousChaptersSummary(e.target.value)}
                  placeholder={labels.previousChaptersPlaceholder}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.researchQuestions}</label>
                <textarea
                  value={researchQuestionsText}
                  onChange={(e) => setResearchQuestionsText(e.target.value)}
                  placeholder={labels.researchQuestionsPlaceholder}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.methodology}</label>
                <input
                  type="text"
                  value={methodology}
                  onChange={(e) => setMethodology(e.target.value)}
                  placeholder={labels.methodologyPlaceholder}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.theoreticalFramework}</label>
                <input
                  type="text"
                  value={theoreticalFramework}
                  onChange={(e) => setTheoreticalFramework(e.target.value)}
                  placeholder={labels.theoreticalFrameworkPlaceholder}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.keyReferences}</label>
                <textarea
                  value={keyReferences}
                  onChange={(e) => setKeyReferences(e.target.value)}
                  placeholder={labels.keyReferencesPlaceholder}
                  rows={3}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Outline Creation - NEW SECTION */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-2xl p-6 border border-purple-500/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4">✨ {labels.outlineSection}</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.outline}</label>
                <textarea
                  value={outline}
                  onChange={(e) => setOutline(e.target.value)}
                  placeholder={labels.outlinePlaceholder}
                  rows={8}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                />
              </div>

              <button
                onClick={handleGenerateOutline}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
              >
                <span>🤖</span>
                <span>{labels.generateOutline}</span>
              </button>

              {/* Chapter Selection from Outline */}
              {parsedChapters.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">{labels.selectChapter}</label>
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto">
                    {parsedChapters.map((chapter) => (
                      <button
                        key={chapter.number}
                        onClick={() => {
                          setChapterNumber(parseInt(chapter.number));
                          setChapterTitle(chapter.title);
                        }}
                        className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-500/60 rounded-lg text-left text-white transition-all duration-200 flex items-start gap-3"
                      >
                        <span className="font-bold text-purple-300 min-w-[2rem]">{chapter.number}.</span>
                        <span className="flex-1">{chapter.title}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">💡 {labels.clickToSelect}</p>
                </div>
              )}
            </div>
          </div>

          {/* 🏗️ ADAPTIVE CHAPTER ARCHITECT™ - THE REVOLUTION! */}
          {chapterTitle && targetWords > 0 && (
            <div className="space-y-4">
              {/* Toggle Button */}
              <button
                onClick={() => setShowArchitect(!showArchitect)}
                className="w-full py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-purple-500/50"
              >
                <span className="text-2xl">🏗️</span>
                <span>
                  {showArchitect
                    ? (language === 'de' ? 'Architekt verbergen' : 'Hide Architect')
                    : (language === 'de' ? '🚀 ADAPTIVE CHAPTER ARCHITECT™' : '🚀 ADAPTIVE CHAPTER ARCHITECT™')}
                </span>
                <span>{showArchitect ? '🔽' : '▶️'}</span>
              </button>

              {/* Visual Chapter Architect */}
              {showArchitect && (
                <VisualChapterArchitect
                  chapterNumber={chapterNumber}
                  chapterTitle={chapterTitle}
                  targetWords={targetWords}
                  academicLevel={academicLevel}
                  language={language}
                  onArchitectureReady={(arch) => setChapterArchitecture(arch)}
                />
              )}
            </div>
          )}

          {/* Chapter Information */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4">📖 {labels.chapterInfo}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{labels.chapterNumber}</label>
                  <input
                    type="number"
                    value={chapterNumber}
                    onChange={(e) => setChapterNumber(parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{labels.targetWords}</label>
                  <input
                    type="number"
                    value={targetWords}
                    onChange={(e) => setTargetWords(parseInt(e.target.value) || 3000)}
                    min="500"
                    step="500"
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.chapterTitle}</label>
                <input
                  type="text"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder={labels.chapterTitlePlaceholder}
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl">
            <h2 className="text-xl font-semibold text-white mb-4">⚙️ {labels.settings}</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{labels.academicLevel}</label>
                  <select
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as 'bachelor' | 'master' | 'phd')}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="bachelor">Bachelor</option>
                    <option value="master">Master</option>
                    <option value="phd">PhD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">{labels.citationStyle}</label>
                  <select
                    value={citationStyle}
                    onChange={(e) => setCitationStyle(e.target.value as 'APA' | 'Harvard' | 'IEEE' | 'Chicago')}
                    className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="APA">APA</option>
                    <option value="Harvard">Harvard</option>
                    <option value="IEEE">IEEE</option>
                    <option value="Chicago">Chicago</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={strictMode}
                    onChange={(e) => setStrictMode(e.target.checked)}
                    className="w-5 h-5 text-blue-500 bg-gray-900 border-gray-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">{labels.strictMode}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">{labels.maxRetries}</label>
                <input
                  type="number"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(parseInt(e.target.value) || 3)}
                  min="1"
                  max="5"
                  className="w-full px-4 py-2 bg-gray-900/50 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Generate Button */}
          <div className="space-y-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !thesisTitle || !chapterTitle}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 ${
                isGenerating || !thesisTitle || !chapterTitle
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 text-white hover:scale-105 hover:shadow-2xl'
              }`}
            >
              {isGenerating ? `⏳ ${labels.generating}` : `🚀 ${labels.generateButton}`}
            </button>

            {/* Notfall-Reset (immer sichtbar bei isGenerating) */}
            {isGenerating && (
              <button
                onClick={handleReset}
                className="w-full py-2 bg-orange-600/80 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-all"
              >
                🔄 {language === 'de' ? 'Notfall-Reset (Button hängt?)' : 'Emergency Reset (Button stuck?)'}
              </button>
            )}
          </div>

          {/* Progress Bar */}
          {isGenerating && (
            <div className="bg-gray-800/50 border border-blue-500/30 rounded-xl p-6 space-y-3">
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-500 ease-out flex items-center justify-center text-xs font-bold text-white"
                  style={{ width: `${progressPercent}%` }}
                >
                  {progressPercent > 10 && `${Math.round(progressPercent)}%`}
                </div>
              </div>

              {/* Progress Text */}
              <div className="text-center space-y-1">
                <div className="text-lg font-semibold text-blue-300">
                  {progress}
                </div>
                {progressDetails && (
                  <div className="text-sm text-gray-400">
                    {progressDetails}
                  </div>
                )}
              </div>

              {/* Loading Animation */}
              <div className="flex justify-center items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>

              {/* Abbrechen Button */}
              <button
                onClick={handleReset}
                className="w-full py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
              >
                ⏸️ {language === 'de' ? 'Abbrechen / Zurücksetzen' : 'Cancel / Reset'}
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300">
              ❌ {error}
            </div>
          )}
        </div>

        {/* Right Column: Results */}
        <div className="space-y-6">
          {generatedChapter ? (
            <>
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-green-500/10 via-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10 backdrop-blur-xl">
                <h2 className="text-2xl font-bold text-white mb-4">✅ {labels.results}</h2>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">{labels.wordCount}</div>
                    <div className="text-3xl font-bold text-white">{generatedChapter.totalWordCount}</div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">{labels.quality}</div>
                    <div className="text-3xl font-bold text-white">{((generatedChapter.qualityScore || 0) * 100).toFixed(1)}%</div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">{labels.completeness}</div>
                    <div className="text-3xl font-bold text-white">
                      {((generatedChapter.validationReport?.completenessRate || 0) * 100).toFixed(1)}%
                    </div>
                  </div>

                  <div className="bg-gray-900/50 rounded-xl p-4">
                    <div className="text-gray-400 text-sm mb-1">{labels.placeholders}</div>
                    <div className={`text-3xl font-bold ${generatedChapter.validationReport?.hasPlaceholders ? 'text-red-500' : 'text-green-500'}`}>
                      {generatedChapter.validationReport?.placeholderCount || 0}
                    </div>
                  </div>
                </div>

                {/* Export Buttons */}
                <div className="mt-6 space-y-3">
                  <button
                    onClick={handleDownloadMarkdown}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
                  >
                    📥 {labels.downloadMarkdown}
                  </button>

                  <button
                    onClick={handleDownloadText}
                    className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold transition-all"
                  >
                    📄 {labels.downloadText}
                  </button>

                  <button
                    onClick={handleCopyToClipboard}
                    className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-semibold transition-all"
                  >
                    📋 {labels.copyToClipboard}
                  </button>

                  {documents && documents.length > 0 && (
                    <button
                      onClick={handleDownloadWithBibliography}
                      className="w-full py-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl font-semibold transition-all"
                    >
                      📚 {labels.downloadWithBibliography}
                    </button>
                  )}
                </div>
              </div>

              {/* Validation Report */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl">
                <h3 className="text-xl font-semibold text-white mb-4">📊 {labels.validationReport}</h3>

                {generatedChapter.validationReport.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="font-semibold text-gray-300 mb-2">{labels.recommendations}:</div>
                    {generatedChapter.validationReport.recommendations.map((rec, idx) => (
                      <div key={idx} className="text-sm text-gray-400 pl-4 border-l-2 border-gray-600">
                        {rec}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chapter Preview */}
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-xl max-h-96 overflow-y-auto">
                <h3 className="text-xl font-semibold text-white mb-4">📖 {labels.chapterContent}</h3>

                <div className="space-y-4 text-gray-300">
                  <div>
                    <div className="font-bold text-white text-lg mb-2">
                      {generatedChapter.chapterNumber}. {generatedChapter.chapterTitle}
                    </div>
                    <div className="text-sm italic text-gray-400 mb-4">
                      <strong>{labels.abstract}:</strong> {generatedChapter.abstract}
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-white mb-2">{labels.sections}:</div>
                    {generatedChapter.sections.map((section, idx) => (
                      <div key={idx} className="mb-4 pb-4 border-b border-gray-700 last:border-0">
                        <div className="font-semibold text-blue-400 mb-2">
                          {section.sectionNumber} {section.sectionTitle}
                        </div>
                        <div className="text-sm text-gray-400 line-clamp-3">
                          {section.content.substring(0, 200)}...
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {section.wordCount} {language === 'de' ? 'Wörter' : 'words'}
                          {section.containsPlaceholders && (
                            <span className="ml-2 text-red-500">⚠️ Placeholder detected</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Placeholder when no chapter generated */
            <div className="bg-gray-800/30 rounded-2xl p-12 border border-gray-700/30 backdrop-blur-xl text-center">
              <div className="text-6xl mb-4">📝</div>
              <div className="text-xl text-gray-400">
                {language === 'de'
                  ? 'Fülle das Formular aus und klicke auf "Kapitel generieren"'
                  : 'Fill out the form and click "Generate Chapter"'}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
