// Advanced Connection Manager for Supabase
export class ConnectionManager {
  private static instance: ConnectionManager;
  private connectionState: 'connected' | 'connecting' | 'disconnected' | 'error' = 'disconnected';
  private lastSuccessfulConnection: Date | null = null;
  private consecutiveFailures = 0;
  private maxRetries = 3;
  private backoffDelay = 1000; // Start with 1 second
  private maxBackoffDelay = 30000; // Max 30 seconds
  private connectionPromise: Promise<boolean> | null = null;
  private listeners: Array<(state: string) => void> = [];

  static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  // Add connection state listener
  addListener(callback: (state: string) => void) {
    this.listeners.push(callback);
  }

  // Remove connection state listener
  removeListener(callback: (state: string) => void) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  // Notify all listeners of state change
  private notifyListeners() {
    this.listeners.forEach(callback => callback(this.connectionState));
  }

  // Get current connection state
  getConnectionState() {
    return {
      state: this.connectionState,
      consecutiveFailures: this.consecutiveFailures,
      lastSuccessfulConnection: this.lastSuccessfulConnection,
      isHealthy: this.consecutiveFailures < 2 && this.connectionState === 'connected'
    };
  }

  // Test connection with smart retry logic
  async testConnection(supabase: any, userId: string): Promise<boolean> {
    // If already connecting, return the existing promise
    if (this.connectionPromise) {
      return this.connectionPromise;
    }

    // If too many consecutive failures, implement exponential backoff
    if (this.consecutiveFailures >= this.maxRetries) {
      const timeSinceLastAttempt = this.lastSuccessfulConnection 
        ? Date.now() - this.lastSuccessfulConnection.getTime()
        : Date.now();
      
      const backoffTime = Math.min(
        this.backoffDelay * Math.pow(2, this.consecutiveFailures - this.maxRetries),
        this.maxBackoffDelay
      );

      if (timeSinceLastAttempt < backoffTime) {
        console.log(`🔄 Connection backoff: waiting ${Math.round((backoffTime - timeSinceLastAttempt) / 1000)}s`);
        return false;
      }
    }

    this.connectionState = 'connecting';
    this.notifyListeners();

    this.connectionPromise = this.performConnectionTest(supabase, userId);
    const result = await this.connectionPromise;
    this.connectionPromise = null;

    return result;
  }

  private async performConnectionTest(supabase: any, userId: string): Promise<boolean> {
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Quick health check with minimal data
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const { data, error } = await supabase
        .from('vendors')
        .select('vendor_id')
        .eq('user_id', userId)
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        throw error;
      }

      // Connection successful
      this.connectionState = 'connected';
      this.consecutiveFailures = 0;
      this.lastSuccessfulConnection = new Date();
      this.notifyListeners();
      
      console.log('✅ Supabase connection successful');
      return true;

    } catch (error: any) {
      this.consecutiveFailures++;
      this.connectionState = 'error';
      this.notifyListeners();

      console.error(`❌ Connection test failed (attempt ${this.consecutiveFailures}):`, error);

      // Provide specific error context
      if (error.name === 'AbortError') {
        console.error('⏰ Connection timeout - server not responding');
      } else if (error.message?.includes('network')) {
        console.error('🌐 Network error - check internet connection');
      } else if (error.code) {
        console.error(`🔧 Database error (${error.code}): ${error.message}`);
      }

      return false;
    }
  }

  // Reset connection state (for manual retry)
  reset() {
    this.consecutiveFailures = 0;
    this.connectionState = 'disconnected';
    this.connectionPromise = null;
    this.notifyListeners();
  }

  // Check if we should attempt connection
  shouldAttemptConnection(): boolean {
    if (this.connectionState === 'connecting') {
      return false; // Already connecting
    }

    if (this.consecutiveFailures >= this.maxRetries) {
      const timeSinceLastAttempt = this.lastSuccessfulConnection 
        ? Date.now() - this.lastSuccessfulConnection.getTime()
        : Date.now();
      
      const backoffTime = Math.min(
        this.backoffDelay * Math.pow(2, this.consecutiveFailures - this.maxRetries),
        this.maxBackoffDelay
      );

      return timeSinceLastAttempt >= backoffTime;
    }

    return true;
  }

  // Get next retry time
  getNextRetryTime(): Date | null {
    if (this.consecutiveFailures < this.maxRetries) {
      return null; // Can retry immediately
    }

    const backoffTime = Math.min(
      this.backoffDelay * Math.pow(2, this.consecutiveFailures - this.maxRetries),
      this.maxBackoffDelay
    );

    return new Date(Date.now() + backoffTime);
  }
}

export const connectionManager = ConnectionManager.getInstance();