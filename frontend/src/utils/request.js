import axios from 'axios'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const url = config.url || ''
    const isLoginRequest = url.includes('/auth/login')
      if (!isLoginRequest) {
      const token = localStorage.getItem('etc_token') || localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const url = error.config?.url || ''
      const isLoginRequest = url.includes('/auth/login')
      if (!isLoginRequest) {
        localStorage.removeItem('etc_token')
        localStorage.removeItem('token')
        localStorage.removeItem('etc_user')
        const currentPath = window.location.pathname
        if (currentPath !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default request
