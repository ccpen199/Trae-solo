export type ServiceStatus = 'OFFLINE' | 'RUNNING' | 'MAINTENANCE' | 'DEGRADED';
export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';
export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type AlertType = 'CIRCUIT_BREAKER_TRIGGERED' | 'RATE_LIMIT_EXCEEDED' | 'SERVICE_DOWN' | 'AUTH_FAILURE' | 'CONFIG_CHANGE';
export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE' | 'DEPLOY' | 'TRIGGER' | 'ACCESS';
export type ResourceType = 'SERVICE' | 'API' | 'API_KEY' | 'RATE_LIMIT_RULE' | 'CIRCUIT_BREAKER_RULE' | 'CONFIGURATION' | 'ALERT';

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
  key_hash: string;
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

export interface CircuitBreakerStateEntity {
  id: string;
  service_id: string;
  api_id: string | null;
  state: CircuitBreakerState;
  failure_count: number;
  success_count: number;
  last_failure_time: number | null;
  open_time: number | null;
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

export interface Metric {
  id: string;
  service_id: string;
  api_id: string | null;
  metric_type: 'SUCCESS_RATE' | 'AVG_DURATION' | 'P95_DURATION' | 'P99_DURATION' | 'REQUEST_COUNT' | 'ERROR_COUNT';
  value: number;
  sample_count: number;
  window_start: number;
  window_end: number;
  created_at: number;
}

export interface AuditLog {
  id: string;
  operation_type: OperationType;
  resource_type: ResourceType;
  resource_id: string | null;
  actor_id: string;
  actor_type: 'USER' | 'SYSTEM';
  old_value: string | null;
  new_value: string | null;
  request_ip: string | null;
  user_agent: string | null;
  created_at: number;
}

export interface ConfigurationChange {
  id: string;
  service_id: string;
  change_type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity_type: 'SERVICE' | 'API' | 'RATE_LIMIT' | 'CIRCUIT_BREAKER';
  entity_id: string;
  old_config: string | null;
  new_config: string | null;
  changed_by: string;
  status: 'PENDING' | 'DEPLOYED' | 'FAILED';
  deployed_at: number | null;
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

export interface AvailabilityProbeResult {
  success: boolean;
  latency: number;
  statusCode?: number;
  error?: string;
  timestamp: number;
}

export interface AuthResult {
  success: boolean;
  apiKeyId?: string;
  serviceId?: string;
  error?: string;
  errorCode?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

export interface CircuitBreakerResult {
  allowed: boolean;
  state: CircuitBreakerState;
  error?: string;
}

export interface ProxyRequest {
  service: Service;
  api?: API;
  method: string;
  path: string;
  headers: Record<string, string | string[] | undefined>;
  body?: string;
  timeout?: number;
}

export interface ProxyResponse {
  success: boolean;
  statusCode: number;
  headers: Record<string, string | string[]>;
  body: string;
  duration: number;
  traceId: string;
  error?: string;
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
