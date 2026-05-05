import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'

const API_BASE_URL = 'http://localhost:12229/api/v1'

let api: AxiosInstance

export const initApi = (token?: string) => {
  api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      let bearerToken: string | null = null
      
      if (token && !token.startsWith('{')) {
        bearerToken = token
      } else {
        const stored = localStorage.getItem('auth-storage')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            if (parsed.state?.token) {
              bearerToken = parsed.state.token
            }
          } catch {
            // 忽略解析错误
          }
        }
      }
      
      if (bearerToken) {
        config.headers.Authorization = `Bearer ${bearerToken}`
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  api.interceptors.response.use(
    (response) => {
      return response.data
    },
    (error) => {
      if (error.response) {
        const { status, data } = error.response
        
        if (status === 401) {
          message.error('登录已过期，请重新登录')
          localStorage.removeItem('auth-storage')
          window.location.href = '/login'
          return Promise.reject(error)
        }
        
        if (data?.error?.message) {
          message.error(data.error.message)
        } else if (status === 403) {
          message.error('权限不足')
        } else if (status === 404) {
          message.error('资源不存在')
        } else if (status === 429) {
          message.error('请求过于频繁，请稍后重试')
        } else {
          message.error('请求失败，请稍后重试')
        }
      } else {
        message.error('网络错误，请检查网络连接')
      }
      
      return Promise.reject(error)
    }
  )

  return api
}

initApi()

export { api }

export const authApi = {
  register: (data: { name: string; email: string; password: string; phone?: string }) => 
    api.post('/developers/register', data),
  
  login: (data: { email: string; password: string }) => 
    api.post('/developers/login', data),
  
  getProfile: () => 
    api.get('/developers/profile'),
  
  updateProfile: (data: Partial<{ name: string; phone: string; companyName: string; description: string }>) => 
    api.put('/developers/profile', data),
}

export const applicationApi = {
  getList: (params?: { page?: number; pageSize?: number; status?: string }) => 
    api.get('/applications', { params }),
  
  getById: (id: string) => 
    api.get(`/applications/${id}`),
  
  create: (data: { 
    name: string; 
    type: string; 
    description?: string; 
    callbackUrl?: string; 
    notifyUrl?: string;
    requestedScopes?: string[];
  }) => api.post('/applications', data),
  
  update: (id: string, data: Partial<{
    name: string;
    description: string;
    callbackUrl: string;
    notifyUrl: string;
    requestedScopes: string[];
  }>) => api.put(`/applications/${id}`, data),
  
  submit: (id: string) => 
    api.post(`/applications/${id}/submit`),
  
  rotateKey: (id: string) => 
    api.post(`/applications/${id}/rotate-key`),
}

export const permissionApi = {
  getScopes: () => 
    api.get('/permissions/scopes'),
  
  getRoles: () => 
    api.get('/permissions/roles'),
  
  verify: (data: { endpoint: string; method: string; userId?: string }) => 
    api.post('/permissions/verify', data),
  
  grant: (data: { userId: string; roleType: string; applicationId: string; grantedScopes?: string[] }) => 
    api.post('/permissions/grant', data),
  
  revoke: (data: { userId: string; applicationId: string }) => 
    api.post('/permissions/revoke', data),
}

export const notificationApi = {
  getWebhooks: (params?: { applicationId?: string }) => 
    api.get('/notifications/webhooks', { params }),
  
  createWebhook: (data: { applicationId: string; eventTypes: string[]; endpointUrl: string }) => 
    api.post('/notifications/webhooks', data),
  
  updateWebhook: (id: string, data: Partial<{ eventTypes: string[]; endpointUrl: string; isActive: boolean }>) => 
    api.put(`/notifications/webhooks/${id}`, data),
  
  deleteWebhook: (id: string) => 
    api.delete(`/notifications/webhooks/${id}`),
  
  getEvents: (params?: { page?: number; pageSize?: number; applicationId?: string; eventType?: string }) => 
    api.get('/notifications/events', { params }),
}
