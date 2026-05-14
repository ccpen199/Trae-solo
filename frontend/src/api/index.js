import axios from 'axios'
import { useUserStore } from '../stores/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  config => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  response => {
    return response.data
  },
  error => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
      }
      return Promise.reject(error.response.data || { success: false, message: '请求失败' })
    }
    return Promise.reject({ success: false, message: '网络错误' })
  }
)

export const authAPI = {
  login: (data) => api.post('/login', data),
  register: (data) => api.post('/register', data),
  checkPhone: (data) => api.post('/check-phone', data),
  checkEmail: (data) => api.post('/check-email', data),
  checkUsername: (data) => api.post('/check-username', data),
  socialLogin: (data) => api.post('/social-login', data)
}

export const productAPI = {
  getCategories: () => api.get('/categories'),
  getProducts: (params) => api.get('/products', { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  search: (params) => api.get('/products/search', { params }),
  addReview: (id, data) => api.post(`/products/${id}/reviews`, data),
  addQuestion: (id, data) => api.post(`/products/${id}/questions`, data)
}

export const cartAPI = {
  getCart: () => api.get('/cart'),
  addToCart: (data) => api.post('/cart', data),
  updateCart: (id, data) => api.put(`/cart/${id}`, data),
  deleteCart: (id) => api.delete(`/cart/${id}`),
  clearCart: () => api.delete('/cart')
}

export const orderAPI = {
  createOrder: (data) => api.post('/orders', data),
  getOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
  payOrder: (id) => api.put(`/orders/${id}/pay`),
  updateStatus: (id, status) => api.put(`/orders/${id}/status`, { status })
}

export default api