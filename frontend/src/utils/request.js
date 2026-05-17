import axios from 'axios'
import { showToast, showDialog } from 'vant'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
  retry: 1,
  retryDelay: 1000
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    if (userStore.token) {
      config.headers.Authorization = `Bearer ${userStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success) {
      return res
    } else {
      showToast(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  async (error) => {
    const config = error.config
    
    if (config.retry && config.__retryCount < config.retry) {
      config.__retryCount = config.__retryCount || 0
      config.__retryCount += 1
      
      await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      return request(config)
    }

    if (error.response) {
      const { status } = error.response
      const userStore = useUserStore()

      switch (status) {
        case 401:
          userStore.logout()
          showToast('登录已过期，请重新登录')
          window.location.href = '/login'
          break
        case 403:
          showToast('没有权限访问')
          break
        case 404:
          showToast('资源不存在')
          break
        case 500:
          showToast('服务器错误')
          break
        default:
          showToast('网络错误')
      }
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时')
    } else {
      showToast('网络连接失败')
    }

    return Promise.reject(error)
  }
)

export default request
