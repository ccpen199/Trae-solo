import axios from 'axios'
import { message } from 'antd'

const request = axios.create({
  baseURL: '/api',
  timeout: 10000
})

request.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      try {
        const user = JSON.parse(userStr)
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`
        }
      } catch (e) {
        // ignore
      }
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
        localStorage.removeItem('user')
        window.location.href = '/login'
        message.error('登录已过期，请重新登录')
      } else if (status === 403) {
        message.error('没有权限执行此操作')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else {
        message.error(data?.message || data?.error || '请求失败')
      }
    } else {
      message.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  }
)

export default request
