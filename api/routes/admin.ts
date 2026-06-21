import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type FuelStation, type AuthStatus } from '../mock/data.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

function getAuthStatus(u: { driverDocs?: { status?: AuthStatus }; shipperDocs?: { status?: AuthStatus } }): AuthStatus {
  if (u.driverDocs?.status) return u.driverDocs.status
  if (u.shipperDocs?.status) return u.shipperDocs.status
  return 'pending'
}

router.get('/dashboard/kpi', async (req: AuthRequest, res: Response): Promise<void> => {
  const { period = '7days' } = req.query as { period?: '7days' | '30days' | '90days' | 'year' | 'all' }
  const now = new Date()
  let startDate: Date

  switch (period) {
    case '7days': startDate = new Date(now.getTime() - 7 * 24 * 3600 * 1000); break
    case '30days': startDate = new Date(now.getTime() - 30 * 24 * 3600 * 1000); break
    case '90days': startDate = new Date(now.getTime() - 90 * 24 * 3600 * 1000); break
    case 'year': startDate = new Date(now.getFullYear(), 0, 1); break
    default: startDate = new Date(0)
  }

  const filterByTime = (dateStr: string | undefined) =>
    dateStr && new Date(dateStr) >= startDate && new Date(dateStr) <= now

  const allOrders = db.orders
  const periodOrders = allOrders.filter(o => filterByTime(o.publishedAt))
  const completedOrders = allOrders.filter(o => o.status === 'completed' && filterByTime(o.completedAt))

  const GMV = periodOrders.reduce((sum, o) => sum + (o.freightAmount || 0) + (o.insuranceAmount || 0), 0)

  const totalDistance = completedOrders.reduce((s, o) => s + (o.distanceKm || 0), 0)
  const emptyDistance = completedOrders.reduce((s, o) => s + (o.emptyDistanceKm || 0), 0)
  const emptyRate = totalDistance > 0 ? parseFloat(((emptyDistance / totalDistance) * 100).toFixed(1)) : 0

  const completedWithSettlement = completedOrders.filter(o => o.completedAt)
  const avgPaymentPeriod = completedWithSettlement.length
    ? completedWithSettlement.reduce((sum, o) => {
        const detail = db.settlementDetails.find(d => d.orderId === o.id)
        const settled = detail?.settledAt
        if (settled && o.completedAt) {
          return sum + ((new Date(settled).getTime() - new Date(o.completedAt).getTime()) / (24 * 3600 * 1000))
        }
        return sum
      }, 0) / completedWithSettlement.length
    : 0

  const fuelRedeems = db.fuelRedeems.filter(r => filterByTime(r.createdAt))
  const totalFuelSaving = fuelRedeems.reduce((s, r) => s + (r.actualSaving || 0), 0)

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const newUsersToday = db.users.filter(u => filterByTime(u.createdAt) && new Date(u.createdAt) >= todayStart).length
  const newOrdersToday = allOrders.filter(o => filterByTime(o.publishedAt) && new Date(o.publishedAt) >= todayStart).length

  const dailyGMV: Array<{ date: string; gmv: number; orders: number }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const next = new Date(d.getTime() + 24 * 3600 * 1000)
    const dayOrders = allOrders.filter(o => {
      const t = new Date(o.publishedAt).getTime()
      return t >= d.getTime() && t < next.getTime()
    })
    dailyGMV.push({
      date: d.toISOString().slice(5, 10),
      gmv: parseFloat(dayOrders.reduce((s, o) => s + (o.freightAmount || 0), 0).toFixed(2)),
      orders: dayOrders.length,
    })
  }

  success(res, {
    kpi: {
      GMV: parseFloat(GMV.toFixed(2)),
      orderCount: periodOrders.length,
      completedCount: completedOrders.length,
      completionRate: periodOrders.length
        ? parseFloat(((completedOrders.length / periodOrders.length) * 100).toFixed(1))
        : 0,
      emptyRate,
      avgPaymentPeriod: parseFloat(avgPaymentPeriod.toFixed(1)),
      totalFuelSaving: parseFloat(totalFuelSaving.toFixed(2)),
      activeDrivers: db.driverProfiles.filter(p => p.lastActiveAt && new Date(p.lastActiveAt) >= new Date(now.getTime() - 3 * 24 * 3600 * 1000)).length,
      activeShippers: db.shipperProfiles.filter(p => p.lastActiveAt && new Date(p.lastActiveAt) >= new Date(now.getTime() - 30 * 24 * 3600 * 1000)).length,
      platformFeeRevenue: parseFloat(periodOrders.reduce((s, o) => s + (o.freightAmount || 0) * 0.005, 0).toFixed(2)),
      newUsersToday,
      newOrdersToday,
    },
    period,
    dailyTrend: dailyGMV,
    orderStatusDist: {
      published: allOrders.filter(o => o.status === 'published').length,
      matched: allOrders.filter(o => o.status === 'matched').length,
      loading: allOrders.filter(o => o.status === 'loading').length,
      in_transit: allOrders.filter(o => o.status === 'in_transit').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      cancelled: allOrders.filter(o => o.status === 'cancelled').length,
    },
  })
})

router.get('/risk/auth-list', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限访问', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { status, role } = req.query

  let list = db.users.filter(u => {
    if (u.role === 'admin') return false
    const hasDocs = (u.role === 'driver' && u.driverDocs) || (u.role === 'shipper' && u.shipperDocs)
    if (!hasDocs) return false
    if (role && u.role !== role) return false
    if (status) {
      const s = getAuthStatus(u)
      if (s !== status) return false
    }
    return true
  })

  list.sort((a, b) => {
    const aTime = new Date(a.driverDocs?.submittedAt || a.shipperDocs?.submittedAt || 0).getTime()
    const bTime = new Date(b.driverDocs?.submittedAt || b.shipperDocs?.submittedAt || 0).getTime()
    return bTime - aTime
  })

  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(u => {
      const docs = u.driverDocs || u.shipperDocs
      return {
        authId: u.role === 'driver' ? `driver-auth-${u.id}` : `shipper-auth-${u.id}`,
        userId: u.id,
        role: u.role,
        nickname: u.nickname,
        phone: u.phone,
        realName: u.realName,
        creditScore: u.creditScore,
        companyName: u.shipperDocs?.companyName,
        docsStatus: docs?.status,
        submittedAt: docs?.submittedAt,
      }
    }),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    stats: {
      pending: list.filter(u => getAuthStatus(u) === 'pending').length,
      approved: list.filter(u => getAuthStatus(u) === 'approved').length,
      rejected: list.filter(u => getAuthStatus(u) === 'rejected').length,
    },
  })
})

router.post('/risk/auth/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限审核', 403, 403)
    return
  }

  const { id } = req.params
  const { approved, remark } = req.body as { approved?: boolean; remark?: string }

  const authUserId = id.startsWith('driver-auth-') || id.startsWith('shipper-auth-')
    ? id.replace('driver-auth-', '').replace('shipper-auth-', '')
    : id

  const authUser = db.users.find(u => u.id === authUserId)
  if (!authUser) {
    notFound(res, '认证记录不存在')
    return
  }

  const docs = authUser.driverDocs || authUser.shipperDocs
  if (!docs) {
    fail(res, '用户未提交认证资料')
    return
  }

  const nowIso = new Date().toISOString()
  const finalApproved = approved ?? true

  if (finalApproved) {
    docs.status = 'approved'
    docs.auditedAt = nowIso
    docs.auditedBy = user.id
    if (authUser.driverDocs) authUser.driverDocs = docs
    if (authUser.shipperDocs) authUser.shipperDocs = docs

    if (authUser.driverDocs && !db.driverProfiles.find(p => p.userId === authUser.id)) {
      db.driverProfiles.push({
        userId: authUser.id,
        vehicleType: 'truck_13',
        plateNumber: '京A' + Math.floor(10000 + Math.random() * 90000),
        totalOrders: 0,
        completedOrders: 0,
        completedRate: 1,
        rating: 5,
        yearsOfExperience: 3,
        currentLocation: { lng: 116.4, lat: 39.9 },
        geohash: 'wx4g0',
        totalMileage: 0,
        onTimeDeliveries: 0,
        lastActiveAt: nowIso,
        creditScore: authUser.creditScore,
        qualifications: ['危化品运输', '冷链运输'],
      })
    }
    if (authUser.shipperDocs && !db.shipperProfiles.find(p => p.userId === authUser.id)) {
      db.shipperProfiles.push({
        userId: authUser.id,
        companyName: authUser.shipperDocs?.companyName || authUser.nickname,
        industry: '制造业',
        scale: 'medium',
        totalOrders: 0,
        rating: 5,
        onTimePaymentRate: 0.98,
        monthlyBudget: 500000,
        lastActiveAt: nowIso,
        creditScore: authUser.creditScore,
      })
    }

    success(res, {
      authId: id,
      status: 'approved',
      auditedAt: nowIso,
    }, '认证审核通过')
  } else {
    docs.status = 'rejected'
    docs.auditedAt = nowIso
    docs.auditedBy = user.id
    docs.rejectReason = remark || '资料不符合要求'
    if (authUser.driverDocs) authUser.driverDocs = docs
    if (authUser.shipperDocs) authUser.shipperDocs = docs

    success(res, {
      authId: id,
      status: 'rejected',
      rejectReason: docs.rejectReason,
      auditedAt: nowIso,
    }, '认证审核已拒绝')
  }
})

router.get('/risk/prepay-list', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin' && user.role !== 'finance') {
    fail(res, '无权限访问', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { status, riskLevel } = req.query

  let list = [...db.prepayOrders]
  if (status) {
    const s = (status as string).split(',').filter(Boolean)
    list = list.filter(p => s.includes(p.status))
  }
  if (riskLevel) {
    list = list.filter(p => p.riskLevel === riskLevel)
  }

  list.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(p => ({
      ...p,
      orderNo: db.orders.find(o => o.id === p.orderId)?.orderNo,
      driverName: db.users.find(u => u.id === p.driverId)?.nickname,
      driverPhone: db.users.find(u => u.id === p.driverId)?.phone,
      shipperName: db.users.find(u => u.id === p.shipperId)?.nickname,
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    stats: {
      pending: list.filter(p => p.status === 'pending').length,
      totalAmount: list.filter(p => p.status === 'pending').reduce((s, p) => s + p.approvedAmount, 0),
      highRisk: list.filter(p => p.riskLevel === 'high').length,
      disbursed: list.filter(p => p.status === 'disbursed').reduce((s, p) => s + p.disbursedAmount, 0),
    },
  })
})

router.post('/risk/prepay/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin' && user.role !== 'finance') {
    fail(res, '无权限复核', 403, 403)
    return
  }

  const { id } = req.params
  const prepay = db.prepayOrders.find(p => p.id === id || p.prepayNo === id)
  if (!prepay) {
    notFound(res, '预支申请不存在')
    return
  }
  if (prepay.status !== 'pending') {
    fail(res, `预支状态${prepay.status}不可复核`)
    return
  }

  const { approved, approvedAmount, remark } = req.body as { approved?: boolean; approvedAmount?: number; remark?: string }
  const nowIso = new Date().toISOString()
  const actualApproved = parseFloat((approvedAmount ?? prepay.approvedAmount).toFixed(2))

  if (!approved) {
    prepay.status = 'rejected'
    prepay.rejectedAt = nowIso
    prepay.rejectedBy = user.id
    prepay.rejectReason = remark || '复核不通过'
    success(res, { prepayId: id, status: 'rejected' }, '预支复核已拒绝')
    return
  }

  prepay.status = 'disbursed'
  prepay.approvedAmount = actualApproved
  prepay.disbursedAmount = actualApproved
  prepay.approvedAt = nowIso
  prepay.disbursedAt = nowIso
  prepay.reviewedBy = user.id
  if (remark) prepay.remark = remark

  const wallet = db.wallets.find(w => w.userId === prepay.driverId)!
  wallet.balance += actualApproved
  wallet.usedCredit += actualApproved
  wallet.totalIncome += actualApproved
  wallet.lastUpdatedAt = nowIso
  db.transactions.push({
    id: uuidv4(),
    walletId: wallet.id,
    userId: wallet.userId,
    type: 'prepay_disbursement',
    amount: actualApproved,
    balanceAfter: wallet.balance,
    relatedOrderId: prepay.orderId,
    remark: `风控复核放款 ${prepay.prepayNo}`,
    createdAt: nowIso,
  })

  success(res, {
    prepayId: id,
    prepayNo: prepay.prepayNo,
    status: 'disbursed',
    approvedAmount: actualApproved,
    disbursedAmount: actualApproved,
  }, '预支复核通过，已放款')
})

router.get('/users', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限访问', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { role, keyword, authStatus } = req.query

  let list = [...db.users]
  if (role) list = list.filter(u => u.role === role)
  if (keyword) {
    const kw = (keyword as string).toLowerCase()
    list = list.filter(u =>
      u.nickname.toLowerCase().includes(kw) ||
      u.phone.includes(kw) ||
      u.realName.toLowerCase().includes(kw)
    )
  }
  if (authStatus) list = list.filter(u => getAuthStatus(u) === authStatus)

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(u => ({
      ...u,
      authStatus: getAuthStatus(u),
      orderCount: u.role === 'shipper'
        ? db.orders.filter(o => o.shipperId === u.id).length
        : u.role === 'driver'
        ? db.orders.filter(o => o.driverId === u.id).length
        : 0,
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    roleStats: {
      driver: db.users.filter(u => u.role === 'driver').length,
      shipper: db.users.filter(u => u.role === 'shipper').length,
      admin: db.users.filter(u => u.role === 'admin').length,
    },
  })
})

router.post('/users/:id/status', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限操作', 403, 403)
    return
  }

  const { id } = req.params
  const target = db.users.find(u => u.id === id)
  if (!target) {
    notFound(res, '用户不存在')
    return
  }
  if (target.role === 'admin') {
    fail(res, '无法操作管理员账号')
    return
  }

  const { status } = req.body as { status?: 'active' | 'suspended' }
  if (!status) {
    fail(res, '请指定状态')
    return
  }

  target.status = status
  success(res, { userId: id, status }, '用户状态已更新')
})

router.get('/stations/all', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限访问', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { brand, province, isActive } = req.query

  let list = [...db.fuelStations]
  if (brand) list = list.filter(s => s.brand === brand)
  if (province) list = list.filter(s => s.province === province)
  if (isActive !== undefined) {
    const active = isActive === 'true' || isActive === '1'
    list = list.filter(s => (s.isActive ?? true) === active)
  }

  list.sort((a, b) => (b.redeemCount || 0) - (a.redeemCount || 0))
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list,
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    summary: {
      totalStations: db.fuelStations.length,
      activeStations: db.fuelStations.filter(s => s.isActive ?? true).length,
      totalRedeems: db.fuelRedeems.length,
      totalRedeemAmount: db.fuelRedeems.reduce((s, r) => s + r.totalAmount, 0),
      totalSaving: db.fuelRedeems.reduce((s, r) => s + r.actualSaving, 0),
    },
  })
})

router.post('/stations/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'admin') {
    fail(res, '无权限操作', 403, 403)
    return
  }

  const { id } = req.params
  const station = db.fuelStations.find(s => s.id === id)
  if (!station) {
    notFound(res, '油站不存在')
    return
  }

  const body = req.body as Partial<FuelStation> & { action?: string }
  const { action, ...rest } = body

  if (action === 'toggle') {
    station.isActive = !(station.isActive ?? true)
  } else {
    Object.assign(station, rest)
  }

  station.updatedAt = new Date().toISOString()
  success(res, { station }, '油站信息已更新')
})

export default router
