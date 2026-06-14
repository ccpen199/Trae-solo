import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
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
    return response.data
  },
  (error) => {
    if (error.response) {
      const url = error.config?.url || ''
      const isLoginRequest = url.includes('/auth/') && url.includes('/login')

      if (error.response.status === 401 && !isLoginRequest) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('userType')
        ElMessage.error('登录已过期，请重新登录')
        import('@/router').then(m => m.default.push('/login'))
      } else if (isLoginRequest) {
        ElMessage.error(error.response.data?.error || '账号或密码错误')
      } else {
        ElMessage.error(error.response.data?.error || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default api
