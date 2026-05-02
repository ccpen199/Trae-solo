import request from './request'

// ============ 认证相关 ============
export function login(username, password) {
  return request.post('/auth/login', { username, password })
}

export function getCurrentUser() {
  return request.get('/auth/me')
}

export function getUsers(role) {
  const params = role ? { role } : {}
  return request.get('/auth/users', { params })
}

// ============ 常量相关 ============
export function getConstants() {
  return request.get('/constants')
}

// ============ 流水线相关 ============
export function getPipelines(params) {
  return request.get('/pipelines', { params })
}

export function getPipeline(id) {
  return request.get(`/pipelines/${id}`)
}

export function createPipeline(data) {
  return request.post('/pipelines', data)
}

export function updatePipeline(id, data) {
  return request.put(`/pipelines/${id}`, data)
}

export function activatePipeline(id, active) {
  return request.post(`/pipelines/${id}/activate`, { active })
}

// ============ 主单相关 ============
export function getOrders(params) {
  return request.get('/orders', { params })
}

export function getOrder(id) {
  return request.get(`/orders/${id}`)
}

export function createOrder(data) {
  return request.post('/orders', data)
}

export function executeOrderAction(id, action, resultData, comment) {
  return request.post(`/orders/${id}/action`, { action, resultData, comment })
}

// ============ 统计相关 ============
export function getDashboardStats() {
  return request.get('/orders/dashboard/stats')
}

export function getKanbanData() {
  return request.get('/orders/dashboard/kanban')
}

// ============ 报表相关 ============
export function getReportSummary(startDate, endDate) {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return request.get('/reports/summary', { params })
}

export function getDailyStats(startDate, endDate) {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return request.get('/reports/daily', { params })
}

export function getStageDuration(startDate, endDate) {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return request.get('/reports/stage-duration', { params })
}

export function getFailureReasons(startDate, endDate) {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return request.get('/reports/failure-reasons', { params })
}

export function getUserPerformance(startDate, endDate) {
  const params = {}
  if (startDate) params.startDate = startDate
  if (endDate) params.endDate = endDate
  return request.get('/reports/user-performance', { params })
}
