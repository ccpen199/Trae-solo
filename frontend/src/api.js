const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:53449/api';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };
  if (options.body) {
    config.body = JSON.stringify(options.body);
  }
  
  const response = await fetch(url, config);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export const api = {
  getHealth: () => request('/health'),
  
  getParkingLots: () => request('/parking-lots'),
  getParkingLot: (id) => request(`/parking-lots/${id}`),
  createParkingLot: (data) => request('/parking-lots', { method: 'POST', body: data }),
  updateParkingLot: (id, data) => request(`/parking-lots/${id}`, { method: 'PUT', body: data }),
  deleteParkingLot: (id) => request(`/parking-lots/${id}`, { method: 'DELETE' }),
  
  getSpotStatus: (lotId) => request(`/spot-status/parking-lot/${lotId}`),
  updateSpot: (spotId, data) => request(`/spot-status/${spotId}`, { method: 'PUT', body: data }),
  
  getRecommendations: (data) => request('/guidance/recommend', { method: 'POST', body: data }),
  recordGuidanceClick: (data) => request('/guidance/click', { method: 'POST', body: data }),
  recordArrive: (data) => request('/guidance/arrive', { method: 'POST', body: data }),
  
  getEntryExitRecords: () => request('/entry-exit'),
  recordEntry: (data) => request('/entry-exit/entry', { method: 'POST', body: data }),
  recordExit: (data) => request('/entry-exit/exit', { method: 'POST', body: data }),
  payRecord: (recordId) => request('/entry-exit/pay', { method: 'POST', body: { record_id: recordId } }),
  verifyData: (lotId) => request(`/entry-exit/verify/${lotId}`),
  
  getDashboardStats: () => request('/dashboard/stats'),
  getDashboardLots: () => request('/dashboard/parking-lots'),
  getHourlyTraffic: () => request('/dashboard/hourly-traffic'),
  getDeviceLogs: () => request('/dashboard/device-status')
};
