import axios from 'axios'
import { showToast, showConfirmDialog } from 'vant'
import router from '@/router'
import { useUserStore } from '@/stores/user'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('petlove_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    const { data } = response
    if (data.success) {
      return data
    } else {
      showToast(data.message || '请求失败')
      return Promise.reject(data)
    }
  },
  async error => {
    const { response } = error
    
    if (response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      showToast('登录已过期，请重新登录')
      router.push('/login')
    } else if (response?.status === 403) {
      showToast('没有权限访问')
    } else if (response?.status === 404) {
      showToast('资源不存在')
    } else if (response?.status >= 500) {
      showToast('服务器错误')
    } else if (!window.navigator.onLine) {
      showToast('网络连接失败')
    } else if (error.code === 'ECONNABORTED') {
      showToast('请求超时')
    } else {
      showToast('请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
