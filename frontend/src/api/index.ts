import axios, { type AxiosInstance, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/stores/user'
import type { ApiResponse } from '@/types'

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    const token = userStore.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse<unknown>>) => {
    return response
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      const userStore = useUserStore()
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          userStore.logout()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限执行此操作')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(error.response.data?.message || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  },
)

export const api = {
  get: async <T>(url: string, params?: unknown) => {
    const response = await request.get<ApiResponse<T>>(url, { params })
    const res = response.data as { success: boolean; data?: T; message?: string }
    if (res.success) {
      return res.data as T
    } else {
      ElMessage.error(res.message || '请求失败')
      throw new Error(res.message || '请求失败')
    }
  },
  post: async <T>(url: string, data?: unknown) => {
    const response = await request.post<ApiResponse<T>>(url, data)
    const res = response.data as { success: boolean; data?: T; message?: string }
    if (res.success) {
      return res.data as T
    } else {
      ElMessage.error(res.message || '请求失败')
      throw new Error(res.message || '请求失败')
    }
  },
  patch: async <T>(url: string, data?: unknown) => {
    const response = await request.patch<ApiResponse<T>>(url, data)
    const res = response.data as { success: boolean; data?: T; message?: string }
    if (res.success) {
      return res.data as T
    } else {
      ElMessage.error(res.message || '请求失败')
      throw new Error(res.message || '请求失败')
    }
  },
  delete: async <T>(url: string) => {
    const response = await request.delete<ApiResponse<T>>(url)
    const res = response.data as { success: boolean; data?: T; message?: string }
    if (res.success) {
      return res.data as T
    } else {
      ElMessage.error(res.message || '请求失败')
      throw new Error(res.message || '请求失败')
    }
  },
}

export default request
