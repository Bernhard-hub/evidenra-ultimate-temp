/**
 * ProtectedPromptService - Integration zwischen EVIDENRA Server und lokalem APIService
 *
 * Dieser Service:
 * 1. Holt geschützte Prompts vom EVIDENRA Server (Railway)
 * 2. Führt KI-Aufrufe lokal aus (mit User's eigenem API Key via APIService)
 * 3. Sendet Ergebnisse zur AKIH-Bewertung an den Server
 */

import { EvidenraClient, MethodologyPrompts, AKIHScoreResult } from './EvidenraClient';
import APIService, { APIMessage, APIResponse } from '../APIService';

export interface ProtectedAnalysisConfig {
  methodology: 'mayring' | 'grounded-theory' | 'thematic' | 'discourse';
  approach?: string;
  text: string;
  provider: string;
  model: string;
  apiKey: string;
  maxTokens?: number;
}

export interface ProtectedAnalysisResult {
  success: boolean;
  codings: Array<{
    text: string;
    category: string;
    reasoning?: string;
    confidence?: number;
  }>;
  rawResponse: string;
  akihScore?: AKIHScoreResult;
  error?: string;
}

export class ProtectedPromptService {
  private client: EvidenraClient;
  private isInitialized = false;

  constructor(config: {
    supabaseUrl: string;
    supabaseAnonKey: string;
    subscription: 'free' | 'basic' | 'pro' | 'ultimate';
  }) {
    this.client = new EvidenraClient({
      serverUrl: 'https://evidenra-analysis-server-production-ad93.up.railway.app',
      supabaseUrl: config.supabaseUrl,
      supabaseAnonKey: config.supabaseAnonKey,
      subscription: config.subscription
    });
  }

  /**
   * Setzt das Access Token (von Supabase Auth)
   */
  setAccessToken(token: string) {
    this.client.setAccessToken(token);
    this.isInitialized = true;
  }

  /**
   * Aktualisiert das Subscription Level
   */
  setSubscription(subscription: 'free' | 'basic' | 'pro' | 'ultimate') {
    this.client.setSubscription(subscription);
  }

  /**
   * Prüft ob ein Feature verfügbar ist
   */
  hasFeature(feature: 'genesis' | 'akih' | 'personas' | 'advanced-methodologies' | 'team-collaboration' | 'quantum-coding'): boolean {
    return this.client.hasFeature(feature);
  }

  /**
   * Führt geschützte Analyse durch
   *
   * Flow:
   * 1. Holt Prompts vom Server
   * 2. Führt KI-Aufruf lokal mit User's API Key aus
   * 3. Parsed das Ergebnis
   * 4. Optional: Sendet zur AKIH-Bewertung
   */
  async analyzeWithProtectedPrompts(config: ProtectedAnalysisConfig): Promise<ProtectedAnalysisResult> {
    if (!this.isInitialized) {
      return {
        success: false,
        codings: [],
        rawResponse: '',
        error: 'Service nicht initialisiert. Bitte setAccessToken() aufrufen.'
      };
    }

    try {
      // 1. Hole geschützte Prompts vom Server
      const prompts = await this.client.getMethodologyPrompts(config.methodology, {
        approach: config.approach
      });

      // 2. Erstelle Messages für den KI-Aufruf
      const messages: APIMessage[] = [
        { role: 'system', content: prompts.systemPrompt },
        {
          role: 'user',
          content: prompts.userPromptTemplate.replace('{{text}}', config.text)
        }
      ];

      // 3. Führe KI-Aufruf lokal aus (mit User's eigenem API Key)
      const aiResponse = await APIService.callAPI(
        config.provider,
        config.model,
        config.apiKey,
        messages,
        config.maxTokens || 4096
      );

      if (!aiResponse.success) {
        return {
          success: false,
          codings: [],
          rawResponse: '',
          error: aiResponse.error || 'KI-Aufruf fehlgeschlagen'
        };
      }

      // 4. Parse das Ergebnis
      const codings = this.parseCodings(aiResponse.content);

      // 5. Berechne AKIH-Score wenn verfügbar
      let akihScore: AKIHScoreResult | undefined;
      if (this.hasFeature('akih') && codings.length > 0) {
        try {
          akihScore = await this.client.calculateAKIHScore({
            codings,
            text: config.text,
            methodology: config.methodology
          });
        } catch (error) {
          console.warn('AKIH-Score Berechnung fehlgeschlagen:', error);
        }
      }

      return {
        success: true,
        codings,
        rawResponse: aiResponse.content,
        akihScore
      };

    } catch (error: any) {
      return {
        success: false,
        codings: [],
        rawResponse: '',
        error: error.message || 'Analyse fehlgeschlagen'
      };
    }
  }

  /**
   * Holt Persona-Prompts für erweiterte Analyse
   */
  async getPersonaPrompts(): Promise<Record<string, any>> {
    if (!this.hasFeature('personas')) {
      throw new Error('Personas nicht verfügbar für dieses Subscription-Level');
    }
    return this.client.getPersonaPrompts();
  }

  /**
   * Holt Genesis Engine Konfiguration
   */
  async getGenesisConfig(): Promise<any> {
    if (!this.hasFeature('genesis')) {
      throw new Error('Genesis Engine nicht verfügbar für dieses Subscription-Level');
    }
    return this.client.getGenesisConfig();
  }

  /**
   * Berechnet AKIH-Score für vorhandene Codings
   */
  async calculateAKIHScore(data: {
    codings: any[];
    text: string;
    methodology?: string;
    categories?: any[];
  }): Promise<AKIHScoreResult> {
    if (!this.hasFeature('akih')) {
      throw new Error('AKIH-Scoring nicht verfügbar für dieses Subscription-Level');
    }
    return this.client.calculateAKIHScore(data);
  }

  /**
   * Gibt Subscription-Features zurück
   */
  getSubscriptionFeatures() {
    return this.client.getSubscriptionFeatures();
  }

  /**
   * Prüft Server-Verfügbarkeit
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.client.healthCheck();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Parsed Codings aus KI-Antwort
   */
  private parseCodings(content: string): Array<{
    text: string;
    category: string;
    reasoning?: string;
    confidence?: number;
  }> {
    try {
      // Versuche JSON zu parsen
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed)) {
          return parsed.map(item => ({
            text: item.text || item.segment || item.quote || '',
            category: item.category || item.code || item.label || '',
            reasoning: item.reasoning || item.explanation || item.rationale || '',
            confidence: item.confidence || item.score || 0.8
          }));
        }
        if (parsed.codings && Array.isArray(parsed.codings)) {
          return parsed.codings.map((item: any) => ({
            text: item.text || item.segment || item.quote || '',
            category: item.category || item.code || item.label || '',
            reasoning: item.reasoning || item.explanation || item.rationale || '',
            confidence: item.confidence || item.score || 0.8
          }));
        }
      }

      // Fallback: Extrahiere strukturierte Daten aus Text
      const codings: Array<{
        text: string;
        category: string;
        reasoning?: string;
        confidence?: number;
      }> = [];

      // Pattern: "Kategorie: X" oder "Code: X" oder "- X:"
      const categoryPattern = /(?:Kategorie|Code|Thema|Category):\s*([^\n]+)/gi;
      const textPattern = /(?:Text|Segment|Zitat|Quote):\s*"?([^"\n]+)"?/gi;

      let categoryMatch;
      while ((categoryMatch = categoryPattern.exec(content)) !== null) {
        const category = categoryMatch[1].trim();
        const textMatch = textPattern.exec(content);
        const text = textMatch ? textMatch[1].trim() : '';

        if (category) {
          codings.push({
            text,
            category,
            confidence: 0.7
          });
        }
      }

      return codings;
    } catch (error) {
      console.error('Fehler beim Parsen der Codings:', error);
      return [];
    }
  }
}

// Singleton für einfache Verwendung
let _instance: ProtectedPromptService | null = null;

export function getProtectedPromptService(config?: {
  supabaseUrl: string;
  supabaseAnonKey: string;
  subscription: 'free' | 'basic' | 'pro' | 'ultimate';
}): ProtectedPromptService {
  if (!_instance && config) {
    _instance = new ProtectedPromptService(config);
  }
  if (!_instance) {
    throw new Error('ProtectedPromptService nicht initialisiert. Bitte config übergeben.');
  }
  return _instance;
}

export default ProtectedPromptService;
