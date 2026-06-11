import axios from 'axios'
import { getToken, removeToken } from './auth'

const request = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  config => {
    const token = getToken()
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
    const res = response.data
    if (res.code === 0) {
      return res
    }
    const err = new Error(res.message || '请求失败')
    err.code = res.code
    err.data = res.data
    return Promise.reject(err)
  },
  error => {
    if (error.response && error.response.status === 401) {
      removeToken()
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        window.location.href = '/login'
      }
    }
    const msg = error.response?.data?.message || error.message || '网络连接失败，请检查后端服务'
    const err = new Error(msg)
    err.status = error.response?.status
    return Promise.reject(err)
  }
)

export default request
