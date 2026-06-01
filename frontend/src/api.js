const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:56800';

export async function api(endpoint, options = {}) {
  const url = `${API_BASE}/api${endpoint}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options
  });
  return response.json();
}

export const customers = {
  getAll: () => api('/customers'),
  get: (id) => api(`/customers/${id}`),
  create: (data) => api('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addCoBorrower: (id, data) => api(`/customers/${id}/co-borrowers`, { method: 'POST', body: JSON.stringify(data) })
};

export const documents = {
  getByCustomer: (customerId) => api(`/documents/customer/${customerId}`),
  update: (id, data) => api(`/documents/${id}`, { method: 'PUT', body: JSON.stringify(data) })
};

export const credit = {
  getByCustomer: (customerId) => api(`/credit/customer/${customerId}`),
  create: (customerId, data) => api(`/credit/customer/${customerId}`, { method: 'POST', body: JSON.stringify(data) }),
  query: (id) => api(`/credit/${id}/query`, { method: 'PUT' })
};

export const approvals = {
  getByCustomer: (customerId) => api(`/approvals/customer/${customerId}`),
  create: (customerId, data) => api(`/approvals/customer/${customerId}`, { method: 'POST', body: JSON.stringify(data) })
};

export const common = {
  getUsers: () => api('/users'),
  getProducts: () => api('/products'),
  getTodos: (userId) => api(`/todos/${userId}`),
  updateTodo: (id, status) => api(`/todos/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getStats: (userId, role) => api(`/stats?userId=${userId}&role=${role}`)
};
