import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

let isRedirectingToLogin = false

const request = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
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
    return response.data
  },
  error => {
    const { response } = error
    
    if (response) {
      switch (response.status) {
        case 401:
          if (!isRedirectingToLogin && router.currentRoute.value.path !== '/login') {
            isRedirectingToLogin = true
            ElMessage.error('登录已过期，请重新登录')
            localStorage.removeItem('token')
            router.push('/login').then(() => {
              setTimeout(() => {
                isRedirectingToLogin = false
              }, 1000)
            })
          }
          break
        case 403:
          ElMessage.error('没有权限访问')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 400:
          ElMessage.error(response.data?.detail || '请求参数错误')
          break
        case 500:
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error(response.data?.detail || error.message)
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    
    return Promise.reject(error)
  }
)

export default request
