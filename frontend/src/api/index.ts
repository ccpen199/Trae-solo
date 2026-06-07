import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { message } from 'antd'
import { useAuthStore } from '@/store'

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().getToken()
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
  (response: AxiosResponse) => {
    return response.data
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      if (status === 401) {
        useAuthStore.getState().logout()
        message.error('登录已过期，请重新登录')
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      } else {
        message.error(data?.message || `请求失败: ${status}`)
      }
    } else if (error.request) {
      message.error('网络错误，请检查后端服务是否启动')
    } else {
      message.error('请求配置错误')
    }
    return Promise.reject(error)
  }
)

export const authAPI = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
}

export const waybillAPI = {
  list: (params?: any) => api.get('/waybills', { params }),
  create: (data: any) => api.post('/waybills', data),
  getDetail: (id: string | number) => api.get(`/waybills/${id}`),
  updateStatus: (id: string | number, status: string, operator_id?: number) =>
    api.put(`/waybills/${id}/status`, { status, operator_id }),
  cancel: (id: string | number, reason?: string) =>
    api.post(`/waybills/${id}/cancel`, { reason }),
}

export const knightAPI = {
  list: (params?: any) => api.get('/knights', { params }),
  create: (data: any) => api.post('/knights', data),
  getDetail: (id: string | number) => api.get(`/knights/${id}`),
  updateLocation: (id: string | number, lat: number, lng: number, speed?: number, heading?: number) =>
    api.put(`/knights/${id}/location`, { lat, lng, speed, heading }),
  updateStatus: (id: string | number, status: string) =>
    api.put(`/knights/${id}/status`, { status }),
  creditHistory: (id: string | number, params?: any) =>
    api.get(`/knights/${id}/credit-history`, { params }),
}

export const dispatchAPI = {
  autoDispatch: (waybillId: string | number) =>
    api.post(`/dispatch/auto/${waybillId}`),
  manualDispatch: (waybillId: string | number, knightId: string | number) =>
    api.post(`/dispatch/manual`, { waybill_id: waybillId, knight_id: knightId }),
  getCandidates: (waybillId: string | number) =>
    api.get(`/dispatch/candidates/${waybillId}`),
  getLogs: (waybillId: string | number | { waybill_id?: string | number }) => {
    const id = typeof waybillId === 'object' ? waybillId.waybill_id : waybillId
    return api.get(`/dispatch/logs/${id}`)
  },
}

export const trackingAPI = {
  submitPoint: (data: { waybill_id: number; knight_id: number; lat: number; lng: number; speed?: number; heading?: number }) =>
    api.post(`/tracking/point`, data),
  getTracking: (waybillId: string | number) => api.get(`/tracking/${waybillId}`),
  getLatest: (waybillId: string | number) => api.get(`/tracking/${waybillId}/latest`),
}

export const exceptionAPI = {
  list: (params?: any) => api.get('/exceptions', { params }),
  check: (_id?: string | number) => api.post('/exceptions/check'),
  resolve: (id: string | number, data?: { new_knight_id?: number; auto?: boolean; reassign?: boolean }) => {
    const payload = data?.reassign ? { ...data, auto: true } : data
    return api.put(`/exceptions/${id}/resolve`, payload || {})
  },
}

export const insuranceAPI = {
  verify: (waybillId: string | number, formData: FormData) =>
    api.post(`/insurance/${waybillId}/verify`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatus: (waybillId: string | number) => api.get(`/insurance/${waybillId}`),
}

export const dashboardAPI = {
  merchantStats: (merchantId: string | number) =>
    api.get(`/dashboard/merchant/${merchantId}`),
  adminStats: () => api.get('/dashboard/admin'),
  settlements: (params?: any) => api.get('/dashboard/settlements', { params }),
}

export const heatmapAPI = {
  getHeatmap: () => api.get('/heatmap'),
  refresh: () => api.post('/heatmap/refresh'),
  getPrediction: () => api.get('/heatmap/prediction'),
}

export default api
