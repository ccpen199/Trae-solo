const API_BASE = '/api'

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  })
  return res.json()
}

export const api = {
  auth: {
    login: (username: string, password: string) =>
      request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    getUsers: () => request('/auth/users'),
  },
  courses: {
    list: (params?: any) => request(`/courses?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/courses/${id}`),
    create: (data: any) => request('/courses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/courses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/courses/${id}`, { method: 'DELETE' }),
    getDepartments: () => request('/courses/departments/list'),
  },
  teachers: {
    list: (params?: any) => request(`/teachers?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/teachers/${id}`),
    create: (data: any) => request('/teachers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/teachers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/teachers/${id}`, { method: 'DELETE' }),
    getSchedules: (id: number, semester?: string) =>
      request(`/teachers/${id}/schedules${semester ? `?semester=${semester}` : ''}`),
    getAvailability: (id: number, semester?: string) =>
      request(`/teachers/${id}/availability${semester ? `?semester=${semester}` : ''}`),
    updateAvailability: (id: number, data: any) =>
      request(`/teachers/${id}/availability`, { method: 'POST', body: JSON.stringify(data) }),
    batchUpdateAvailability: (id: number, data: any) =>
      request(`/teachers/${id}/availability/batch`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  classes: {
    list: (params?: any) => request(`/classes?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/classes/${id}`),
    create: (data: any) => request('/classes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/classes/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/classes/${id}`, { method: 'DELETE' }),
    getSchedules: (id: number, semester?: string) =>
      request(`/classes/${id}/schedules${semester ? `?semester=${semester}` : ''}`),
    getAvailability: (id: number, semester?: string) =>
      request(`/classes/${id}/availability${semester ? `?semester=${semester}` : ''}`),
    updateAvailability: (id: number, data: any) =>
      request(`/classes/${id}/availability`, { method: 'POST', body: JSON.stringify(data) }),
    batchUpdateAvailability: (id: number, data: any) =>
      request(`/classes/${id}/availability/batch`, { method: 'PUT', body: JSON.stringify(data) }),
  },
  classrooms: {
    list: (params?: any) => request(`/classrooms?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/classrooms/${id}`),
    create: (data: any) => request('/classrooms', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/classrooms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/classrooms/${id}`, { method: 'DELETE' }),
    getBuildings: () => request('/classrooms/buildings'),
  },
  schedules: {
    list: (params?: any) => request(`/schedules?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/schedules/${id}`),
    create: (data: any) => request('/schedules', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: number, data: any) => request(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: number) => request(`/schedules/${id}`, { method: 'DELETE' }),
    checkConflict: (data: any) => request('/schedules/check-conflict', { method: 'POST', body: JSON.stringify(data) }),
    getTimeSlots: () => request('/schedules/time-slots'),
    getSemesters: () => request('/schedules/semesters'),
  },
  adjustments: {
    list: (params?: any) => request(`/adjustments?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/adjustments/${id}`),
    create: (data: any) => request('/adjustments', { method: 'POST', body: JSON.stringify(data) }),
    approve: (id: number, data: any) => request(`/adjustments/${id}/approve`, { method: 'POST', body: JSON.stringify(data) }),
    reject: (id: number, data: any) => request(`/adjustments/${id}/reject`, { method: 'POST', body: JSON.stringify(data) }),
    cancel: (id: number) => request(`/adjustments/${id}`, { method: 'DELETE' }),
  },
  notifications: {
    list: (params?: any) => request(`/notifications?${new URLSearchParams(params)}`),
    get: (id: number) => request(`/notifications/${id}`),
    markRead: (id: number) => request(`/notifications/${id}/read`, { method: 'POST' }),
    markAllRead: (userId: number) => request(`/notifications/read-all/${userId}`, { method: 'POST' }),
    getUnreadCount: (userId: number) => request(`/notifications/unread-count/${userId}`),
    create: (data: any) => request('/notifications', { method: 'POST', body: JSON.stringify(data) }),
  },
  reports: {
    classroomUtilization: (params?: any) => request(`/reports/classroom-utilization?${new URLSearchParams(params)}`),
    teacherWorkload: (params?: any) => request(`/reports/teacher-workload?${new URLSearchParams(params)}`),
    adjustmentStatistics: (params?: any) => request(`/reports/adjustment-statistics?${new URLSearchParams(params)}`),
    pendingApprovals: () => request('/reports/pending-approvals'),
    conflictReasons: () => request('/reports/conflict-reasons'),
    summary: (params?: any) => request(`/reports/summary?${new URLSearchParams(params)}`),
    departmentStats: () => request('/reports/department-stats'),
    overview: () => request('/reports/overview'),
  },
}
