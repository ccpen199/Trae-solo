import axios from 'axios'
import { useAuthStore } from './store'

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
    }
    console.error('API Error:', error.message)
    return Promise.reject(error)
  }
)

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
}

export const homeApi = {
  getBanners: () => api.get('/home/banners'),
  getArticles: (params) => api.get('/home/articles', { params }),
  getArticleDetail: (id) => api.get(`/home/articles/${id}`),
  getHotels: (params) => api.get('/home/hotels', { params }),
  getHotelDetail: (id) => api.get(`/home/hotels/${id}`),
  getExchangeRates: () => api.get('/home/exchange-rates'),
}

export const productApi = {
  getProducts: (params) => api.get('/product', { params }),
  getCategories: () => api.get('/product/categories'),
  getProductDetail: (id) => api.get(`/product/${id}`),
  getCart: () => api.get('/product/cart/list'),
  addToCart: (data) => api.post('/product/cart/add', data),
  removeFromCart: (id) => api.delete(`/product/cart/${id}`),
  updateCart: (data) => api.post('/product/cart/update', data),
}

export const orderApi = {
  createHotelOrder: (data) => api.post('/order/hotel/create', data),
  getHotelOrders: (params) => api.get('/order/hotel/list', { params }),
  getHotelOrderDetail: (orderNo) => api.get(`/order/hotel/${orderNo}`),
  payHotelOrder: (data) => api.post('/order/hotel/pay', data),
  createProductOrder: (data) => api.post('/order/product/create', data),
  getProductOrders: (params) => api.get('/order/product/list', { params }),
  payProductOrder: (data) => api.post('/order/product/pay', data),
}

export const communityApi = {
  getPosts: (params) => api.get('/community/posts', { params }),
  getPostDetail: (id) => api.get(`/community/posts/${id}`),
  createPost: (data) => api.post('/community/posts/create', data),
  likePost: (data) => api.post('/community/posts/like', data),
  createComment: (data) => api.post('/community/comment/create', data),
}

export default api
