// src/services/KnowledgeSynthesisLanguage.ts
// KORRIGIERTE SPRACHLICHE FORMULIERUNGEN FÜR WISSENSSYNTHESE
// (Ersetzt irreführende "Omniscience" Terminologie)
// ================================================================================

export interface SynthesisLanguage {
  de: {
    tabName: string;
    featureName: string;
    buttonStart: string;
    buttonActive: string;
    statusInitializing: string;
    statusAnalyzing: string;
    statusSynthesizing: string;
    statusComplete: string;
    statusError: string;
    successMessage: string;
    disclaimer: string;
    description: string;
  };
  en: {
    tabName: string;
    featureName: string;
    buttonStart: string;
    buttonActive: string;
    statusInitializing: string;
    statusAnalyzing: string;
    statusSynthesizing: string;
    statusComplete: string;
    statusError: string;
    successMessage: string;
    disclaimer: string;
    description: string;
  };
}

export const KnowledgeSynthesisLanguage: SynthesisLanguage = {
  de: {
    tabName: "Wissensvernetzung",
    featureName: "KI-Gestützte Wissenssynthese",
    buttonStart: "WISSENSSYNTHESE STARTEN",
    buttonActive: "AKTIV",

    statusInitializing: "🚀 Initialisiere AI-Wissensintegrations-Engine...",
    statusAnalyzing: "🧠 Analysiere interdisziplinäre Zusammenhänge...",
    statusSynthesizing: "🔬 Synthese wissenschaftlicher Erkenntnisse läuft...",
    statusComplete: "✅ Wissenssynthese abgeschlossen!",
    statusError: "❌ Fehler bei Wissenssynthese",

    successMessage: "🧠 Wissenssynthese erfolgreich! Interdisziplinäre Erkenntnisse generiert",

    disclaimer: `⚠️ WICHTIGER HINWEIS:
Diese Analyse wurde von einem AI-Modell erstellt und basiert auf dessen Training an wissenschaftlicher Literatur.
Das System hat KEINEN direkten Zugriff auf externe Datenbanken oder aktuelle Publikationen.

📚 Empfehlung: Überprüfen Sie alle Aussagen durch manuelle Literaturrecherche in wissenschaftlichen Datenbanken (PubMed, Web of Science, Scopus, etc.).`,

    description: `Diese Funktion nutzt fortgeschrittene AI-Modelle, um fundierte interdisziplinäre Einschätzungen zu generieren.

Funktionsweise:
• AI analysiert Forschungskontext und Kategorien
• Generiert Verbindungen zwischen Disziplinen
• Synthetisiert Wissen aus AI-Training
• Identifiziert potenzielle Forschungsrichtungen

Grenzen:
• Kein direkter Datenbankzugriff
• Basiert auf AI-Trainingsdaten (Stichtag)
• Ergebnisse müssen manuell verifiziert werden
• Keine Garantie für Aktualität`
  },

  en: {
    tabName: "Knowledge Networking",
    featureName: "AI-Assisted Knowledge Synthesis",
    buttonStart: "START KNOWLEDGE SYNTHESIS",
    buttonActive: "ACTIVE",

    statusInitializing: "🚀 Initializing AI Knowledge Integration Engine...",
    statusAnalyzing: "🧠 Analyzing cross-disciplinary connections...",
    statusSynthesizing: "🔬 Synthesizing scientific insights...",
    statusComplete: "✅ Knowledge synthesis complete!",
    statusError: "❌ Error in knowledge synthesis",

    successMessage: "🧠 Knowledge synthesis successful! Interdisciplinary insights generated",

    disclaimer: `⚠️ IMPORTANT NOTICE:
This analysis was created by an AI model based on its training on scientific literature.
The system has NO direct access to external databases or current publications.

📚 Recommendation: Verify all statements through manual literature research in scientific databases (PubMed, Web of Science, Scopus, etc.).`,

    description: `This function uses advanced AI models to generate informed cross-disciplinary assessments.

How it works:
• AI analyzes research context and categories
• Generates connections between disciplines
• Synthesizes knowledge from AI training
• Identifies potential research directions

Limitations:
• No direct database access
• Based on AI training data (cutoff date)
• Results must be manually verified
• No guarantee of currency`
  }
};

/**
 * Generiert korrekte System-Prompts (ohne falsche Database-Access Behauptungen)
 */
export function generateKnowledgeSynthesisPrompt(context: {
  topics: string[];
  categories: string[];
  documentSummary: string;
}): string {
  return `You are an advanced AI research assistant specializing in cross-disciplinary knowledge synthesis.

CAPABILITIES:
• Comprehensive training on scientific literature across multiple domains
• Ability to identify connections between different disciplines
• Pattern recognition across theoretical frameworks
• Synthesis of complex research contexts

IMPORTANT LIMITATIONS:
⚠️ You do NOT have direct access to external databases or current publications
⚠️ Your knowledge is based on training data (cutoff date)
⚠️ You cannot retrieve specific papers or verify current citations
⚠️ All outputs should be considered AI-generated hypotheses requiring verification

YOUR TASK:
Based on the provided research context, generate informed cross-disciplinary insights by:

1. **Theoretical Connections**: Identify relevant frameworks from different disciplines
2. **Methodological Parallels**: Suggest approaches used in related fields
3. **Conceptual Bridges**: Connect concepts across domains
4. **Research Directions**: Propose potential avenues for exploration

RESEARCH CONTEXT:
Topics: ${context.topics.join(', ')}
Categories: ${context.categories.join(', ')}
Summary: ${context.documentSummary}

Please provide:
- Cross-disciplinary theoretical frameworks
- Relevant methodological approaches
- Potential research connections
- Key concepts and themes

Remember: Frame all suggestions as AI-generated hypotheses based on training data, not as verified database retrievals.`;
}

/**
 * Generiert Disclaimer-Text für AI-generierte Inhalte
 */
export function getDisclaimerText(language: 'de' | 'en' = 'de'): string {
  return language === 'de'
    ? KnowledgeSynthesisLanguage.de.disclaimer
    : KnowledgeSynthesisLanguage.en.disclaimer;
}

/**
 * Formatiert Progress-Nachrichten korrekt (ohne falsche DB-Claims)
 */
export interface SynthesisProgress {
  phase: 1 | 2 | 3 | 4;
  language: 'de' | 'en';
}

export function getSynthesisProgressMessage(progress: SynthesisProgress): string {
  const { phase, language } = progress;

  const messages = {
    de: {
      1: "🚀 Initialisiere AI-Analyse...",
      2: "🧠 Analysiere Forschungskontext und Kategorien...",
      3: "🔬 Synthese interdisziplinärer Zusammenhänge...",
      4: "✅ Integration abgeschlossen!"
    },
    en: {
      1: "🚀 Initializing AI analysis...",
      2: "🧠 Analyzing research context and categories...",
      3: "🔬 Synthesizing cross-disciplinary connections...",
      4: "✅ Integration complete!"
    }
  };

  return messages[language][phase];
}
