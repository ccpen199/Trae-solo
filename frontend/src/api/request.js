import axios from 'axios'
import { showToast, showDialog } from 'vant'
import { useUserStore } from '../stores/user'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
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
    
    if (res.code !== 200) {
      showToast(res.message || '请求失败')
      
      if (res.code === 401) {
        const userStore = useUserStore()
        userStore.logout()
        showDialog({
          title: '提示',
          message: '登录已过期，请重新登录',
          confirmButtonText: '去登录'
        }).then(() => {
          window.location.href = '/login'
        })
      }
      
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    
    return res
  },
  (error) => {
    const message = error.message || '网络错误'
    
    if (message.includes('Network Error') || message.includes('timeout')) {
      showToast('网络连接失败，请检查网络')
    } else {
      showToast(message)
    }
    
    return Promise.reject(error)
  }
)

export default request
