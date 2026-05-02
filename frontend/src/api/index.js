import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

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
    const res = response.data
    if (res.success) {
      return res
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.error('登录已过期，请重新登录')
        router.push('/login')
      } else if (error.response.status === 403) {
        ElMessage.error('权限不足')
      } else if (error.response.status === 409) {
        ElMessage.error('数据已被其他用户修改，请刷新后重试')
      } else {
        ElMessage.error(error.response.data?.message || '服务器错误')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getCurrentUser: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data)
}

export const orderApi = {
  getList: (params) => api.get('/orders', { params }),
  getDetail: (id) => api.get(`/orders/${id}`),
  createEntry: (data) => api.post('/orders/entry', data),
  confirmParking: (data) => api.post('/orders/parking', data),
  processBilling: (data) => api.post('/orders/billing', data),
  processPayment: (data) => api.post('/orders/payment', data),
  reconcile: (data) => api.post('/orders/reconcile', data),
  getStats: () => api.get('/orders/stats/summary')
}

export default api