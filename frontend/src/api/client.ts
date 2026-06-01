import axios from 'axios'
import type { ApiResponse } from '../types'

const TOKEN_KEY = 'k8s_gov_token'

const client = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

client.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code >= 200 && data.code < 300) {
        response.data = data.data
        return response
      }
      return Promise.reject(new Error(data.message || '请求失败'))
    }
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem('k8s_gov_user')
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    const message =
      error.response?.data?.message || error.message || '网络请求异常'
    return Promise.reject(new Error(message))
  },
)

export default client
export { TOKEN_KEY }
