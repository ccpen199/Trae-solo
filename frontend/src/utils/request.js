import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

request.interceptors.request.use(
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

const handleResponseError = async (error) => {
  const originalRequest = error.config

  if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
    if (!originalRequest._retry) {
      originalRequest._retry = true
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1
      if (originalRequest._retryCount <= 1) {
        return request(originalRequest)
      }
    }
    ElMessage.error('请求超时，请稍后重试')
    return Promise.reject(error)
  }

  if (error.response) {
    const { status, data } = error.response
    const message = data?.message || '请求失败'

    switch (status) {
      case 401:
        if (!isRefreshing) {
          isRefreshing = true
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          if (router.currentRoute.value.name !== 'Login') {
            router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
          }
          
          ElMessage.error('登录已过期，请重新登录')
          isRefreshing = false
          processQueue(error)
        }
        return Promise.reject(error)
      
      case 403:
        ElMessage.error('无权限访问')
        break
      
      case 404:
        ElMessage.error('资源不存在')
        break
      
      case 500:
        ElMessage.error(message || '服务器错误')
        break
      
      default:
        if (status >= 400) {
          ElMessage.error(message)
        }
    }
  } else if (error.request) {
    ElMessage.error('网络连接失败，请检查网络')
  } else {
    ElMessage.error(error.message || '请求失败')
  }

  return Promise.reject(error)
}

request.interceptors.response.use(
  response => {
    const { data } = response
    
    if (data && typeof data === 'object' && 'success' in data) {
      if (data.success) {
        return data
      } else {
        ElMessage.error(data.message || '请求失败')
        return Promise.reject(new Error(data.message || '请求失败'))
      }
    }
    
    return data
  },
  handleResponseError
)

export default request
