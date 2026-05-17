import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const request = axios.create({
  baseURL: 'http://localhost:47601/api',
  timeout: 10000,
  withCredentials: true
})

let retryCount = 0
const MAX_RETRY = 1

request.interceptors.request.use(
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

request.interceptors.response.use(
  response => {
    const res = response.data
    if (res.success) {
      return res
    } else {
      ElMessage.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  async error => {
    const originalRequest = error.config

    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      ElMessage.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        ElMessage.warning('请求超时，正在重试...')
        return request(originalRequest)
      }
      ElMessage.error('请求超时，请稍后重试')
      return Promise.reject(error)
    }

    const status = error.response?.status
    switch (status) {
      case 401:
        ElMessage.error('登录已过期，请重新登录')
        const userStore = useUserStore()
        userStore.logout()
        window.location.href = '/login'
        break
      case 403:
        ElMessage.error('没有权限访问')
        break
      case 404:
        ElMessage.error('请求的资源不存在')
        break
      case 500:
        ElMessage.error('服务器错误')
        break
      default:
        ElMessage.error(error.response?.data?.message || '请求失败')
    }

    return Promise.reject(error)
  }
)

export default request
