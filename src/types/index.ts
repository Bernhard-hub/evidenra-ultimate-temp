// 🎯 Shared Types for EVIDENRA Professional
// Central type definitions for the entire application

// ============================================================================
// Core Data Types
// ============================================================================

export interface Document {
  id: string;
  name: string;
  content: string;
  size: number;
  type: string;
  wordCount?: number;
  uploadedAt?: Date | string;
  originalFile?: File;
  metadata?: {
    pages?: number;
    extractionQuality?: 'full' | 'partial' | 'failed';
    author?: string;
    year?: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  parentId?: string;
  level?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export interface Coding {
  id: string;
  documentId: string;
  categoryId: string;
  categoryName: string;
  text: string;
  startLine: number;
  endLine: number;
  source?: 'manual' | 'ai' | 'hybrid';
  aiGenerated?: boolean;
  confidence?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  validation?: CodingValidation;
}

export interface CodingValidation {
  isValidated: boolean;
  validatedAt?: Date;
  validatedBy?: 'human' | 'ai' | 'consensus';
  confidence?: number;
  rationale?: string;
  suggestedImprovements?: string[];
}

export interface Pattern {
  id: string;
  name?: string;
  pattern: string;
  count: number;
  strength?: string | number;
  type: string;
  confidence: number;
  categories?: Category[];
  description?: string;
  createdAt?: Date | string;
}

export interface Cluster {
  id: string;
  name: string;
  categories: Category[];
  strength: number;
  description?: string;
}

export interface ResearchQuestion {
  id: string;
  question: string;
  type: 'exploratory' | 'descriptive' | 'explanatory' | 'evaluative';
  priority?: 'high' | 'medium' | 'low';
  status?: 'open' | 'in_progress' | 'answered';
  answer?: string;
  createdAt?: Date | string;
}

export interface LiteratureReference {
  id: string;
  title: string;
  authors: string[];
  year: number;
  type: 'book' | 'article' | 'chapter' | 'thesis' | 'report' | 'web';
  abstract?: string;
  doi?: string;
  url?: string;
  notes?: string;
  citationKey?: string;
}

export interface ReflexivityStatement {
  id: string;
  timestamp: Date | string;
  researcherBackground: string;
  theoreticalPerspective: string;
  epistemologicalStance: 'positivist' | 'constructivist' | 'critical' | 'pragmatist' | 'other';
  acknowledgedBiases: string[];
  methodologicalDecisions: string[];
  influenceOnInterpretation: string;
  challengesToAssumptions: string[];
  learningPoints: string[];
}

export interface MemoEntry {
  id: string;
  content: string;
  type: 'theoretical' | 'methodological' | 'analytical' | 'personal';
  linkedCategories?: string[];
  linkedDocuments?: string[];
  createdAt: Date | string;
  updatedAt?: Date | string;
}

// ============================================================================
// Project Data Structure
// ============================================================================

export interface ProjectData {
  // Basic Project Info
  id?: string;
  name?: string;
  description?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;

  // Core Research Data
  documents: Document[];
  categories: Category[];
  codings: Coding[];
  patterns: Pattern[];
  clusters?: Cluster[];

  // Research Framework
  researchQuestions?: ResearchQuestion[];
  literature?: LiteratureReference[];
  reflexivityStatements?: ReflexivityStatement[];
  memos?: MemoEntry[];

  // Analysis Results
  thematicAnalysis?: any;
  interRaterReliability?: any;
  omniscienceReport?: any;

  // Metadata
  settings?: ProjectSettings;
  statistics?: ProjectStatistics;
}

export interface ProjectSettings {
  language?: 'de' | 'en';
  codingMode?: 'manual' | 'ai-assisted' | 'hybrid';
  aiProvider?: 'anthropic' | 'openai' | 'bridge';
  aiModel?: string;
  analysisMode?: 'grounded-theory' | 'content-analysis' | 'thematic' | 'akih';
}

export interface ProjectStatistics {
  totalDocuments: number;
  totalWords: number;
  totalCategories: number;
  totalCodings: number;
  totalPatterns: number;
  analyzedDocuments: number;
  validatedCodings: number;
  akihScore?: number;
  lastUpdated?: Date | string;
}

// ============================================================================
// AI/API Related Types
// ============================================================================

export interface APIProvider {
  id: string;
  name: string;
  enabled: boolean;
  apiKey?: string;
  models: AIModel[];
  priority: number;
  status?: 'active' | 'inactive' | 'error';
}

export interface AIModel {
  id: string;
  name: string;
  cost: number;
  maxTokens: number;
  contextWindow?: number;
  description?: string;
}

// ============================================================================
// Report Types
// ============================================================================

export interface ReportOptions {
  mode: 'BASIS' | 'ENHANCED' | 'ULTIMATE';
  language: 'de' | 'en';
  includeReferences?: boolean;
  includeVisualizations?: boolean;
  includeAKIHScore?: boolean;
  targetWordCount?: number;
  maxTokens?: number;
}

export interface GeneratedReport {
  id: string;
  type: string;
  content: string;
  wordCount: number;
  generatedAt: Date;
  options: ReportOptions;
  akihScore?: number;
  cost?: number;
  error?: string;
}

// ============================================================================
// Export all types
// ============================================================================

export type {
  // Re-export for convenience
  Document as DocumentType,
  Category as CategoryType,
  Coding as CodingType,
  Pattern as PatternType
};
