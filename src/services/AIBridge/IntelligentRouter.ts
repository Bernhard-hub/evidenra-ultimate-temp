// 🎯 Intelligent Router - Smart Provider Selection & Fallback

import {
  AIProvider,
  AIRequest,
  AIResponse,
  RouterConfig,
  RoutingStrategy,
  ProviderRegistryEntry,
  AIBridgeError,
  AIErrorType
} from './types';

/**
 * Intelligenter Router der automatisch den besten Provider auswählt
 * und bei Fehlern auf Fallbacks zurückfällt
 */
export class IntelligentRouter {
  private providers: Map<string, ProviderRegistryEntry> = new Map();
  private config: RouterConfig;
  private roundRobinIndex: number = 0;

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      strategy: RoutingStrategy.PRIORITY,
      enableFallback: true,
      maxRetries: 3,
      timeout: 30000,
      ...config
    };

    console.log('🎯 IntelligentRouter initialisiert:', this.config);
  }

  /**
   * Registriert einen neuen Provider
   */
  registerProvider(provider: AIProvider): void {
    const entry: ProviderRegistryEntry = {
      provider,
      config: {
        name: provider.name,
        priority: provider.priority,
        enabled: true,
        capabilities: provider.capabilities
      },
      status: {
        available: false,
        healthy: false,
        lastCheck: new Date().toISOString()
      }
    };

    this.providers.set(provider.name, entry);
    console.log(`✅ Provider registriert: ${provider.name} (Priority: ${provider.priority})`);
  }

  /**
   * Wählt den besten verfügbaren Provider aus
   */
  async selectProvider(request: AIRequest): Promise<AIProvider> {
    console.log(`🔍 Wähle Provider aus (Strategie: ${this.config.strategy})...`);

    const availableProviders = await this.getAvailableProviders();

    if (availableProviders.length === 0) {
      throw new AIBridgeError(
        AIErrorType.PROVIDER_UNAVAILABLE,
        'Kein Provider verfügbar. Bitte API-Key konfigurieren oder Bridge aktivieren.'
      );
    }

    let selectedProvider: AIProvider;

    switch (this.config.strategy) {
      case RoutingStrategy.FASTEST:
        selectedProvider = await this.selectFastest(availableProviders);
        break;

      case RoutingStrategy.CHEAPEST:
        selectedProvider = this.selectCheapest(availableProviders);
        break;

      case RoutingStrategy.MOST_RELIABLE:
        selectedProvider = this.selectMostReliable(availableProviders);
        break;

      case RoutingStrategy.ROUND_ROBIN:
        selectedProvider = this.selectRoundRobin(availableProviders);
        break;

      case RoutingStrategy.PRIORITY:
      default:
        selectedProvider = this.selectByPriority(availableProviders);
        break;
    }

    console.log(`✅ Provider ausgewählt: ${selectedProvider.name}`);
    return selectedProvider;
  }

  /**
   * Führt Request mit automatischem Fallback aus
   */
  async executeWithFallback(request: AIRequest): Promise<AIResponse> {
    const availableProviders = await this.getAvailableProviders();

    if (availableProviders.length === 0) {
      return {
        success: false,
        content: '',
        provider: 'none',
        timestamp: new Date().toISOString(),
        error: 'Kein Provider verfügbar'
      };
    }

    let lastError: Error | null = null;

    // Versuche Provider in Reihenfolge
    for (const provider of availableProviders) {
      try {
        console.log(`🚀 Versuche ${provider.name}...`);
        const response = await provider.execute(request);

        if (response.success) {
          console.log(`✅ Erfolgreich mit ${provider.name}`);
          return response;
        }

        lastError = new Error(response.error || 'Unknown error');

      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ ${provider.name} fehlgeschlagen:`, error);

        if (!this.config.enableFallback) {
          throw error;
        }

        // Nächster Provider wird versucht
        continue;
      }
    }

    // Alle Provider fehlgeschlagen
    return {
      success: false,
      content: '',
      provider: 'all_failed',
      timestamp: new Date().toISOString(),
      error: lastError?.message || 'Alle Provider fehlgeschlagen'
    };
  }

  /**
   * Gibt alle verfügbaren Provider zurück (sortiert nach Strategie)
   */
  private async getAvailableProviders(): Promise<AIProvider[]> {
    const entries = Array.from(this.providers.values());
    const available: AIProvider[] = [];

    // Parallel availability check für bessere Performance
    await Promise.all(
      entries.map(async (entry) => {
        if (!entry.config.enabled) {
          return;
        }

        try {
          const isAvailable = await entry.provider.isAvailable();
          if (isAvailable) {
            available.push(entry.provider);
          }
        } catch (error) {
          console.warn(`⚠️ ${entry.provider.name} availability check failed:`, error);
        }
      })
    );

    // Sortiere nach Priorität (höher = besser)
    return available.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Strategie: Nach Priorität (Standard)
   */
  private selectByPriority(providers: AIProvider[]): AIProvider {
    return providers[0]; // Bereits sortiert
  }

  /**
   * Strategie: Schnellster Provider (nach letztem Health-Check)
   */
  private async selectFastest(providers: AIProvider[]): Promise<AIProvider> {
    const withLatency = await Promise.all(
      providers.map(async (provider) => {
        const status = await provider.healthCheck();
        return { provider, latency: status.latency || Infinity };
      })
    );

    withLatency.sort((a, b) => a.latency - b.latency);
    return withLatency[0].provider;
  }

  /**
   * Strategie: Günstigster Provider
   */
  private selectCheapest(providers: AIProvider[]): AIProvider {
    return providers.sort(
      (a, b) => a.capabilities.costPerToken - b.capabilities.costPerToken
    )[0];
  }

  /**
   * Strategie: Zuverlässigster Provider
   */
  private selectMostReliable(providers: AIProvider[]): AIProvider {
    const entries = providers.map(p => this.providers.get(p.name)!);

    // Bevorzuge Provider mit niedriger Error-Rate
    entries.sort((a, b) => {
      const aError = a.status.errorRate || 0;
      const bError = b.status.errorRate || 0;
      return aError - bError;
    });

    return entries[0].provider;
  }

  /**
   * Strategie: Round-Robin (gleichmäßige Verteilung)
   */
  private selectRoundRobin(providers: AIProvider[]): AIProvider {
    const provider = providers[this.roundRobinIndex % providers.length];
    this.roundRobinIndex++;
    return provider;
  }

  /**
   * Gibt Statistiken über alle Provider zurück
   */
  getStatistics() {
    const stats = Array.from(this.providers.values()).map(entry => ({
      name: entry.provider.name,
      priority: entry.provider.priority,
      enabled: entry.config.enabled,
      available: entry.status.available,
      healthy: entry.status.healthy,
      latency: entry.status.latency,
      errorRate: entry.status.errorRate
    }));

    return {
      totalProviders: this.providers.size,
      enabledProviders: stats.filter(s => s.enabled).length,
      availableProviders: stats.filter(s => s.available).length,
      healthyProviders: stats.filter(s => s.healthy).length,
      providers: stats
    };
  }

  /**
   * Setzt Routing-Strategie
   */
  setStrategy(strategy: RoutingStrategy): void {
    this.config.strategy = strategy;
    console.log(`🎯 Routing-Strategie geändert: ${strategy}`);
  }

  /**
   * Aktiviert/Deaktiviert einen Provider
   */
  toggleProvider(providerName: string, enabled: boolean): void {
    const entry = this.providers.get(providerName);
    if (entry) {
      entry.config.enabled = enabled;
      console.log(`${enabled ? '✅' : '❌'} ${providerName} ${enabled ? 'aktiviert' : 'deaktiviert'}`);
    }
  }
}
