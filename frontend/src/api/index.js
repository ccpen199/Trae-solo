import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
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
    const { success, message, data } = response.data
    if (!success) {
      ElMessage.error(message || '操作失败')
      return Promise.reject(new Error(message))
    }
    return data
  },
  error => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        const userStore = useUserStore()
        userStore.logout()
        ElMessage.error('登录失效，请重新登录')
      } else if (status === 403) {
        ElMessage.error('权限不足')
      } else if (status === 404) {
        ElMessage.error('资源不存在')
      } else if (status === 500) {
        ElMessage.error('服务器错误')
      } else {
        ElMessage.error(error.response.data.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时')
    } else {
      ElMessage.error('网络异常')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  sendCode: (phone) => api.post('/auth/send-code', { phone }),
  login: (phone, code) => api.post('/auth/login', { phone, code }),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data)
}

export const postAPI = {
  list: (params) => api.get('/posts', { params }),
  detail: (id) => api.get(`/posts/${id}`),
  create: (data) => api.post('/posts', data),
  like: (id) => api.post(`/posts/${id}/like`),
  comment: (id, content) => api.post(`/posts/${id}/comments`, { content })
}

export const productAPI = {
  categories: () => api.get('/products/categories'),
  list: (params) => api.get('/products', { params }),
  hot: () => api.get('/products/hot'),
  detail: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`)
}

export const designerAPI = {
  list: (params) => api.get('/designers', { params }),
  detail: (id) => api.get(`/designers/${id}`),
  apply: (data) => api.post('/designers', data),
  createWork: (data) => api.post('/designers/works', data),
  workDetail: (id) => api.get(`/designers/works/${id}`),
  follow: (id) => api.post(`/designers/${id}/follow`),
  likeWork: (id) => api.post(`/designers/works/${id}/like`)
}

export const couponAPI = {
  list: () => api.get('/coupons'),
  mine: () => api.get('/coupons/mine'),
  receive: (id) => api.post(`/coupons/${id}/receive`),
  create: (data) => api.post('/coupons', data)
}

export const cartAPI = {
  list: () => api.get('/cart'),
  add: (data) => api.post('/cart', data),
  update: (id, quantity) => api.put(`/cart/${id}`, { quantity }),
  delete: (id) => api.delete(`/cart/${id}`)
}

export const orderAPI = {
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`),
  create: (data) => api.post('/orders', data),
  pay: (id) => api.post(`/orders/${id}/pay`)
}

export const caseAPI = {
  list: (params) => api.get('/cases', { params }),
  detail: (id) => api.get(`/cases/${id}`),
  create: (data) => api.post('/cases', data),
  like: (id) => api.post(`/cases/${id}/like`)
}

export const homeAPI = {
  index: () => api.get('/home'),
  banners: () => api.get('/home/banners'),
  activities: () => api.get('/home/activities')
}

export default api