const API_BASE = 'http://127.0.0.1:53403/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

export const versionsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/versions${qs ? '?' + qs : ''}`);
  },
  get: (id) => request(`/versions/${id}`),
  create: (data) => request('/versions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/versions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/versions/${id}`, { method: 'DELETE' }),
  compare: (id1, id2) => request(`/versions/compare/${id1}/${id2}`),
};

export const strategiesApi = {
  list: () => request('/strategies'),
  get: (id) => request(`/strategies/${id}`),
  create: (data) => request('/strategies', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/strategies/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id) => request(`/strategies/${id}`, { method: 'DELETE' }),
  activate: (id, data = {}) => request(`/strategies/${id}/activate`, { method: 'POST', body: JSON.stringify(data) }),
  pause: (id, data = {}) => request(`/strategies/${id}/pause`, { method: 'POST', body: JSON.stringify(data) }),
  hitScope: (id) => request(`/strategies/${id}/hit-scope`),
};

export const releasesApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/releases${qs ? '?' + qs : ''}`);
  },
  listByStrategy: (strategyId) => request(`/releases?strategy_id=${strategyId}`),
  get: (id) => request(`/releases/${id}`),
  create: (data) => request('/releases', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/releases/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

export const metricsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/metrics${qs ? '?' + qs : ''}`);
  },
  create: (data) => request('/metrics', { method: 'POST', body: JSON.stringify(data) }),
  alertCheck: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/metrics/alert-check${qs ? '?' + qs : ''}`);
  },
};

export const rollbacksApi = {
  list: () => request('/rollbacks'),
  get: (id) => request(`/rollbacks/${id}`),
  create: (data) => request('/rollbacks', { method: 'POST', body: JSON.stringify(data) }),
  compare: (strategyId) => request(`/rollbacks/compare/${strategyId}`),
  verify: (id) => request(`/rollbacks/verify/${id}`, { method: 'POST' }),
};