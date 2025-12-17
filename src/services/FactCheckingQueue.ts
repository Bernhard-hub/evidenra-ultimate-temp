// src/services/FactCheckingQueue.ts

export interface FactCheckItem {
  id: string;
  claim: string;
  source: string;
  status: 'pending' | 'processing' | 'verified' | 'disputed' | 'failed';
  timestamp: number;
  verification?: FactVerification;
  priority: 'low' | 'medium' | 'high';
  category?: string;
  context?: string;
}

export interface FactVerification {
  verified: boolean;
  confidence: number;
  sources: VerificationSource[];
  reasoning: string;
  timestamp: number;
  method: 'automatic' | 'manual' | 'hybrid';
  flags: string[];
}

export interface VerificationSource {
  type: 'academic' | 'news' | 'government' | 'organization' | 'other';
  title: string;
  url?: string;
  doi?: string;
  author?: string;
  publishDate?: string;
  reliability: number; // 0-1 scale
  relevance: number; // 0-1 scale
}

export interface FactCheckingConfig {
  maxConcurrent: number;
  timeoutMs: number;
  retryAttempts: number;
  enableAutoVerification: boolean;
  trustedSources: string[];
  untrustedSources: string[];
}

export class FactCheckingQueue {
  private queue: Map<string, FactCheckItem> = new Map();
  private processing: Set<string> = new Set();
  private verified: Map<string, FactVerification> = new Map();
  private config: FactCheckingConfig;

  // Event listeners
  private listeners: Map<string, ((item: FactCheckItem) => void)[]> = new Map();

  constructor(config?: Partial<FactCheckingConfig>) {
    this.config = {
      maxConcurrent: 3,
      timeoutMs: 30000,
      retryAttempts: 2,
      enableAutoVerification: true,
      trustedSources: [
        'pubmed.ncbi.nlm.nih.gov',
        'scholar.google.com',
        'doi.org',
        'ncbi.nlm.nih.gov',
        'nature.com',
        'science.org',
        'who.int',
        'cdc.gov',
        'nih.gov'
      ],
      untrustedSources: [
        'wikipedia.org', // Can be unreliable for fact-checking
        'facebook.com',
        'twitter.com',
        'reddit.com'
      ],
      ...config
    };

    // Start background processing
    this.startBackgroundProcessor();
  }

  /**
   * Fügt einen Fakt zur Überprüfungsschlange hinzu
   */
  async addToQueue(
    claim: string,
    source: string,
    priority: 'low' | 'medium' | 'high' = 'medium',
    category?: string,
    context?: string
  ): Promise<string> {
    const id = this.generateId();

    const item: FactCheckItem = {
      id,
      claim,
      source,
      status: 'pending',
      timestamp: Date.now(),
      priority,
      category,
      context
    };

    this.queue.set(id, item);
    this.emit('added', item);

    // High priority items werden sofort verarbeitet
    if (priority === 'high' && this.processing.size < this.config.maxConcurrent) {
      this.processNext();
    }

    return id;
  }

  /**
   * Verarbeitet Schlange kontinuierlich
   */
  private startBackgroundProcessor() {
    setInterval(() => {
      this.processNext();
    }, 1000);
  }

  /**
   * Verarbeitet nächstes Item in der Schlange
   */
  private async processNext() {
    if (this.processing.size >= this.config.maxConcurrent) {
      return;
    }

    // Finde nächstes Item zum Verarbeiten (Priorität beachten)
    const nextItem = this.getNextPendingItem();
    if (!nextItem) return;

    try {
      this.processing.add(nextItem.id);
      nextItem.status = 'processing';
      this.emit('processing', nextItem);

      const verification = await this.verifyFact(nextItem);

      nextItem.verification = verification;
      nextItem.status = verification.verified ? 'verified' : 'disputed';

      this.verified.set(nextItem.claim, verification);
      this.emit('completed', nextItem);

    } catch (error) {
      console.error(`Fact checking failed for ${nextItem.id}:`, error);
      nextItem.status = 'failed';
      this.emit('failed', nextItem);
    } finally {
      this.processing.delete(nextItem.id);
    }
  }

  /**
   * Findet nächstes Item nach Priorität
   */
  private getNextPendingItem(): FactCheckItem | null {
    const pending = Array.from(this.queue.values()).filter(item => item.status === 'pending');

    if (pending.length === 0) return null;

    // Sortiere nach Priorität und dann nach Timestamp
    pending.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      return priorityDiff !== 0 ? priorityDiff : a.timestamp - b.timestamp;
    });

    return pending[0];
  }

  /**
   * Verifiziert einen Fakt
   */
  private async verifyFact(item: FactCheckItem): Promise<FactVerification> {
    const verification: FactVerification = {
      verified: false,
      confidence: 0,
      sources: [],
      reasoning: '',
      timestamp: Date.now(),
      method: 'automatic',
      flags: []
    };

    try {
      // 1. Überprüfe gegen bereits verifizierte Claims
      const existingVerification = this.verified.get(item.claim);
      if (existingVerification && (Date.now() - existingVerification.timestamp) < 24 * 60 * 60 * 1000) {
        return { ...existingVerification, timestamp: Date.now() };
      }

      // 2. Automatische Verifikation falls aktiviert
      if (this.config.enableAutoVerification) {
        const autoResult = await this.performAutomaticVerification(item);
        Object.assign(verification, autoResult);
      }

      // 3. Zusätzliche Heuristiken
      verification.flags = this.analyzeClaimForRedFlags(item.claim);

      // 4. Source-basierte Adjustierung
      this.adjustVerificationBySource(verification, item.source);

      // 5. Finale Bewertung
      verification.reasoning = this.generateReasoning(verification, item);

    } catch (error) {
      console.error('Verification process failed:', error);
      verification.flags.push('verification_error');
      verification.reasoning = 'Automatic verification failed due to technical error';
    }

    return verification;
  }

  /**
   * Führt automatische Verifikation durch
   */
  private async performAutomaticVerification(item: FactCheckItem): Promise<Partial<FactVerification>> {
    const verification: Partial<FactVerification> = {
      sources: [],
      confidence: 0.5, // Neutral start
      verified: false
    };

    try {
      // 1. Suche in vertrauenswürdigen Quellen
      const searchResults = await this.searchTrustedSources(item.claim);
      verification.sources = searchResults;

      // 2. Bewerte Ergebnisse
      if (searchResults.length === 0) {
        verification.confidence = 0.3;
        verification.verified = false;
      } else {
        const avgReliability = searchResults.reduce((sum, s) => sum + s.reliability, 0) / searchResults.length;
        const avgRelevance = searchResults.reduce((sum, s) => sum + s.relevance, 0) / searchResults.length;

        verification.confidence = (avgReliability * 0.6) + (avgRelevance * 0.4);
        verification.verified = verification.confidence > 0.7 && searchResults.length >= 2;
      }

      // 3. Spezielle Checks für verschiedene Claim-Typen
      verification.confidence = this.adjustConfidenceByClaimType(verification.confidence, item);

    } catch (error) {
      console.error('Automatic verification failed:', error);
      verification.confidence = 0.2; // Low confidence bei Fehlern
    }

    return verification;
  }

  /**
   * Sucht in vertrauenswürdigen Quellen
   */
  private async searchTrustedSources(claim: string): Promise<VerificationSource[]> {
    const sources: VerificationSource[] = [];
    const searchTerms = this.extractSearchTerms(claim);

    // Für Demo-Zwecke: Simulierte Suche
    // In Produktion würde man echte APIs verwenden (PubMed, Google Scholar, etc.)

    try {
      // Simuliere CrossRef-Suche für akademische Quellen
      const academicResults = await this.searchAcademic(searchTerms);
      sources.push(...academicResults);

      // Simuliere News-API-Suche für aktuelle Ereignisse
      const newsResults = await this.searchNews(searchTerms);
      sources.push(...newsResults);

      // Simuliere Government-API-Suche
      const govResults = await this.searchGovernment(searchTerms);
      sources.push(...govResults);

    } catch (error) {
      console.error('Source search failed:', error);
    }

    return sources.slice(0, 10); // Limitiere auf 10 Quellen
  }

  /**
   * Sucht akademische Quellen (Simulation)
   */
  private async searchAcademic(terms: string[]): Promise<VerificationSource[]> {
    // In Produktion: Echte CrossRef/PubMed API
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResults: VerificationSource[] = [];

        // Simuliere Zufallsergebnisse basierend auf Suchbegriffen
        const relevantTermFound = terms.some(term =>
          ['covid', 'vaccine', 'climate', 'research', 'study'].includes(term.toLowerCase())
        );

        if (relevantTermFound) {
          mockResults.push({
            type: 'academic',
            title: `Study on ${terms[0]} and related factors`,
            doi: `10.1000/mock.${Date.now()}`,
            author: 'Research Team',
            publishDate: '2023',
            reliability: 0.8 + Math.random() * 0.2,
            relevance: 0.6 + Math.random() * 0.4
          });
        }

        resolve(mockResults);
      }, 1000 + Math.random() * 2000); // 1-3 Sekunden Delay
    });
  }

  /**
   * Sucht News-Quellen (Simulation)
   */
  private async searchNews(terms: string[]): Promise<VerificationSource[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResults: VerificationSource[] = [];

        if (Math.random() > 0.3) { // 70% Chance auf Ergebnis
          mockResults.push({
            type: 'news',
            title: `Breaking: ${terms[0]} developments`,
            url: 'https://example-news.com/article',
            publishDate: new Date().toISOString().split('T')[0],
            reliability: 0.6 + Math.random() * 0.3,
            relevance: 0.5 + Math.random() * 0.5
          });
        }

        resolve(mockResults);
      }, 500 + Math.random() * 1500);
    });
  }

  /**
   * Sucht Government-Quellen (Simulation)
   */
  private async searchGovernment(terms: string[]): Promise<VerificationSource[]> {
    return new Promise(resolve => {
      setTimeout(() => {
        const mockResults: VerificationSource[] = [];

        const govTopics = ['health', 'safety', 'regulation', 'policy', 'official'];
        const hasGovTopic = terms.some(term =>
          govTopics.some(topic => term.toLowerCase().includes(topic))
        );

        if (hasGovTopic) {
          mockResults.push({
            type: 'government',
            title: `Official statement on ${terms[0]}`,
            url: 'https://government.example/statement',
            publishDate: '2024',
            reliability: 0.9,
            relevance: 0.7 + Math.random() * 0.3
          });
        }

        resolve(mockResults);
      }, 800 + Math.random() * 1200);
    });
  }

  /**
   * Extrahiert Suchbegriffe aus Claim
   */
  private extractSearchTerms(claim: string): string[] {
    // Einfache Keyword-Extraktion
    const words = claim.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['that', 'this', 'with', 'from', 'they', 'have', 'been', 'were', 'said', 'says'].includes(word));

    return words.slice(0, 5); // Top 5 Keywords
  }

  /**
   * Analysiert Claim auf Red Flags
   */
  private analyzeClaimForRedFlags(claim: string): string[] {
    const flags: string[] = [];

    const redFlagPatterns = [
      { pattern: /(always|never|all|none|every|completely)/gi, flag: 'absolute_language' },
      { pattern: /(miracle|cure|guaranteed|100%)/gi, flag: 'exaggerated_claims' },
      { pattern: /(they don't want you to know|hidden truth|conspiracy)/gi, flag: 'conspiracy_language' },
      { pattern: /\d{2,}\.\d{2,}%/g, flag: 'suspicious_precision' },
      { pattern: /(breakthrough|revolutionary|unprecedented)/gi, flag: 'sensational_language' }
    ];

    redFlagPatterns.forEach(({ pattern, flag }) => {
      if (pattern.test(claim)) {
        flags.push(flag);
      }
    });

    return flags;
  }

  /**
   * Adjustiert Verifikation basierend auf Quelle
   */
  private adjustVerificationBySource(verification: FactVerification, source: string) {
    try {
      const sourceUrl = new URL(source);
      const domain = sourceUrl.hostname.toLowerCase();

      if (this.config.trustedSources.some(trusted => domain.includes(trusted))) {
        verification.confidence = Math.min(verification.confidence * 1.2, 1.0);
        verification.flags.push('trusted_source');
      } else if (this.config.untrustedSources.some(untrusted => domain.includes(untrusted))) {
        verification.confidence *= 0.8;
        verification.flags.push('untrusted_source');
      }
    } catch {
      // Kein gültiger URL, ignorieren
    }
  }

  /**
   * Adjustiert Konfidenz basierend auf Claim-Typ
   */
  private adjustConfidenceByClaimType(confidence: number, item: FactCheckItem): number {
    const claim = item.claim.toLowerCase();

    // Medizinische Claims brauchen höhere Standards
    if (claim.includes('cure') || claim.includes('treatment') || claim.includes('medicine')) {
      return confidence * 0.8; // Strengere Bewertung
    }

    // Statistische Claims
    if (/\d+(\.\d+)?%/.test(claim) || claim.includes('study shows')) {
      return confidence * 0.9; // Leicht strengere Bewertung
    }

    // Historische Facts
    if (claim.includes('year') && /\d{4}/.test(claim)) {
      return Math.min(confidence * 1.1, 1.0); // Leicht bessere Bewertung
    }

    return confidence;
  }

  /**
   * Generiert Reasoning-Text
   */
  private generateReasoning(verification: FactVerification, item: FactCheckItem): string {
    let reasoning = '';

    if (verification.sources.length === 0) {
      reasoning = 'No reliable sources found to verify this claim. ';
    } else {
      reasoning = `Found ${verification.sources.length} relevant source(s). `;

      const academicSources = verification.sources.filter(s => s.type === 'academic').length;
      if (academicSources > 0) {
        reasoning += `${academicSources} academic source(s) found. `;
      }
    }

    if (verification.flags.length > 0) {
      reasoning += `Detected potential issues: ${verification.flags.join(', ')}. `;
    }

    if (verification.confidence > 0.8) {
      reasoning += 'High confidence verification from multiple reliable sources.';
    } else if (verification.confidence > 0.5) {
      reasoning += 'Moderate confidence - some supporting evidence found.';
    } else {
      reasoning += 'Low confidence - insufficient or conflicting evidence.';
    }

    return reasoning;
  }

  /**
   * Event System
   */
  on(event: string, callback: (item: FactCheckItem) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  private emit(event: string, item: FactCheckItem) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(item);
      } catch (error) {
        console.error(`Event listener error for ${event}:`, error);
      }
    });
  }

  /**
   * Hilfsmethoden
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Öffentliche API Methoden
   */
  getQueueStatus() {
    const items = Array.from(this.queue.values());
    return {
      total: items.length,
      pending: items.filter(i => i.status === 'pending').length,
      processing: items.filter(i => i.status === 'processing').length,
      verified: items.filter(i => i.status === 'verified').length,
      disputed: items.filter(i => i.status === 'disputed').length,
      failed: items.filter(i => i.status === 'failed').length
    };
  }

  getItem(id: string): FactCheckItem | null {
    return this.queue.get(id) || null;
  }

  getAllItems(): FactCheckItem[] {
    return Array.from(this.queue.values());
  }

  clearCompleted() {
    const completed = Array.from(this.queue.entries()).filter(([_, item]) =>
      ['verified', 'disputed', 'failed'].includes(item.status)
    );

    completed.forEach(([id]) => this.queue.delete(id));
    return completed.length;
  }

  updateConfig(newConfig: Partial<FactCheckingConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  getVerificationHistory(): FactVerification[] {
    return Array.from(this.verified.values());
  }
}

export default FactCheckingQueue;