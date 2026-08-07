export interface HealthResponse {
  status: string;
  application: string;
  database: string;
  timestamp: string;
  uptime: number;
}
