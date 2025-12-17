/**
 * Model Discovery Service
 * Automatically discovers and updates available models from AI providers
 * Supports: Anthropic, OpenAI, Groq, Ollama
 */

export interface ModelInfo {
  id: string;
  name: string;
  cost: number;
  maxTokens: number;
}

export interface ProviderModels {
  models: ModelInfo[];
  lastUpdated: number;
}

export class ModelDiscoveryService {

  /**
   * Fetch available models from Anthropic Claude API
   * ✨ GENIUS AUTO-UPDATE: Fetches from web-based JSON registry!
   * This allows adding new models WITHOUT rebuilding the app!
   */
  static async fetchAnthropicModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      // 🌐 Try to fetch latest models from web-based registry (GitHub raw JSON)
      // This file can be updated ANYTIME without rebuilding the app!
      console.log('🌐 Fetching latest Anthropic models from web registry...');

      const registryUrl = 'https://raw.githubusercontent.com/Bernhard-hub/evidenra-professional/master/model-registry.json';

      try {
        const response = await fetch(registryUrl, {
          method: 'GET',
          cache: 'no-cache', // Always get fresh data
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          const registry = await response.json();
          if (registry.anthropic && Array.isArray(registry.anthropic.models)) {
            console.log(`✅ Loaded ${registry.anthropic.models.length} models from web registry (updated: ${registry.anthropic.lastUpdated})`);
            return registry.anthropic.models;
          }
        }
      } catch (fetchError) {
        console.warn('⚠️ Could not fetch from web registry, using fallback:', fetchError);
      }

      // 🔄 Fallback: Use hardcoded AUTO-UPDATE aliases
      // These ALWAYS work and point to latest versions
      console.log('📋 Using fallback Anthropic model aliases (auto-latest)');
      const fallbackModels = [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Auto-Latest)', cost: 0.003, maxTokens: 200000 },
        { id: 'claude-opus-4-1', name: 'Claude Opus 4.1 (Auto-Latest)', cost: 0.015, maxTokens: 200000 },
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (Auto-Latest)', cost: 0.00015, maxTokens: 200000 }
      ];

      return fallbackModels;
    } catch (error) {
      console.error('Anthropic model list failed:', error);
      // Return minimal fallback (Auto-update aliases)
      return [
        { id: 'claude-sonnet-4-5', name: 'Claude Sonnet 4.5 (Auto-Latest)', cost: 0.003, maxTokens: 200000 },
        { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 (Auto-Latest)', cost: 0.00015, maxTokens: 200000 }
      ];
    }
  }

  /**
   * Fetch available models from OpenAI API
   * ✨ GENIUS AUTO-UPDATE: First tries web registry, then OpenAI API
   */
  static async fetchOpenAIModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      // 🌐 First try: Web-based registry (no API key needed!)
      console.log('🌐 Checking web registry for OpenAI models...');
      const registryUrl = 'https://raw.githubusercontent.com/Bernhard-hub/evidenra-professional/master/model-registry.json';

      try {
        const registryResponse = await fetch(registryUrl, {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' }
        });

        if (registryResponse.ok) {
          const registry = await registryResponse.json();
          if (registry.openai && Array.isArray(registry.openai.models)) {
            console.log(`✅ Loaded ${registry.openai.models.length} OpenAI models from web registry`);
            return registry.openai.models;
          }
        }
      } catch (registryError) {
        console.warn('⚠️ Web registry failed, trying OpenAI API...', registryError);
      }

      // 🔄 Second try: OpenAI API (requires API key)
      if (!apiKey) {
        throw new Error('No API key provided and web registry unavailable');
      }

      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      // Filter for GPT models only
      const gptModels = data.data.filter((m: any) =>
        m.id.includes('gpt-4') || m.id.includes('gpt-3.5')
      );

      for (const model of gptModels) {
        let cost = 0.001;
        let maxTokens = 4096;
        let name = model.id;

        // Set specific costs and limits for known models
        if (model.id === 'gpt-4o') {
          cost = 0.005;
          maxTokens = 128000;
          name = 'GPT-4o (Latest)';
        } else if (model.id === 'gpt-4o-mini') {
          cost = 0.00015;
          maxTokens = 128000;
          name = 'GPT-4o Mini';
        } else if (model.id === 'gpt-4-turbo') {
          cost = 0.01;
          maxTokens = 128000;
          name = 'GPT-4 Turbo';
        } else if (model.id === 'gpt-3.5-turbo') {
          cost = 0.0005;
          maxTokens = 16385;
          name = 'GPT-3.5 Turbo';
        }

        models.push({
          id: model.id,
          name,
          cost,
          maxTokens
        });
      }

      console.log(`✅ Loaded ${models.length} models from OpenAI API`);
      return models;
    } catch (error) {
      console.error('OpenAI model discovery failed:', error);
      // Return fallback models
      return [
        { id: 'gpt-4o', name: 'GPT-4o (Latest)', cost: 0.005, maxTokens: 128000 },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', cost: 0.00015, maxTokens: 128000 }
      ];
    }
  }

  /**
   * Fetch available models from Groq API
   * ✨ GENIUS AUTO-UPDATE: First tries web registry, then Groq API
   */
  static async fetchGroqModels(apiKey: string): Promise<ModelInfo[]> {
    try {
      // 🌐 First try: Web-based registry (no API key needed!)
      console.log('🌐 Checking web registry for Groq models...');
      const registryUrl = 'https://raw.githubusercontent.com/Bernhard-hub/evidenra-professional/master/model-registry.json';

      try {
        const registryResponse = await fetch(registryUrl, {
          method: 'GET',
          cache: 'no-cache',
          headers: { 'Accept': 'application/json' }
        });

        if (registryResponse.ok) {
          const registry = await registryResponse.json();
          if (registry.groq && Array.isArray(registry.groq.models)) {
            console.log(`✅ Loaded ${registry.groq.models.length} Groq models from web registry`);
            return registry.groq.models;
          }
        }
      } catch (registryError) {
        console.warn('⚠️ Web registry failed, trying Groq API...', registryError);
      }

      // 🔄 Second try: Groq API (requires API key)
      if (!apiKey) {
        throw new Error('No API key provided and web registry unavailable');
      }

      const response = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const models: ModelInfo[] = [];

      for (const model of data.data) {
        models.push({
          id: model.id,
          name: model.id.split('-').map((w: string) =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' '),
          cost: 0.0001, // Groq is very cheap
          maxTokens: model.context_window || 8192
        });
      }

      console.log(`✅ Loaded ${models.length} models from Groq API`);
      return models;
    } catch (error) {
      console.error('Groq model discovery failed:', error);
      // Return fallback models
      return [
        { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B', cost: 0.00059, maxTokens: 8192 },
        { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B', cost: 0.00059, maxTokens: 131072 },
        { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', cost: 0.00027, maxTokens: 32768 }
      ];
    }
  }

  /**
   * Fetch available models from Ollama local instance
   */
  static async fetchOllamaModels(): Promise<ModelInfo[]> {
    try {
      const endpoints = [
        { url: 'http://localhost:11434/api/tags', name: 'localhost' },
        { url: 'http://127.0.0.1:11434/api/tags', name: '127.0.0.1' }
      ];

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint.url, {
            method: 'GET',
            signal: AbortSignal.timeout(5000)
          });

          if (response.ok) {
            const data = await response.json();
            const models: ModelInfo[] = [];

            if (data.models && Array.isArray(data.models)) {
              for (const model of data.models) {
                const modelName = model.name || model.model || 'unknown';
                models.push({
                  id: modelName,
                  name: modelName.charAt(0).toUpperCase() + modelName.slice(1),
                  cost: 0,
                  maxTokens: 4096
                });
              }
            }

            return models;
          }
        } catch (error) {
          continue;
        }
      }

      // No Ollama instance found
      return [];
    } catch (error) {
      console.error('Ollama model discovery failed:', error);
      return [];
    }
  }

  /**
   * Discover models for a specific provider
   */
  static async discoverModels(
    provider: 'anthropic' | 'openai' | 'groq' | 'ollama',
    apiKey?: string
  ): Promise<ModelInfo[]> {
    switch (provider) {
      case 'anthropic':
        if (!apiKey) throw new Error('API key required for Anthropic');
        return this.fetchAnthropicModels(apiKey);

      case 'openai':
        if (!apiKey) throw new Error('API key required for OpenAI');
        return this.fetchOpenAIModels(apiKey);

      case 'groq':
        if (!apiKey) throw new Error('API key required for Groq');
        return this.fetchGroqModels(apiKey);

      case 'ollama':
        return this.fetchOllamaModels();

      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  }

  /**
   * Check if models should be refreshed (cache expired)
   */
  static shouldRefresh(lastUpdated: number): boolean {
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - lastUpdated > CACHE_DURATION;
  }

  /**
   * Get cached models or fetch new ones
   */
  static async getModels(
    provider: 'anthropic' | 'openai' | 'groq' | 'ollama',
    apiKey?: string,
    forceRefresh: boolean = false
  ): Promise<ProviderModels> {
    const cacheKey = `models_${provider}`;
    const cached = localStorage.getItem(cacheKey);

    if (!forceRefresh && cached) {
      try {
        const data: ProviderModels = JSON.parse(cached);
        if (!this.shouldRefresh(data.lastUpdated)) {
          return data;
        }
      } catch (error) {
        console.error('Failed to parse cached models:', error);
      }
    }

    // Fetch fresh models
    const models = await this.discoverModels(provider, apiKey);
    const providerModels: ProviderModels = {
      models,
      lastUpdated: Date.now()
    };

    // Cache the results
    localStorage.setItem(cacheKey, JSON.stringify(providerModels));

    return providerModels;
  }
}
