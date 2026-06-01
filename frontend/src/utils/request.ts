import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { showToast } from 'vant'
import router from '@/router'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const service = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.success) {
      return res
    } else {
      showToast({
        message: res.message || '请求失败',
        type: 'fail'
      })
      return Promise.reject(new Error(res.message || '请求失败'))
    }
  },
  (error: AxiosError) => {
    if (error.code === 'ERR_NETWORK') {
      showToast({
        message: '网络连接失败，请检查网络',
        type: 'fail'
      })
    } else if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          showToast({
            message: '登录已过期，请重新登录',
            type: 'fail'
          })
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          break
        case 403:
          showToast({
            message: '没有权限访问',
            type: 'fail'
          })
          break
        case 404:
          showToast({
            message: '请求的资源不存在',
            type: 'fail'
          })
          break
        case 500:
          showToast({
            message: '服务器错误',
            type: 'fail'
          })
          break
        default:
          showToast({
            message: error.message || '请求失败',
            type: 'fail'
          })
      }
    } else if (error.code === 'ECONNABORTED') {
      showToast({
        message: '请求超时，请重试',
        type: 'fail'
      })
    }
    return Promise.reject(error)
  }
)

export default service
