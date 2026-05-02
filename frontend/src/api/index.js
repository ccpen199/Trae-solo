import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

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
    const { data } = response
    if (data.success) {
      return data
    } else {
      ElMessage.error(data.message || '请求失败')
      return Promise.reject(new Error(data.message || '请求失败'))
    }
  },
  (error) => {
    const { response } = error
    if (response) {
      switch (response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          break
        case 403:
          ElMessage.error('权限不足')
          break
        case 404:
          ElMessage.error('资源不存在')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getCurrentUser: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
  updatePassword: (data) => api.put('/auth/password', data),
  logout: () => api.post('/auth/logout')
}

export const productApi = {
  getList: (params) => api.get('/products', { params }),
  getDetail: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getMyProducts: (params) => api.get('/products/my', { params }),
  toggleFavorite: (id) => api.put(`/products/${id}/favorite`),
  getFavorites: (params) => api.get('/products/favorites/list', { params }),
  getCategories: () => api.get('/products/categories'),
  getBrands: (params) => api.get('/products/brands', { params })
}

export const orderApi = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders/my', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  pay: (id) => api.post(`/orders/${id}/pay`),
  ship: (id, data) => api.post(`/orders/${id}/ship`, data),
  receive: (id) => api.post(`/orders/${id}/receive`),
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),
  review: (id, data) => api.post(`/orders/${id}/review`, data),
  getReviews: (id) => api.get(`/orders/${id}/reviews`)
}

export const chatApi = {
  getSessions: () => api.get('/chat/sessions'),
  getSession: (productId) => api.get(`/chat/session/${productId}`),
  getMessages: (sessionId, params) => api.get(`/chat/messages/${sessionId}`, { params }),
  sendMessage: (data) => api.post('/chat/messages', data),
  flagMessage: (id, data) => api.post(`/chat/messages/${id}/flag`, data),
  checkFraud: (params) => api.get('/chat/check-fraud', { params })
}

export const disputeApi = {
  create: (data) => api.post('/disputes', data),
  getMyDisputes: (params) => api.get('/disputes/my', { params }),
  getDetail: (id) => api.get(`/disputes/${id}`),
  addEvidence: (id, data) => api.post(`/disputes/${id}/evidence`, data),
  getTypes: () => api.get('/disputes/types'),
  getResolutions: () => api.get('/disputes/resolutions')
}

export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getPendingReviews: (params) => api.get('/admin/products/review', { params }),
  approveProduct: (id, data) => api.post(`/admin/products/${id}/approve`, data),
  rejectProduct: (id, data) => api.post(`/admin/products/${id}/reject`, data),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, data) => api.put(`/admin/users/${id}/status`, data),
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
  getUserTrust: (userId) => api.get(`/admin/trust/${userId}`),
  getPendingDisputes: (params) => api.get('/disputes/pending', { params }),
  getAssignedDisputes: (params) => api.get('/disputes/assigned', { params }),
  assignDispute: (id, data) => api.post(`/disputes/${id}/assign`, data),
  mediateDispute: (id) => api.post(`/disputes/${id}/mediate`),
  resolveDispute: (id, data) => api.post(`/disputes/${id}/resolve`, data),
  closeDispute: (id) => api.post(`/disputes/${id}/close`)
}

export default api
