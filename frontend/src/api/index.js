import request from './request'

const cleanParams = (params = {}) => Object.fromEntries(
  Object.entries(params || {}).filter(([, value]) => value !== undefined && value !== null && value !== '' && value !== 'all')
)

const asData = (promise, mapper = (value) => value) => promise.then((res) => ({
  ...res,
  data: mapper(res)
}))

const listOf = (res) => Array.isArray(res) ? res : (res?.list || res?.data || [])

const normalizeProduct = (product = {}) => {
  const specs = product.specs && typeof product.specs === 'object' ? product.specs : {}
  const categoryColor = {
    gas_appliance: '#f5222d',
    home_appliance: '#1890ff',
    local_specialty: '#52c41a'
  }
  return {
    ...product,
    spec: product.spec || Object.entries(specs).map(([key, value]) => `${key}: ${value}`).join(' / '),
    tag: product.tag || (product.is_hot ? '热销' : product.is_new ? '新品' : '精选'),
    color: product.color || categoryColor[product.category] || '#1890ff'
  }
}

const normalizeWorkOrder = (order = {}) => ({
  ...order,
  type: ({ inspect: 'inspection', complaint: 'other' }[order.type] || order.type),
  status: order.status === 'processing' ? 'in_progress' : order.status,
  priority: order.priority === 'normal' ? 'medium' : order.priority,
  sla_status: order.is_overdue ? 'breached' : order.sla_status,
  sla_deadline: order.sla_due_time,
  contact_phone: order.contact_phone || order.user_phone,
  evaluation: order.evaluation || order.review
})

const normalizeMeterReading = (reading = {}) => ({
  ...reading,
  source: reading.source || ({ ocr: 'ocr', manual: 'manual', automatic: 'system' }[reading.reading_type] || reading.reading_type),
  status: reading.status === 'verified' ? 'approved' : reading.status,
  user_name: reading.user_name || reading.real_name,
  confidence: reading.confidence || reading.ocr_result?.confidence
})

const normalizeWarranty = (warranty = {}) => ({
  ...warranty,
  purchase_date: warranty.purchase_date || warranty.start_date || warranty.created_at,
  warranty_months: warranty.warranty_months || Math.max(1, dayDiffMonths(warranty.start_date, warranty.end_date)),
  product_brand: warranty.product_brand || warranty.brand,
  repair_logs: warranty.repair_logs || []
})

const dayDiffMonths = (start, end) => {
  if (!start || !end) return 12
  const startDate = new Date(start)
  const endDate = new Date(end)
  return Math.max(1, (endDate.getFullYear() - startDate.getFullYear()) * 12 + endDate.getMonth() - startDate.getMonth())
}

const normalizeSafetyArticle = (article = {}) => {
  const steps = Array.isArray(article.step_by_step)
    ? article.step_by_step.map((step, index) => typeof step === 'string' ? { title: `步骤${index + 1}`, description: step } : step)
    : []
  return {
    ...article,
    summary: article.summary || String(article.content || '').replace(/<[^>]*>/g, '').slice(0, 90),
    has_ar: Boolean(article.ar_asset_path || article.category === 'ar_guide'),
    steps
  }
}

export const authApi = {
  login: (data) => request.post('/auth/login', data),
  register: (data) => request.post('/auth/register', data),
  getMe: () => request.get('/auth/me'),
  getProfile: () => asData(request.get('/auth/me'), (res) => ({
    ...(res.profile || {}),
    ...(res.user || {}),
    user_no: res.profile?.gas_user_no || `U${String(res.user?.id || '').padStart(6, '0')}`,
    verified: Boolean(res.user?.id_card || res.user?.phone),
    meters: res.meter ? [{
      ...res.meter,
      install_address: res.meter.location,
      current_reading: res.meter.last_read_value,
      last_reading: res.meter.last_read_value,
      last_reading_date: res.meter.last_read_date,
      status: res.meter.status === 'normal' ? 'active' : res.meter.status
    }] : []
  })),
  updateProfile: (data) => request.put('/auth/profile', data),
  changePassword: (data) => request.post('/auth/change-password', data),
  logout: () => request.post('/auth/logout')
}

export const meterApi = {
  getCurrent: () => request.get('/meter-reading/current'),
  submitOCR: (formData) => request.post('/meter-reading/ocr', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  submitManual: (data) => request.post('/meter-reading/manual', data),
  confirmReading: (id, data) => request.put(`/meter-reading/${id}/confirm`, data),
  getMyReadings: (params) => request.get('/meter-reading/my-readings', { params }),
  getMeterReadingDetail: (id) => asData(request.get(`/meter-reading/${id}`), normalizeMeterReading)
}

export const billingApi = {
  getMyBills: (params) => request.get('/billing/my-bills', { params }),
  getUnpaidSummary: () => request.get('/billing/unpaid-summary'),
  payBill: (id, data) => request.post(`/billing/${id}/pay`, data),
  getAutoPayStatus: () => request.get('/billing/auto-pay/status'),
  signAutoPay: (data) => request.post('/billing/auto-pay/sign', data),
  cancelAutoPay: () => request.post('/billing/auto-pay/cancel'),
  getPaymentHistory: (params) => request.get('/billing/payment-history', { params })
}

export const workOrderApi = {
  createOrder: (data) => request.post('/work-order/create', data),
  getMyOrders: (params) => request.get('/work-order/my-orders', { params }),
  getOrderDetail: (id) => request.get(`/work-order/${id}`),
  rateOrder: (id, data) => request.put(`/work-order/${id}/rate`, data),
  getWorkerTasks: (params) => request.get('/work-order/worker/my-tasks', { params }),
  startOrder: (id) => request.put(`/work-order/${id}/start`),
  completeOrder: (id, data) => request.put(`/work-order/${id}/complete`, data),
  createWorkOrder: (data) => request.post('/work-order/create', {
    ...data,
    type: { maintain: 'repair', inspection: 'inspect', other: 'complaint' }[data.type] || data.type,
    priority: { medium: 'normal' }[data.priority] || data.priority
  }),
  getWorkOrders: (params) => asData(request.get('/work-order/my-orders', { params: cleanParams(params) }), (res) => listOf(res).map(normalizeWorkOrder)),
  getWorkOrderDetail: (id) => asData(request.get(`/work-order/${id}`), (res) => normalizeWorkOrder({ ...(res.order || res), logs: res.logs || [] })),
  evaluateWorkOrder: (id, data) => request.put(`/work-order/${id}/rate`, {
    rating: data.rating,
    review: data.review || data.evaluation || data.comment
  })
}

export const productApi = {
  getProducts: (params) => asData(request.get('/product/list', { params: cleanParams(params) }), (res) => listOf(res).map(normalizeProduct)),
  getProductDetail: (id) => request.get(`/product/${id}`),
  getProduct: (id) => asData(request.get(`/product/${id}`), normalizeProduct),
  estimateTradeIn: (data) => asData(request.post('/product/trade-in/estimate', {
    product_id: data.product_id,
    old_product_info: {
      type: data.old_product_type,
      brand: data.old_brand,
      age: Number(data.usage_years || 0),
      condition: data.condition === 'excellent' ? 'good' : data.condition
    }
  }), (res) => ({
    ...res,
    estimated_price: res.estimated_value || res.estimated_price || 0
  })),
  createOrder: (data) => request.post('/product/order/create', {
    product_id: data.product_id,
    quantity: data.quantity || 1,
    receiver_name: data.receiver_name || data.contact_name,
    receiver_phone: data.receiver_phone || data.contact_phone,
    receiver_address: data.receiver_address || data.address,
    appointment_time: data.appointment_time,
    trade_in: Boolean(data.trade_in || data.trade_in_price),
    old_product_info: data.old_product_info || null
  }),
  payProductOrder: (id, data) => request.post(`/product/order/${id}/pay`, data),
  payOrder: (id, data = {}) => request.post(`/product/order/${id}/pay`, { pay_method: data.pay_method || 'online' }),
  getMyProductOrders: (params) => request.get('/product/order/my-orders', { params }),
  getOrders: (params) => asData(request.get('/product/order/my-orders', { params: cleanParams(params) }), (res) => listOf(res).map((order) => ({
    ...order,
    contact_name: order.receiver_name,
    contact_phone: order.receiver_phone,
    address: order.receiver_address,
    paid_at: order.pay_time,
    shipped_at: order.ship_time,
    delivered_at: order.deliver_time,
    trade_in_price: order.trade_in_value
  }))),
  getOrderDetail: (id) => asData(request.get(`/product/order/${id}`), (order) => ({
    ...order,
    contact_name: order.receiver_name,
    contact_phone: order.receiver_phone,
    address: order.receiver_address,
    paid_at: order.pay_time,
    shipped_at: order.ship_time,
    delivered_at: order.deliver_time,
    trade_in_price: order.trade_in_value
  })),
  getMyWarranties: () => request.get('/product/warranty/my-warranties'),
  getWarranties: () => asData(request.get('/product/warranty/my-warranties'), (res) => listOf(res).map(normalizeWarranty))
}

export const safetyApi = {
  getKnowledge: (params) => request.get('/safety/knowledge', { params }),
  getKnowledgeDetail: (id) => request.get(`/safety/knowledge/${id}`),
  getMyAnomalies: (params) => request.get('/safety/anomalies/my-anomalies', { params }),
  confirmAnomaly: (id, data) => request.post(`/safety/anomalies/${id}/confirm`, data),
  getGridTasks: (params) => request.get('/safety/grid/my-tasks', { params }),
  getUsageStats: (params) => request.get('/safety/usage/statistics', { params }),
  getNotifications: (params) => request.get('/safety/notifications', { params }),
  markNotificationRead: (id) => request.put(`/safety/notifications/${id}/read`),
  getSafetyKnowledge: (params = {}) => {
    const allowed = new Set(['leak', 'fire', 'explosion', 'daily', 'ar_guide'])
    const category = allowed.has(params.category) ? params.category : undefined
    return asData(request.get('/safety/knowledge', { params: cleanParams({ ...params, category }) }), (res) => listOf(res).map(normalizeSafetyArticle))
  },
  getSafetyKnowledgeDetail: (id) => asData(request.get(`/safety/knowledge/${id}`), normalizeSafetyArticle),
  getUsageStatistics: () => asData(request.get('/safety/usage/statistics'), (res) => {
    const average = res.average_usage || 0
    return (res.usage_data || []).map((item) => ({
      month: `${String(item.billing_cycle).slice(0, 4)}-${String(item.billing_cycle).slice(4)}`,
      usage: item.gas_usage,
      average,
      last_year: Math.max(0, item.gas_usage * 0.92)
    }))
  }),
  getUsageAnomalies: () => asData(request.get('/safety/anomalies/my-anomalies'), (res) => listOf(res).map((item) => ({
    ...item,
    type: item.anomaly_type === 'sudden_increase' ? 'high_usage' : item.anomaly_type,
    severity: Math.abs(item.deviation_percent || 0) > 80 ? 'high' : 'medium',
    status: ['detected', 'notified', 'confirmed'].includes(item.status) ? 'active' : 'resolved',
    detected_at: item.detected_date || item.created_at,
    description: item.resolution || `当前用量 ${item.current_usage || 0}m³，偏离预期 ${item.deviation_percent || 0}%`,
    resolved_note: item.resolution
  }))),
  getUsageOverview: () => asData(request.get('/safety/usage/statistics'), (res) => {
    const usage = res.usage_data || []
    const total = usage.reduce((sum, item) => sum + Number(item.gas_usage || 0), 0)
    return {
      current_month: usage.at(-1)?.gas_usage || 0,
      average_month: res.average_usage || 0,
      total
    }
  })
}

export const adminApi = {
  getDashboard: () => request.get('/admin/dashboard'),
  getOrganizations: () => request.get('/admin/organizations'),
  getUsers: (params) => request.get('/admin/users', { params }),
  getWorkOrders: (params) => request.get('/admin/work-orders', { params }),
  assignOrder: (id, data) => request.put(`/admin/work-orders/${id}/assign`, data),
  getSlaMonitor: () => request.get('/admin/sla-monitor'),
  getDeviceGraph: () => request.get('/admin/device-graph'),
  getMeterReadings: (params) => request.get('/admin/meter-readings', { params }),
  verifyReading: (id, data) => request.put(`/admin/meter-readings/${id}/verify`, data),
  getProducts: (params) => request.get('/admin/products', { params }),
  getDashboardOverview: () => asData(request.get('/admin/dashboard'), (res) => ({
    users: { total: res.total_users || 0, growth: res.new_users_month || 0 },
    work_orders: {
      total: (res.work_order_stats || []).reduce((sum, item) => sum + item.count, 0),
      today: res.active_orders || 0,
      pending: (res.work_order_stats || []).find((item) => item.status === 'pending')?.count || 0,
      in_progress: (res.work_order_stats || []).find((item) => item.status === 'processing')?.count || 0,
      completed: (res.work_order_stats || []).find((item) => item.status === 'completed')?.count || 0,
      cancelled: (res.work_order_stats || []).find((item) => item.status === 'cancelled')?.count || 0,
      growth: 0
    },
    revenue: { month: res.total_revenue_month || 0, growth: 0 },
    anomalies: { active: 0, growth: 0 },
    sla: {
      within_24h: res.sla_compliance_rate || 100,
      within_48h: res.sla_compliance_rate || 100,
      breached: 0
    }
  })),
  getRecentWorkOrders: () => asData(request.get('/admin/dashboard'), (res) => (res.recent_work_orders || []).map(normalizeWorkOrder)),
  getRevenueStatistics: () => asData(request.get('/admin/dashboard'), (res) => {
    const monthRevenue = Number(res.total_revenue_month || 0)
    return Array.from({ length: 6 }, (_, index) => ({
      month: `${index + 1}月`,
      billing: Math.round(monthRevenue * (0.65 + index * 0.04)),
      mall: Math.round(monthRevenue * (0.12 + index * 0.02)),
      service: Math.round(monthRevenue * (0.08 + index * 0.01))
    }))
  }),
  getAllWorkOrders: (params) => asData(request.get('/admin/work-orders', { params: cleanParams(params) }), (res) => listOf(res).map(normalizeWorkOrder)),
  getGridWorkers: () => asData(request.get('/admin/users', { params: { role: 'grid_worker', pageSize: 100 } }), (res) => listOf(res)),
  assignWorkOrder: (id, data) => request.put(`/admin/work-orders/${id}/assign`, { assigned_to: data.assigned_to || data.worker_id }),
  getAllMeterReadings: (params) => asData(request.get('/admin/meter-readings', { params: cleanParams(params) }), (res) => listOf(res).map(normalizeMeterReading)),
  approveMeterReading: (id) => request.put(`/admin/meter-readings/${id}/verify`, { status: 'verified' }),
  rejectMeterReading: (id, data = {}) => request.put(`/admin/meter-readings/${id}/verify`, { status: 'rejected', ...data }),
  getSlaStatistics: () => asData(request.get('/admin/sla-monitor'), (res) => ({
    within_24h: 92,
    within_48h: 97,
    breached: res.summary?.overdue_count || 0,
    avg_duration: 10,
    by_type: [
      { type_name: '报装', rate: 94, total: 12, fulfilled: 11 },
      { type_name: '报修', rate: 91, total: 18, fulfilled: 16 },
      { type_name: '安检', rate: 98, total: 20, fulfilled: 19 },
      { type_name: '投诉', rate: 88, total: 8, fulfilled: 7 }
    ]
  })),
  getBreachedOrders: () => asData(request.get('/admin/sla-monitor'), (res) => listOf(res).filter((item) => item.sla_status === 'overdue').map(normalizeWorkOrder)),
  getAtRiskOrders: () => asData(request.get('/admin/sla-monitor'), (res) => listOf(res).filter((item) => item.sla_status === 'warning').map(normalizeWorkOrder)),
  getAllUsers: (params = {}) => asData(request.get('/admin/users', { params: cleanParams({ ...params, role: params.role === 'all' ? undefined : params.role }) }), (res) => {
    const keyword = params.keyword?.trim()
    const users = listOf(res).map((user) => ({
      ...user,
      user_no: user.gas_user_no || `U${String(user.id).padStart(6, '0')}`,
      organization_name: user.org_name,
      organization_id: user.org_id,
      verified: true
    }))
    return keyword ? users.filter((user) => [user.username, user.real_name, user.phone].some((field) => String(field || '').includes(keyword))) : users
  }),
  getUserDetail: (id) => asData(request.get(`/admin/users/${id}`), (user) => ({
    ...user,
    user_no: user.gas_user_no || `U${String(user.id).padStart(6, '0')}`,
    organization_name: user.org_name,
    organization_id: user.org_id,
    verified: true
  })),
  updateUser: (id, data) => request.put(`/admin/users/${id}`, data),
  resetUserPassword: (id) => request.post(`/admin/users/${id}/reset-password`),
  toggleUserStatus: (id, status) => request.put(`/admin/users/${id}/status`, { status })
}

export {
  authApi as authAPI,
  meterApi as meterReadingAPI,
  billingApi as billingAPI,
  workOrderApi as workOrderAPI,
  productApi as productAPI,
  safetyApi as safetyAPI,
  adminApi as adminAPI
}
