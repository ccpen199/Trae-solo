import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api

export const authAPI = {
  login: (data: { username: string; password: string }) =>
    api.post('/auth/login', data),
}

export const patientAPI = {
  list: (params?: any) => api.get('/patients', { params }),
  get: (id: number) => api.get(`/patients/${id}`),
  create: (data: any) => api.post('/patients', data),
  update: (id: number, data: any) => api.put(`/patients/${id}`, data),
  delete: (id: number) => api.delete(`/patients/${id}`),
}

export const appointmentAPI = {
  list: (params?: any) => api.get('/appointments', { params }),
  get: (id: number) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  update: (id: number, data: any) => api.put(`/appointments/${id}`, data),
  cancel: (id: number, reason: string) => api.post(`/appointments/${id}/cancel`, { reason }),
  updateStatus: (id: number, status: string) => api.post(`/appointments/${id}/status`, { status }),
  checkConflict: (params: any) => api.get('/appointments/check/conflict', { params }),
}

export const treatmentPlanAPI = {
  list: (params?: any) => api.get('/treatment-plans', { params }),
  get: (id: number) => api.get(`/treatment-plans/${id}`),
  create: (data: any) => api.post('/treatment-plans', data),
  update: (id: number, data: any) => api.put(`/treatment-plans/${id}`, data),
  confirm: (id: number) => api.post(`/treatment-plans/${id}/confirm`),
}

export const invoiceAPI = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: number) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  pay: (id: number, data: any) => api.post(`/invoices/${id}/pay`, data),
  refund: (id: number, data: any) => api.post(`/invoices/${id}/refund`, data),
}

export const supplyAPI = {
  list: (params?: any) => api.get('/supplies', { params }),
  get: (id: number) => api.get(`/supplies/${id}`),
  create: (data: any) => api.post('/supplies', data),
  update: (id: number, data: any) => api.put(`/supplies/${id}`, data),
  updateStock: (id: number, quantity: number) => api.post(`/supplies/${id}/stock`, { quantity }),
  delete: (id: number) => api.delete(`/supplies/${id}`),
}

export const reminderAPI = {
  list: (params?: any) => api.get('/reminders', { params }),
  create: (data: any) => api.post('/reminders', data),
  send: (id: number) => api.post(`/reminders/${id}/send`),
  cancel: (id: number) => api.post(`/reminders/${id}/cancel`),
  delete: (id: number) => api.delete(`/reminders/${id}`),
}

export const masterAPI = {
  doctors: () => api.get('/master/doctors'),
  users: () => api.get('/master/users'),
  chairs: () => api.get('/master/chairs'),
  treatments: (params?: any) => api.get('/master/treatments', { params }),
  stats: () => api.get('/master/stats'),
}
