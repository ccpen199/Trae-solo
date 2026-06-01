import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:58952/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

export const warehousesAPI = {
  getAll: (status?: string) => api.get('/warehouses', { params: { status } }),
  getById: (id: number) => api.get(`/warehouses/${id}`),
  getHistory: (id: number) => api.get(`/warehouses/${id}/history`),
  create: (data: any) => api.post('/warehouses', data),
  update: (id: number, data: any) => api.put(`/warehouses/${id}`, data),
  updateStatus: (id: number, data: any) => api.put(`/warehouses/${id}/status`, data),
  delete: (id: number) => api.delete(`/warehouses/${id}`),
}

export const customersAPI = {
  getAll: () => api.get('/customers'),
  getById: (id: number) => api.get(`/customers/${id}`),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  delete: (id: number) => api.delete(`/customers/${id}`),
}

export const inquiriesAPI = {
  getAll: () => api.get('/inquiries'),
  getById: (id: number) => api.get(`/inquiries/${id}`),
  getMatches: (id: number) => api.get(`/inquiries/${id}/matches`),
  create: (data: any) => api.post('/inquiries', data),
  match: (id: number) => api.post(`/inquiries/${id}/match`),
  updateStatus: (id: number, data: any) => api.put(`/inquiries/${id}/status`, data),
}

export const contractsAPI = {
  getAll: () => api.get('/contracts'),
  getById: (id: number) => api.get(`/contracts/${id}`),
  create: (data: any) => api.post('/contracts', data),
  update: (id: number, data: any) => api.put(`/contracts/${id}`, data),
  approve: (id: number, data: any) => api.post(`/contracts/${id}/approve`, data),
  terminate: (id: number, data: any) => api.post(`/contracts/${id}/terminate`, data),
}

export const billsAPI = {
  getAll: (params?: any) => api.get('/bills', { params }),
  getById: (id: number) => api.get(`/bills/${id}`),
  getPayments: (id: number) => api.get(`/bills/${id}/payments`),
  pay: (id: number, data: any) => api.post(`/bills/${id}/pay`, data),
  discount: (id: number, data: any) => api.post(`/bills/${id}/discount`, data),
  invoice: (id: number, data: any) => api.post(`/bills/${id}/invoice`, data),
}

export const reportsAPI = {
  getOverview: () => api.get('/reports/overview'),
  getWarehouseUtilization: () => api.get('/reports/warehouse-utilization'),
  getRevenue: (year?: number) => api.get('/reports/revenue', { params: { year } }),
  checkDuplicateRental: () => api.get('/reports/check-duplicate-rental'),
  getOverdueBills: () => api.get('/reports/overdue-bills'),
  getCustomerAnalysis: () => api.get('/reports/customer-analysis'),
}

export default api
