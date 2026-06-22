import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { ApiResponse, User, Worker, Enterprise } from '../types'

const TOKEN_KEY = 'token'
const USER_INFO_KEY = 'userInfo'
const WORKER_INFO_KEY = 'workerInfo'
const ENTERPRISE_INFO_KEY = 'enterpriseInfo'

export const tokenUtils = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY)
  },
  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token)
  },
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY)
  },
  getUserInfo(): User | null {
    const data = localStorage.getItem(USER_INFO_KEY)
    return data ? JSON.parse(data) : null
  },
  setUserInfo(user: User): void {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(user))
  },
  removeUserInfo(): void {
    localStorage.removeItem(USER_INFO_KEY)
  },
  getWorkerInfo(): Worker | null {
    const data = localStorage.getItem(WORKER_INFO_KEY)
    return data ? JSON.parse(data) : null
  },
  setWorkerInfo(worker: Worker): void {
    localStorage.setItem(WORKER_INFO_KEY, JSON.stringify(worker))
  },
  removeWorkerInfo(): void {
    localStorage.removeItem(WORKER_INFO_KEY)
  },
  getEnterpriseInfo(): Enterprise | null {
    const data = localStorage.getItem(ENTERPRISE_INFO_KEY)
    return data ? JSON.parse(data) : null
  },
  setEnterpriseInfo(enterprise: Enterprise): void {
    localStorage.setItem(ENTERPRISE_INFO_KEY, JSON.stringify(enterprise))
  },
  removeEnterpriseInfo(): void {
    localStorage.removeItem(ENTERPRISE_INFO_KEY)
  },
  clearAll(): void {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_INFO_KEY)
    localStorage.removeItem(WORKER_INFO_KEY)
    localStorage.removeItem(ENTERPRISE_INFO_KEY)
  },
}

const request: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenUtils.getToken()
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
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (res.code === 401) {
      tokenUtils.clearAll()
      window.location.href = '/login'
      return Promise.reject(new Error(res.message || '登录已过期'))
    }
    return response
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      tokenUtils.clearAll()
      window.location.href = '/login'
    }
    console.error('Response error:', error.message)
    return Promise.reject(error)
  }
)

export const http = {
  get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.get(url, config).then((res) => res.data)
  },
  post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.post(url, data, config).then((res) => res.data)
  },
  put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.put(url, data, config).then((res) => res.data)
  },
  delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.delete(url, config).then((res) => res.data)
  },
}

export default request
