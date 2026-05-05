import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  register: (formData) => api.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getProfile: () => api.get('/auth/me'),
  becomeRider: (data) => api.post('/auth/become-rider', data)
}

export const riderApi = {
  getStatus: () => api.get('/rider/status'),
  goOnline: () => api.post('/rider/go-online'),
  goOffline: () => api.post('/rider/go-offline'),
  getSettings: () => api.get('/rider/settings'),
  updateSettings: (data) => api.put('/rider/settings', data),
  getProfile: () => api.get('/rider/profile'),
  updateQualification: (data) => api.post('/rider/update-qualification', data)
}

export const orderApi = {
  getAvailable: () => api.get('/order/available'),
  getPendingPickup: () => api.get('/order/pending-pickup'),
  getInDelivery: () => api.get('/order/in-delivery'),
  getAll: (status) => api.get('/order/all', { params: { status } }),
  getDetail: (orderId) => api.get(`/order/${orderId}`),
  accept: (orderId) => api.post(`/order/${orderId}/accept`),
  offsiteArrive: (orderId) => api.post(`/order/${orderId}/offsite-arrive`),
  confirmPickup: (orderId) => api.post(`/order/${orderId}/confirm-pickup`),
  complete: (orderId) => api.post(`/order/${orderId}/complete`),
  refund: (orderId, data) => api.post(`/order/${orderId}/refund`, data),
  createTestOrder: (data) => api.post('/order/create-test-order', data)
}

export const scheduleApi = {
  getList: (date) => api.get('/schedule', { params: { date } }),
  create: (data) => api.post('/schedule', data),
  cancel: (scheduleId) => api.delete(`/schedule/${scheduleId}`)
}

export const commonApi = {
  getCities: () => api.get('/common/cities'),
  getSchools: (cityId) => api.get(`/common/schools/${cityId}`),
  initAdmin: () => api.post('/common/init-admin')
}

export default api
