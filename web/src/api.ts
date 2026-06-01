const API_BASE = '/api';

async function request(path: string, options: RequestInit = {}) {
  const resp = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as any).error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body: any) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: any) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export const monitorApi = {
  stations: () => api.get('/monitor/stations'),
  stationsByType: (type: string) => api.get(`/monitor/stations?type=${type}`),
  realtime: () => api.get('/monitor/data/realtime'),
  trend: (dataType?: string, hours = 24) =>
    api.get(`/monitor/data/trend?hours=${hours}${dataType ? `&data_type=${dataType}` : ''}`),
  alerts: () => api.get('/monitor/alerts'),
  thresholds: (dataType?: string) =>
    api.get(`/monitor/thresholds${dataType ? `?data_type=${dataType}` : ''}`),
  postData: (data: any) => api.post('/monitor/data', data),
  postThreshold: (data: any) => api.post('/monitor/thresholds', data),
  updateAlert: (id: number, data: any) => api.put(`/monitor/alerts/${id}`, data),
};

export const warningApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/warning${qs}`);
  },
  get: (id: number) => api.get(`/warning/${id}`),
  create: (data: any) => api.post('/warning', data),
  update: (id: number, data: any) => api.put(`/warning/${id}`, data),
  publish: (id: number, channelIds: number[], operator = '值班员') =>
    api.post(`/warning/${id}/publish`, { channel_ids: channelIds, operator }),
  cancel: (id: number, reason: string, operator = '值班员') =>
    api.post(`/warning/${id}/cancel`, { reason, operator }),
  templates: () => api.get('/warning/templates/list'),
  createTemplate: (data: any) => api.post('/warning/templates', data),
  getTemplate: (id: number) => api.get(`/warning/templates/${id}`),
  updateTemplate: (id: number, data: any) => api.put(`/warning/templates/${id}`, data),
  logs: (id: number) => api.get(`/warning/${id}/logs`),
};

export const publishApi = {
  channels: () => api.get('/publish/channels'),
  createChannel: (data: any) => api.post('/publish/channels', data),
  updateChannel: (id: number, data: any) => api.put(`/publish/channels/${id}`, data),
  records: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/publish${qs}`);
  },
  get: (id: number) => api.get(`/publish/${id}`),
  failures: (id: number) => api.get(`/publish/${id}/failures`),
  retry: (id: number, operator = '值班员') =>
    api.post(`/publish/${id}/retry`, { operator }),
  targets: (type?: string) =>
    api.get(`/publish/targets/list${type ? `?target_type=${type}` : ''}`),
  createTarget: (data: any) => api.post('/publish/targets', data),
};

export const receiptApi = {
  list: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/receipt${qs}`);
  },
  get: (id: number) => api.get(`/receipt/${id}`),
  confirm: (id: number, operator = '系统') =>
    api.post(`/receipt/${id}/confirm`, { operator }),
  forward: (id: number, forwardTo: string, operator = '系统') =>
    api.post(`/receipt/${id}/forward`, { forward_to: forwardTo, operator }),
  act: (id: number, measures: string, operator = '系统') =>
    api.post(`/receipt/${id}/act`, { action_measures: measures, operator }),
  markNoResponse: (id: number, operator = '系统') =>
    api.post(`/receipt/${id}/no-response`, { operator }),
  feedback: (id: number, feedback: string, operator = '系统') =>
    api.post(`/receipt/${id}/feedback`, { feedback, operator }),
  byWarning: () => api.get('/receipt/summary/by-warning'),
  byTarget: () => api.get('/receipt/summary/by-target'),
};

export const reportApi = {
  overview: () => api.get('/report/overview'),
  warningStats: (start?: string, end?: string) =>
    api.get(`/report/warning-stats${start ? `?start=${start}${end ? `&end=${end}` : ''}` : ''}`),
  publishStats: (start?: string, end?: string) =>
    api.get(`/report/publish-stats${start ? `?start=${start}${end ? `&end=${end}` : ''}` : ''}`),
  receiptStats: (start?: string, end?: string) =>
    api.get(`/report/receipt-stats${start ? `?start=${start}${end ? `&end=${end}` : ''}` : ''}`),
  timeliness: () => api.get('/report/timeliness'),
  coverage: () => api.get('/report/coverage'),
  hitAccuracy: () => api.get('/report/hit-accuracy'),
  cancellationLog: () => api.get('/report/cancellation-log'),
  opsLog: (params?: any) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return api.get(`/report/ops-log${qs}`);
  },
};