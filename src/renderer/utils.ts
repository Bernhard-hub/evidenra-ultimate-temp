export class CircuitBreaker {
  private threshold: number;
  private timeout: number;
  private failureCount: number;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  private nextAttempt: number;
  private successCount: number;
  private requestCount: number;
  private lastError: string | null;

  constructor(threshold = 5, timeout = 60000) {
    this.threshold = threshold;
    this.timeout = timeout;
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.nextAttempt = Date.now();
    this.successCount = 0;
    this.requestCount = 0;
    this.lastError = null;
  }

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN. Next attempt in ${Math.round((this.nextAttempt - Date.now()) / 1000)}s. Last error: ${this.lastError}`);
      } else {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
        this.requestCount = 0;
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error: any) {
      this.onFailure(error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.successCount++;
    this.requestCount++;
    this.lastError = null;
    
    if (this.state === 'HALF_OPEN' && this.successCount >= 3) {
      this.state = 'CLOSED';
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++;
    this.requestCount++;
    this.lastError = error.message;
    
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successRate: this.requestCount > 0 ? (this.successCount / this.requestCount * 100).toFixed(1) + '%' : 'N/A',
      nextAttemptIn: this.state === 'OPEN' ? Math.max(0, Math.round((this.nextAttempt - Date.now()) / 1000)) : 0,
      lastError: this.lastError
    };
  }

  reset(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
    this.successCount = 0;
    this.requestCount = 0;
    this.lastError = null;
  }
}

export class RequestQueue {
  private queue: any[];
  private running: number;
  private maxConcurrency: number;
  private defaultDelay: number;
  private lastRequestTime: number;
  private requestStats: any;
  private responseTimes: number[];

  constructor(maxConcurrency = 3, defaultDelay = 1000) {
    this.queue = [];
    this.running = 0;
    this.maxConcurrency = maxConcurrency;
    this.defaultDelay = defaultDelay;
    this.lastRequestTime = 0;
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      queued: 0,
      avgResponseTime: 0
    };
    this.responseTimes = [];
  }

  async add<T>(operation: () => Promise<T>, options: any = {}): Promise<T> {
    // Implementation here...
    return operation();
  }

  getStats() {
    return this.requestStats;
  }

  clear(): void {
    this.queue = [];
    this.requestStats.queued = 0;
  }
}