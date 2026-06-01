const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || res.statusText);
  }
  return res.json();
}

export const api = {
  getDashboard: (stationId = 1) => request(`/dashboard?station_id=${stationId}`),
  getOrders: (params = '') => request(`/orders${params ? '?' + params : ''}`),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrderStatus: (id, data) => request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getBatteries: (params = '') => request(`/batteries${params ? '?' + params : ''}`),
  getBattery: (id) => request(`/batteries/${id}`),
  createBattery: (data) => request('/batteries', { method: 'POST', body: JSON.stringify(data) }),
  updateBattery: (id, data) => request(`/batteries/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateBatteryStatus: (id, data) => request(`/batteries/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  getAlerts: (params = '') => request(`/safety/alerts${params ? '?' + params : ''}`),
  createAlert: (data) => request('/safety/alerts', { method: 'POST', body: JSON.stringify(data) }),
  updateAlert: (id, data) => request(`/safety/alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getWorkOrders: (params = '') => request(`/safety/work-orders${params ? '?' + params : ''}`),
  createWorkOrder: (data) => request('/safety/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateWorkOrder: (id, data) => request(`/safety/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getReservations: (params = '') => request(`/reservations${params ? '?' + params : ''}`),
  createReservation: (data) => request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
  updateReservation: (id, data) => request(`/reservations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  getSwapFrequency: (params = '') => request(`/reports/swap-frequency${params ? '?' + params : ''}`),
  getBatteryTurnover: (params = '') => request(`/reports/battery-turnover${params ? '?' + params : ''}`),
  getStationLoad: (params = '') => request(`/reports/station-load${params ? '?' + params : ''}`),
  getFaultRate: (params = '') => request(`/reports/fault-rate${params ? '?' + params : ''}`),
  getRevenue: (params = '') => request(`/reports/revenue${params ? '?' + params : ''}`),
};
