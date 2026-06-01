import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(config => {
  return config
}, error => {
  return Promise.reject(error)
})

api.interceptors.response.use(response => {
  return response.data
}, error => {
  return Promise.reject(error)
})

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data)
}

export const orderAPI = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  accept: (id, data) => api.post(`/orders/${id}/accept`, data),
  arrive: (id) => api.post(`/orders/${id}/arrive`),
  complete: (id) => api.post(`/orders/${id}/complete`)
}

export const driverAPI = {
  list: (params) => api.get('/drivers', { params }),
  verify: (id, status) => api.post(`/drivers/${id}/verify`, { status })
}

export const vehicleAPI = {
  list: () => api.get('/vehicles'),
  listByDriver: (driverId) => api.get(`/vehicles/driver/${driverId}`),
  create: (data) => api.post('/vehicles', data)
}

export const statsAPI = {
  overview: () => api.get('/statistics/overview'),
  sla: () => api.get('/statistics/sla')
}

export const heatmapAPI = {
  routes: () => api.get('/heatmap/routes')
}

export const exceptionAPI = {
  list: () => api.get('/exceptions'),
  create: (data) => api.post('/exceptions', data),
  handle: (id, data) => api.post(`/exceptions/${id}/handle`, data)
}

export const pricingAPI = {
  calculate: (params) => api.get('/pricing/calculate', { params })
}

export default api
