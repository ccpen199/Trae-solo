import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

export default api

export const enterprises = {
  list: () => api.get('/enterprises')
}

export const parkingLots = {
  list: () => api.get('/parking-lots')
}

export const appointments = {
  create: (data) => api.post('/appointments', data),
  list: (params) => api.get('/appointments', { params }),
  get: (id) => api.get(`/appointments/${id}`),
  getByQr: (qrCode) => api.get(`/appointments/qr/${qrCode}`),
  review: (id, data) => api.post(`/appointments/${id}/review`, data),
  cancel: (id, data) => api.post(`/appointments/${id}/cancel`, data)
}

export const checkin = {
  do: (data) => api.post('/checkin', data)
}

export const parking = {
  entry: (data) => api.post('/parking/entry', data),
  exit: (data) => api.post('/parking/exit', data),
  records: (params) => api.get('/parking/records', { params })
}

export const checkout = {
  do: (data) => api.post('/checkout', data)
}

export const dashboard = {
  stats: () => api.get('/dashboard/stats')
}

export const visitors = {
  list: (params) => api.get('/visitors', { params }),
  blacklist: (id, data) => api.post(`/visitors/${id}/blacklist`, data),
  setRisk: (id, data) => api.post(`/visitors/${id}/risk`, data)
}

export const logs = {
  list: () => api.get('/access-logs')
}

export const alerts = {
  list: () => api.get('/alerts')
}

export const auth = {
  login: (data) => api.post('/auth/login', data)
}
