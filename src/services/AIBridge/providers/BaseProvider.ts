// 🎯 Base Provider - Gemeinsame Funktionalität für alle Provider

import {
  AIProvider,
  AIRequest,
  AIResponse,
  ProviderConfig,
  ProviderStatus,
  ProviderCapabilities,
  AIBridgeError,
  AIErrorType
} from '../types';

/**
 * Abstrakte Basis-Klasse für alle Provider
 * Implementiert gemeinsame Funktionalität
 */
export abstract class BaseProvider implements AIProvider {
  protected config: ProviderConfig;
  protected lastStatus: ProviderStatus;

  constructor(
    public readonly name: string,
    public readonly priority: number,
    public readonly capabilities: ProviderCapabilities
  ) {
    this.config = {
      name,
      priority,
      enabled: true,
      capabilities
    };

    this.lastStatus = {
      available: false,
      healthy: false,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Konfiguriert den Provider
   */
  configure(config: Partial<ProviderConfig>): void {
    this.config = { ...this.config, ...config };
    console.log(`🔧 ${this.name} konfiguriert:`, this.config);
  }

  /**
   * Prüft Verfügbarkeit (muss von Subclass implementiert werden)
   */
  abstract isAvailable(): Promise<boolean>;

  /**
   * Führt Request aus (muss von Subclass implementiert werden)
   */
  abstract execute(request: AIRequest): Promise<AIResponse>;

  /**
   * Health-Check mit Caching
   */
  async healthCheck(): Promise<ProviderStatus> {
    const startTime = Date.now();

    try {
      const available = await this.isAvailable();
      const latency = Date.now() - startTime;

      this.lastStatus = {
        available,
        healthy: available && latency < 5000,
        latency,
        lastCheck: new Date().toISOString()
      };

      return this.lastStatus;
    } catch (error) {
      this.lastStatus = {
        available: false,
        healthy: false,
        latency: Date.now() - startTime,
        lastCheck: new Date().toISOString()
      };

      return this.lastStatus;
    }
  }

  /**
   * Hilfsmethode: Erstelle standardisierte Error-Response
   */
  protected createErrorResponse(
    error: Error | AIBridgeError,
    type: AIErrorType = AIErrorType.API_ERROR
  ): AIResponse {
    console.error(`❌ ${this.name} Error:`, error);

    return {
      success: false,
      content: '',
      provider: this.name,
      timestamp: new Date().toISOString(),
      error: error.message
    };
  }

  /**
   * Hilfsmethode: Erstelle standardisierte Success-Response
   */
  protected createSuccessResponse(
    content: string,
    metadata?: {
      model?: string;
      tokens?: number;
      cost?: number;
      [key: string]: any;
    }
  ): AIResponse {
    return {
      success: true,
      content,
      provider: this.name,
      timestamp: new Date().toISOString(),
      ...metadata
    };
  }

  /**
   * Hilfsmethode: Timeout-Wrapper für Requests
   */
  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 30000,
    errorMessage: string = 'Request timeout'
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(
          new AIBridgeError(
            AIErrorType.TIMEOUT,
            errorMessage,
            this.name
          )
        );
      }, timeoutMs);
    });

    return Promise.race([promise, timeout]);
  }

  /**
   * Hilfsmethode: Retry-Logik mit exponential backoff
   */
  protected async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt);
          console.warn(
            `⚠️ ${this.name} Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
          );
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new AIBridgeError(
      AIErrorType.API_ERROR,
      `Failed after ${maxRetries} attempts: ${lastError!.message}`,
      this.name,
      lastError!
    );
  }

  /**
   * Hilfsmethode: Validiere Request
   */
  protected validateRequest(request: AIRequest): void {
    if (!request.prompt || request.prompt.trim().length === 0) {
      throw new AIBridgeError(
        AIErrorType.INVALID_REQUEST,
        'Prompt is required and cannot be empty',
        this.name
      );
    }

    if (request.maxTokens && request.maxTokens > this.capabilities.maxTokens) {
      console.warn(
        `⚠️ Requested ${request.maxTokens} tokens exceeds max ${this.capabilities.maxTokens}, capping...`
      );
      request.maxTokens = this.capabilities.maxTokens;
    }
  }

  /**
   * Getter für enabled Status
   */
  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Getter für API-Key (falls vorhanden)
   */
  protected get apiKey(): string | undefined {
    return this.config.apiKey;
  }
}
