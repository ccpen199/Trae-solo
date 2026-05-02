import { request } from '@/utils/request'
import type { User, PageResult, FormDefinition, FormDetail, FormField, FormSubmission, SubmissionHistory, Notification, AuditLog } from '@/types'

export const authApi = {
  login(username: string, password: string) {
    const formData = new URLSearchParams()
    formData.append('username', username)
    formData.append('password', password)
    return request.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  },
  register(data: { username: string; password: string; email?: string }) {
    return request.post('/auth/register', data)
  },
  getCurrentUser() {
    return request.get<User>('/auth/me')
  },
  logout() {
    return request.post('/auth/logout')
  }
}

export const formApi = {
  list(params: { status?: string; page?: number; page_size?: number }) {
    return request.get<PageResult<FormDefinition>>('/forms', { params })
  },
  get(id: number) {
    return request.get<FormDetail>(`/forms/${id}`)
  },
  create(data: { name: string; code: string; description?: string; fields: FormField[] }) {
    return request.post<FormDefinition>('/forms', data)
  },
  update(id: number, data: { name?: string; description?: string; fields?: FormField[] }) {
    return request.put<FormDefinition>(`/forms/${id}`, data)
  },
  delete(id: number) {
    return request.delete(`/forms/${id}`)
  },
  publish(id: number) {
    return request.post(`/forms/${id}/publish`)
  },
  unpublish(id: number) {
    return request.post(`/forms/${id}/unpublish`)
  },
  addLogic(formId: number, data: { logic_type: string; name: string; dsl_code: string }) {
    return request.post(`/forms/${formId}/logics`, data)
  },
  getPublished(code: string) {
    return request.get(`/forms/published/${code}`)
  }
}

export const submissionApi = {
  list(params: { form_id?: number; status?: string; page?: number; page_size?: number }) {
    return request.get<PageResult<FormSubmission>>('/submissions', { params })
  },
  get(id: number) {
    return request.get<{
      id: number
      form_id: number
      user_id: number
      data: Record<string, any>
      status: string
      version: number
      created_at: string
      updated_at?: string
      submitted_at?: string
      histories: SubmissionHistory[]
    }>(`/submissions/${id}`)
  },
  create(data: { form_id?: number; form_code?: string; data: Record<string, any>; save_as_draft?: boolean }) {
    return request.post('/submissions', data)
  },
  update(id: number, data: { data: Record<string, any> }, save_as_draft: boolean = false) {
    return request.put(`/submissions/${id}`, data, { params: { save_as_draft } })
  },
  approve(id: number) {
    return request.post(`/submissions/${id}/approve`)
  },
  reject(id: number) {
    return request.post(`/submissions/${id}/reject`)
  },
  getHistory(submissionId: number, version: number) {
    return request.get(`/submissions/${submissionId}/history/${version}`)
  }
}

export const commonApi = {
  getAuditTimeline(params: {
    resource_type?: string
    resource_id?: number
    action?: string
    start_time?: string
    end_time?: string
    page?: number
    page_size?: number
  }) {
    return request.get<PageResult<AuditLog>>('/common/audit/timeline', { params })
  },
  getNotifications(params: { is_read?: boolean; page?: number; page_size?: number }) {
    return request.get<PageResult<Notification>>('/common/notifications', { params })
  },
  getUnreadCount() {
    return request.get<{ count: number }>('/common/notifications/unread-count')
  },
  markNotificationRead(id: number) {
    return request.post(`/common/notifications/${id}/read`)
  },
  markAllNotificationsRead() {
    return request.post('/common/notifications/mark-all-read')
  },
  getDashboardStats() {
    return request.get('/common/dashboard/stats')
  },
  health() {
    return request.get('/common/health')
  },
  listUsers() {
    return request.get<User[]>('/common/users')
  }
}
