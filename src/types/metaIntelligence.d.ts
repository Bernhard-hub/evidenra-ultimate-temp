export interface MetaIntelligence {
  stage1: {
    completed: boolean;
    optimizedPrompts: Array<{
      purpose: string;
      prompt: string;
      effectiveness: number;
    }>;
    timestamp?: string;
  };
  stage2: {
    completed: boolean;
    enhancedAnalysis: {
      themes: string[];
      patterns: any[];
      insights: string[];
      recommendations: string[];
    };
    timestamp?: string;
  };
  stage3: {
    completed: boolean;
    article?: string;
    timestamp?: string;
  };
}

export interface MetaProcessing {
  active: boolean;
  stage: number;
  progress: number;
  message: string;
}