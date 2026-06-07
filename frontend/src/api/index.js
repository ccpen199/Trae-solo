import request from '@/utils/request'

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  faceVerify: (data) => request.post('/auth/face-verify', data),
  licenseVerify: (data) => request.post('/auth/business-license-verify', data),
  getUserInfo: () => request.get('/auth/userinfo'),
  adminLogin: (data) => request.post('/auth/admin/login', data)
}

export const serviceApi = {
  getList: (params) => request.get('/services', { params }),
  getDetail: (id) => request.get(`/services/${id}`),
  getHotList: () => request.get('/services/hot/list'),
  getByCategory: (category) => request.get(`/services/category/${category}`)
}

export const applicationApi = {
  create: (data) => request.post('/applications', data),
  getMyList: (params) => request.get('/applications/my', { params }),
  getDetail: (id) => request.get(`/applications/${id}`),
  cancel: (id) => request.post(`/applications/${id}/cancel`)
}

export const certificateApi = {
  getMyList: () => request.get('/certificates/my'),
  getTypes: () => request.get('/certificates/types'),
  getDetail: (id) => request.get(`/certificates/${id}`),
  verify: (id) => request.post(`/certificates/verify/${id}`)
}

export const workOrderApi = {
  create: (data) => request.post('/workorders', data),
  getMyList: (params) => request.get('/workorders/my', { params }),
  getDetail: (id) => request.get(`/workorders/${id}`)
}

export const adminApi = {
  getDashboard: () => request.get('/admin/dashboard'),
  getApplications: (params) => request.get('/admin/applications', { params }),
  processApplication: (id, data) => request.post(`/admin/applications/${id}/process`, data),
  getWorkOrders: (params) => request.get('/admin/workorders', { params }),
  assignWorkOrder: (id, data) => request.post(`/admin/workorders/${id}/assign`, data),
  getServices: () => request.get('/admin/services'),
  createService: (data) => request.post('/admin/services', data),
  updateService: (id, data) => request.put(`/admin/services/${id}`, data),
  getOverdueApplications: () => request.get('/admin/overdue/applications'),
  getSystemHealth: () => request.get('/admin/health/systems')
}
