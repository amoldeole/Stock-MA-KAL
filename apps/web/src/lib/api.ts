// ============================================================
// API Client
// ============================================================

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Stock endpoints
  async getQuote(symbol: string) {
    return this.request<{ success: boolean; data: any }>(`/api/quote/${symbol}`);
  }

  async getHistory(symbol: string, timeframe: string, limit = 500) {
    return this.request<{ success: boolean; data: any[] }>(
      `/api/history/${symbol}?timeframe=${timeframe}&limit=${limit}`
    );
  }

  async searchStocks(query: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/search?q=${query}`);
  }

  async getBatchQuotes(symbols: string[]) {
    return this.request<{ success: boolean; data: any[] }>('/api/quotes', {
      method: 'POST',
      body: JSON.stringify({ symbols }),
    });
  }

  // Indicator endpoints
  async calculateMA(symbol: string, timeframe: string, config: any) {
    return this.request<{ success: boolean; data: any }>('/api/indicators/ma', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, config }),
    });
  }

  async calculateKalman(symbol: string, timeframe: string, config?: any) {
    return this.request<{ success: boolean; data: any }>('/api/indicators/kalman', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, config }),
    });
  }

  async calculateRSI(symbol: string, timeframe: string, period = 14) {
    return this.request<{ success: boolean; data: any }>('/api/indicators/rsi', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, period }),
    });
  }

  async generateSignal(symbol: string, timeframe: string, signalConfig?: any) {
    return this.request<{ success: boolean; data: any }>('/api/signals/generate', {
      method: 'POST',
      body: JSON.stringify({ symbol, timeframe, signalConfig }),
    });
  }

  // Features
  async getFeatures(platform = 'web') {
    return this.request<{ success: boolean; data: any }>(`/api/features?platform=${platform}`);
  }

  // Voice
  async parseVoiceCommand(text: string) {
    return this.request<{ success: boolean; data: any }>('/api/voice/parse', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async getVoiceCommands() {
    return this.request<{ success: boolean; data: any }>('/api/voice/commands');
  }
}

export const api = new ApiClient();
