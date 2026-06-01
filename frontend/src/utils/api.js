import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

api.interceptors.response.use(
  response => response.data,
  error => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export default {
  health: () => api.get('/health'),
  dashboard: () => api.get('/dashboard'),
  
  floors: () => api.get('/floors'),
  
  resources: (params) => api.get('/resources', { params }),
  createResource: (data) => api.post('/resources', data),
  updateResource: (id, data) => api.put(`/resources/${id}`, data),
  
  companies: () => api.get('/companies'),
  createCompany: (data) => api.post('/companies', data),
  
  members: () => api.get('/members'),
  createMember: (data) => api.post('/members', data),
  
  contracts: () => api.get('/contracts'),
  createContract: (data) => api.post('/contracts', data),
  renewContract: (id, data) => api.put(`/contracts/${id}/renew`, data),
  
  bookings: (params) => api.get('/bookings', { params }),
  checkBooking: (data) => api.post('/bookings/check', data),
  createBooking: (data) => api.post('/bookings', data),
  cancelBooking: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
  checkoutBooking: (id) => api.put(`/bookings/${id}/checkout`),
  
  bills: (params) => api.get('/bills', { params }),
  getBill: (id) => api.get(`/bills/${id}`),
  createBill: (data) => api.post('/bills', data),
  payBill: (id, data) => api.post(`/bills/${id}/pay`, data),
  
  monthlyReports: () => api.get('/reports/monthly')
}
