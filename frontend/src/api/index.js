import axios from 'axios'

const baseURL = '/api'

const instance = axios.create({
  baseURL,
  timeout: 10000
})

instance.interceptors.request.use(
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

instance.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error.response?.data || { success: false, message: '网络错误' })
  }
)

export const authAPI = {
  sendCaptcha: (phone) => instance.post('/auth/send-captcha', { phone }),
  loginCaptcha: (phone, code) => instance.post('/auth/login-captcha', { phone, code }),
  loginPassword: (phone, password) => instance.post('/auth/login-password', { phone, password }),
  register: (phone, password, nickname) => instance.post('/auth/register', { phone, password, nickname }),
  thirdPartyLogin: (type, openid, nickname, avatar) => instance.post('/auth/third-party-login', { type, openid, nickname, avatar })
}

export const homeAPI = {
  getCategories: () => instance.get('/home/categories'),
  getBanners: () => instance.get('/home/banners'),
  getTopics: () => instance.get('/home/topics'),
  getHotSearch: () => instance.get('/home/hot-search')
}

export const merchantAPI = {
  getMerchants: (params) => instance.get('/merchants', { params }),
  getMerchant: (id) => instance.get(`/merchants/${id}`)
}

export const productAPI = {
  getProducts: (params) => instance.get('/products', { params })
}

export const addressAPI = {
  getAddresses: () => instance.get('/addresses'),
  getAddress: (id) => instance.get(`/addresses/${id}`),
  addAddress: (data) => instance.post('/addresses', data),
  updateAddress: (id, data) => instance.put(`/addresses/${id}`, data),
  deleteAddress: (id) => instance.delete(`/addresses/${id}`)
}

export const orderAPI = {
  getOrders: (params) => instance.get('/orders', { params }),
  getOrder: (id) => instance.get(`/orders/${id}`),
  createOrder: (data) => instance.post('/orders', data),
  payOrder: (id, payMethod) => instance.put(`/orders/${id}/pay`, { pay_method: payMethod })
}

export const userAPI = {
  getProfile: () => instance.get('/users/profile'),
  updateProfile: (data) => instance.put('/users/profile', data),
  updatePassword: (oldPassword, newPassword) => instance.put('/users/password', { oldPassword, newPassword })
}

export default instance
