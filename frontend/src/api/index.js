import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

export const getHealth = () => api.get('/health')
export const getUsers = () => api.get('/users')
export const getChannels = () => api.get('/channels')
export const getProperties = (status) => api.get('/properties', { params: { status } })
export const getPropertyDetail = (id) => api.get(`/properties/${id}`)
export const updateProperty = (id, data) => api.put(`/properties/${id}`, data)
export const updatePropertyStatus = (id, data) => api.put(`/properties/${id}/status`, data)
export const getCustomers = (params) => api.get('/customers', { params })
export const getCustomerDetail = (id) => api.get(`/customers/${id}`)
export const createCustomer = (data) => api.post('/customers', data)
export const updateCustomer = (id, data) => api.put(`/customers/${id}`, data)
export const transferCustomer = (id, data) => api.post(`/customers/${id}/transfer`, data)
export const createVisit = (data) => api.post('/visits', data)
export const createFollowUp = (data) => api.post('/follow-ups', data)
export const createIntention = (data) => api.post('/intentions', data)
export const approveIntention = (id, data) => api.post(`/intentions/${id}/approve`, data)
export const refundIntention = (id, data) => api.post(`/intentions/${id}/refund`, data)
export const createChurn = (data) => api.post('/churns', data)
export const createRevisit = (data) => api.post('/revisits', data)
export const getSummaryReport = () => api.get('/reports/summary')
export const getChurnReport = () => api.get('/reports/churn-reasons')

export default api
