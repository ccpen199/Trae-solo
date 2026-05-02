const USE_MOCK = true

const mockData = {
  users: [
    { id: 1, username: 'admin', password: '123456', nickname: '系统管理员', roleType: 5, roleName: '系统管理员' },
    { id: 2, username: 'merchant', password: '123456', nickname: '测试商家', roleType: 1, roleName: '商家', storeId: 1 },
    { id: 3, username: 'staff', password: '123456', nickname: '测试店员', roleType: 2, roleName: '店员', storeId: 1 },
    { id: 4, username: 'rider', password: '123456', nickname: '测试骑手', roleType: 3, roleName: '骑手' }
  ],
  orders: [] as any[]
}

function initMockOrders() {
  if (mockData.orders.length > 0) return
  
  const statusMap: Record<number, string> = {
    10: '待接单', 15: '待付款', 20: '已接单', 30: '制作中',
    40: '待取餐', 45: '取餐中', 50: '配送中', 60: '已完成',
    70: '已取消', 80: '退款中', 90: '已退款'
  }
  const platformMap: Record<number, string> = { 1: '美团外卖', 2: '饿了么', 3: '自营平台' }

  for (let i = 1; i <= 30; i++) {
    const status = [10, 20, 30, 40, 50, 60, 70][i % 7]
    const platform = [1, 2][i % 2]
    mockData.orders.push({
      id: i,
      orderNo: `OD${Date.now()}${i.toString().padStart(3, '0')}`,
      platformOrderNo: `${platform === 1 ? 'MT' : 'EL'}${Date.now()}${i}`,
      storeId: 1,
      merchantId: 1,
      platformType: platform,
      platformTypeName: platformMap[platform],
      orderStatus: status,
      orderStatusName: statusMap[status],
      receiveType: i % 3 === 0 ? 1 : 2,
      customerName: `顾客${i}`,
      customerPhone: `138${(10000000 + i).toString()}`,
      deliveryAddress: `北京市海淀区中关村街道${i}号`,
      orderAmount: 50 + i * 10,
      goodsAmount: 40 + i * 8,
      deliveryFee: 5,
      packageFee: 2,
      discountAmount: i * 2,
      paidAmount: 50 + i * 10 - i * 2,
      orderRemark: i % 3 === 0 ? '少放辣，不要葱' : '',
      printed: i > 5 ? 1 : 0,
      printCount: i > 5 ? 2 : 0,
      hasAfterSale: i % 10 === 0 ? 1 : 0,
      createTime: new Date(Date.now() - i * 3600000).toISOString().replace('T', ' ').substring(0, 19)
    })
  }
}

initMockOrders()

function mockLogin(username: string, password: string) {
  const user = mockData.users.find(u => u.username === username && u.password === password)
  if (user) {
    return {
      code: 200,
      message: 'success',
      data: {
        token: `mock_token_${user.id}_${Date.now()}`,
        expireTime: Date.now() + 86400000
      },
      timestamp: Date.now()
    }
  }
  return {
    code: 401,
    message: '用户名或密码错误',
    timestamp: Date.now()
  }
}

function mockUserInfo(username: string) {
  const user = mockData.users.find(u => u.username === username)
  if (user) {
    return {
      code: 200,
      message: 'success',
      data: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        phone: '13800138000',
        avatar: '',
        roleType: user.roleType,
        roleName: user.roleName,
        merchantId: 1,
        storeId: (user as any).storeId || 1,
        storeName: '美味餐厅(中关村店)'
      },
      timestamp: Date.now()
    }
  }
  return {
    code: 401,
    message: '未授权',
    timestamp: Date.now()
  }
}

function mockOrderList(params: any) {
  let filtered = [...mockData.orders]
  
  if (params && params.status) {
    filtered = filtered.filter(o => o.orderStatus === params.status)
  }
  if (params && params.keyword) {
    const keyword = params.keyword.toLowerCase()
    filtered = filtered.filter(o => 
      o.orderNo.toLowerCase().includes(keyword) ||
      o.platformOrderNo.toLowerCase().includes(keyword) ||
      o.customerName.includes(keyword) ||
      o.customerPhone.includes(keyword)
    )
  }

  const page = params?.page || 1
  const size = params?.size || 10
  const start = (page - 1) * size
  const end = start + size

  return {
    code: 200,
    message: 'success',
    data: {
      total: filtered.length,
      page: page,
      size: size,
      totalPages: Math.ceil(filtered.length / size),
      records: filtered.slice(start, end)
    },
    timestamp: Date.now()
  }
}

function mockStatisticsOverview() {
  return {
    code: 200,
    message: 'success',
    data: {
      todayOrderCount: 48,
      todayValidOrderCount: 42,
      todayTotalAmount: 3280,
      todayValidAmount: 2860,
      todayCancelCount: 3,
      todayRefundCount: 2,
      todayCancelRate: 6.25,
      todayRefundRate: 4.17,
      todayReceiveRate: 95.8,
      todayAutoReceiveCount: 35,
      todayManualReceiveCount: 7,
      todayPrintCount: 42,
      todayAvgDeliveryTime: 25.5,
      todayAvgPrepareTime: 18.3,
      yesterdayOrderCount: 45,
      yesterdayValidAmount: 2650,
      weekOrderCount: 285,
      weekValidAmount: 18650,
      weekCancelRate: 5.8,
      monthOrderCount: 1256,
      monthValidAmount: 82500,
      monthCancelRate: 6.1,
      calculationBasis: '{"source":"mock","date":"' + new Date().toISOString().split('T')[0] + '"}'
    },
    timestamp: Date.now()
  }
}

function mockOrderDetail(id: number) {
  const order = mockData.orders.find(o => o.id === id)
  if (!order) {
    return {
      code: 404,
      message: '订单不存在',
      timestamp: Date.now()
    }
  }
  return {
    code: 200,
    message: 'success',
    data: {
      ...order,
      auditLogs: [
        { id: 1, traceId: 'trace_' + id, operator: '系统', fromStatus: null, toStatus: 10, detail: '订单创建', createTime: order.createTime },
        { id: 2, traceId: 'trace_' + id, operator: 'merchant', fromStatus: 10, toStatus: 20, detail: '商家接单', createTime: new Date(Date.now() - 300000).toISOString().replace('T', ' ').substring(0, 19) },
        { id: 3, traceId: 'trace_' + id, operator: '系统', fromStatus: 20, toStatus: 30, detail: '开始制作', createTime: new Date(Date.now() - 200000).toISOString().replace('T', ' ').substring(0, 19) }
      ],
      orderGoods: [
        { id: 1, goodsName: '宫保鸡丁', quantity: 1, unitPrice: 28, totalPrice: 28, specName: '中辣' },
        { id: 2, goodsName: '米饭', quantity: 2, unitPrice: 2, totalPrice: 4, specName: '' }
      ]
    },
    timestamp: Date.now()
  }
}

function mockOrderAction(action: string, id: number) {
  const order = mockData.orders.find(o => o.id === id)
  if (!order) {
    return {
      code: 404,
      message: '订单不存在',
      timestamp: Date.now()
    }
  }
  
  const statusTransitions: Record<string, { from: number, to: number, message: string }> = {
    'receive': { from: 10, to: 20, message: '接单成功' },
    'start-cook': { from: 20, to: 30, message: '开始制作' },
    'ready': { from: 30, to: 40, message: '订单已备好' },
    'complete': { from: 50, to: 60, message: '订单已完成' },
    'cancel': { from: 10, to: 70, message: '订单已取消' }
  }
  
  const transition = statusTransitions[action]
  if (transition && order.orderStatus === transition.from) {
    order.orderStatus = transition.to
    const statusMap: Record<number, string> = {
      10: '待接单', 20: '已接单', 30: '制作中', 40: '待取餐', 50: '配送中', 60: '已完成', 70: '已取消'
    }
    order.orderStatusName = statusMap[transition.to]
  }
  
  return {
    code: 200,
    message: transition?.message || '操作成功',
    timestamp: Date.now()
  }
}

function handleMockRequest(url: string, method: string, data: any, params: any) {
  if (url.includes('/api/auth/login') && method === 'post') {
    return mockLogin(data.username, data.password)
  }
  if (url.includes('/api/auth/userinfo') && method === 'get') {
    return mockUserInfo('merchant')
  }
  if (url.includes('/api/order/list') && method === 'get') {
    return mockOrderList(params)
  }
  if (url.includes('/api/statistics/overview') && method === 'get') {
    return mockStatisticsOverview()
  }
  if (url.match(/\/api\/order\/\d+$/) && method === 'get') {
    const id = parseInt(url.split('/').pop() || '0')
    return mockOrderDetail(id)
  }
  if (url.match(/\/api\/order\/\d+\/receive/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    return mockOrderAction('receive', id)
  }
  if (url.match(/\/api\/order\/\d+\/start-cook/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    return mockOrderAction('start-cook', id)
  }
  if (url.match(/\/api\/order\/\d+\/ready/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    return mockOrderAction('ready', id)
  }
  if (url.match(/\/api\/order\/\d+\/complete/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    return mockOrderAction('complete', id)
  }
  if (url.match(/\/api\/order\/\d+\/cancel/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    return mockOrderAction('cancel', id)
  }
  if (url.match(/\/api\/order\/\d+\/print/) && method === 'post') {
    const id = parseInt(url.split('/').slice(-2, -1)[0] || '0')
    const order = mockData.orders.find(o => o.id === id)
    if (order) {
      order.printed = 1
      order.printCount = (order.printCount || 0) + 1
    }
    return {
      code: 200,
      message: '打印成功',
      timestamp: Date.now()
    }
  }

  return {
    code: 200,
    message: 'success',
    data: null,
    timestamp: Date.now()
  }
}

class MockAxiosService {
  async request(config: { url: string; method: string; data?: any; params?: any }) {
    const url = config.url || ''
    const method = (config.method || 'get').toLowerCase()
    const data = config.data || {}
    const params = config.params || {}
    
    console.log('[Mock Axios] Request:', method.toUpperCase(), url)
    const result = handleMockRequest(url, method, data, params)
    console.log('[Mock Axios] Response:', result)
    
    return result
  }

  async get(url: string, config?: { params?: any }) {
    return this.request({ url, method: 'get', params: config?.params })
  }

  async post(url: string, data?: any) {
    return this.request({ url, method: 'post', data })
  }

  async put(url: string, data?: any) {
    return this.request({ url, method: 'put', data })
  }

  async delete(url: string) {
    return this.request({ url, method: 'delete' })
  }
}

export const mockService = new MockAxiosService()

if (USE_MOCK) {
  console.log('='.repeat(50))
  console.log('Mock 模式已启用 - 所有 API 使用模拟数据')
  console.log('测试账号: merchant / 123456')
  console.log('='.repeat(50))
}

export default mockService

export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

export interface PageData<T> {
  total: number
  page: number
  size: number
  totalPages: number
  records: T[]
}
