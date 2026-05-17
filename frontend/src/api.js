import axios from 'axios'
import { useStore } from './store'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
})

api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      useStore.getState().logout()
    }
    return Promise.reject(error)
  }
)

export const userApi = {
  login: (phone) => api.post('/user/login', { phone }),
  getProfile: () => api.get('/user/profile'),
  getOrders: () => api.get('/user/orders'),
}

export const consultApi = {
  getQuestionTypes: () => api.get('/question-types'),
  createQuick: (questionTypeId) => api.post('/consult/quick', { question_type_id: questionTypeId }),
  createText: (data) => api.post('/consult/text', data),
  getDetail: (orderId) => api.get(`/consult/${orderId}`),
  sendMessage: (consultationId, content) => api.post(`/consult/${consultationId}/message`, { content }),
  submitReview: (orderId, data) => api.post(`/consult/${orderId}/review`, data),
  getList: () => api.get('/consultations'),
}

export const lawyerApi = {
  getList: (params) => api.get('/lawyers', { params }),
  getDetail: (id) => api.get(`/lawyers/${id}`),
  createConsult: (data) => api.post('/lawyers/consult', data),
}

export const dailyLawApi = {
  get: () => api.get('/daily-law'),
}

export const adminApi = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  getStats: () => api.get('/admin/stats'),
  getOrders: () => api.get('/admin/orders'),
}
