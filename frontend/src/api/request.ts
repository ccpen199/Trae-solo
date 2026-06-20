import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'

const baseURL = import.meta.env.VITE_API_URL || '/api'

const request: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
}

export function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.get(url, config)
}

export function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.post(url, data, config)
}

export function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.put(url, data, config)
}

export function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
  return request.delete(url, config)
}

export default request
