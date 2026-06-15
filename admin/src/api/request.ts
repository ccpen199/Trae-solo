import axios, { type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useUserStore } from '@/store/user'

const service: AxiosInstance = axios.create({
  baseURL: '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useUserStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

service.interceptors.response.use(
  (response) => {
    const res = response.data
    if (res.code !== 0 && res.code !== 200) {
      message.error(res.message || '请求失败')
      if (res.code === 401 || res.code === 403) {
        useUserStore.getState().logout()
        window.location.href = '/login'
      }
      return Promise.reject(new Error(res.message || '请求失败'))
    }
    return res
  },
  (error) => {
    if (error.response) {
      const { status } = error.response
      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录')
          useUserStore.getState().logout()
          window.location.href = '/login'
          break
        case 403:
          message.error('没有访问权限')
          break
        case 404:
          message.error('请求的资源不存在')
          break
        case 500:
          message.error('服务器内部错误')
          break
        default:
          message.error(error.response.data?.message || error.message || '请求失败')
      }
    } else if (error.request) {
      message.error('网络连接失败，请检查网络')
    } else {
      message.error(error.message || '请求失败')
    }
    return Promise.reject(error)
  }
)

export interface RequestConfig extends AxiosRequestConfig {}

const request = {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return service.get(url, config).then((res) => res.data as T)
  },
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return service.post(url, data, config).then((res) => res.data as T)
  },
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return service.put(url, data, config).then((res) => res.data as T)
  },
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T> {
    return service.delete(url, config).then((res) => res.data as T)
  }
}

export default request
