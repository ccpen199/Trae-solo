import axios from 'axios'
import { showToast } from 'vant'
import router from '@/router'

const instance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
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
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        router.push({
          path: '/login',
          query: { redirect: router.currentRoute.value.fullPath }
        })
        showToast('请先登录')
      } else if (status === 404) {
        router.push('/error')
      } else {
        const message = data?.message || '请求失败'
        if (!error.config.silent) {
          showToast(message)
        }
      }
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      showToast('请求超时，请稍后重试')
    } else {
      showToast('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default instance
