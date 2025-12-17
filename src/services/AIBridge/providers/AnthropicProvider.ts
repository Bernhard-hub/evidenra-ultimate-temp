// 🎯 Anthropic Provider - Direct API Integration

import { BaseProvider } from './BaseProvider';
import { AIRequest, AIResponse, AIErrorType, AIBridgeError } from '../types';

/**
 * Anthropic Claude Provider
 * Nutzt direkte API-Kommunikation mit Anthropic
 */
export class AnthropicProvider extends BaseProvider {
  private static readonly API_ENDPOINT = 'https://api.anthropic.com/v1/messages';
  private static readonly API_VERSION = '2023-06-01';

  // Token-Kosten (USD per 1M tokens)
  private static readonly TOKEN_COSTS: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }
  };

  constructor() {
    super(
      'anthropic',
      100, // Höchste Priorität (Direct API ist am schnellsten)
      {
        streaming: true,
        vision: true,
        functionCalling: false,
        maxTokens: 8192,
        costPerToken: 0.003 // Average cost
      }
    );
  }

  /**
   * Prüft ob API-Key verfügbar ist
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    // API-Key muss gesetzt sein
    if (!this.apiKey || this.apiKey.trim().length === 0) {
      console.log('❌ Anthropic: Kein API-Key konfiguriert');
      return false;
    }

    // Validiere API-Key Format
    if (!this.apiKey.startsWith('sk-ant-')) {
      console.warn('⚠️ Anthropic: API-Key Format ungültig (sollte mit sk-ant- beginnen)');
      return false;
    }

    console.log('✅ Anthropic: API-Key gefunden');
    return true;
  }

  /**
   * Führt Anthropic API Request aus
   */
  async execute(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    if (!this.apiKey) {
      return this.createErrorResponse(
        new AIBridgeError(
          AIErrorType.PROVIDER_UNAVAILABLE,
          'API-Key nicht konfiguriert',
          this.name
        )
      );
    }

    try {
      const model = this.config.model || 'claude-sonnet-4-5'; // BASIC-kompatibles Model-Name (funktioniert mit Standard API-Keys)

      // Baue Request Body
      const requestBody: any = {
        model,
        max_tokens: request.maxTokens || 4096,
        messages: [
          {
            role: 'user',
            content: request.prompt
          }
        ]
      };

      // System-Prompt hinzufügen wenn vorhanden
      if (request.systemPrompt) {
        requestBody.system = request.systemPrompt;
      }

      // Temperature hinzufügen
      if (request.temperature !== undefined) {
        requestBody.temperature = request.temperature;
      }

      console.log(`🚀 Anthropic API Call (Model: ${model})`);

      const response = await this.withTimeout(
        fetch(AnthropicProvider.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.apiKey,
            'anthropic-version': AnthropicProvider.API_VERSION
          },
          body: JSON.stringify(requestBody)
        }),
        90000, // Erhöht von 30s auf 90s für größere Anfragen
        'Anthropic API timeout (90s)'
      );

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || `API Error ${response.status}`;

        // Rate Limit Detection
        if (response.status === 429) {
          throw new AIBridgeError(
            AIErrorType.RATE_LIMIT,
            'Rate limit erreicht. Bitte kurz warten.',
            this.name
          );
        }

        // Model Not Found (404) - Spezifische Hilfe
        if (response.status === 404 && errorMessage.includes('model')) {
          throw new AIBridgeError(
            AIErrorType.API_ERROR,
            `❌ Modell "${model}" nicht gefunden!\n\n` +
            `💡 LÖSUNGEN:\n` +
            `1. API Key prüfen: console.anthropic.com\n` +
            `2. Modell-Zugriff prüfen (Tier/Subscription)\n` +
            `3. Alternative: Browser Extension nutzen\n\n` +
            `➡️ Öffne claude.ai im Browser und aktiviere die Extension`,
            this.name
          );
        }

        throw new AIBridgeError(
          AIErrorType.API_ERROR,
          errorMessage,
          this.name
        );
      }

      const data = await response.json();

      // Extrahiere Content
      const content = data.content[0]?.text || '';

      // Berechne Kosten
      const inputTokens = data.usage?.input_tokens || 0;
      const outputTokens = data.usage?.output_tokens || 0;
      const costs = AnthropicProvider.TOKEN_COSTS[model] || { input: 3.00, output: 15.00 };
      const totalCost = (inputTokens * costs.input + outputTokens * costs.output) / 1000000;

      console.log(`✅ Anthropic Response erhalten (${inputTokens + outputTokens} tokens, $${totalCost.toFixed(4)})`);

      return this.createSuccessResponse(content, {
        model,
        tokens: inputTokens + outputTokens,
        cost: totalCost,
        metadata: {
          inputTokens,
          outputTokens
        }
      });

    } catch (error) {
      if (error instanceof AIBridgeError) {
        return this.createErrorResponse(error, error.type);
      }

      return this.createErrorResponse(
        error as Error,
        AIErrorType.NETWORK_ERROR
      );
    }
  }
}
