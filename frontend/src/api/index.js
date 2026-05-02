import http from './http'

export const authApi = {
  login: (data) => http.post('/auth/login', data),
  logout: () => http.post('/auth/logout'),
  getCurrentUser: () => http.get('/auth/current'),
  getRoles: () => http.get('/auth/roles'),
}

export const bookingsApi = {
  getList: (params) => http.get('/bookings', { params }),
  getDetail: (id) => http.get(`/bookings/${id}`),
  create: (data) => http.post('/bookings', data),
  submit: (id, data) => http.post(`/bookings/${id}/submit`, data),
  approve: (id, data) => http.post(`/bookings/${id}/approve`, data),
  reject: (id, data) => http.post(`/bookings/${id}/reject`, data),
  portEntry: (id, data) => http.post(`/bookings/${id}/port-entry`, data),
  loading: (id, data) => http.post(`/bookings/${id}/loading`, data),
  releaseBol: (id, data) => http.post(`/bookings/${id}/release-bol`, data),
}

export const schedulesApi = {
  getList: (params) => http.get('/schedules', { params }),
  getById: (id) => http.get(`/schedules/${id}`),
}

export const containerApi = {
  assign: (bookingId, data) => http.post(`/containers/${bookingId}/assign`, data),
  validate: (data) => http.post('/containers/validate', data),
}

export const billsApi = {
  getByMainId: (mainId) => http.get(`/bills/main/${mainId}`),
  getById: (id) => http.get(`/bills/${id}`),
  create: (data) => http.post('/bills', data),
  lock: (mainId) => http.post(`/bills/lock/${mainId}`),
  unlock: (mainId) => http.post(`/bills/unlock/${mainId}`),
  release: (mainId, data) => http.post(`/bills/release/${mainId}`, data),
}

export const messageApi = {
  getList: (params) => http.get('/messages', { params }),
  getPendingCount: () => http.get('/messages/pending-count'),
  markRead: (id) => http.post(`/messages/${id}/read`),
  markAllAsRead: (mainId) => http.post(`/messages/main/${mainId}/read-all`),
}

export const auditApi = {
  getList: (params) => http.get('/audit', { params }),
  getByMainId: (mainId, params) => http.get(`/audit/main/${mainId}`, { params }),
}

export const exceptionApi = {
  getList: (params) => http.get('/exceptions', { params }),
  getStatistics: () => http.get('/exceptions/statistics'),
  getById: (id) => http.get(`/exceptions/${id}`),
  handle: (id, data) => http.post(`/exceptions/${id}/handle`, data),
  resolve: (id, data) => http.post(`/exceptions/${id}/resolve`, data),
}

export default {
  auth: authApi,
  bookings: bookingsApi,
  schedules: schedulesApi,
  container: containerApi,
  bills: billsApi,
  message: messageApi,
  audit: auditApi,
  exception: exceptionApi,
}
