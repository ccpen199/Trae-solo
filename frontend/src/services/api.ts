import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { useUserStore } from '../stores/userStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  code?: number
  timestamp: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
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

api.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    if (response.data && typeof response.data.success === 'boolean' && !response.data.success) {
      const error = new Error(response.data.message || '请求失败')
      ;(error as any).response = response
      return Promise.reject(error)
    }
    return response
  },
  (error) => {
    console.error('API请求错误:', error)
    
    let errorMessage = '请求失败'
    
    if (error.response) {
      if (error.response.status === 401) {
        useUserStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
        errorMessage = '未授权访问，请重新登录'
      } else if (error.response.status === 403) {
        errorMessage = '权限不足'
      } else if (error.response.status === 404) {
        errorMessage = '请求的资源不存在'
      } else if (error.response.status >= 500) {
        errorMessage = '服务器内部错误'
      } else if (error.response.data?.message) {
        errorMessage = error.response.data.message
      }
    } else if (error.request) {
      errorMessage = '网络错误，请检查网络连接或服务是否启动'
    } else {
      errorMessage = error.message || '请求失败'
    }
    
    const customError = new Error(errorMessage)
    ;(customError as any).response = error.response
    ;(customError as any).request = error.request
    ;(customError as any).originalError = error
    
    return Promise.reject(customError)
  }
)

export const userApi = {
  login: (username: string, password: string): Promise<AxiosResponse<ApiResponse<{ token: string; user: any }>>> => {
    return api.post('/users/login', { username, password })
  },

  register: (data: { username: string; password: string; name?: string; phone?: string; email?: string }): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/users/register', data)
  },

  getCurrentUser: (): Promise<AxiosResponse<ApiResponse>> => {
    return api.get('/users/me')
  },

  updateProfile: (data: { name?: string; phone?: string; email?: string }): Promise<AxiosResponse<ApiResponse>> => {
    return api.put('/users/profile', data)
  },

  changePassword: (oldPassword: string, newPassword: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.put('/users/password', { oldPassword, newPassword })
  },
}

export const pointsApi = {
  getPointsInfo: (): Promise<AxiosResponse<ApiResponse>> => {
    return api.get('/points/info')
  },

  getTransactions: (params?: {
    page?: number
    pageSize?: number
    type?: string
    startDate?: string
    endDate?: string
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get('/points/transactions', { params })
  },

  awardPoints: (data: {
    memberId: string
    points: number
    businessType: string
    businessNo?: string
    description?: string
    expiryDate?: string
  }): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/points/award', data)
  },

  triggerEvent: (data: {
    eventType: string
    eventData: Record<string, any>
    businessNo?: string
  }): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/points/trigger-event', data)
  },

  checkIn: (): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/points/check-in')
  },
}

export const exchangeApi = {
  createExchange: (data: {
    itemId: string
    itemName: string
    itemType: string
    pointsPerUnit: number
    quantity: number
    businessNo?: string
  }): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/exchanges', data)
  },

  getOrders: (params?: {
    page?: number
    pageSize?: number
    status?: string
    exchangeType?: string
    startDate?: string
    endDate?: string
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get('/exchanges', { params })
  },

  getOrder: (orderId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.get(`/exchanges/${orderId}`)
  },

  confirmExchange: (orderId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post(`/exchanges/${orderId}/confirm`)
  },

  cancelExchange: (orderId: string, reason?: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post(`/exchanges/${orderId}/cancel`, { reason })
  },
}

export const ruleApi = {
  getRules: (params?: {
    page?: number
    pageSize?: number
    type?: string
    status?: string
    keyword?: string
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get('/rules', { params })
  },

  getRule: (ruleId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.get(`/rules/${ruleId}`)
  },

  createRule: (data: Record<string, any>): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/rules', data)
  },

  updateRule: (ruleId: string, data: Record<string, any>): Promise<AxiosResponse<ApiResponse>> => {
    return api.put(`/rules/${ruleId}`, data)
  },

  activateRule: (ruleId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post(`/rules/${ruleId}/activate`)
  },

  deactivateRule: (ruleId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post(`/rules/${ruleId}/deactivate`)
  },

  deleteRule: (ruleId: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.delete(`/rules/${ruleId}`)
  },
}

export const reconciliationApi = {
  getReconciliations: (params?: {
    page?: number
    pageSize?: number
  }): Promise<AxiosResponse<ApiResponse<PaginatedResponse<any>>>> => {
    return api.get('/reconciliations', { params })
  },

  getReconciliationByDate: (date: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.get(`/reconciliations/by-date?date=${date}`)
  },

  executeReconciliation: (date?: string): Promise<AxiosResponse<ApiResponse>> => {
    return api.post('/reconciliations/execute', { date })
  },
}

export default api
