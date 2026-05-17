import axios from 'axios'
import { showToast, showDialog } from 'vant'
import router from '../router'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

const request = axios.create({
  baseURL,
  timeout: 10000
})

let retryCount = 0
const MAX_RETRY = 1

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    retryCount = 0
    const { data } = response
    if (data.success) {
      return data.data
    } else {
      showToast(data.message || '请求失败')
      return Promise.reject(data)
    }
  },
  async error => {
    const originalRequest = error.config
    
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        showToast('请求超时，正在重试...')
        return request(originalRequest)
      }
    }
    
    const status = error.response?.status
    const message = error.response?.data?.message || error.message
    
    switch (status) {
      case 401:
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        showDialog({
          title: '提示',
          message: '登录已过期，请重新登录',
          confirmButtonText: '确定'
        }).then(() => {
          router.replace('/welcome')
        })
        break
      case 403:
        showToast('没有权限执行此操作')
        break
      case 404:
        showToast('资源不存在')
        break
      case 500:
        showToast('服务器错误，请稍后重试')
        break
      default:
        if (!window.navigator.onLine) {
          showToast('网络连接不可用')
        } else if (error.code === 'ECONNABORTED') {
          showToast('请求超时，请检查网络')
        } else {
          showToast(message || '网络错误')
        }
    }
    
    return Promise.reject(error)
  }
)

export default request
