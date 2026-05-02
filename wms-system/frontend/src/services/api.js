const API_BASE_URL = 'http://localhost:8888/api';

const fetchApi = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export const appointmentService = {
  create: (data) => fetchApi('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  confirm: (id) => fetchApi(`/appointments/${id}/confirm`, { method: 'PUT' }),
  cancel: (id) => fetchApi(`/appointments/${id}/cancel`, { method: 'PUT' }),
  list: (params = {}) => fetchApi(`/appointments?status=${params.status || ''}`),
  getById: (id) => fetchApi(`/appointments/${id}`),
};

export const inboundService = {
  create: (data) => fetchApi('/inbound', { method: 'POST', body: JSON.stringify(data) }),
  processItem: (id, data) => fetchApi(`/inbound/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  complete: (id) => fetchApi(`/inbound/${id}/complete`, { method: 'PUT' }),
  list: (params = {}) => fetchApi(`/inbound?status=${params.status || ''}`),
  getById: (id) => fetchApi(`/inbound/${id}`),
};

export const outboundService = {
  create: (data) => fetchApi('/outbound', { method: 'POST', body: JSON.stringify(data) }),
  generateWavePicks: (data) => fetchApi('/outbound/wave-picks', { method: 'POST', body: JSON.stringify(data) }),
  pickItem: (id) => fetchApi(`/outbound/items/${id}/pick`, { method: 'PUT' }),
  packItem: (id) => fetchApi(`/outbound/items/${id}/pack`, { method: 'PUT' }),
  ship: (id) => fetchApi(`/outbound/${id}/ship`, { method: 'PUT' }),
  list: (params = {}) => fetchApi(`/outbound?status=${params.status || ''}`),
  getById: (id) => fetchApi(`/outbound/${id}`),
};

export const auditService = {
  create: (data) => fetchApi('/audits', { method: 'POST', body: JSON.stringify(data) }),
  start: (id) => fetchApi(`/audits/${id}/start`, { method: 'PUT' }),
  submitResults: (id, data) => fetchApi(`/audits/${id}/results`, { method: 'POST', body: JSON.stringify(data) }),
  adjust: (id, data) => fetchApi(`/audits/${id}/adjust`, { method: 'PUT', body: JSON.stringify(data) }),
  list: (params = {}) => fetchApi(`/audits?status=${params.status || ''}&auditType=${params.auditType || ''}`),
  getById: (id) => fetchApi(`/audits/${id}`),
};