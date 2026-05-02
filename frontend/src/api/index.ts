import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8002/api/v1',
  timeout: 10000
})

export const demandApi = {
  list: () => api.get('/demands'),
  get: (id: string) => api.get(`/demands/${id}`),
  create: (data: any) => api.post('/demands', data),
  assignDesigner: (id: string, data: any) => api.post(`/demands/${id}/assign-designer`, data)
}

export const measurementApi = {
  list: () => api.get('/measurements'),
  get: (id: string) => api.get(`/measurements/${id}`),
  create: (data: any) => api.post('/measurements', data),
  start: (id: string, data: any) => api.post(`/measurements/${id}/start`, data),
  complete: (id: string, data: any) => api.post(`/measurements/${id}/complete`, data)
}

export const designApi = {
  list: () => api.get('/designs'),
  get: (id: string) => api.get(`/designs/${id}`),
  create: (data: any) => api.post('/designs', data),
  update: (id: string, data: any) => api.put(`/designs/${id}`, data),
  submit: (id: string, data: any) => api.post(`/designs/${id}/submit`, data),
  review: (id: string, data: any) => api.post(`/designs/${id}/review`, data)
}

export const quoteApi = {
  list: () => api.get('/quotes'),
  get: (id: string) => api.get(`/quotes/${id}`),
  create: (data: any) => api.post('/quotes', data),
  submit: (id: string) => api.post(`/quotes/${id}/submit`),
  confirm: (id: string, data: any) => api.post(`/quotes/${id}/confirm`, data)
}

export const orderApi = {
  list: () => api.get('/orders'),
  get: (id: string) => api.get(`/orders/${id}`),
  create: (data: any) => api.post('/orders', data),
  signContract: (id: string, data: any) => api.post(`/orders/${id}/sign-contract`, data),
  payment: (id: string, data: any) => api.post(`/orders/${id}/payment`, data)
}

export const splitApi = {
  list: () => api.get('/splits'),
  get: (id: string) => api.get(`/splits/${id}`),
  create: (data: any) => api.post('/splits', data),
  execute: (id: string, data: any) => api.post(`/splits/${id}/execute`, data),
  submit: (id: string, data: any) => api.post(`/splits/${id}/submit`, data),
  review: (id: string, data: any) => api.post(`/splits/${id}/review`, data)
}

export const productionApi = {
  list: () => api.get('/production'),
  get: (id: string) => api.get(`/production/${id}`),
  create: (data: any) => api.post('/production', data),
  start: (id: string, data: any) => api.post(`/production/${id}/start`, data),
  progress: (id: string, data: any) => api.post(`/production/${id}/progress`, data),
  complete: (id: string, data: any) => api.post(`/production/${id}/complete`, data)
}

export const installationApi = {
  list: () => api.get('/installations'),
  get: (id: string) => api.get(`/installations/${id}`),
  create: (data: any) => api.post('/installations', data),
  autoAssign: (id: string, data: any) => api.post(`/installations/${id}/auto-assign`, data),
  assign: (id: string, data: any) => api.post(`/installations/${id}/assign`, data),
  start: (id: string, data: any) => api.post(`/installations/${id}/start`, data),
  complete: (id: string, data: any) => api.post(`/installations/${id}/complete`, data),
  accept: (id: string, data: any) => api.post(`/installations/${id}/accept`, data)
}

export default api
