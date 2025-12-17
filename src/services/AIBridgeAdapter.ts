// 🎯 AI Bridge Adapter - Backwards Compatibility Layer
// Mappt alte APIService Calls auf neue UniversalAIBridge

import UniversalAIBridge, { AIRequest, AIResponse as BridgeResponse } from './AIBridge';
import { APIResponse, APIMessage } from './APIService';

/**
 * Adapter der alte APIService.callAPI() Calls auf neue UniversalAIBridge mappt
 * Ermöglicht schrittweise Migration ohne alle Callsites ändern zu müssen
 */
export class AIBridgeAdapter {
  private static bridge = UniversalAIBridge.getInstance();
  private static currentConfig: {
    provider?: string;
    apiKey?: string;
    model?: string;
  } = {};

  /**
   * Konfiguriert die Bridge basierend auf Provider-Settings
   */
  static configure(provider: string, apiKey: string, model: string): void {
    this.currentConfig = { provider, apiKey, model };

    // Bestimme welcher Provider basierend auf 'provider' Parameter
    if (provider === 'anthropic') {
      this.bridge.configure({
        anthropic: {
          apiKey,
          model,
          enabled: true
        },
        openai: {
          enabled: false
        },
        bridge: {
          enabled: true // Als Fallback
        }
      });
    } else if (provider === 'openai') {
      this.bridge.configure({
        anthropic: {
          enabled: false
        },
        openai: {
          apiKey,
          model,
          enabled: true
        },
        bridge: {
          enabled: true // Als Fallback
        }
      });
    } else if (provider === 'bridge') {
      // Nur Bridge, keine API-Keys
      this.bridge.configure({
        anthropic: {
          enabled: false
        },
        openai: {
          enabled: false
        },
        bridge: {
          enabled: true
        }
      });
    }
  }

  /**
   * Kompatibilitäts-Wrapper für APIService.callAPI() mit Retry-Logik
   *
   * @param provider - 'anthropic', 'openai', oder 'bridge'
   * @param model - Model name
   * @param apiKey - API Key
   * @param messages - Array of messages
   * @param maxTokens - Max tokens to generate
   * @returns APIResponse im alten Format
   */
  static async callAPI(
    provider: string,
    model: string,
    apiKey: string,
    messages: APIMessage[],
    maxTokens: number = 4096
  ): Promise<APIResponse> {
    // Konfiguriere Bridge wenn sich Settings geändert haben
    if (
      this.currentConfig.provider !== provider ||
      this.currentConfig.apiKey !== apiKey ||
      this.currentConfig.model !== model
    ) {
      this.configure(provider, apiKey, model);
    }

    // ✨ Retry-Logik mit Exponential Backoff
    return await this.callAPIWithRetry(messages, maxTokens);
  }

  /**
   * 🔄 Retry-Logik mit Exponential Backoff
   * Retries transiente Fehler (502, 503, 504, 429) automatisch
   */
  private static async callAPIWithRetry(
    messages: APIMessage[],
    maxTokens: number,
    retryCount: number = 0
  ): Promise<APIResponse> {
    const MAX_RETRIES = 5;
    const BASE_DELAY = 1000; // 1 Sekunde

    try {
      // Konvertiere Messages zu Request
      const request = this.convertMessagesToRequest(messages, maxTokens);

      // Rufe Bridge auf
      const bridgeResponse = await this.bridge.generate(request);

      // Konvertiere Response zurück zum alten Format
      return this.convertResponseToLegacy(bridgeResponse);

    } catch (error: any) {
      const errorMessage = error.message || String(error);
      const isTransientError = this.isTransientError(errorMessage, error);

      // Log Error
      console.error(`❌ API Error (Attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, errorMessage);

      // Prüfe ob Retry möglich ist
      if (isTransientError && retryCount < MAX_RETRIES) {
        // Berechne Delay mit Exponential Backoff: 1s, 2s, 4s, 8s, 16s
        const delay = BASE_DELAY * Math.pow(2, retryCount);

        console.log(`🔄 Retrying in ${delay}ms... (${MAX_RETRIES - retryCount} attempts remaining)`);

        // Warte mit Exponential Backoff
        await new Promise(resolve => setTimeout(resolve, delay));

        // Rekursiver Retry
        return await this.callAPIWithRetry(messages, maxTokens, retryCount + 1);
      }

      // Permanenter Fehler oder Max Retries erreicht
      if (retryCount >= MAX_RETRIES) {
        console.error(`❌ Max retries (${MAX_RETRIES}) erreicht. Gebe auf.`);
      }

      return {
        success: false,
        content: '',
        error: errorMessage
      };
    }
  }

  /**
   * Prüft ob ein Fehler transient (retry-bar) ist
   */
  private static isTransientError(errorMessage: string, error: any): boolean {
    const message = errorMessage.toLowerCase();

    // HTTP Status Codes (transient errors)
    const transientStatusCodes = [429, 500, 502, 503, 504, 529];
    // 529 = Anthropic Overloaded Error
    if (transientStatusCodes.some(code => message.includes(String(code)))) {
      return true;
    }

    // Overloaded / Capacity Errors (Anthropic specific)
    if (message.includes("overloaded") || message.includes("overload") || message.includes("capacity")) {
      return true;
    }

    // Cloudflare Errors
    if (message.includes('cloudflare') || message.includes('bad gateway')) {
      return true;
    }

    // Network Errors
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('fetch failed')
    ) {
      return true;
    }

    // Rate Limit
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    // Permanente Fehler (NICHT retry-bar)
    const permanentErrors = ['401', '403', '400', 'invalid api key', 'unauthorized', 'forbidden'];
    if (permanentErrors.some(err => message.includes(err))) {
      return false;
    }

    // Default: Bei Unsicherheit nicht retries (sicherer)
    return false;
  }

  /**
   * Konvertiert Messages-Array zu AIRequest
   */
  private static convertMessagesToRequest(
    messages: APIMessage[],
    maxTokens: number
  ): AIRequest {
    // Extrahiere System-Prompt
    const systemMessage = messages.find(m => m.role === 'system');

    // Extrahiere User-Prompts (kombiniere alle user messages)
    const userMessages = messages.filter(m => m.role === 'user');
    const prompt = userMessages.map(m => m.content).join('\n\n');

    return {
      prompt,
      systemPrompt: systemMessage?.content,
      maxTokens,
      temperature: 0.7,
      streaming: false
    };
  }

  /**
   * Konvertiert BridgeResponse zu Legacy APIResponse
   */
  private static convertResponseToLegacy(response: BridgeResponse): APIResponse {
    return {
      success: response.success,
      content: response.content,
      error: response.error,
      cost: response.cost,
      tokens: response.tokens
    };
  }

  /**
   * Prüft welche Provider verfügbar sind
   */
  static async checkAvailability() {
    return await this.bridge.checkAvailability();
  }

  /**
   * Gibt Statistiken zurück
   */
  static getStatistics() {
    return this.bridge.getStatistics();
  }
}

export default AIBridgeAdapter;
