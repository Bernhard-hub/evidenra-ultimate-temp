// src/types/ResearchTypes.ts
// Wissenschaftlich fundierte Typen für qualitative Forschung

/**
 * Memo-Typen nach Grounded Theory (Glaser & Strauss, 1967)
 */
export type MemoType =
  | 'theoretical'      // Theoretische Überlegungen, Konzeptentwicklung
  | 'methodological'   // Methodische Entscheidungen, Vorgehensweise
  | 'reflexive'        // Forscher-Reflexivität, Bias-Bewusstsein
  | 'analytical'       // Analytische Beobachtungen
  | 'ethical';         // Ethische Überlegungen

/**
 * Forschungs-Memo (nach Charmaz, 2014)
 */
export interface ResearchMemo {
  id: string;
  type: MemoType;
  title: string;
  content: string;
  timestamp: Date;
  author: string; // Forscher-Name

  // Relationen
  relatedToCategory?: string;
  relatedToSegment?: string;
  relatedToDocument?: string;
  relatedToCoding?: string;

  // Metadata
  tags: string[];
  isPrivate: boolean; // Für sensitive Reflexionen

  // Versionierung
  version: number;
  editHistory: {
    timestamp: Date;
    changes: string;
  }[];
}

/**
 * KI-Erklärung (Explainable AI)
 */
export interface AIExplanation {
  // Hauptentscheidung
  decision: string; // z.B. "Kategorie: Emotionale Belastung"

  // Begründung
  reasoning: string[]; // Schritt-für-Schritt Erklärung
  confidence: number; // 0-1 (Konfidenz der KI)

  // Evidenz
  textEvidences: {
    quote: string;
    reason: string;
    weight: number; // Wie wichtig war diese Evidence?
  }[];

  // Alternativen
  alternativeInterpretations: {
    category: string;
    probability: number;
    reason: string;
  }[];

  // Limitationen
  limitations: string[];
  uncertainties: string[];

  // Metadaten
  model: string;
  timestamp: Date;
  tokenUsage: number;
}

/**
 * Bias-Typen (nach O'Neil, 2016; Noble, 2018)
 */
export type BiasType =
  | 'selection'        // Sampling Bias
  | 'confirmation'     // Bestätigungsverzerrung
  | 'anchoring'        // Erste Eindrücke
  | 'availability'     // Recency Effect
  | 'cultural'         // Kulturelle Annahmen
  | 'linguistic'       // Sprachliche Präferenzen
  | 'algorithmic'      // KI-Bias
  | 'researcher';      // Forscher-Voreingenommenheit

/**
 * Bias-Warnung
 */
export interface BiasWarning {
  id: string;
  type: BiasType;
  severity: 'low' | 'medium' | 'high' | 'critical';

  // Beschreibung
  title: string;
  description: string;
  detectedAt: Date;

  // Kontext
  affectedCategory?: string;
  affectedSegment?: string;
  affectedCoding?: string;

  // Evidence
  evidence: string[];

  // Empfehlungen
  mitigation: {
    strategy: string;
    implementation: string;
    priority: 'low' | 'medium' | 'high';
  }[];

  // Status
  acknowledged: boolean;
  mitigated: boolean;
  mitigationNote?: string;
}

/**
 * Reflexivitäts-Dokumentation (nach Lincoln & Guba, 1985)
 */
export interface ReflexivityStatement {
  id: string;
  timestamp: Date;

  // Forscher-Positionierung
  researcherBackground: string;
  theoreticalPerspective: string;
  epistemologicalStance: 'positivist' | 'constructivist' | 'critical' | 'pragmatist' | 'other';

  // Bias-Bewusstsein
  acknowledgedBiases: {
    bias: string;
    impact: string;
    mitigation: string;
  }[];

  // Methodische Transparenz
  methodologicalDecisions: {
    decision: string;
    rationale: string;
    alternatives: string;
    timestamp: Date;
  }[];

  // Einfluss auf Forschung
  influenceOnInterpretation: string;
  relationshipToParticipants?: string;

  // Selbstreflexion
  challengesToAssumptions: string[];
  learningPoints: string[];
}

/**
 * Theoretische Sättigung (nach Glaser & Strauss, 1967)
 */
export interface SaturationAnalysis {
  iterationNumber: number;
  timestamp: Date;

  // Neue Konzepte
  newConceptsFound: number;
  totalConceptsNow: number;

  // Sättigungs-Metriken
  saturationScore: number; // 0-1 (1 = vollständig gesättigt)
  convergenceRate: number; // Wie schnell konvergiert?

  // Kategorien-Analyse
  categoriesAnalyzed: number;
  categoriesSaturated: number;
  categoriesNeedingMoreData: string[];

  // Empfehlung
  recommendation: 'continue_coding' | 'approaching_saturation' | 'saturation_reached';
  reasonForRecommendation: string;

  // Visualisierung
  saturationCurve: {
    iteration: number;
    newConcepts: number;
  }[];
}

/**
 * Member Checking / Respondent Validation
 */
export interface MemberCheckingSession {
  id: string;
  participantId: string; // Anonymisiert
  timestamp: Date;

  // Präsentierte Interpretation
  interpretationPresented: {
    category: string;
    finding: string;
    quotes: string[];
  }[];

  // Feedback
  participantFeedback: {
    category: string;
    agreementLevel: 1 | 2 | 3 | 4 | 5; // Likert-Skala
    comments: string;
    corrections?: string;
    additionalContext?: string;
  }[];

  // Anpassungen
  interpretationAdjustments: {
    original: string;
    adjusted: string;
    reason: string;
  }[];

  // Metadaten
  validationMethod: 'interview' | 'written' | 'group_discussion' | 'email';
  duration?: number; // Minuten
}

/**
 * Audit Trail (für Dependability nach Lincoln & Guba)
 */
export interface AuditTrailEntry {
  id: string;
  timestamp: Date;
  action: string;
  actor: string; // 'researcher' | 'ai' | 'system'

  // Details
  beforeState?: any;
  afterState?: any;
  reasoning?: string;

  // Kontext
  affectedEntity: 'category' | 'segment' | 'coding' | 'memo' | 'interpretation';
  entityId: string;

  // Validierung
  validated: boolean;
  validatedBy?: string;
  validationNote?: string;
}

/**
 * Ethik-Compliance
 */
export interface EthicsCompliance {
  // Einwilligung
  informedConsentObtained: boolean;
  consentDocumentation: string;
  participantsInformed: boolean;

  // Datenschutz
  dataAnonymized: boolean;
  anonymizationMethod: string;
  personalDataHandling: string;

  // KI-Nutzung
  aiUsageDisclosed: boolean;
  participantsConsentToAI: boolean;
  dataSharedWithThirdParty: boolean;
  thirdPartyProvider?: string;

  // IRB/Ethics Board
  ethicsApprovalObtained: boolean;
  ethicsApprovalNumber?: string;
  institutionalReview?: string;

  // Vulnerable Populations
  involvesVulnerablePopulations: boolean;
  specialProtections?: string[];

  // Data Storage
  dataStorageLocation: 'local' | 'cloud' | 'institutional_server';
  dataRetentionPeriod: string;
  dataDeletionPlan: string;

  // Harm Mitigation
  potentialHarms: string[];
  harmMitigationStrategies: string[];
}

/**
 * Erweiterte Projekt-Daten (wissenschaftlich)
 */
export interface ScientificProject {
  // Basis
  id: string;
  name: string;
  description: string;
  created: Date;
  updated: Date;

  // Forschungsdesign
  researchQuestions: string[];
  epistemology: string;
  methodology: string;
  samplingStrategy: string;

  // Qualitätssicherung
  memos: ResearchMemo[];
  reflexivityStatements: ReflexivityStatement[];
  biasWarnings: BiasWarning[];
  auditTrail: AuditTrailEntry[];

  // Validierung
  saturationAnalysis: SaturationAnalysis[];
  memberCheckingSessions: MemberCheckingSession[];

  // Ethik
  ethicsCompliance: EthicsCompliance;

  // Daten
  documents: any[];
  categories: any[];
  codings: any[];

  // KI-Transparenz
  aiExplanations: Map<string, AIExplanation>; // Key = coding/category ID
}

/**
 * Gütekriterien-Report (nach Lincoln & Guba, 1985)
 */
export interface QualityCriteriaReport {
  projectId: string;
  generatedAt: Date;

  // Credibility (Glaubwürdigkeit)
  credibility: {
    score: number; // 0-100
    factors: {
      prolongedEngagement: boolean;
      persistentObservation: boolean;
      triangulation: {
        dataTriangulation: boolean;
        investigatorTriangulation: boolean;
        theoryTriangulation: boolean;
        methodologicalTriangulation: boolean;
      };
      peerDebriefing: boolean;
      negativeCase Analysis: boolean;
      memberChecking: boolean;
    };
    recommendations: string[];
  };

  // Transferability (Übertragbarkeit)
  transferability: {
    score: number;
    thickDescriptionQuality: number;
    contextDocumentation: number;
    samplingRationale: string;
    boundaryConditions: string[];
  };

  // Dependability (Verlässlichkeit)
  dependability: {
    score: number;
    auditTrailCompleteness: number;
    methodologicalCoherence: number;
    decisionDocumentation: number;
  };

  // Confirmability (Bestätigbarkeit)
  confirmability: {
    score: number;
    dataGrounding: number;
    reflexivityLevel: number;
    biasAcknowledgment: number;
    confirmationAudit: boolean;
  };

  // Zusätzlich: Reflexivity
  reflexivity: {
    score: number;
    positioningClarity: number;
    biasTransparency: number;
    methodologicalReflection: number;
  };

  // Gesamt
  overallQualityScore: number;
  passesMinimumStandards: boolean;
  readyForPublication: boolean;
  criticalIssues: string[];
}
