import apiClient from './client';
import type {
  CurrentWeather,
  HourlyForecast,
  DailyForecast,
  MinutelyPrecipitation,
  LifeIndex,
  WeatherAlert,
  City,
  DataSource,
  QualityRule,
  CircuitBreakLog,
  IndexParameter,
  ApiCallStats,
  ApiKey,
  AuditLog,
  ComplianceReport,
} from '../../shared/types';

export const weatherApi = {
  getCurrent: (cityId: string): Promise<CurrentWeather> =>
    apiClient.get('/weather/current', { params: { cityId } }),

  getHourly: (cityId: string): Promise<HourlyForecast[]> =>
    apiClient.get('/weather/hourly', { params: { cityId } }),

  getDaily: (cityId: string): Promise<DailyForecast[]> =>
    apiClient.get('/weather/daily', { params: { cityId } }),

  getMinutely: (cityId: string): Promise<MinutelyPrecipitation> =>
    apiClient.get('/weather/minutely', { params: { cityId } }),

  getGrid: (cityId: string) =>
    apiClient.get('/weather/grid', { params: { cityId } }),
};

export const indicesApi = {
  getAll: (cityId: string): Promise<LifeIndex[]> =>
    apiClient.get('/indices', { params: { cityId } }),

  getByType: (cityId: string, type: string): Promise<LifeIndex> =>
    apiClient.get(`/indices/${type}`, { params: { cityId } }),
};

export const alertsApi = {
  getList: (cityId: string): Promise<WeatherAlert[]> =>
    apiClient.get('/alerts', { params: { cityId } }),

  getById: (id: string): Promise<WeatherAlert> =>
    apiClient.get(`/alerts/${id}`),
};

export const citiesApi = {
  getAll: (): Promise<City[]> =>
    apiClient.get('/cities'),

  search: (keyword: string): Promise<City[]> =>
    apiClient.get('/cities/search', { params: { keyword } }),

  getFavorites: (): Promise<City[]> =>
    apiClient.get('/cities/favorites'),

  addFavorite: (cityId: string) =>
    apiClient.post(`/cities/favorites/${cityId}`),

  removeFavorite: (cityId: string) =>
    apiClient.delete(`/cities/favorites/${cityId}`),
};

export const adminApi = {
  getDataSources: (): Promise<DataSource[]> =>
    apiClient.get('/admin/data-sources'),

  updateDataSource: (id: string, data: any): Promise<DataSource> =>
    apiClient.put(`/admin/data-sources/${id}`, data),

  getQualityRules: (): Promise<QualityRule[]> =>
    apiClient.get('/admin/quality-rules'),

  updateQualityRule: (id: string, data: any): Promise<QualityRule> =>
    apiClient.put(`/admin/quality-rules/${id}`, data),

  getCircuitBreakerStatus: (): Promise<DataSource[]> =>
    apiClient.get('/admin/circuit-breaker'),

  manualBreak: (id: string, reason: string) =>
    apiClient.post(`/admin/circuit-breaker/${id}/break`, { reason }),

  manualRestore: (id: string) =>
    apiClient.post(`/admin/circuit-breaker/${id}/restore`),

  getCircuitBreakLogs: (): Promise<CircuitBreakLog[]> =>
    apiClient.get('/admin/circuit-breaker/logs'),

  getIndexParams: (): Promise<IndexParameter[]> =>
    apiClient.get('/admin/index-params'),

  getIndexParamByType: (type: string): Promise<IndexParameter> =>
    apiClient.get(`/admin/index-params/${type}`),

  updateIndexParam: (type: string, data: any): Promise<IndexParameter> =>
    apiClient.put(`/admin/index-params/${type}`, data),

  getApiStats: (): Promise<ApiCallStats> =>
    apiClient.get('/admin/api-stats'),

  getApiKeys: (): Promise<ApiKey[]> =>
    apiClient.get('/admin/api-keys'),

  createApiKey: (data: { keyName: string; rateLimit: number }): Promise<ApiKey> =>
    apiClient.post('/admin/api-keys', data),

  updateApiKeyStatus: (id: string, status: string): Promise<ApiKey> =>
    apiClient.put(`/admin/api-keys/${id}/status`, { status }),

  getAuditLogs: (limit = 50, offset = 0): Promise<{ logs: AuditLog[]; total: number }> =>
    apiClient.get('/admin/audit-logs', { params: { limit, offset } }),
};

export const complianceApi = {
  getStatus: (): Promise<ComplianceReport> =>
    apiClient.get('/compliance/status'),
};

export const alertNotifyApi = {
  notify: (id: string, method: 'sms' | 'system', phone?: string) =>
    apiClient.post(`/alerts/${id}/notify`, { method, phone }),
};
