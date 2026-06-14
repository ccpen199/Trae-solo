import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store/authStore'

const service: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json;charset=utf-8',
  },
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    console.error('Request error:', error)
    return Promise.reject(error)
  },
)

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (!res.ok) {
      message.error(res.message || '请求失败')
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      if (status === 401) {
        useAuthStore.getState().logout()
        message.error('登录已过期，请重新登录')
        window.location.href = '/login'
      } else if (status === 403) {
        message.error('没有权限访问')
      } else if (status === 404) {
        message.error('请求的资源不存在')
      } else if (status >= 500) {
        message.error('服务器错误')
      } else {
        message.error(error.response.data?.message || '请求失败')
      }
    } else {
      message.error('网络错误，请检查网络连接')
    }
    return Promise.reject(error)
  },
)

export interface ResponseData<T = any> {
  ok: boolean
  message?: string
  data: T
  code?: number
}

export const request = <T = any>(config: AxiosRequestConfig): Promise<ResponseData<T>> => {
  return service.request<any, ResponseData<T>>(config)
}

export const get = <T = any>(url: string, config?: AxiosRequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ method: 'GET', url, ...config })
}

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ method: 'POST', url, data, ...config })
}

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ method: 'PUT', url, data, ...config })
}

export const del = <T = any>(url: string, config?: AxiosRequestConfig): Promise<ResponseData<T>> => {
  return request<T>({ method: 'DELETE', url, ...config })
}

export default service
