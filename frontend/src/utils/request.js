import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: '/api',
  timeout: 30000
})

request.interceptors.request.use(
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

request.interceptors.response.use(
  (response) => {
    const res = response.data
    return res
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const data = error.response.data
      const url = error.config.url
      
      if (status === 401) {
        if (url && url.includes('/auth/login')) {
          ElMessage.error(data?.message || '用户名或密码错误')
        } else {
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          ElMessage.error('登录已过期，请重新登录')
          router.push({ name: 'Login' })
        }
      } else if (status === 403) {
        ElMessage.error(data?.message || '没有权限访问该资源')
      } else if (status === 404) {
        ElMessage.error(data?.message || '请求的资源不存在')
      } else if (status === 400) {
        ElMessage.error(data?.message || '请求参数错误')
      } else if (status === 500) {
        ElMessage.error(data?.message || '服务器内部错误')
      } else {
        ElMessage.error(data?.message || error.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error(error.message || '请求失败')
    }
    
    return Promise.reject(error)
  }
)

export default request
