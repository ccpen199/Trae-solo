import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
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

api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          router.push('/login')
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 422:
          const errors = error.response.data?.errors
          if (errors) {
            const messages = errors.map((e: { msg: string }) => e.msg).join(', ')
            ElMessage.error(messages)
          } else {
            ElMessage.error('请求参数验证失败')
          }
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          const message = error.response.data?.detail || error.response.data?.message || '请求失败'
          ElMessage.error(message)
      }
    } else if (error.request) {
      ElMessage.error('网络错误，请检查网络连接')
    } else {
      ElMessage.error('请求配置错误')
    }

    return Promise.reject(error)
  }
)

export const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig) => api.get<T>(url, config),
  post: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.post<T>(url, data, config),
  put: <T>(url: string, data?: unknown, config?: AxiosRequestConfig) => api.put<T>(url, data, config),
  delete: <T>(url: string, config?: AxiosRequestConfig) => api.delete<T>(url, config),
}

export default api
