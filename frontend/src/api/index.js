import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useUserStore } from '@/store/user'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
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
    const data = response.data
    if (data.success) {
      return data.data
    }
    ElMessage.error(data.message || '请求失败')
    return Promise.reject(new Error(data.message || '请求失败'))
  },
  (error) => {
    if (error.response?.status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      ElMessage.error('登录已过期，请重新登录')
    } else {
      ElMessage.error(error.response?.data?.detail || error.message || '网络错误')
    }
    return Promise.reject(error)
  }
)

export async function login(username, password) {
  const response = await axios.post('/api/auth/login', null, {
    params: { username, password }
  })
  return response.data
}

export async function getCurrentUser() {
  return api.get('/auth/me')
}

export async function getOrders(status, limit = 100, offset = 0) {
  const params = { limit, offset }
  if (status) params.status = status
  return api.get('/orders', { params })
}

export async function getOrderCounts() {
  return api.get('/orders/counts')
}

export async function getOrder(id) {
  return api.get(`/orders/${id}`)
}

export async function createOrder(data) {
  return api.post('/orders', data)
}

export async function submitOrder(id, comment) {
  return api.post(`/orders/${id}/submit`, { comment })
}

export async function executeOrderAction(id, data) {
  return api.post(`/orders/${id}/action`, data)
}

export async function getOrderAllowedActions(id) {
  return api.get(`/orders/${id}/allowed-actions`)
}

export async function getDashboardStats() {
  return api.get('/reports/dashboard')
}

export async function getOrganizations(orgType) {
  const params = orgType ? { org_type: orgType } : {}
  return api.get('/users/organizations', { params })
}

export async function getUsersByRole(role) {
  return api.get('/users/by-role', { params: { role } })
}

export async function getMessages(status) {
  const params = status ? { status } : {}
  return api.get('/users/messages', { params })
}

export async function getPendingMessageCount() {
  return api.get('/users/messages/pending-count')
}

export async function markMessageRead(id) {
  return api.post(`/users/messages/${id}/read`)
}

export async function markMessageProcessed(id) {
  return api.post(`/users/messages/${id}/processed`)
}

export async function getOrderReport(startDate, endDate) {
  const params = {}
  if (startDate) params.start_date = startDate
  if (endDate) params.end_date = endDate
  return api.get('/reports/orders', { params })
}

export async function getRiskReport() {
  return api.get('/reports/risk')
}

export async function getAuditTrail(orderId, userId, limit = 100) {
  const params = { limit }
  if (orderId) params.order_id = orderId
  if (userId) params.user_id = userId
  return api.get('/reports/audit-trail', { params })
}

export async function getLedgerReport(orderId, limit = 100) {
  const params = { limit }
  if (orderId) params.order_id = orderId
  return api.get('/reports/ledger', { params })
}

export const statusMap = {
  'pending_asset_registration': { label: '待资产登记', type: 'info' },
  'pending_confirmation': { label: '待核心企业确权', type: 'warning' },
  'pending_risk_assessment': { label: '待风控评估', type: 'warning' },
  'pending_loan': { label: '待放款', type: 'warning' },
  'pending_repayment': { label: '待回款核销', type: 'warning' },
  'completed': { label: '已完成', type: 'success' },
  'rejected': { label: '已驳回', type: 'danger' },
  'cancelled': { label: '已撤销', type: 'info' },
  'closed': { label: '已关闭', type: 'info' },
  'locked': { label: '已锁定', type: 'danger' }
}

export const roleMap = {
  'supplier': { label: '供应商', icon: 'OfficeBuilding' },
  'core_enterprise': { label: '核心企业', icon: 'Building' },
  'financial_institution': { label: '金融机构', icon: 'BankCard' },
  'risk_control': { label: '风控', icon: 'View' },
  'finance': { label: '财务', icon: 'Money' },
  'admin': { label: '管理员', icon: 'User' }
}

export const actionMap = {
  'submit': '提交',
  'approve': '通过',
  'reject': '拒绝',
  'return': '退回',
  'supplement': '补充资料',
  'reassign': '转派',
  'loan': '放款',
  'repay': '回款核销',
  'lock': '锁定',
  'unlock': '解锁',
  'retry': '重试',
  'close': '关闭',
  'cancel': '撤销'
}

export const roleMenus = {
  'supplier': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '订单列表', icon: 'List' },
    { path: '/orders/create', label: '资产登记', icon: 'Plus' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'DataLine' }
  ],
  'core_enterprise': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '确权订单', icon: 'List' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'DataLine' }
  ],
  'risk_control': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '风控评估', icon: 'View' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'Warning' }
  ],
  'finance': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '放款/回款', icon: 'Money' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'DataLine' }
  ],
  'admin': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '订单管理', icon: 'List' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'DataLine' }
  ],
  'financial_institution': [
    { path: '/dashboard', label: '工作台', icon: 'HomeFilled' },
    { path: '/orders', label: '订单列表', icon: 'List' },
    { path: '/messages', label: '待办消息', icon: 'Bell' },
    { path: '/reports', label: '报表中心', icon: 'DataLine' }
  ]
}
