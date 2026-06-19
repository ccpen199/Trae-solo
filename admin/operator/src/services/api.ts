import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api/v1/operator',
  timeout: 30000
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('operator_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

request.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== undefined && res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || 'Error'))
    }
    return res.data !== undefined ? res.data : res
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('operator_token')
      window.location.href = '/login'
    } else {
      message.error(error.response?.data?.message || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export default request
