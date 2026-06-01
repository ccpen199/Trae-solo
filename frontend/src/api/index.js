import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getHealth = () => api.get('/health')

export const getProductionLines = () => api.get('/production-lines/')
export const createProductionLine = (data) => api.post('/production-lines/', data)

export const getShifts = () => api.get('/shifts/')
export const createShift = (data) => api.post('/shifts/', data)

export const getDevices = (params) => api.get('/devices/', { params })
export const getDevice = (id) => api.get(`/devices/${id}`)
export const createDevice = (data) => api.post('/devices/', data)
export const updateDevice = (id, data) => api.put(`/devices/${id}`, data)

export const getOperationRecords = (params) => api.get('/operation-records/', { params })
export const createOperationRecord = (data) => api.post('/operation-records/', data)
export const updateOperationRecord = (id, data) => api.put(`/operation-records/${id}`, data)
export const deleteOperationRecord = (id) => api.delete(`/operation-records/${id}`)

export const getProducts = () => api.get('/products/')
export const createProduct = (data) => api.post('/products/', data)
export const deleteProduct = (id) => api.delete(`/products/${id}`)

export const getWorkOrders = () => api.get('/work-orders/')
export const createWorkOrder = (data) => api.post('/work-orders/', data)
export const deleteWorkOrder = (id) => api.delete(`/work-orders/${id}`)

export const getProductionRecords = (params) => api.get('/production-records/', { params })
export const createProductionRecord = (data) => api.post('/production-records/', data)
export const deleteProductionRecord = (id) => api.delete(`/production-records/${id}`)

export const getOEE = (params) => api.get('/oee', { params })
export const getOEEByDevice = (params) => api.get('/oee/by-device', { params })
export const getOEEByShift = (params) => api.get('/oee/by-shift', { params })
export const getDowntimeEvents = (params) => api.get('/oee/downtime-events', { params })

export default api
