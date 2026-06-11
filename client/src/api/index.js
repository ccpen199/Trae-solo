import client from './client';

export const authAPI = {
  login: (data) => client.post('/auth/login', data),
  register: (data) => client.post('/auth/register', data),
  getProfile: () => client.get('/auth/profile'),
  updateProfile: (data) => client.put('/auth/profile', data)
};

export const merchantAPI = {
  list: (params) => client.get('/merchants', { params }),
  detail: (id) => client.get(`/merchants/${id}`),
  updateProfile: (data) => client.put('/merchants/profile', data),
  like: (id) => client.post(`/merchants/${id}/like`)
};

export const serviceAPI = {
  categories: () => client.get('/services/categories'),
  list: (params) => client.get('/services', { params }),
  detail: (id) => client.get(`/services/${id}`),
  compare: (ids) => client.get('/services/compare', { params: { ids } }),
  create: (data) => client.post('/services', data),
  update: (id, data) => client.put(`/services/${id}`, data),
  delete: (id) => client.delete(`/services/${id}`),
  like: (id) => client.post(`/services/${id}/like`)
};

export const caseAPI = {
  list: (params) => client.get('/cases', { params }),
  detail: (id) => client.get(`/cases/${id}`),
  ranking: (params) => client.get('/cases/ranking/likes', { params }),
  create: (data) => client.post('/cases', data),
  update: (id, data) => client.put(`/cases/${id}`, data),
  delete: (id) => client.delete(`/cases/${id}`),
  like: (id) => client.post(`/cases/${id}/like`)
};

export const marketingAPI = {
  list: (params) => client.get('/marketing', { params }),
  detail: (id) => client.get(`/marketing/${id}`),
  create: (data) => client.post('/marketing', data),
  update: (id, data) => client.put(`/marketing/${id}`, data),
  delete: (id) => client.delete(`/marketing/${id}`)
};

export const coupleAPI = {
  getProfile: () => client.get('/couple/profile'),
  updateProfile: (data) => client.put('/couple/profile', data),
  getTasks: (params) => client.get('/couple/tasks', { params }),
  createTask: (data) => client.post('/couple/tasks', data),
  updateTask: (id, data) => client.put(`/couple/tasks/${id}`, data),
  deleteTask: (id) => client.delete(`/couple/tasks/${id}`),
  getBudget: () => client.get('/couple/budget'),
  createBudgetItem: (data) => client.post('/couple/budget/items', data),
  updateBudgetItem: (id, data) => client.put(`/couple/budget/items/${id}`, data),
  deleteBudgetItem: (id) => client.delete(`/couple/budget/items/${id}`),
  getCountdown: () => client.get('/couple/countdown')
};

export const reviewAPI = {
  list: (params) => client.get('/reviews', { params }),
  create: (data) => client.post('/reviews', data),
  helpful: (id) => client.post(`/reviews/${id}/helpful`)
};

export const orderAPI = {
  list: (params) => client.get('/orders', { params }),
  detail: (id) => client.get(`/orders/${id}`),
  create: (data) => client.post('/orders', data),
  updateStatus: (id, status) => client.put(`/orders/${id}/status`, { status })
};

export const adminAPI = {
  dashboard: () => client.get('/admin/dashboard'),
  getPendingMerchants: () => client.get('/admin/merchants/pending'),
  approveMerchant: (id, data) => client.put(`/admin/merchants/${id}/approve`, data),
  rejectMerchant: (id, data) => client.put(`/admin/merchants/${id}/reject`, data),
  getKnowledge: (params) => client.get('/admin/knowledge', { params }),
  createKnowledge: (data) => client.post('/admin/knowledge', data),
  updateKnowledge: (id, data) => client.put(`/admin/knowledge/${id}`, data),
  deleteKnowledge: (id) => client.delete(`/admin/knowledge/${id}`),
  getCityManagers: () => client.get('/admin/city-managers'),
  createCityManager: (data) => client.post('/admin/city-managers', data),
  getDeposits: (params) => client.get('/admin/deposits', { params }),
  deductDeposit: (merchantId, data) => client.post(`/admin/deposits/${merchantId}/deduct`, data),
  rechargeDeposit: (merchantId, data) => client.post(`/admin/deposits/${merchantId}/recharge`, data)
};
