import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const customers = {
  list: () => api.get('/customers'),
  get: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`)
}

export const products = {
  list: () => api.get('/products'),
  get: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
}

export const temperatureZones = {
  list: () => api.get('/temperature-zones')
}

export const locations = {
  list: (params) => api.get('/locations', { params })
}

export const inbound = {
  appointments: () => api.get('/inbound/appointments'),
  createAppointment: (data) => api.post('/inbound/appointments', data),
  records: () => api.get('/inbound/records'),
  receive: (data) => api.post('/inbound/receive', data),
  inspect: (id, data) => api.post(`/inbound/inspect/${id}`, data),
  putaway: (id, data) => api.post(`/inbound/putaway/${id}`, data)
}

export const inventory = {
  list: (params) => api.get('/inventory', { params }),
  byBatch: (batchNo) => api.get(`/inventory/batch/${batchNo}`)
}

export const temperature = {
  records: (params) => api.get('/temperature/records', { params }),
  trend: (params) => api.get('/temperature/trend', { params }),
  alerts: (params) => api.get('/temperature/alerts', { params }),
  handleAlert: (id, data) => api.post(`/temperature/alerts/${id}/handle`, data)
}

export const exceptions = {
  list: (params) => api.get('/exceptions', { params }),
  handle: (id, data) => api.post(`/exceptions/${id}/handle`, data)
}

export const outbound = {
  list: () => api.get('/outbound'),
  get: (id) => api.get(`/outbound/${id}`),
  create: (data) => api.post('/outbound', data),
  execute: (id, data) => api.post(`/outbound/${id}/execute`, data)
}

export const billing = {
  records: (params) => api.get('/billing/records', { params }),
  get: (id) => api.get(`/billing/records/${id}`),
  calculate: (data) => api.post('/billing/calculate', data),
  create: (data) => api.post('/billing/create', data),
  pay: (id) => api.post(`/billing/records/${id}/pay`)
}

export default api
