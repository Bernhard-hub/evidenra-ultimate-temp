// 🎯 Universal AI Bridge - Type Definitions
// Zentrale Typen für alle AI Provider

/**
 * Basis-Request für alle AI-Anfragen
 */
export interface AIRequest {
  prompt: string;
  context?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  streaming?: boolean;
  metadata?: Record<string, any>;
}

/**
 * Standardisierte AI-Response
 */
export interface AIResponse {
  success: boolean;
  content: string;
  provider: string;
  model?: string;
  timestamp: string;
  tokens?: number;
  cost?: number;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * Streaming-Chunk für Real-time Updates
 */
export interface AIStreamChunk {
  delta: string;
  accumulated: string;
  provider: string;
  timestamp: string;
}

/**
 * Provider-Konfiguration
 */
export interface ProviderConfig {
  name: string;
  priority: number;
  apiKey?: string;
  model?: string;
  endpoint?: string;
  enabled: boolean;
  capabilities: ProviderCapabilities;
}

/**
 * Provider-Fähigkeiten
 */
export interface ProviderCapabilities {
  streaming: boolean;
  vision: boolean;
  functionCalling: boolean;
  maxTokens: number;
  costPerToken: number;
}

/**
 * Provider Status
 */
export interface ProviderStatus {
  available: boolean;
  healthy: boolean;
  latency?: number;
  errorRate?: number;
  lastCheck: string;
}

/**
 * Base Provider Interface
 * Alle Provider müssen diese Methoden implementieren
 */
export interface AIProvider {
  readonly name: string;
  readonly priority: number;
  readonly capabilities: ProviderCapabilities;

  /**
   * Prüft ob Provider verfügbar ist
   */
  isAvailable(): Promise<boolean>;

  /**
   * Führt AI-Request aus
   */
  execute(request: AIRequest): Promise<AIResponse>;

  /**
   * Streaming-Execute (optional)
   */
  executeStream?(
    request: AIRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<AIResponse>;

  /**
   * Health-Check
   */
  healthCheck(): Promise<ProviderStatus>;

  /**
   * Provider-spezifische Konfiguration
   */
  configure(config: ProviderConfig): void;
}

/**
 * Router-Strategie
 */
export enum RoutingStrategy {
  FASTEST = 'fastest',           // Schnellster verfügbarer Provider
  CHEAPEST = 'cheapest',         // Günstigster Provider
  MOST_RELIABLE = 'reliable',    // Zuverlässigster Provider
  ROUND_ROBIN = 'round_robin',   // Gleichmäßige Verteilung
  PRIORITY = 'priority'          // Nach Priorität (Standard)
}

/**
 * Router-Konfiguration
 */
export interface RouterConfig {
  strategy: RoutingStrategy;
  enableFallback: boolean;
  maxRetries: number;
  timeout: number;
}

/**
 * Fehler-Typen
 */
export enum AIErrorType {
  PROVIDER_UNAVAILABLE = 'provider_unavailable',
  API_ERROR = 'api_error',
  TIMEOUT = 'timeout',
  RATE_LIMIT = 'rate_limit',
  INVALID_REQUEST = 'invalid_request',
  PARSING_ERROR = 'parsing_error',
  NETWORK_ERROR = 'network_error'
}

/**
 * Standardisierter AI-Fehler
 */
export class AIBridgeError extends Error {
  constructor(
    public type: AIErrorType,
    message: string,
    public provider?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AIBridgeError';
  }
}

/**
 * Provider-Registry Entry
 */
export interface ProviderRegistryEntry {
  provider: AIProvider;
  config: ProviderConfig;
  status: ProviderStatus;
}
