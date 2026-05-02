import axios from 'axios';
import type {
  Service,
  API,
  APIKey,
  RateLimitRule,
  CircuitBreakerRule,
  Alert,
  AuditLog,
  RealTimeMetrics,
  ServiceMetrics,
  CallLog,
  CreateServiceRequest,
  CreateAPIRequest,
  CreateRateLimitRuleRequest,
  CreateCircuitBreakerRuleRequest,
  CreateAPIKeyRequest,
  ApiResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'X-User-Id': 'frontend-user',
  },
});

export const serviceApi = {
  getAll: async (): Promise<Service[]> => {
    const response = await api.get<ApiResponse<Service[]>>('/services');
    return response.data.data || [];
  },

  getById: async (id: string): Promise<Service | null> => {
    const response = await api.get<ApiResponse<Service>>(`/services/${id}`);
    return response.data.data || null;
  },

  create: async (data: CreateServiceRequest): Promise<{ service: Service; apiKey: string }> => {
    const response = await api.post<ApiResponse<{ service: Service; apiKey: string }>>('/services', data);
    if (!response.data.data) throw new Error('Failed to create service');
    return response.data.data;
  },

  probe: async (id: string): Promise<{ success: boolean; latency: number; statusCode?: number; error?: string }> => {
    const response = await api.post<ApiResponse<{ success: boolean; latency: number; statusCode?: number; error?: string }>>(`/services/${id}/probe`);
    if (!response.data.data) throw new Error('Failed to probe service');
    return response.data.data;
  },

  updateStatus: async (id: string, status: 'OFFLINE' | 'RUNNING' | 'MAINTENANCE' | 'DEGRADED'): Promise<Service> => {
    const response = await api.patch<ApiResponse<Service>>(`/services/${id}/status`, { status });
    if (!response.data.data) throw new Error('Failed to update service status');
    return response.data.data;
  },

  deploy: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/services/${id}/deploy`);
    return { success: response.data.success, message: response.data.data?.message || 'Deployed' };
  },

  getAPIs: async (serviceId: string): Promise<API[]> => {
    const response = await api.get<ApiResponse<API[]>>(`/services/${serviceId}/apis`);
    return response.data.data || [];
  },

  createAPI: async (serviceId: string, data: CreateAPIRequest): Promise<API> => {
    const response = await api.post<ApiResponse<API>>(`/services/${serviceId}/apis`, data);
    if (!response.data.data) throw new Error('Failed to create API');
    return response.data.data;
  },

  getRateLimitRules: async (serviceId: string): Promise<RateLimitRule[]> => {
    const response = await api.get<ApiResponse<RateLimitRule[]>>(`/services/${serviceId}/rate-limit-rules`);
    return response.data.data || [];
  },

  createRateLimitRule: async (serviceId: string, data: CreateRateLimitRuleRequest): Promise<RateLimitRule> => {
    const response = await api.post<ApiResponse<RateLimitRule>>(`/services/${serviceId}/rate-limit-rules`, data);
    if (!response.data.data) throw new Error('Failed to create rate limit rule');
    return response.data.data;
  },

  getCircuitBreakerRules: async (serviceId: string): Promise<CircuitBreakerRule[]> => {
    const response = await api.get<ApiResponse<CircuitBreakerRule[]>>(`/services/${serviceId}/circuit-breaker-rules`);
    return response.data.data || [];
  },

  createCircuitBreakerRule: async (serviceId: string, data: CreateCircuitBreakerRuleRequest): Promise<CircuitBreakerRule> => {
    const response = await api.post<ApiResponse<CircuitBreakerRule>>(`/services/${serviceId}/circuit-breaker-rules`, data);
    if (!response.data.data) throw new Error('Failed to create circuit breaker rule');
    return response.data.data;
  },

  getAPIKeys: async (serviceId: string): Promise<APIKey[]> => {
    const response = await api.get<ApiResponse<APIKey[]>>(`/services/${serviceId}/api-keys`);
    return response.data.data || [];
  },

  createAPIKey: async (serviceId: string, data?: CreateAPIKeyRequest): Promise<{ apiKey: APIKey; key: string }> => {
    const response = await api.post<ApiResponse<{ apiKey: APIKey; key: string }>>(`/services/${serviceId}/api-keys`, data || {});
    if (!response.data.data) throw new Error('Failed to create API key');
    return response.data.data;
  },
};

export const metricsApi = {
  getRealTime: async (): Promise<RealTimeMetrics> => {
    const response = await api.get<ApiResponse<RealTimeMetrics>>('/metrics');
    if (!response.data.data) throw new Error('Failed to get metrics');
    return response.data.data;
  },

  getServiceMetrics: async (serviceId: string): Promise<ServiceMetrics | null> => {
    const response = await api.get<ApiResponse<ServiceMetrics>>(`/metrics/services/${serviceId}`);
    return response.data.data || null;
  },
};

export const alertApi = {
  getAll: async (): Promise<Alert[]> => {
    const response = await api.get<ApiResponse<Alert[]>>('/alerts');
    return response.data.data || [];
  },

  acknowledge: async (id: string): Promise<boolean> => {
    const response = await api.post<ApiResponse<{ message: string }>>(`/alerts/${id}/acknowledge`);
    return response.data.success;
  },
};

export const auditApi = {
  getAll: async (): Promise<AuditLog[]> => {
    const response = await api.get<ApiResponse<AuditLog[]>>('/audit-logs');
    return response.data.data || [];
  },
};

export const traceApi = {
  getByTraceId: async (traceId: string): Promise<CallLog[]> => {
    const response = await api.get<ApiResponse<CallLog[]>>(`/trace/${traceId}`);
    return response.data.data || [];
  },

  getByFingerprint: async (fingerprint: string): Promise<CallLog[]> => {
    const response = await api.get<ApiResponse<CallLog[]>>(`/fingerprint/${fingerprint}`);
    return response.data.data || [];
  },
};

export { api };
