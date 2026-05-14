import axios from 'axios'
import { message } from 'antd'
import useUserStore from '../store/user'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true
})

let retryCount = 0
const MAX_RETRY = 1

request.interceptors.request.use(
  (config) => {
    const { token, adminToken } = useUserStore.getState()
    
    if (config.url?.startsWith('/admin') && adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success) {
      return res
    } else {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  async (error) => {
    const originalRequest = error.config
    
    if (error.code === 'ECONNABORTED' && !originalRequest._retry) {
      if (retryCount < MAX_RETRY) {
        retryCount++
        originalRequest._retry = true
        message.warning('网络超时，正在重试...')
        return request(originalRequest)
      }
    }
    
    retryCount = 0
    
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          message.error(data?.message || '登录已过期，请重新登录')
          useUserStore.getState().logout()
          useUserStore.getState().adminLogout()
          if (!window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/admin/login')) {
            window.location.href = '/login'
          }
          break
        case 403:
          message.error(data?.message || '没有权限访问')
          break
        case 404:
          message.error(data?.message || '资源不存在')
          break
        case 500:
          message.error(data?.message || '服务器错误，请稍后重试')
          break
        default:
          message.error(data?.message || '请求失败')
      }
    } else if (error.code === 'ERR_NETWORK') {
      message.error('网络异常，请检查网络连接')
    } else if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
    } else {
      message.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
