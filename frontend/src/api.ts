import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

export const inquiriesApi = {
  list: (params?: any) => api.get('/inquiries', { params }),
  get: (id: number) => api.get(`/inquiries/${id}`),
  create: (data: any) => api.post('/inquiries', data),
  update: (id: number, data: any) => api.put(`/inquiries/${id}`, data),
  delete: (id: number) => api.delete(`/inquiries/${id}`),
}

export const quotationsApi = {
  list: (params?: any) => api.get('/quotations', { params }),
  get: (id: number) => api.get(`/quotations/${id}`),
  create: (data: any) => api.post('/quotations', data),
  update: (id: number, data: any) => api.put(`/quotations/${id}`, data),
  lock: (id: number, data: any) => api.post(`/quotations/${id}/lock`, data),
  delete: (id: number) => api.delete(`/quotations/${id}`),
}

export const spaceApi = {
  list: (params?: any) => api.get('/space', { params }),
  get: (id: number) => api.get(`/space/${id}`),
  create: (data: any) => api.post('/space', data),
  update: (id: number, data: any) => api.put(`/space/${id}`, data),
  confirm: (id: number, data: any) => api.post(`/space/${id}/confirm`, data),
  cancel: (id: number) => api.post(`/space/${id}/cancel`),
}

export const bookingsApi = {
  list: (params?: any) => api.get('/bookings', { params }),
  get: (id: number) => api.get(`/bookings/${id}`),
  create: (data: any) => api.post('/bookings', data),
  update: (id: number, data: any) => api.put(`/bookings/${id}`, data),
  delete: (id: number) => api.delete(`/bookings/${id}`),
}

export const blApi = {
  list: (params?: any) => api.get('/bl', { params }),
  get: (id: number) => api.get(`/bl/${id}`),
  create: (data: any) => api.post('/bl', data),
  update: (id: number, data: any) => api.put(`/bl/${id}`, data),
  confirm: (id: number, data: any) => api.post(`/bl/${id}/confirm`, data),
  revisions: (id: number) => api.get(`/bl/${id}/revisions`),
  delete: (id: number) => api.delete(`/bl/${id}`),
}

export const settlementsApi = {
  list: (params?: any) => api.get('/settlements', { params }),
  get: (id: number) => api.get(`/settlements/${id}`),
  create: (data: any) => api.post('/settlements', data),
  update: (id: number, data: any) => api.put(`/settlements/${id}`, data),
  addItem: (id: number, data: any) => api.post(`/settlements/${id}/items`, data),
  deleteItem: (id: number, itemId: number) => api.delete(`/settlements/${id}/items/${itemId}`),
  profitReport: (params?: any) => api.get('/reports/profit', { params }),
}

export default api
