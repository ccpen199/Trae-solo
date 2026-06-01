const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56892/api';

export async function api(endpoint, options = {}) {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });
  return response.json();
}

export const apiGet = (endpoint) => api(endpoint, { method: 'GET' });
export const apiPost = (endpoint, data) => api(endpoint, { method: 'POST', body: JSON.stringify(data) });
export const apiPatch = (endpoint, data) => api(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
export const apiDelete = (endpoint) => api(endpoint, { method: 'DELETE' });
