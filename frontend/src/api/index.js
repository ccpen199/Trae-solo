import axios from 'axios'
import { useUserStore } from '../stores/user'
import { useToast } from '../stores/toast'
import router from '../router'

const instance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let retryCount = 0
const MAX_RETRY = 1

instance.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

instance.interceptors.response.use(
  response => {
    retryCount = 0
    const res = response.data
    if (res.success) {
      return res
    } else {
      const toast = useToast()
      toast.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  async error => {
    const toast = useToast()
    const originalRequest = error.config

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        return instance(originalRequest)
      }
      toast.error('请求超时，请稍后重试')
      return Promise.reject(error)
    }

    if (!error.response) {
      toast.error('网络断开，请检查网络连接')
      return Promise.reject(error)
    }

    const status = error.response.status

    switch (status) {
      case 401:
        const userStore = useUserStore()
        userStore.logout()
        toast.error('请先登录')
        router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
        break
      case 403:
        toast.error('无权限访问')
        break
      case 404:
        toast.error('资源不存在')
        break
      case 500:
        toast.error('服务器错误')
        break
      default:
        toast.error(error.response.data?.message || `请求失败 (${status})`)
    }

    return Promise.reject(error)
  }
)

export const api = instance

export const authApi = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  loginPhone: (phone, code) => api.post('/auth/login-phone', { phone, code }),
  loginWechat: (openId, nickname, avatar) => api.post('/auth/login-wechat', { openId, nickname, avatar }),
  loginQQ: (openId, nickname, avatar) => api.post('/auth/login-qq', { openId, nickname, avatar }),
  getProfile: () => api.get('/auth/profile'),
  logout: () => api.post('/auth/logout')
}

export const homeApi = {
  getIndex: () => api.get('/home/index'),
  getBanners: () => api.get('/home/banners'),
  getCategories: () => api.get('/home/categories'),
  getActivityIcons: () => api.get('/home/activity-icons'),
  getBuyProducts: () => api.get('/home/buy-products'),
  getHotProducts: (params) => api.get('/home/hot-products', { params }),
  searchProducts: (params) => api.get('/product/search', { params })
}

export const productApi = {
  getDetail: (id) => api.get(`/product/detail/${id}`),
  toggleFavorite: (productId) => api.post('/favorite/toggle', { productId })
}

export const cartApi = {
  getList: () => api.get('/cart'),
  addToCart: (productId, quantity = 1) => api.post('/cart/add', { productId, quantity }),
  updateCart: (cartId, quantity, selected) => api.post('/cart/update', { cartId, quantity, selected }),
  deleteCart: (cartIds) => api.post('/cart/delete', { cartIds }),
  getCount: () => api.get('/cart/count')
}

export const orderApi = {
  create: (productId, quantity, type, groupId, addressId) => api.post('/order/create', { productId, quantity, type, groupId, addressId }),
  pay: (orderId) => api.post('/order/pay', { orderId }),
  getList: (params) => api.get('/order/list', { params }),
  getDetail: (id) => api.get(`/order/detail/${id}`),
  cancel: (orderId) => api.post('/order/cancel', { orderId }),
  confirm: (orderId) => api.post('/order/confirm', { orderId }),
  getStats: () => api.get('/order/stats')
}

export const groupApi = {
  create: (productId, totalCount = 2) => api.post('/group/create', { productId, totalCount }),
  getList: (productId) => api.get('/group/list', { params: { productId } }),
  getDetail: (id) => api.get(`/group/detail/${id}`)
}

export const favoriteApi = {
  getList: (params) => api.get('/favorite', { params }),
  toggle: (productId) => api.post('/favorite/toggle', { productId }),
  delete: (productIds) => api.post('/favorite/delete', { productIds })
}

export const followApi = {
  getList: (params) => api.get('/follow', { params }),
  toggle: (shopId) => api.post('/follow/toggle', { shopId })
}

export const liveApi = {
  getList: (params) => api.get('/live/list', { params }),
  getDetail: (id) => api.get(`/live/detail/${id}`),
  like: (liveId) => api.post('/live/like', { liveId }),
  enter: (liveId) => api.post('/live/enter', { liveId })
}

export const dynamicApi = {
  getList: (params) => api.get('/dynamic/list', { params }),
  getDetail: (id) => api.get(`/dynamic/detail/${id}`),
  like: (dynamicId) => api.post('/dynamic/like', { dynamicId })
}

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data)
}

export const addressApi = {
  getList: () => api.get('/address'),
  getDefault: () => api.get('/address/default'),
  create: (data) => api.post('/address', data),
  update: (id, data) => api.put(`/address/${id}`, data),
  delete: (id) => api.delete(`/address/${id}`)
}

export const activityApi = {
  getOrchard: () => api.get('/activity/orchard'),
  waterOrchard: () => api.post('/activity/orchard/water'),
  fertilizeOrchard: () => api.post('/activity/orchard/fertilize'),
  getBargain: (params) => api.get('/activity/bargain', { params }),
  createBargain: (productId) => api.post('/activity/bargain/create', { productId }),
  getCash: () => api.get('/activity/cash'),
  inviteCash: () => api.post('/activity/cash/invite')
}

export const adminApi = {
  login: (username, password) => api.post('/admin/login', { username, password }),
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getProducts: (params) => api.get('/admin/products', { params }),
  getOrders: (params) => api.get('/admin/orders', { params })
}
