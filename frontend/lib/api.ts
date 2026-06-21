const stripTrailingSlash = (value: string) => value.replace(/\/+$/, '');

const getWindowHost = (): string => {
  if (typeof window === 'undefined') {
    return '';
  }

  const hostname = window.location.hostname;
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return '';
  }

  return `http://${hostname}:8000`;
};

const buildApiCandidates = (): string[] => {
  const candidates: string[] = [];
  const add = (url?: string) => {
    if (!url) return;
    const normalized = stripTrailingSlash(url);
    if (!candidates.includes(normalized)) {
      candidates.push(normalized);
    }
  };

  add(import.meta.env.VITE_BACKEND_API_URL?.trim());
  add(getWindowHost());
  add('http://localhost:8000');
  add('http://127.0.0.1:8000');
  add('https://greenchain-qfwf.onrender.com');

  return candidates;
};

const BACKEND_API_URL = import.meta.env.VITE_BACKEND_API_URL?.trim() || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiService {
  private baseUrl: string;
  private readonly baseCandidates: string[];

  constructor(baseUrl: string = BACKEND_API_URL) {
    this.baseUrl = stripTrailingSlash(baseUrl);
    this.baseCandidates = buildApiCandidates();
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    let lastError: unknown;
    const candidates = [this.baseUrl, ...this.baseCandidates.filter(candidate => candidate !== this.baseUrl)];

    for (const base of candidates) {
      try {
        const url = `${base}${endpoint}`;
        const response = await fetch(url, {
          headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
          },
          ...options,
        });

        const rawText = await response.text();
        const parsed = rawText ? JSON.parse(rawText) : null;

        if (!response.ok) {
          const detail = parsed?.detail || parsed?.message || `HTTP error! status: ${response.status}`;
          throw new Error(detail);
        }

        this.baseUrl = base;
        return { data: parsed, success: true };
      } catch (error) {
        lastError = error;
      }
    }

    console.error(`API request failed: ${endpoint}`, lastError, { baseCandidates: candidates });
    return {
      error: lastError instanceof Error ? lastError.message : 'Network error',
      success: false,
    };
  }

  async getShipments(): Promise<ApiResponse<any[]>> {
    return this.request('/shipments');
  }

  async getShipmentById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/shipments/${id}`);
  }

  async updateShipment(data: any): Promise<ApiResponse<any>> {
    return this.request('/shipments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getEmissions(): Promise<ApiResponse<any[]>> {
    return this.request('/emissions');
  }

  async getEmissionsByShipmentId(shipmentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/emissions/${shipmentId}`);
  }

  async getAlerts(): Promise<ApiResponse<any[]>> {
    return this.request('/alerts');
  }

  async markAlertAsRead(alertId: string): Promise<ApiResponse<any>> {
    return this.request(`/alerts/${alertId}/read`, {
      method: 'PATCH',
      body: JSON.stringify({ is_read: true }),
    });
  }

  async getAnalytics(): Promise<ApiResponse<any>> {
    return this.request('/analytics/fleet-overview');
  }

  async getGreenScore(): Promise<ApiResponse<any>> {
    return this.request('/green-score/fleet');
  }

  async getAIInsights(query: string): Promise<ApiResponse<any>> {
    return this.request('/ai/ask', {
      method: 'POST',
      body: JSON.stringify({ question: query }),
    });
  }

  async getReports(): Promise<ApiResponse<any>> {
    return this.request('/reports/fleet-summary');
  }

  async getRouteAlternatives(shipmentId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/shipments/${shipmentId}/route-alternatives`);
  }

  async predictCO2(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/predict-co2', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async detectAnomaly(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/detect-anomaly', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getDriverProfile(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/driver-profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async forecastCredits(days: number = 30): Promise<ApiResponse<any>> {
    return this.request(`/api/ml/forecast-credits?days=${days}`);
  }

  async recommendRoute(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/recommend-route', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async fuelWasteRisk(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/fuel-waste-risk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scoreShipment(data: any): Promise<ApiResponse<any>> {
    return this.request('/api/ml/score-shipment', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async scoreFleet(shipments: any[]): Promise<ApiResponse<any>> {
    return this.request('/api/ml/score-fleet', {
      method: 'POST',
      body: JSON.stringify(shipments),
    });
  }
}

export const apiService = new ApiService();
