// Type definitions for Meta-Intelligence System

export interface MetaIntelligence {
  stage1: {
    completed: boolean;
    optimizedPrompts: any[];
    timestamp?: string;
  };
  stage2: {
    completed: boolean;
    enhancedAnalysis: {
      themes: string[];
      patterns: string[];
      insights: string[];
      recommendations: string[];
    };
    timestamp?: string;
  };
  stage3: {
    completed: boolean;
    finalArticle?: string;
    timestamp?: string;
  };
  stage4: {
    completed: boolean;
    ultimateFusionArticle?: string;
    literatureCount?: number;
    citationAnalysis?: {
      totalSources: number;
      validCitations: number;
      doiCount: number;
      pmidCount: number;
    };
    timestamp?: string;
  };
}

export interface MetaProcessing {
  active: boolean;
  stage: number;
  progress: number;
  message: string;
}