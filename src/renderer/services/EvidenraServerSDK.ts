/**
 * EVIDENRA Server SDK
 *
 * Thin Client SDK für Server-basierte Analyse-Services
 * Alle Berechnungen werden serverseitig durchgeführt
 */

const SERVER_URL = 'https://evidenra-analysis-server-production-ad93.up.railway.app';
// const SERVER_URL = 'http://localhost:3001'; // Dev

interface ServerResponse<T> {
  success: boolean;
  error?: string;
  data?: T;
}

interface SegmentResult {
  segments: Array<{
    id: string;
    text: string;
    startIndex: number;
    endIndex: number;
    type: string;
  }>;
  count: number;
}

interface CodingResult {
  prompt: {
    system: string;
    user: string;
    outputFormat: string;
  };
  methodology: string;
  categories: any[];
  segmentCount: number;
}

interface ThreeExpertPrepResult {
  experts: Array<{
    expertId: string;
    profile: string;
    systemPrompt: string;
    userPrompt: string;
  }>;
  text: string;
  categories: any[];
}

interface ConsensusResult {
  irr: {
    fleissKappa: number;
    interpretation: string;
    agreementPercentage: number;
  };
  consensus: any;
  expertCount: number;
}

interface CitationValidationResult {
  results: Array<{
    citation: string;
    valid: boolean;
    issues: string[];
    confidence: number;
  }>;
  validCount: number;
  totalCount: number;
}

interface HallucinationResult {
  redFlags: Array<{
    type: string;
    matches: string[];
    severity: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high';
  score: number;
}

interface StatisticsResult {
  statistics: {
    n: number;
    sum: number;
    mean: number;
    median: number;
    min: number;
    max: number;
    variance: number;
    stdDev: number;
    range: number;
  };
}

interface AKIHScoreResult {
  score: number;
  level: string;
  dimensions: any;
  recommendations: string[];
  details: any;
}

export class EvidenraServerSDK {
  private authToken: string | null = null;

  /**
   * Set authentication token (from Supabase)
   */
  setAuthToken(token: string) {
    this.authToken = token;
  }

  /**
   * Make authenticated request to server
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${SERVER_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(error.error || `Server error: ${response.status}`);
    }

    return response.json();
  }

  // ============================================
  // SEMANTIC SEGMENTATION
  // ============================================

  /**
   * Segmentiert Text in semantische Einheiten
   */
  async segmentText(
    text: string,
    options: {
      includeContext?: boolean;
      minSentenceLength?: number;
    } = {}
  ): Promise<SegmentResult> {
    return this.request<SegmentResult>('/api/analysis/segment', 'POST', {
      text,
      options,
    });
  }

  // ============================================
  // CODING & KATEGORISIERUNG
  // ============================================

  /**
   * Bereitet Kodierung vor (liefert Prompt für AI)
   */
  async prepareCoding(
    segments: any[],
    categories: any[],
    methodology: string = 'mayring'
  ): Promise<CodingResult> {
    return this.request<CodingResult>('/api/analysis/code', 'POST', {
      segments,
      categories,
      methodology,
    });
  }

  // ============================================
  // THREE EXPERT SYSTEM (IRR)
  // ============================================

  /**
   * Bereitet 3-Experten Analyse vor
   */
  async prepareThreeExpertAnalysis(
    text: string,
    categories: any[],
    expertProfiles: string[] = ['conservative', 'progressive', 'balanced']
  ): Promise<ThreeExpertPrepResult> {
    return this.request<ThreeExpertPrepResult>(
      '/api/analysis/three-expert/prepare',
      'POST',
      {
        text,
        categories,
        expertProfiles,
      }
    );
  }

  /**
   * Berechnet Konsens und IRR aus Experten-Ergebnissen
   */
  async calculateConsensus(expertResults: any[]): Promise<ConsensusResult> {
    return this.request<ConsensusResult>(
      '/api/analysis/three-expert/consensus',
      'POST',
      {
        expertResults,
      }
    );
  }

  // ============================================
  // CITATION VALIDATION
  // ============================================

  /**
   * Validiert Zitate auf Halluzinationen
   */
  async validateCitations(
    citations: string[],
    text?: string
  ): Promise<CitationValidationResult> {
    return this.request<CitationValidationResult>(
      '/api/analysis/validate-citations',
      'POST',
      {
        citations,
        text,
      }
    );
  }

  // ============================================
  // HALLUCINATION DETECTION
  // ============================================

  /**
   * Prüft Text auf Halluzinationen
   */
  async detectHallucinations(
    text: string,
    context?: string
  ): Promise<HallucinationResult> {
    return this.request<HallucinationResult>(
      '/api/analysis/detect-hallucinations',
      'POST',
      {
        text,
        context,
      }
    );
  }

  // ============================================
  // STATISTICS
  // ============================================

  /**
   * Berechnet statistische Kennzahlen
   */
  async calculateStatistics(
    values: number[],
    type: string = 'descriptive'
  ): Promise<StatisticsResult> {
    return this.request<StatisticsResult>('/api/analysis/statistics', 'POST', {
      values,
      type,
    });
  }

  // ============================================
  // REPORT GENERATION
  // ============================================

  /**
   * Generiert Report-Template
   */
  async generateReportTemplate(
    analysisResults: any,
    reportType: string = 'summary',
    language: string = 'de'
  ): Promise<any> {
    return this.request('/api/analysis/generate-report', 'POST', {
      analysisResults,
      reportType,
      language,
    });
  }

  // ============================================
  // AKIH SCORING (Protected Algorithm)
  // ============================================

  /**
   * Berechnet AKIH Score serverseitig
   */
  async calculateAKIHScore(
    codings: any[],
    text: string,
    methodology: string,
    categories: any[]
  ): Promise<AKIHScoreResult> {
    return this.request<AKIHScoreResult>('/api/score/akih', 'POST', {
      codings,
      text,
      methodology,
      categories,
    });
  }

  /**
   * Holt AKIH Dimensionen und Gewichtungen
   */
  async getAKIHDimensions(): Promise<any> {
    return this.request('/api/score/akih/dimensions', 'GET');
  }

  // ============================================
  // PROMPTS & METHODOLOGIES
  // ============================================

  /**
   * Holt geschützten Methodologie-Prompt
   */
  async getMethodologyPrompt(
    methodology: string,
    options: { approach?: string; categories?: any[] } = {}
  ): Promise<any> {
    const params = new URLSearchParams();
    if (options.approach) params.set('approach', options.approach);

    return this.request(
      `/api/prompts/methodology/${methodology}?${params.toString()}`,
      'GET'
    );
  }

  /**
   * Holt Persona-Prompts
   */
  async getPersonaPrompts(): Promise<any> {
    return this.request('/api/prompts/personas', 'GET');
  }

  /**
   * Holt Genesis Engine Config
   */
  async getGenesisConfig(): Promise<any> {
    return this.request('/api/prompts/genesis', 'GET');
  }

  /**
   * Holt verfügbare Features basierend auf Subscription
   */
  async getFeatures(): Promise<any> {
    return this.request('/api/features', 'GET');
  }

  // ============================================
  // HEALTH CHECK
  // ============================================

  /**
   * Prüft Server-Verfügbarkeit
   */
  async checkHealth(): Promise<{ status: string; version: string }> {
    return this.request('/health', 'GET');
  }
}

// Singleton Export
export const evidenraServer = new EvidenraServerSDK();

// Default export
export default EvidenraServerSDK;
