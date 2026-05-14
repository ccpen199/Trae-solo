import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

let retryCount = new Map()
const MAX_RETRY = 1

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
    const data = response.data
    
    if (data && typeof data.success === 'boolean') {
      if (data.success) {
        return Promise.resolve(data)
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(data)
      }
    }
    
    return Promise.resolve(response)
  },
  async (error) => {
    const originalRequest = error.config
    const requestKey = `${originalRequest?.method}_${originalRequest?.url}`
    
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const retries = retryCount.get(requestKey) || 0
      if (retries < MAX_RETRY) {
        retryCount.set(requestKey, retries + 1)
        ElMessage.info('网络超时，正在重试...')
        return api(originalRequest)
      }
      ElMessage.error('网络超时，请稍后重试')
      return Promise.reject(error)
    }
    
    if (!error.response) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }
    
    const status = error.response.status
    
    switch (status) {
      case 401:
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        ElMessage.warning('登录已过期，请重新登录')
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
          window.location.href = '/login'
        }
        break
      case 403:
        ElMessage.error('无权限访问此资源')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器内部错误')
        break
      default:
        const errorData = error.response?.data
        if (errorData?.message) {
          ElMessage.error(errorData.message)
        } else {
          ElMessage.error(`请求失败 (${status})`)
        }
    }
    
    retryCount.delete(requestKey)
    return Promise.reject(error)
  }
)

export default api
