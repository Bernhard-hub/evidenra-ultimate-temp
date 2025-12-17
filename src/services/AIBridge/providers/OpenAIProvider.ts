// 🎯 OpenAI Provider - Direct API Integration

import { BaseProvider } from './BaseProvider';
import { AIRequest, AIResponse, AIErrorType, AIBridgeError } from '../types';

/**
 * OpenAI GPT Provider
 * Nutzt direkte API-Kommunikation mit OpenAI
 */
export class OpenAIProvider extends BaseProvider {
  private static readonly API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';

  // Token-Kosten (USD per 1M tokens - averaged input/output)
  private static readonly TOKEN_COSTS: Record<string, number> = {
    'gpt-4o': 0.005,
    'gpt-4-turbo': 0.01,
    'gpt-4': 0.03,
    'gpt-3.5-turbo': 0.001,
    'gpt-4o-mini': 0.0001
  };

  constructor() {
    super(
      'openai',
      90, // Hohe Priorität (nach Anthropic)
      {
        streaming: true,
        vision: true,
        functionCalling: true,
        maxTokens: 4096,
        costPerToken: 0.005
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
      console.log('❌ OpenAI: Kein API-Key konfiguriert');
      return false;
    }

    // Validiere API-Key Format
    if (!this.apiKey.startsWith('sk-')) {
      console.warn('⚠️ OpenAI: API-Key Format ungültig (sollte mit sk- beginnen)');
      return false;
    }

    console.log('✅ OpenAI: API-Key gefunden');
    return true;
  }

  /**
   * Führt OpenAI API Request aus
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
      const model = this.config.model || 'gpt-4o';

      // Baue Messages Array
      const messages: any[] = [];

      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt
        });
      }

      messages.push({
        role: 'user',
        content: request.prompt
      });

      const requestBody: any = {
        model,
        messages,
        max_tokens: request.maxTokens || 4096
      };

      // Temperature hinzufügen
      if (request.temperature !== undefined) {
        requestBody.temperature = request.temperature;
      }

      console.log(`🚀 OpenAI API Call (Model: ${model})`);

      const response = await this.withTimeout(
        fetch(OpenAIProvider.API_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify(requestBody)
        }),
        30000,
        'OpenAI API timeout'
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

        throw new AIBridgeError(
          AIErrorType.API_ERROR,
          errorMessage,
          this.name
        );
      }

      const data = await response.json();

      // Extrahiere Content
      const content = data.choices[0]?.message?.content || '';

      // Berechne Kosten
      const totalTokens = data.usage?.total_tokens || 0;
      const costPerToken = OpenAIProvider.TOKEN_COSTS[model] || 0.005;
      const totalCost = (totalTokens * costPerToken) / 1000;

      console.log(`✅ OpenAI Response erhalten (${totalTokens} tokens, $${totalCost.toFixed(4)})`);

      return this.createSuccessResponse(content, {
        model,
        tokens: totalTokens,
        cost: totalCost,
        metadata: {
          promptTokens: data.usage?.prompt_tokens,
          completionTokens: data.usage?.completion_tokens
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
