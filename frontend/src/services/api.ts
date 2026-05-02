import axios from 'axios'
import { useUserStore } from '@/store/userStore'

const api = axios.create({
  baseURL: '/api',
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
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      useUserStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authApi = {
  login: (username: string, password: string) =>
    api.post('/auth/login', { username, password }),
  getMe: () => api.get('/auth/me'),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
}

export const roomsApi = {
  getAll: (params?: { status?: string; floor?: number; type?: string }) =>
    api.get('/rooms', { params }),
  getStatusSummary: () => api.get('/rooms/status-summary'),
  getById: (id: string) => api.get(`/rooms/${id}`),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.put(`/rooms/${id}/status`, { status, reason }),
  create: (data: any) => api.post('/rooms', data),
  update: (id: string, data: any) => api.put(`/rooms/${id}`, data),
  delete: (id: string) => api.delete(`/rooms/${id}`),
  getHistory: (id: string, limit?: number) =>
    api.get(`/rooms/${id}/history`, { params: { limit } }),
}

export const reservationsApi = {
  getAll: (params?: {
    status?: string
    channelId?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) => api.get('/reservations', { params }),
  getPreArrivals: () => api.get('/reservations/pre-arrivals'),
  getPreDepartures: () => api.get('/reservations/pre-departures'),
  getById: (id: string) => api.get(`/reservations/${id}`),
  create: (data: any) => api.post('/reservations', data),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.put(`/reservations/${id}/status`, { status, reason }),
  assignRoom: (id: string, roomId: string) =>
    api.put(`/reservations/${id}/assign-room`, { roomId }),
}

export const checkInsApi = {
  getAll: (params?: {
    guestName?: string
    roomNumber?: string
    page?: number
    pageSize?: number
  }) => api.get('/check-ins', { params }),
  getInHouse: () => api.get('/check-ins/in-house'),
  getById: (id: string) => api.get(`/check-ins/${id}`),
  create: (data: any) => api.post('/check-ins', data),
  checkOut: (id: string, data?: any) =>
    api.post(`/check-ins/${id}/check-out`, data),
}

export const billsApi = {
  getAll: (params?: {
    status?: string
    guestName?: string
    page?: number
    pageSize?: number
  }) => api.get('/bills', { params }),
  getById: (id: string) => api.get(`/bills/${id}`),
  addItem: (id: string, item: any) =>
    api.post(`/bills/${id}/items`, item),
  addPayment: (id: string, payment: any) =>
    api.post(`/bills/${id}/payments`, payment),
  applyDiscount: (id: string, discountAmount: number) =>
    api.post(`/bills/${id}/discount`, { discountAmount }),
  settle: (id: string, payments: any[]) =>
    api.post(`/bills/${id}/settle`, { payments }),
  getHistory: (id: string) => api.get(`/bills/${id}/history`),
}

export const cleaningApi = {
  getAll: (params?: {
    status?: string
    assigneeId?: string
    page?: number
    pageSize?: number
  }) => api.get('/cleaning', { params }),
  getMyTasks: (params?: { status?: string }) =>
    api.get('/cleaning/my-tasks', { params }),
  getStats: () => api.get('/cleaning/stats'),
  getById: (id: string) => api.get(`/cleaning/${id}`),
  create: (data: any) => api.post('/cleaning', data),
  assignTask: (id: string, assigneeId: string, notes?: string) =>
    api.put(`/cleaning/${id}/assign`, { assigneeId, notes }),
  startTask: (id: string) => api.put(`/cleaning/${id}/start`),
  completeTask: (id: string, remark?: string) =>
    api.put(`/cleaning/${id}/complete`, { remark }),
  cancelTask: (id: string, reason?: string) =>
    api.put(`/cleaning/${id}/cancel`, { reason }),
}

export const reportsApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getDaily: (params?: { startDate?: string; endDate?: string }) =>
    api.get('/reports/daily', { params }),
  getRevenue: (params?: {
    startDate?: string
    endDate?: string
    groupBy?: string
  }) => api.get('/reports/revenue', { params }),
  getAuditLogs: (params?: {
    module?: string
    action?: string
    operatorId?: string
    startDate?: string
    endDate?: string
    page?: number
    pageSize?: number
  }) => api.get('/reports/audit-logs', { params }),
  getDailyReport: (date: string) => api.get(`/reports/daily`, {
    params: { startDate: date, endDate: date }
  }),
}

export default api
