import axios from 'axios'
import { message } from 'antd'
import useAuthStore from '../store/authStore'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
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
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        useAuthStore.getState().logout()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        message.error('无权限访问此资源')
      } else if (status === 404) {
        message.error('资源不存在')
      } else if (status === 500) {
        message.error(data.message || '服务器错误')
      } else {
        message.error(data.message || '请求失败')
      }
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
    } else {
      message.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default api
