import axios from 'axios'
import type { 
  Declaration, 
  DeclarationItem,
  TodoItem,
  Message,
  User,
  ApiResponse,
  PaginatedResponse 
} from '@/types'

const API_BASE = '/api'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'X-User-Id': 'system-user-001',
    'X-User-Role': 'ADMIN',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const declarationApi = {
  getList: (params?: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
    sortBy?: string
    sortOrder?: string
  }): Promise<ApiResponse<PaginatedResponse<Declaration>>> => 
    api.get('/declarations', { params }).then(r => r.data),

  getById: (id: string): Promise<ApiResponse<Declaration>> =>
    api.get(`/declarations/${id}`).then(r => r.data),

  create: (data: Partial<Declaration> & { items?: Partial<DeclarationItem>[] }): Promise<ApiResponse<Declaration>> =>
    api.post('/declarations', data).then(r => r.data),

  update: (id: string, data: Partial<Declaration> & { items?: Partial<DeclarationItem>[] }): Promise<ApiResponse<Declaration>> =>
    api.put(`/declarations/${id}`, data).then(r => r.data),

  performAction: (id: string, action: string, comment?: string): Promise<ApiResponse<Declaration>> =>
    api.post(`/declarations/${id}/action`, { action, comment }).then(r => r.data),

  getAvailableActions: (id: string): Promise<ApiResponse<{
    currentStatus: string
    currentStatusName: string
    availableActions: { code: string; name: string }[]
  }>> =>
    api.get(`/declarations/${id}/available-actions`).then(r => r.data),

  calculateTax: (id: string): Promise<ApiResponse<{
    totalTax: number
    exchangeRate: number
    taxRecords: any[]
  }>> =>
    api.post(`/declarations/${id}/calculate-tax`).then(r => r.data),

  validateDocuments: (id: string): Promise<ApiResponse<{
    isValid: boolean
    errors: string[]
    warnings: string[]
  }>> =>
    api.post(`/declarations/${id}/validate-documents`).then(r => r.data),

  lock: (id: string): Promise<ApiResponse<Declaration>> =>
    api.post(`/declarations/${id}/lock`).then(r => r.data),

  unlock: (id: string): Promise<ApiResponse<Declaration>> =>
    api.post(`/declarations/${id}/unlock`).then(r => r.data),
}

export const dashboardApi = {
  getStatusCounts: (): Promise<ApiResponse<Record<string, { count: number; displayName: string }>>> =>
    api.get('/dashboard/status-counts').then(r => r.data),

  getStatistics: (params?: { startDate?: string; endDate?: string }): Promise<ApiResponse<{
    total: number
    completed: number
    rejected: number
    inProgress: number
    avgProcessingTime: string
    completionRate: string
  }>> =>
    api.get('/dashboard/statistics', { params }).then(r => r.data),

  getKanban: (): Promise<ApiResponse<Record<string, {
    statusName: string
    count: number
    items: Declaration[]
  }>>> =>
    api.get('/dashboard/kanban').then(r => r.data),

  getRecentActivities: (limit?: number): Promise<ApiResponse<any[]>> =>
    api.get('/dashboard/recent-activities', { params: { limit } }).then(r => r.data),

  getTodoCounts: (): Promise<ApiResponse<{ pending: number; overdue: number; today: number }>> =>
    api.get('/dashboard/todo-counts').then(r => r.data),

  getExceptionCounts: (): Promise<ApiResponse<{ open: number; resolved: number; total: number }>> =>
    api.get('/dashboard/exception-counts').then(r => r.data),
}

export const userApi = {
  getList: (params?: {
    role?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<PaginatedResponse<User>>> =>
    api.get('/users', { params }).then(r => r.data),

  getById: (id: string): Promise<ApiResponse<User>> =>
    api.get(`/users/${id}`).then(r => r.data),

  create: (data: Partial<User> & { password: string }): Promise<ApiResponse<User>> =>
    api.post('/users', data).then(r => r.data),

  getTodos: (userId: string, params?: {
    status?: string
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<PaginatedResponse<TodoItem>>> =>
    api.get(`/users/${userId}/todos`, { params }).then(r => r.data),

  getMessages: (userId: string, params?: {
    isRead?: boolean
    page?: number
    pageSize?: number
  }): Promise<ApiResponse<PaginatedResponse<Message>>> =>
    api.get(`/users/${userId}/messages`, { params }).then(r => r.data),

  markMessageRead: (messageId: string): Promise<ApiResponse<void>> =>
    api.post(`/users/messages/${messageId}/read`).then(r => r.data),
}

export const constantsApi = {
  getAll: (): Promise<ApiResponse<{
    UserRole: Record<string, string>
    DeclarationStatus: Record<string, string>
    DocumentType: Record<string, string>
    InspectionResult: Record<string, string>
  }>> =>
    api.get('/constants').then(r => r.data),
}

export const healthApi = {
  check: (): Promise<{ status: string; timestamp: string; service: string }> =>
    axios.get('/health', { baseURL: 'http://localhost:11851' }).then(r => r.data),
}

export default api
