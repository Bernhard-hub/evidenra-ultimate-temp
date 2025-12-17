// 🎯 Claude Bridge Provider - Browser Extension Fallback

import { BaseProvider } from './BaseProvider';
import { AIRequest, AIResponse, AIErrorType, AIBridgeError } from '../types';

/**
 * Claude Bridge Provider
 * Nutzt Browser Extension als Fallback wenn kein API-Key vorhanden
 */
export class ClaudeBridgeProvider extends BaseProvider {
  constructor() {
    super(
      'claude-bridge',
      10, // Niedrigste Priorität (nur als Fallback)
      {
        streaming: false,
        vision: false,
        functionCalling: false,
        maxTokens: 8192,
        costPerToken: 0 // Nutzt User's Claude Subscription
      }
    );
  }

  /**
   * Prüft ob Bridge verfügbar und verbunden ist
   */
  async isAvailable(): Promise<boolean> {
    if (!this.isEnabled) {
      return false;
    }

    try {
      // Prüfe ob Electron API verfügbar ist
      if (typeof window === 'undefined') {
        return false;
      }

      const electronAPI = (window as any).electronAPI;
      if (!electronAPI?.bridgeIsConnected) {
        console.log('❌ Bridge: Electron API nicht verfügbar');
        return false;
      }

      // Prüfe ob Bridge verbunden ist
      const connected = await electronAPI.bridgeIsConnected();
      if (!connected) {
        console.log('❌ Bridge: Nicht verbunden (Extension nicht aktiv)');
        return false;
      }

      console.log('✅ Bridge: Verbindung aktiv');
      return true;

    } catch (error) {
      console.warn('⚠️ Bridge availability check failed:', error);
      return false;
    }
  }

  /**
   * Führt Request via Bridge aus
   */
  async execute(request: AIRequest): Promise<AIResponse> {
    this.validateRequest(request);

    try {
      const electronAPI = (window as any).electronAPI;

      if (!electronAPI?.bridgeGenerateReport) {
        throw new AIBridgeError(
          AIErrorType.PROVIDER_UNAVAILABLE,
          'Bridge API nicht verfügbar',
          this.name
        );
      }

      // Konvertiere zu Bridge-Format
      let prompt = '';

      if (request.systemPrompt) {
        prompt += `${request.systemPrompt}\n\n`;
      }

      prompt += request.prompt;

      if (request.context) {
        prompt += `\n\nContext: ${request.context}`;
      }

      const projectData = {
        prompt: prompt.trim(),
        context: request.metadata || {}
      };

      console.log('🔌 Bridge: Sende Request via Extension...');
      console.log('📏 Prompt Length:', prompt.length);
      console.log('📝 Prompt Preview:', prompt.substring(0, 200));

      const bridgeResponse = await this.withTimeout(
        electronAPI.bridgeGenerateReport(projectData, 'ai-generation'),
        900000, // 15 Minuten Timeout (für längere KI-Generierungen wie Dynamic Coding)
        'Bridge timeout - keine Response nach 15 Minuten'
      );

      // Bridge gibt ein Objekt zurück: { success: boolean, content?: string, error?: string }
      console.log('🔍 Bridge Response Type:', typeof bridgeResponse);
      console.log('🔍 Bridge Response Success:', bridgeResponse?.success);
      console.log('📏 Bridge Response Content Length:', bridgeResponse?.content?.length || 0);
      console.log('📝 Bridge Response Content Preview:', bridgeResponse?.content?.substring(0, 300) || 'N/A');

      if (!bridgeResponse || typeof bridgeResponse !== 'object') {
        throw new AIBridgeError(
          AIErrorType.API_ERROR,
          `Bridge gab keine gültige Response zurück (Type: ${typeof bridgeResponse}, Value: ${JSON.stringify(bridgeResponse)})`,
          this.name
        );
      }

      if (!bridgeResponse.success) {
        throw new AIBridgeError(
          AIErrorType.API_ERROR,
          bridgeResponse.error || 'Bridge API Fehler',
          this.name
        );
      }

      const responseContent = bridgeResponse.content || '';

      if (!responseContent) {
        throw new AIBridgeError(
          AIErrorType.API_ERROR,
          'Bridge Response enthält keinen Content',
          this.name
        );
      }

      // Schätze Token-Count
      const estimatedTokens = Math.ceil(responseContent.split(/\s+/).length * 1.3);

      console.log(`✅ Bridge Response erhalten (${estimatedTokens} tokens geschätzt)`);

      return this.createSuccessResponse(responseContent, {
        model: 'claude-via-browser',
        tokens: estimatedTokens,
        cost: 0, // Bridge nutzt User's Subscription
        metadata: {
          method: 'browser-extension'
        }
      });

    } catch (error) {
      if (error instanceof AIBridgeError) {
        return this.createErrorResponse(error, error.type);
      }

      // Spezielle Fehlerbehandlung für Bridge
      const errorMessage = (error as Error).message;

      if (errorMessage.includes('nicht verbunden') || errorMessage.includes('not connected')) {
        return this.createErrorResponse(
          new AIBridgeError(
            AIErrorType.PROVIDER_UNAVAILABLE,
            'Browser Extension nicht verbunden. Bitte claude.ai öffnen und Extension aktivieren.',
            this.name
          )
        );
      }

      return this.createErrorResponse(
        error as Error,
        AIErrorType.API_ERROR
      );
    }
  }
}
