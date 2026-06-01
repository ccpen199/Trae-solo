import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58954/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000
})

export const getHealth = () => api.get('/health')
export const getCustomers = () => api.get('/customers')
export const getDrivers = () => api.get('/drivers')
export const getVehicles = () => api.get('/vehicles')
export const getProbes = () => api.get('/probes')

export const getOrders = () => api.get('/orders')
export const getOrder = (id) => api.get(`/orders/${id}`)
export const createOrder = (data) => api.post('/orders', data)

export const getDispatches = () => api.get('/dispatches')
export const checkDispatch = (data) => api.post('/dispatches/check', data)
export const createDispatch = (data) => api.post('/dispatches', data)
export const startDispatch = (id) => api.post(`/dispatches/${id}/start`)
export const getTemperatures = (id) => api.get(`/dispatches/${id}/temperatures`)

export const addTemperatureRecord = (data) => api.post('/temperature-records', data)

export const getAlerts = () => api.get('/alerts')
export const handleAlert = (id, data) => api.post(`/alerts/${id}/handle`, data)

export const getSignoff = (dispatchId) => api.get(`/signoffs/${dispatchId}`)
export const createSignoff = (data) => api.post('/signoffs', data)

export const getAudit = (orderId) => api.get(`/audit/${orderId}`)
export const getTemperatureReport = (dispatchId) => api.get(`/report/temperature/${dispatchId}`)

export default api
