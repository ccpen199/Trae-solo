import axios from 'axios'
import { useUserStore } from '../store'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = useUserStore.getState().token
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
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
    }
    return Promise.reject(error.response?.data || error)
  }
)

export const userApi = {
  register: (data) => api.post('/users/register', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  updatePassword: (data) => api.put('/users/password', data),
  agreement: (data) => api.post('/users/agreement', data),
  getMemberInfo: () => api.get('/users/member/info')
}

export const productApi = {
  getCategories: () => api.get('/products/categories'),
  getList: (params) => api.get('/products/list', { params }),
  getDetail: (id) => api.get(`/products/detail/${id}`),
  getHot: (limit = 10) => api.get('/products/hot', { params: { limit } }),
  getNew: (limit = 10) => api.get('/products/new', { params: { limit } }),
  getRecommend: (limit = 10) => api.get('/products/recommend', { params: { limit } }),
  getFlashSales: () => api.get('/products/flash-sales'),
  getMemberOnly: (params) => api.get('/products/member-only', { params })
}

export const cartApi = {
  getList: () => api.get('/cart/list'),
  add: (data) => api.post('/cart/add', data),
  update: (data) => api.put('/cart/update', data),
  remove: (data) => api.delete('/cart/remove', { data }),
  clear: () => api.delete('/cart/clear'),
  getCount: () => api.get('/cart/count')
}

export const orderApi = {
  getCheckoutInfo: () => api.get('/orders/checkout-info'),
  create: (data) => api.post('/orders/create', data),
  getList: (params) => api.get('/orders/list', { params }),
  getDetail: (orderId) => api.get(`/orders/detail/${orderId}`),
  pay: (data) => api.post('/orders/pay', data),
  cancel: (data) => api.post('/orders/cancel', data),
  confirmReceipt: (data) => api.post('/orders/confirm-receipt', data),
  applyAfterSale: (data) => api.post('/orders/after-sale', data),
  getAfterSaleList: () => api.get('/orders/after-sale/list')
}

export const videoApi = {
  getList: (params) => api.get('/videos/list', { params }),
  getDetail: (videoId) => api.get(`/videos/detail/${videoId}`),
  like: (data) => api.post('/videos/like', data),
  favorite: (data) => api.post('/videos/favorite', data),
  getMyVideos: (params) => api.get('/videos/my-videos', { params }),
  getMyFavorites: (params) => api.get('/videos/my-favorites', { params }),
  create: (data) => api.post('/videos/create', data)
}

export const addressApi = {
  getList: () => api.get('/addresses/list'),
  getDefault: () => api.get('/addresses/default'),
  create: (data) => api.post('/addresses/create', data),
  update: (id, data) => api.put(`/addresses/update/${id}`, data),
  delete: (id) => api.delete(`/addresses/delete/${id}`),
  setDefault: (id) => api.put(`/addresses/set-default/${id}`)
}

export default api
