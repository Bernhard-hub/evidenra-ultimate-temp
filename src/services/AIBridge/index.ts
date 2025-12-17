// 🎯 Universal AI Bridge - Main Entry Point
// Production-Ready AI Provider Abstraction Layer

import { IntelligentRouter } from './IntelligentRouter';
import {
  AnthropicProvider,
  OpenAIProvider,
  ClaudeBridgeProvider
} from './providers';
import {
  AIRequest,
  AIResponse,
  RouterConfig,
  RoutingStrategy,
  AIErrorType,
  AIBridgeError
} from './types';

// Re-export types für externe Nutzung
export type { AIRequest, AIResponse };
export { AIErrorType, AIBridgeError, RoutingStrategy };

/**
 * Universal AI Bridge
 * Zentrale Schnittstelle für alle AI-Provider
 *
 * Features:
 * - Automatische Provider-Auswahl
 * - Intelligent Fallback Chain
 * - Retry Logic mit Exponential Backoff
 * - Cost & Token Tracking
 * - Streaming Support (coming soon)
 *
 * @example
 * ```typescript
 * const bridge = UniversalAIBridge.getInstance();
 * bridge.configure({ anthropic: { apiKey: 'sk-ant-...' } });
 *
 * const response = await bridge.generate({
 *   prompt: 'Erkläre Quantencomputing',
 *   temperature: 0.7
 * });
 * ```
 */
export class UniversalAIBridge {
  private static instance: UniversalAIBridge;
  private router: IntelligentRouter;
  private anthropic: AnthropicProvider;
  private openai: OpenAIProvider;
  private bridge: ClaudeBridgeProvider;

  private constructor() {
    console.log('🚀 Initialisiere Universal AI Bridge...');

    // Initialisiere Router
    this.router = new IntelligentRouter({
      strategy: RoutingStrategy.PRIORITY,
      enableFallback: true,
      maxRetries: 3,
      timeout: 30000
    });

    // Initialisiere alle Provider
    this.anthropic = new AnthropicProvider();
    this.openai = new OpenAIProvider();
    this.bridge = new ClaudeBridgeProvider();

    // Registriere Provider beim Router
    this.router.registerProvider(this.anthropic);
    this.router.registerProvider(this.openai);
    this.router.registerProvider(this.bridge);

    console.log('✅ Universal AI Bridge initialisiert');
  }

  /**
   * Singleton Instance
   */
  public static getInstance(): UniversalAIBridge {
    if (!UniversalAIBridge.instance) {
      UniversalAIBridge.instance = new UniversalAIBridge();
    }
    return UniversalAIBridge.instance;
  }

  /**
   * Konfiguriert die Provider
   *
   * @example
   * ```typescript
   * bridge.configure({
   *   anthropic: {
   *     apiKey: 'sk-ant-...',
   *     model: 'claude-3-5-sonnet-20241022'
   *   },
   *   openai: {
   *     apiKey: 'sk-...',
   *     model: 'gpt-4o'
   *   }
   * });
   * ```
   */
  configure(config: {
    anthropic?: { apiKey?: string; model?: string; enabled?: boolean };
    openai?: { apiKey?: string; model?: string; enabled?: boolean };
    bridge?: { enabled?: boolean };
    strategy?: RoutingStrategy;
  }): void {
    console.log('🔧 Konfiguriere AI Bridge...');

    if (config.anthropic) {
      this.anthropic.configure({
        ...this.anthropic['config'],
        ...config.anthropic
      });
    }

    if (config.openai) {
      this.openai.configure({
        ...this.openai['config'],
        ...config.openai
      });
    }

    if (config.bridge) {
      this.bridge.configure({
        ...this.bridge['config'],
        ...config.bridge
      });
    }

    if (config.strategy) {
      this.router.setStrategy(config.strategy);
    }

    console.log('✅ Konfiguration angewendet');
  }

  /**
   * Generiert AI-Content
   * Wählt automatisch besten Provider und fällt bei Fehlern auf Alternativen zurück
   *
   * @param request - AI Request mit Prompt und Optionen
   * @returns AI Response mit generiertem Content
   */
  async generate(request: AIRequest): Promise<AIResponse> {
    console.log('📝 Generiere Content via Universal AI Bridge...');

    try {
      // Nutze Router für automatische Provider-Auswahl und Fallback
      const response = await this.router.executeWithFallback(request);

      if (!response.success) {
        console.error('❌ Alle Provider fehlgeschlagen:', response.error);
      } else {
        console.log(`✅ Content generiert via ${response.provider}`);
      }

      return response;

    } catch (error) {
      console.error('❌ Unerwarteter Fehler:', error);

      return {
        success: false,
        content: '',
        provider: 'error',
        timestamp: new Date().toISOString(),
        error: (error as Error).message
      };
    }
  }

  /**
   * Gibt Statistiken über alle Provider zurück
   */
  getStatistics() {
    return this.router.getStatistics();
  }

  /**
   * Prüft welche Provider verfügbar sind
   */
  async checkAvailability() {
    const [anthropicAvailable, openaiAvailable, bridgeAvailable] = await Promise.all([
      this.anthropic.isAvailable(),
      this.openai.isAvailable(),
      this.bridge.isAvailable()
    ]);

    return {
      anthropic: anthropicAvailable,
      openai: openaiAvailable,
      bridge: bridgeAvailable,
      anyAvailable: anthropicAvailable || openaiAvailable || bridgeAvailable
    };
  }

  /**
   * Aktiviert/Deaktiviert einen Provider
   */
  toggleProvider(provider: 'anthropic' | 'openai' | 'bridge', enabled: boolean): void {
    const providerName = provider === 'anthropic' ? 'anthropic' :
                        provider === 'openai' ? 'openai' : 'claude-bridge';

    this.router.toggleProvider(providerName, enabled);
  }

  /**
   * Setzt Routing-Strategie
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.router.setStrategy(strategy);
  }
}

// Default Export
export default UniversalAIBridge;
