import api from './index'

export const authApi = {
  clientRegister: (data) => api.post('/auth/client/register', data),
  clientLogin: (data) => api.post('/auth/client/login', data),
  courierRegister: (data) => api.post('/auth/courier/register', data),
  courierLogin: (data) => api.post('/auth/courier/login', data),
  adminLogin: (data) => api.post('/auth/admin/login', data),
  faceVerify: (data) => api.post('/auth/courier/face-verify', data),
  licenseVerify: (data) => api.post('/auth/courier/license-verify', data)
}

export const taskApi = {
  create: (data) => api.post('/tasks', data),
  list: () => api.get('/tasks'),
  available: () => api.get('/tasks/available'),
  detail: (id) => api.get(`/tasks/${id}`),
  updateStatus: (id, data) => api.put(`/tasks/${id}/status`, data),
  accept: (id) => api.post(`/tasks/${id}/accept`),
  track: (id, data) => api.post(`/tasks/${id}/track`, data),
  verify: (id, data) => api.post(`/tasks/${id}/verify`, data)
}

export const pricingApi = {
  calculate: (data) => api.post('/pricing/calculate', data),
  rules: () => api.get('/pricing/rules')
}

export const insuranceApi = {
  create: (data) => api.post('/insurance/create', data),
  detail: (id) => api.get(`/insurance/${id}`),
  byTask: (taskId) => api.get(`/insurance/task/${taskId}`)
}

export const reviewApi = {
  create: (data) => api.post('/reviews', data),
  byTask: (taskId) => api.get(`/reviews/task/${taskId}`)
}

export const exceptionApi = {
  create: (data) => api.post('/exceptions', data),
  list: (params) => api.get('/exceptions', { params }),
  update: (id, data) => api.put(`/exceptions/${id}`, data)
}

export const adminApi = {
  zones: {
    list: () => api.get('/admin/zones'),
    create: (data) => api.post('/admin/zones', data),
    update: (id, data) => api.put(`/admin/zones/${id}`, data),
    delete: (id) => api.delete(`/admin/zones/${id}`)
  },
  restrictedItems: {
    list: () => api.get('/admin/restricted-items'),
    create: (data) => api.post('/admin/restricted-items', data),
    update: (id, data) => api.put(`/admin/restricted-items/${id}`, data),
    delete: (id) => api.delete(`/admin/restricted-items/${id}`)
  },
  disputes: {
    list: (params) => api.get('/admin/disputes', { params }),
    update: (id, data) => api.put(`/admin/disputes/${id}`, data)
  },
  auditLogs: {
    list: (params) => api.get('/admin/audit-logs', { params })
  },
  stats: () => api.get('/admin/stats'),
  couriers: {
    list: (params) => api.get('/admin/couriers', { params }),
    update: (id, data) => api.put(`/admin/couriers/${id}`, data)
  }
}
