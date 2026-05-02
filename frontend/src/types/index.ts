export type ServiceStatus = 'OFFLINE' | 'RUNNING' | 'MAINTENANCE' | 'DEGRADED';
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type AlertType = 'CIRCUIT_BREAKER_TRIGGERED' | 'RATE_LIMIT_EXCEEDED' | 'SERVICE_DOWN' | 'AUTH_FAILURE' | 'CONFIG_CHANGE';

export interface Service {
  id: string;
  name: string;
  description: string | null;
  base_url: string;
  status: ServiceStatus;
  created_by: string;
  created_at: number;
  updated_at: number;
}

export interface API {
  id: string;
  service_id: string;
  name: string;
  path: string;
  method: string;
  description: string | null;
  timeout: number;
  is_public: boolean;
  created_at: number;
  updated_at: number;
}

export interface APIKey {
  id: string;
  service_id: string;
  key_prefix: string;
  status: 'ACTIVE' | 'INACTIVE' | 'REVOKED';
  rate_limit: number;
  rate_window: number;
  created_by: string;
  created_at: number;
  expires_at: number | null;
}

export interface RateLimitRule {
  id: string;
  service_id: string;
  api_id: string | null;
  name: string;
  limit_type: 'GLOBAL' | 'PER_API' | 'PER_KEY';
  requests_per_second: number;
  burst_size: number;
  window_size: number;
  is_enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface CircuitBreakerRule {
  id: string;
  service_id: string;
  api_id: string | null;
  name: string;
  failure_threshold: number;
  timeout: number;
  reset_timeout: number;
  min_requests: number;
  is_enabled: boolean;
  created_at: number;
  updated_at: number;
}

export interface CallLog {
  id: string;
  trace_id: string;
  service_id: string;
  api_id: string | null;
  api_key_id: string | null;
  request_fingerprint: string;
  method: string;
  path: string;
  status_code: number;
  duration: number;
  request_headers: string | null;
  request_body: string | null;
  response_headers: string | null;
  response_body: string | null;
  error_message: string | null;
  client_ip: string | null;
  user_agent: string | null;
  created_at: number;
}

export interface Alert {
  id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  service_id: string;
  api_id: string | null;
  message: string;
  is_acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: number | null;
  metadata: string | null;
  created_at: number;
}

export interface RealTimeMetrics {
  timestamp: number;
  totalRequests: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorCount: number;
  activeServices: number;
  openCircuits: number;
}

export interface ServiceMetrics {
  serviceId: string;
  serviceName: string;
  requestCount: number;
  successRate: number;
  avgDuration: number;
  p95Duration: number;
  p99Duration: number;
  errorCount: number;
  status: string;
}

export interface AuditLog {
  id: string;
  operation_type: string;
  resource_type: string;
  resource_id: string | null;
  actor_id: string;
  actor_type: string;
  old_value: string | null;
  new_value: string | null;
  request_ip: string | null;
  user_agent: string | null;
  created_at: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CreateServiceRequest {
  name: string;
  description?: string;
  base_url: string;
}

export interface CreateAPIRequest {
  name: string;
  path: string;
  method: string;
  description?: string;
  timeout?: number;
  is_public?: boolean;
}

export interface CreateRateLimitRuleRequest {
  name: string;
  api_id?: string;
  limit_type: 'GLOBAL' | 'PER_API' | 'PER_KEY';
  requests_per_second: number;
  burst_size?: number;
  window_size?: number;
}

export interface CreateCircuitBreakerRuleRequest {
  name: string;
  api_id?: string;
  failure_threshold: number;
  timeout?: number;
  reset_timeout?: number;
  min_requests?: number;
}

export interface CreateAPIKeyRequest {
  rate_limit?: number;
  rate_window?: number;
  expires_at?: number;
}
