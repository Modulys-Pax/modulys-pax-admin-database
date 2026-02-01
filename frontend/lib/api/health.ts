import api from '../axios';

export interface HealthResponse {
  status: string;
  timestamp: string;
  database: string;
  error?: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>('/health');
  return response.data;
}
