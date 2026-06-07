import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('gas_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      localStorage.setItem('token', token)
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      if (status === 401) {
        localStorage.removeItem('gas_token')
        localStorage.removeItem('token')
        localStorage.removeItem('gas_user')
        message.error('登录已过期，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else if (status === 403) {
        message.error(data?.error || '权限不足')
      } else if (status === 400) {
        message.error(data?.error || '参数错误')
      } else if (status >= 500) {
        message.error(data?.error || '服务器错误')
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
