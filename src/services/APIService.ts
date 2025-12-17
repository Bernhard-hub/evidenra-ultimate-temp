// src/services/APIService.ts

import AIBridgeAdapter from './AIBridgeAdapter';

export interface APIResponse {
  success: boolean;
  content: string;
  error?: string;
  cost?: number;
  tokens?: number;
}

export interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

class APIService {
  // 🎯 NEW: Enable Universal AI Bridge (with intelligent fallback)
  private static USE_UNIVERSAL_BRIDGE = true;

  // Cache für verfügbare Modelle
  private static modelCache: Map<string, { models: any[], lastUpdated: number }> = new Map();
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden

  // Automatische Modell-Mappings (werden dynamisch aktualisiert)
  private static modelMappings: Record<string, string> = {
    // Fallback-Mappings für veraltete Modelle
    'claude-3-7-sonnet': 'claude-sonnet-4-5', // 3.7 existiert nicht -> 4.5
    'claude-3-5-sonnet-20240620': 'claude-3-5-sonnet-20241022', // June 2024 -> Oct 2024
    'claude-3-5-haiku-20241022': 'claude-3-5-haiku-20241022', // Oct 2024 Haiku -> Auto-Update
    'claude-3-sonnet-20240229': 'claude-sonnet-4-5',
    'claude-3-opus-20240229': 'claude-sonnet-4-5', // Opus ist veraltet -> Sonnet 4.5
    'claude-3-haiku-20240307': 'claude-haiku-4-5', // Altes Haiku -> Neues Haiku
    'claude-2.1': 'claude-sonnet-4-5',
    'claude-2': 'claude-sonnet-4-5',
    'gpt-4-turbo-preview': 'gpt-4-turbo',
    'gpt-4-1106-preview': 'gpt-4-turbo'
  };

  // Basis-Token-Kosten (werden dynamisch aktualisiert)
  private static tokenCosts: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5': { input: 3.00, output: 15.00 },
    'claude-haiku-4-5': { input: 0.25, output: 1.25 },
    'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
    'claude-3-5-haiku-20241022': { input: 0.25, output: 1.25 },
    'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
    'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
    'gpt-4-turbo': { input: 10.00, output: 30.00 },
    'gpt-4': { input: 30.00, output: 60.00 },
    'gpt-3.5-turbo': { input: 0.50, output: 1.50 }
  };

  /**
   * Lädt verfügbare Modelle dynamisch von der API
   */
  static async fetchAvailableModels(provider: string, apiKey: string, forceRefresh: boolean = false): Promise<any[]> {
    try {
      const cacheKey = `${provider}_${apiKey.slice(-8)}`;
      const cached = this.modelCache.get(cacheKey);

      // Cache prüfen (außer bei forceRefresh)
      if (!forceRefresh && cached && (Date.now() - cached.lastUpdated) < this.CACHE_DURATION) {
        return cached.models;
      }

      let models: any[] = [];

      if (provider === 'anthropic') {
        models = await this.fetchAnthropicModels(apiKey);
      } else if (provider === 'openai') {
        models = await this.fetchOpenAIModels(apiKey);
      } else if (provider === 'groq') {
        models = await this.fetchGroqModels(apiKey);
      } else if (provider === 'ollama') {
        models = await this.fetchOllamaModels();
      } else if (provider === 'lmstudio') {
        models = await this.fetchLMStudioModels();
      } else {
        // Fallback auf statische Liste
        models = this.getStaticModels(provider);
      }

      // Cache aktualisieren
      this.modelCache.set(cacheKey, {
        models,
        lastUpdated: Date.now()
      });

      return models;
    } catch (error) {
      console.warn('Fehler beim Laden der Modelle, verwende statische Liste:', error);
      return this.getStaticModels(provider);
    }
  }

  /**
   * Lädt Anthropic-Modelle (kuratierte Liste)
   *
   * WICHTIG: Anthropic hat keinen öffentlichen /models Endpoint!
   * Diese Liste wird manuell aktualisiert, wenn Anthropic neue Modelle released.
   *
   * Letzte Aktualisierung: Januar 2025
   */
  private static async fetchAnthropicModels(apiKey: string): Promise<any[]> {
    // Kuratierte Liste der verfügbaren Anthropic-Modelle
    // (Stand: Januar 2025)
    // ⚠️ BASIC-kompatible Model-Namen ZUERST (diese funktionieren mit Standard API-Keys!)
    const knownModels = [
      {
        id: 'claude-sonnet-4-5',
        name: 'Claude Sonnet 4.5 - RECOMMENDED (BASIC Compatible)',
        maxTokens: 8192,
        cost: 0.003
      },
      {
        id: 'claude-haiku-4-5',
        name: 'Claude Haiku 4.5 - Fast & Cheap (BASIC Compatible)',
        maxTokens: 8192,
        cost: 0.001
      },
      {
        id: 'claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet (Oct 2024)',
        maxTokens: 8192,
        cost: 0.003
      },
      {
        id: 'claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku (Oct 2024) - Fast & Cheap',
        maxTokens: 8192,
        cost: 0.001
      },
      {
        id: 'claude-3-opus-20240229',
        name: 'Claude 3 Opus (Legacy)',
        maxTokens: 4096,
        cost: 0.015
      }
    ];

    console.log('📋 Anthropic models loaded from curated list (no API test needed)');
    return knownModels;
  }

  /**
   * Lädt OpenAI-Modelle dynamisch
   */
  private static async fetchOpenAIModels(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Filtere nur Chat-Modelle und füge Metadaten hinzu
      const chatModels = data.data
        .filter((model: any) =>
          model.id.includes('gpt-4') ||
          model.id.includes('gpt-3.5-turbo') ||
          model.id.includes('gpt-4o')
        )
        .map((model: any) => ({
          id: model.id,
          name: this.formatModelName(model.id),
          maxTokens: this.getModelMaxTokens(model.id),
          cost: this.getModelCost(model.id)
        }))
        .sort((a: any, b: any) => b.cost - a.cost); // Sortiere nach Kosten (teuer zuerst)

      return chatModels;
    } catch (error) {
      console.warn('OpenAI Models API fehler:', error);
      return this.getStaticModels('openai');
    }
  }

  /**
   * Lädt Groq-Modelle dynamisch
   */
  private static async fetchGroqModels(apiKey: string): Promise<any[]> {
    try {
      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Groq Models mit Metadaten
      const groqModels = data.data
        .map((model: any) => ({
          id: model.id,
          name: this.formatGroqModelName(model.id),
          maxTokens: this.getGroqModelMaxTokens(model.id),
          cost: 0 // Groq ist aktuell kostenlos
        }))
        .sort((a: any, b: any) => {
          // Sortiere nach: llama3.3 > llama3.1 > mixtral > andere
          const order = ['llama-3.3', 'llama-3.1', 'llama3-', 'mixtral'];
          const aIndex = order.findIndex(o => a.id.includes(o));
          const bIndex = order.findIndex(o => b.id.includes(o));
          return (aIndex === -1 ? 999 : aIndex) - (bIndex === -1 ? 999 : bIndex);
        });

      return groqModels;
    } catch (error) {
      console.warn('Groq Models API fehler:', error);
      return this.getStaticModels('groq');
    }
  }

  /**
   * Lädt LM Studio-Modelle dynamisch (lokal installiert)
   * LM Studio verwendet OpenAI-kompatible API auf localhost:1234
   */
  private static async fetchLMStudioModels(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // LM Studio gibt OpenAI-kompatibles Format zurück
      const lmstudioModels = (data.data || []).map((model: any) => ({
        id: model.id,
        name: this.formatLMStudioModelName(model.id),
        maxTokens: 4096, // Default für lokale Modelle
        cost: 0 // Lokal = kostenlos
      }));

      return lmstudioModels.length > 0 ? lmstudioModels : this.getStaticModels('lmstudio');
    } catch (error) {
      console.warn('LM Studio Models API fehler (ist LM Studio gestartet?):', error);
      return this.getStaticModels('lmstudio');
    }
  }

  /**
   * Formatiert LM Studio-Modellnamen für bessere Lesbarkeit
   */
  private static formatLMStudioModelName(modelId: string): string {
    // LM Studio Modelle haben oft Pfade wie "TheBloke/model-name-GGUF"
    const baseName = modelId.split('/').pop() || modelId;

    // Entferne GGUF und Quantisierungs-Suffixe
    const cleanName = baseName
      .replace(/-GGUF$/i, '')
      .replace(/-Q[0-9]+_[A-Z]+$/i, '')
      .replace(/\.gguf$/i, '');

    return `${cleanName} (LM Studio)`;
  }

  /**
   * Lädt Ollama-Modelle dynamisch (lokal installiert)
   */
  private static async fetchOllamaModels(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      // Ollama gibt installierte Modelle zurück
      const ollamaModels = (data.models || []).map((model: any) => ({
        id: model.name,
        name: this.formatOllamaModelName(model.name),
        maxTokens: 4096, // Default für lokale Modelle
        cost: 0 // Lokal = kostenlos
      }));

      return ollamaModels.length > 0 ? ollamaModels : this.getStaticModels('ollama');
    } catch (error) {
      console.warn('Ollama Models API fehler (ist Ollama gestartet?):', error);
      return this.getStaticModels('ollama');
    }
  }

  /**
   * Testet ob ein Modell verfügbar ist
   */
  private static async testModelAvailability(provider: string, model: string, apiKey: string): Promise<boolean> {
    try {
      const testMessages = [{ role: 'user' as const, content: 'test' }];
      const result = await this.callAPI(provider, model, apiKey, testMessages, 5, true); // skipModelUpdate = true
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Statische Fallback-Modelle
   */
  private static getStaticModels(provider: string): any[] {
    if (provider === 'anthropic') {
      return [
        { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Latest)', maxTokens: 8192, cost: 0.003 },
        { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fast)', maxTokens: 8192, cost: 0.001 },
        { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (DEPRECATED - use Sonnet 3.5)', maxTokens: 4096, cost: 0.015 }
      ];
    } else if (provider === 'openai') {
      return [
        { id: 'gpt-4o', name: 'GPT-4o (Latest)', maxTokens: 4096, cost: 0.005 },
        { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', maxTokens: 4096, cost: 0.01 },
        { id: 'gpt-4', name: 'GPT-4', maxTokens: 8192, cost: 0.03 },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', maxTokens: 4096, cost: 0.001 }
      ];
    } else if (provider === 'lmstudio') {
      return [
        { id: 'local-model', name: 'LM Studio Model (Start LM Studio to detect)', maxTokens: 4096, cost: 0 }
      ];
    }
    return [];
  }

  /**
   * Formatiert Modellnamen für bessere Lesbarkeit
   */
  private static formatModelName(modelId: string): string {
    const names: Record<string, string> = {
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4-turbo-preview': 'GPT-4 Turbo Preview',
      'gpt-4-0125-preview': 'GPT-4 Turbo (Jan 2024)',
      'gpt-4-1106-preview': 'GPT-4 Turbo (Nov 2023)',
      'gpt-4': 'GPT-4',
      'gpt-4-0613': 'GPT-4 (June 2023)',
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-3.5-turbo-0125': 'GPT-3.5 Turbo (Jan 2024)',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini'
    };
    return names[modelId] || modelId;
  }

  /**
   * Ermittelt maximale Token für Modell
   */
  private static getModelMaxTokens(modelId: string): number {
    const tokenLimits: Record<string, number> = {
      'gpt-4-turbo': 4096,
      'gpt-4': 8192,
      'gpt-3.5-turbo': 4096,
      'gpt-4o': 4096,
      'gpt-4o-mini': 16384
    };
    return tokenLimits[modelId] || 4096;
  }

  /**
   * Ermittelt Kosten pro Token für Modell
   */
  private static getModelCost(modelId: string): number {
    const costs: Record<string, number> = {
      'gpt-4-turbo': 0.01,
      'gpt-4': 0.03,
      'gpt-3.5-turbo': 0.001,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.0001
    };
    return costs[modelId] || 0.01;
  }

  /**
   * Formatiert Groq-Modellnamen für bessere Lesbarkeit
   */
  private static formatGroqModelName(modelId: string): string {
    const names: Record<string, string> = {
      'llama-3.3-70b-versatile': 'Llama 3.3 70B Versatile',
      'llama-3.1-70b-versatile': 'Llama 3.1 70B Versatile',
      'llama-3.1-8b-instant': 'Llama 3.1 8B Instant',
      'llama3-70b-8192': 'Llama 3 70B',
      'llama3-8b-8192': 'Llama 3 8B',
      'mixtral-8x7b-32768': 'Mixtral 8x7B',
      'gemma-7b-it': 'Gemma 7B',
      'gemma2-9b-it': 'Gemma 2 9B'
    };
    return names[modelId] || modelId;
  }

  /**
   * Ermittelt maximale Token für Groq-Modell
   */
  private static getGroqModelMaxTokens(modelId: string): number {
    const tokenLimits: Record<string, number> = {
      'llama-3.3-70b-versatile': 8192,
      'llama-3.1-70b-versatile': 8192,
      'llama-3.1-8b-instant': 8192,
      'llama3-70b-8192': 8192,
      'llama3-8b-8192': 8192,
      'mixtral-8x7b-32768': 32768,
      'gemma-7b-it': 8192,
      'gemma2-9b-it': 8192
    };
    return tokenLimits[modelId] || 8192;
  }

  /**
   * Formatiert Ollama-Modellnamen für bessere Lesbarkeit
   */
  private static formatOllamaModelName(modelId: string): string {
    // Ollama-Modelle haben oft Tags wie "llama3.3:latest" - extrahiere den Namen
    const baseName = modelId.split(':')[0];

    const names: Record<string, string> = {
      'llama3.3': 'Llama 3.3',
      'llama3.1': 'Llama 3.1',
      'llama3': 'Llama 3',
      'llama2': 'Llama 2',
      'mistral': 'Mistral',
      'mixtral': 'Mixtral',
      'codellama': 'Code Llama',
      'phi': 'Phi',
      'gemma': 'Gemma',
      'qwen': 'Qwen'
    };

    return names[baseName] || modelId;
  }

  /**
   * Aktualisiert Modell-Mappings für veraltete Modelle
   */
  static updateModelMappings(availableModels: any[]): void {
    const activeModelIds = availableModels.map(m => m.id);
    
    // Überprüfe und aktualisiere Mappings
    for (const [oldModel, currentMapping] of Object.entries(this.modelMappings)) {
      if (!activeModelIds.includes(currentMapping)) {
        // Finde alternatives Modell
        const alternative = this.findBestAlternative(oldModel, availableModels);
        if (alternative) {
          this.modelMappings[oldModel] = alternative.id;
          console.log(`Modell-Mapping aktualisiert: ${oldModel} -> ${alternative.id}`);
        }
      }
    }
  }

  /**
   * Findet beste Alternative für veraltetes Modell
   */
  private static findBestAlternative(oldModel: string, availableModels: any[]): any | null {
    // Intelligente Modell-Zuordnung basierend auf Namen
    if (oldModel.includes('claude')) {
      return availableModels.find(m => m.id.includes('claude-3-5-sonnet')) ||
             availableModels.find(m => m.id.includes('claude-3-opus')) ||
             availableModels.find(m => m.id.includes('claude')) ||
             availableModels[0];
    } else if (oldModel.includes('gpt-4')) {
      return availableModels.find(m => m.id.includes('gpt-4-turbo')) ||
             availableModels.find(m => m.id.includes('gpt-4')) ||
             availableModels[0];
    } else if (oldModel.includes('gpt-3.5')) {
      return availableModels.find(m => m.id.includes('gpt-3.5-turbo')) ||
             availableModels[0];
    }
    
    return availableModels[0] || null;
  }

  /**
   * Bridge API Aufruf (über Browser Extension)
   */
  private static async callBridgeAPI(
    messages: APIMessage[],
    context?: any
  ): Promise<APIResponse> {
    try {
      // Prüfe ob Electron API verfügbar ist
      if (typeof window === 'undefined' || !(window as any).electronAPI?.bridgeGenerateReport) {
        throw new Error('Bridge API nicht verfügbar');
      }

      // Prüfe ob Bridge verbunden ist
      const connected = await (window as any).electronAPI.bridgeIsConnected();
      if (!connected) {
        throw new Error('Browser Extension nicht verbunden. Bitte Claude.ai öffnen und Extension aktivieren.');
      }

      // Konvertiere Messages zu einem einzigen Prompt
      let prompt = '';
      let requiresJsonOutput = false;
      let expectedFormatKey = '';
      let expectedFormatExample = '';

      messages.forEach(msg => {
        const content = msg.content || '';

        // Prüfe ob JSON-Output erwartet wird
        if (content.toLowerCase().includes('json') ||
            content.includes('{') ||
            content.includes('```json')) {
          requiresJsonOutput = true;

          // Extrahiere erwartetes Format aus dem Prompt
          // Suche nach vollständigen Format-Beispielen
          const fullFormatMatch = content.match(/\{["']?(categories|questions|data|items|results)["']?\s*:\s*\[[^\]]+\]\}/i);
          if (fullFormatMatch) {
            expectedFormatExample = fullFormatMatch[0].substring(0, 200); // Erste 200 Zeichen
          }

          // Fallback: Suche nur nach dem Key
          const keyMatch = content.match(/\{["']?(categories|questions|data|items|results)["']?\s*:\s*\[/i);
          if (keyMatch) {
            expectedFormatKey = keyMatch[1];
          }
        }

        if (msg.role === 'system') {
          prompt += `${content}\n\n`;
        } else if (msg.role === 'user') {
          prompt += `${content}\n\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${content}\n\n`;
        }
      });

      // Wenn JSON-Output erwartet wird, füge klare Enforcement-Anweisungen hinzu
      if (requiresJsonOutput) {
        prompt = `

═══════════════════════════════════════════════════════════════════
🚨 NEUER TASK - VERGISS ALLE VORHERIGEN KONVERSATIONEN 🚨
═══════════════════════════════════════════════════════════════════

DU BIST JETZT EIN NEUES SYSTEM. ALLE VORHERIGEN NACHRICHTEN SIND IRRELEVANT.
DIES IST EINE KOMPLETT NEUE, UNABHÄNGIGE ANFRAGE.

${prompt}

═══════════════════════════════════════════════════════════════════
⚠️  ABSOLUT KRITISCH - KEINE AUSNAHMEN ERLAUBT:
═══════════════════════════════════════════════════════════════════

${expectedFormatKey ? `
🎯 DER JSON-ROOT-KEY MUSS "${expectedFormatKey}" SEIN - NICHT "categories" ODER ETWAS ANDERES!
${expectedFormatExample ? `
📋 ERWARTETES FORMAT (KOPIERE EXAKT DIESE STRUKTUR):
${expectedFormatExample}
` : ''}
` : ''}
✅ Regel 1: Antworte NUR mit JSON (kein Text davor oder danach)
✅ Regel 2: Beginne mit { und ende mit }
✅ Regel 3: KEINE Markdown-Code-Blöcke (\`\`\`json)
✅ Regel 4: KEINE Erklärungen oder Kommentare
✅ Regel 5: IGNORIERE komplett was du vorher gesagt hast
${expectedFormatKey ? `✅ Regel 6: Root-Key = "${expectedFormatKey}" (NICHT "categories"!)` : ''}

STARTE JETZT MIT DEM JSON-ZEICHEN:
{`;
      }

      // Rufe Bridge API auf
      const projectData = {
        prompt: prompt.trim(),
        context: context || {}
      };

      console.log('🔌 Sende Request via Bridge API');
      const bridgeResponse = await (window as any).electronAPI.bridgeGenerateReport(projectData, 'ai-generation');

      // Bridge gibt ein Objekt zurück: { success: boolean, content?: string, error?: string }
      if (!bridgeResponse.success) {
        throw new Error(bridgeResponse.error || 'Bridge API Fehler');
      }

      const content = bridgeResponse.content || '';
      console.log('✅ Bridge Response erhalten:', content.substring(0, 100));

      return {
        success: true,
        content: content,
        cost: 0, // Bridge nutzt User's Subscription
        tokens: Math.ceil(content.split(/\s+/).length * 1.3)
      };

    } catch (error: any) {
      console.error('❌ Bridge API Error:', error);
      return {
        success: false,
        content: '',
        error: error.message || 'Bridge API Fehler'
      };
    }
  }

  /**
   * Prüft ob Bridge verfügbar und verbunden ist
   */
  static async isBridgeAvailable(): Promise<boolean> {
    try {
      if (typeof window === 'undefined' || !(window as any).electronAPI?.bridgeIsConnected) {
        return false;
      }
      return await (window as any).electronAPI.bridgeIsConnected();
    } catch (error) {
      return false;
    }
  }

  /**
   * Hauptmethode für API-Aufrufe (mit automatischer Modell-Aktualisierung und Bridge-Support)
   */
  static async callAPI(
    provider: string,
    model: string,
    apiKey: string,
    messages: APIMessage[],
    maxTokens: number = 4096,
    skipModelUpdate: boolean = false,
    context?: any
  ): Promise<APIResponse> {
    try {
      // 🎯 NEW: Use Universal AI Bridge (with intelligent fallback)
      if (this.USE_UNIVERSAL_BRIDGE) {
        console.log('🎯 Using Universal AI Bridge...');
        return await AIBridgeAdapter.callAPI(provider, model, apiKey, messages, maxTokens);
      }

      // 🔌 Bridge Provider - nutzt Browser Extension
      if (provider === 'bridge') {
        return await this.callBridgeAPI(messages, context);
      }

      // Ollama benötigt keine API-Schlüssel
      if (provider === 'ollama') {
        return await this.callOllamaAPI(model, messages, maxTokens);
      }

      // 🖥️ LM Studio - lokale AI (nur ULTIMATE)
      if (provider === 'lmstudio') {
        return await this.callLMStudioAPI(model, messages, maxTokens);
      }

      // Prüfe auf verfügbare Modelle und aktualisiere Mappings (nur wenn nicht bereits in einer Rekursion)
      if (apiKey && (provider === 'openai' || provider === 'anthropic') && !skipModelUpdate) {
        try {
          const availableModels = await this.fetchAvailableModels(provider, apiKey);
          this.updateModelMappings(availableModels);
        } catch (error) {
          console.warn('Modell-Aktualisierung fehlgeschlagen:', error);
        }
      }

      // Modell-Mapping anwenden (mit automatischer Aktualisierung)
      const actualModel = this.modelMappings[model] || model;

      // Warnung wenn Modell gemappt wurde
      if (actualModel !== model) {
        console.warn(`Modell ${model} wurde automatisch auf ${actualModel} aktualisiert`);
      }

      if (provider === 'anthropic') {
        return await this.callAnthropicAPI(apiKey, actualModel, messages, maxTokens);
      } else if (provider === 'openai') {
        return await this.callOpenAIAPI(apiKey, model, messages, maxTokens);
      } else {
        throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error: any) {
      console.error('API call error:', error);
      return {
        success: false,
        content: '',
        error: error.message || 'Unknown error occurred'
      };
    }
  }

  /**
   * Ollama API Aufruf
   */
  private static async callOllamaAPI(
    model: string,
    messages: APIMessage[],
    maxTokens: number
  ): Promise<APIResponse> {
    try {
      // First check if Ollama is running
      const healthCheck = await fetch('http://localhost:11434/api/version', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        console.log('Ollama health check failed, trying direct generation...');
      }

      // Prepare prompt from messages
      let prompt = '';
      messages.forEach(msg => {
        if (msg.role === 'system') {
          prompt += `System: ${msg.content}\n\n`;
        } else if (msg.role === 'user') {
          prompt += `Human: ${msg.content}\n\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n\n`;
        }
      });

      if (!prompt) {
        prompt = messages[messages.length - 1].content;
      }

      prompt += "Assistant: ";

      console.log('Calling Ollama with model:', model);

      // Call Ollama generate endpoint with longer timeout
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            num_predict: maxTokens,
            stop: ["Human:", "System:"]
          }
        }),
        signal: AbortSignal.timeout(180000) // 3 minute timeout for large models and comprehensive sections
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ollama response error:', errorText);

        // Check if model exists
        if (errorText.includes('model') || response.status === 404) {
          throw new Error(`Model '${model}' not found. Please run: ollama pull ${model}`);
        }
        throw new Error(`Ollama error: ${errorText || response.statusText}`);
      }

      const data = await response.json();

      if (!data.response) {
        throw new Error('Invalid response from Ollama - no content returned');
      }

      console.log('Ollama response received, length:', data.response.length);

      // Estimate tokens
      const estimatedTokens = Math.ceil(data.response.split(/\s+/).length * 1.3);

      return {
        success: true,
        content: data.response,
        tokens: estimatedTokens,
        cost: 0
      };

    } catch (error: any) {
      console.error('Ollama Direct Error:', error);

      // Provide helpful error messages
      if (error.message.includes('fetch failed') || error.name === 'TypeError') {
        return {
          success: false,
          content: '',
          error: 'Ollama is not running. Please start it with: ollama serve'
        };
      } else if (error.message.includes('aborted')) {
        return {
          success: false,
          content: '',
          error: 'Request timeout - model may be loading. Please try again.'
        };
      }

      return {
        success: false,
        content: '',
        error: error.message
      };
    }
  }

  /**
   * 🖥️ LM Studio API Aufruf (OpenAI-kompatibel auf localhost:1234)
   * Nur in ULTIMATE verfügbar - für vollständig lokale AI ohne Internet
   */
  private static async callLMStudioAPI(
    model: string,
    messages: APIMessage[],
    maxTokens: number
  ): Promise<APIResponse> {
    try {
      // First check if LM Studio is running
      const healthCheck = await fetch('http://localhost:1234/v1/models', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null);

      if (!healthCheck || !healthCheck.ok) {
        return {
          success: false,
          content: '',
          error: 'LM Studio ist nicht gestartet. Bitte starten Sie LM Studio und laden Sie ein Modell.'
        };
      }

      console.log('🖥️ Calling LM Studio with model:', model);

      // LM Studio verwendet OpenAI-kompatible API
      const response = await fetch('http://localhost:1234/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          messages: messages,
          max_tokens: maxTokens,
          temperature: 0.7,
          stream: false
        }),
        signal: AbortSignal.timeout(180000) // 3 minute timeout for large models
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('LM Studio response error:', errorText);
        throw new Error(`LM Studio error: ${errorText || response.statusText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0]?.message?.content) {
        throw new Error('Invalid response from LM Studio - no content returned');
      }

      console.log('🖥️ LM Studio response received, length:', data.choices[0].message.content.length);

      // Token-Schätzung
      const estimatedTokens = data.usage?.total_tokens ||
        Math.ceil(data.choices[0].message.content.split(/\s+/).length * 1.3);

      return {
        success: true,
        content: data.choices[0].message.content,
        tokens: estimatedTokens,
        cost: 0 // Lokal = kostenlos
      };

    } catch (error: any) {
      console.error('LM Studio Error:', error);

      // Provide helpful error messages
      if (error.message.includes('fetch failed') || error.name === 'TypeError') {
        return {
          success: false,
          content: '',
          error: 'LM Studio ist nicht erreichbar. Bitte starten Sie LM Studio auf http://localhost:1234'
        };
      } else if (error.message.includes('aborted')) {
        return {
          success: false,
          content: '',
          error: 'Request Timeout - Das Modell braucht zu lange. Versuchen Sie es erneut oder verwenden Sie ein kleineres Modell.'
        };
      }

      return {
        success: false,
        content: '',
        error: error.message
      };
    }
  }

  /**
   * Anthropic API Aufruf
   */
  private static async callAnthropicAPI(
    apiKey: string,
    model: string,
    messages: APIMessage[],
    maxTokens: number
  ): Promise<APIResponse> {
    // System-Message extrahieren falls vorhanden
    const systemMessage = messages.find(m => m.role === 'system');
    const userMessages = messages.filter(m => m.role !== 'system');

    const requestBody: any = {
      model: model,
      max_tokens: maxTokens,
      messages: userMessages
    };

    // System-Message hinzufügen wenn vorhanden
    if (systemMessage) {
      requestBody.system = systemMessage.content;
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || 
        `Anthropic API error (${response.status}): ${JSON.stringify(errorData)}`
      );
    }

    const data = await response.json();
    
    // Token-Kosten berechnen
    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const costs = this.tokenCosts[model] || { input: 0, output: 0 };
    const totalCost = (inputTokens * costs.input + outputTokens * costs.output) / 1000000;

    return {
      success: true,
      content: data.content[0]?.text || '',
      cost: totalCost,
      tokens: inputTokens + outputTokens
    };
  }

  /**
   * OpenAI API Aufruf
   */
  private static async callOpenAIAPI(
    apiKey: string,
    model: string,
    messages: APIMessage[],
    maxTokens: number
  ): Promise<APIResponse> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    
    // Token-Kosten für OpenAI (beispielhaft)
    const totalTokens = data.usage?.total_tokens || 0;
    const costPerToken = model.includes('gpt-4') ? 0.00003 : 0.000002;
    
    return {
      success: true,
      content: data.choices[0]?.message?.content || '',
      cost: totalTokens * costPerToken,
      tokens: totalTokens
    };
  }

  /**
   * Validiert API-Schlüssel
   */
  static async validateAPIKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Einfacher Test-Aufruf
      const testMessages: APIMessage[] = [
        { role: 'user', content: 'Say "OK" if you can read this.' }
      ];
      
      const result = await this.callAPI(provider, 
        provider === 'anthropic' ? 'claude-3-haiku-20240307' : 'gpt-3.5-turbo',
        apiKey, testMessages, 10
      );
      
      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gibt verfügbare Modelle für einen Provider zurück (mit dynamischer Aktualisierung)
   */
  static async getAvailableModels(provider: string, apiKey?: string): Promise<{ id: string; name: string; maxTokens: number; cost?: number }[]> {
    // Bridge Provider - verwendet User's Claude Max Subscription
    if (provider === 'bridge') {
      return [
        {
          id: 'claude-max',
          name: 'Claude Max (via Browser Extension)',
          maxTokens: 8192,
          cost: 0 // Nutzt User's Subscription
        }
      ];
    }

    // Wenn API-Schlüssel verfügbar, dynamisch laden
    if (apiKey && (provider === 'openai' || provider === 'anthropic')) {
      try {
        const models = await this.fetchAvailableModels(provider, apiKey);
        return models.map(model => ({
          id: model.id,
          name: model.name,
          maxTokens: model.maxTokens,
          cost: model.cost
        }));
      } catch (error) {
        console.warn('Dynamisches Laden fehlgeschlagen, verwende statische Liste:', error);
      }
    }

    // Fallback auf statische Modelle
    return this.getStaticModels(provider);
  }

  /**
   * Synchrone Methode für Backward-Kompatibilität
   */
  static getAvailableModelsSync(provider: string): { id: string; name: string; maxTokens: number }[] {
    return this.getStaticModels(provider);
  }

  /**
   * Manuelles Refresh der Modelle (ignoriert Cache)
   */
  static async refreshModels(provider: string, apiKey: string): Promise<{
    success: boolean;
    models: any[];
    newModels: string[];
    removedModels: string[];
    cacheAge: number;
    error?: string;
  }> {
    try {
      const cacheKey = `${provider}_${apiKey.slice(-8)}`;
      const cached = this.modelCache.get(cacheKey);
      const oldModels = cached?.models.map(m => m.id) || [];
      const cacheAge = cached ? Math.floor((Date.now() - cached.lastUpdated) / 1000 / 60) : 0; // in Minuten

      // Force refresh (ignoriere Cache)
      const newModels = await this.fetchAvailableModels(provider, apiKey, true);
      const newModelIds = newModels.map(m => m.id);

      // Finde neue und entfernte Modelle
      const addedModels = newModelIds.filter(id => !oldModels.includes(id));
      const removedModels = oldModels.filter(id => !newModelIds.includes(id));

      return {
        success: true,
        models: newModels,
        newModels: addedModels,
        removedModels: removedModels,
        cacheAge: cacheAge
      };
    } catch (error: any) {
      console.error('Model refresh failed:', error);
      return {
        success: false,
        models: [],
        newModels: [],
        removedModels: [],
        cacheAge: 0,
        error: error.message || 'Unknown error'
      };
    }
  }

  /**
   * Überprüft System-Status und Model-Verfügbarkeit
   */
  static async getSystemStatus(): Promise<{
    status: 'online' | 'offline' | 'limited';
    modelUpdatesAvailable: boolean;
    lastModelCheck: number;
    deprecatedModels: string[];
    newModels: string[];
  }> {
    const now = Date.now();
    const deprecatedModels: string[] = [];
    const newModels: string[] = [];
    let modelUpdatesAvailable = false;

    try {
      // Überprüfe alle gecachten Provider
      for (const [cacheKey, cached] of this.modelCache.entries()) {
        const provider = cacheKey.split('_')[0];
        const cacheAge = now - cached.lastUpdated;

        if (cacheAge > this.CACHE_DURATION) {
          modelUpdatesAvailable = true;
        }

        // Prüfe auf veraltete Modelle
        for (const [oldModel, newModel] of Object.entries(this.modelMappings)) {
          if (oldModel !== newModel) {
            deprecatedModels.push(oldModel);
          }
        }
      }

      return {
        status: 'online',
        modelUpdatesAvailable,
        lastModelCheck: Math.max(...Array.from(this.modelCache.values()).map(c => c.lastUpdated), 0),
        deprecatedModels,
        newModels
      };
    } catch (error) {
      return {
        status: 'offline',
        modelUpdatesAvailable: false,
        lastModelCheck: 0,
        deprecatedModels,
        newModels
      };
    }
  }

  /**
   * Setzt das System zurück
   */
  static resetSystem(): void {
    this.modelCache.clear();
    console.log('System reset: Model cache cleared');
  }
}

export default APIService;

// Named exports to prevent tree-shaking
export const refreshModels = APIService.refreshModels.bind(APIService);
export const fetchAvailableModels = APIService.fetchAvailableModels.bind(APIService);
export const getAvailableModels = APIService.getAvailableModels.bind(APIService);
