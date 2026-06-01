import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const url = error.config?.url || ''
      const method = (error.config?.method || '').toLowerCase()
      const authRequiredPrefixes = [
        '/orders', '/admin', '/auth', '/coupons/my',
        '/merchant/', '/rider/', '/users/'
      ]
      const isAuthRequired = authRequiredPrefixes.some(prefix => url.includes(prefix))
      if (isAuthRequired || method !== 'get') {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api
