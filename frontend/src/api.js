const API_BASE = 'http://127.0.0.1:56825/api';

export async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return response.json();
}

export const shipments = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/shipments?${query}`);
  },
  get: (id) => request(`/shipments/${id}`),
  create: (data) => request('/shipments', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/shipments/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status) => request(`/shipments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  approveDangerous: (id, data) => request(`/shipments/${id}/approve-dangerous`, { method: 'POST', body: JSON.stringify(data) })
};

export const warehouse = {
  receive: (data) => request('/warehouse/receive', { method: 'POST', body: JSON.stringify(data) }),
  get: (shipmentId) => request(`/warehouse/${shipmentId}`)
};

export const security = {
  check: (data) => request('/security/check', { method: 'POST', body: JSON.stringify(data) }),
  get: (shipmentId) => request(`/security/${shipmentId}`)
};

export const flightStatus = {
  getFlow: () => request('/flight-status/flow'),
  update: (data) => request('/flight-status/update', { method: 'POST', body: JSON.stringify(data) }),
  get: (shipmentId) => request(`/flight-status/${shipmentId}`),
  createVersion: (data) => request('/flight-status/version', { method: 'POST', body: JSON.stringify(data) }),
  getVersions: (shipmentId) => request(`/flight-status/versions/${shipmentId}`)
};

export const charges = {
  calculate: (data) => request('/charges/calculate', { method: 'POST', body: JSON.stringify(data) }),
  add: (data) => request('/charges/add', { method: 'POST', body: JSON.stringify(data) }),
  get: (shipmentId) => request(`/charges/${shipmentId}`),
  verify: (data) => request('/charges/verify', { method: 'POST', body: JSON.stringify(data) })
};

export const subscriptions = {
  subscribe: (data) => request('/subscriptions/subscribe', { method: 'POST', body: JSON.stringify(data) }),
  get: (shipmentId) => request(`/subscriptions/${shipmentId}`),
  getNotifications: (shipmentId) => request(`/subscriptions/notifications/${shipmentId}`),
  unsubscribe: (id) => request(`/subscriptions/${id}`, { method: 'DELETE' })
};
