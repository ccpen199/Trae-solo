import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type FreightOrder, type OrderStatus, type PrepayOrder, type PrepayStatus, type AddressPoint } from '../mock/data.js'
import { genOrderNo, genPrepayNo } from '../mock/data.js'
import { evaluatePrepayRisk } from '../services/riskEngine.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  published: ['matched', 'cancelled'],
  matched: ['loading', 'cancelled'],
  loading: ['in_transit', 'cancelled'],
  in_transit: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return STATUS_TRANSITIONS[current]?.includes(next) ?? false
}

function getUserName(userId?: string): string | undefined {
  const u = db.users.find(x => x.id === userId)
  return u?.realName || u?.nickname
}

function getUserPhone(userId?: string): string | undefined {
  return db.users.find(x => x.id === userId)?.phone
}

function buildAddressPoint(data: Partial<AddressPoint> & { longitude?: number; latitude?: number; lng?: number; lat?: number }, city: string): AddressPoint {
  const longitude = data.longitude ?? data.lng ?? 116.4074 + Math.random() * 0.1
  const latitude = data.latitude ?? data.lat ?? 39.9042 + Math.random() * 0.1
  return {
    id: data.id || uuidv4(),
    province: data.province || city,
    city,
    district: data.district || '市辖区',
    address: data.address || `${city}市辖区配送点`,
    longitude,
    latitude,
    contactName: data.contactName,
    contactPhone: data.contactPhone,
  }
}

router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const params = parsePagination(req.query as Record<string, unknown>)
  const { status } = req.query

  let list = [...db.orders]

  if (user.role === 'driver') {
    list = list.filter(o => o.driverId === user.id)
  } else if (user.role === 'shipper') {
    list = list.filter(o => o.shipperId === user.id)
  }

  if (status) {
    const statusList = (status as string).split(',').filter(Boolean) as OrderStatus[]
    list = list.filter(o => statusList.includes(o.status))
  }

  list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(o => ({
      ...o,
      shipperName: getUserName(o.shipperId),
      shipperPhone: getUserPhone(o.shipperId),
      driverName: o.driverId ? getUserName(o.driverId) : undefined,
      driverPhone: o.driverId ? getUserPhone(o.driverId) : undefined,
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
  })
})

router.get('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const order = db.orders.find(o => o.id === id || o.orderNo === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  const user = req.user!
  if (user.role !== 'admin' && order.shipperId !== user.id && order.driverId !== user.id) {
    fail(res, '无权限查看此运单', 403, 403)
    return
  }

  const prepayOrder = db.prepayOrders.find(p => p.orderId === order.id)
  const trackPoints = db.trackPoints
    .filter(t => t.orderId === order.id)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const alerts = db.trackAlerts.filter(a => a.orderId === order.id)

  success(res, {
    order: {
      ...order,
      shipperName: getUserName(order.shipperId),
      shipperPhone: getUserPhone(order.shipperId),
      driverName: order.driverId ? getUserName(order.driverId) : undefined,
      driverPhone: order.driverId ? getUserPhone(order.driverId) : undefined,
    },
    prepayOrder,
    trackPoints,
    alerts,
  })
})

router.post('/', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'shipper' && user.role !== 'admin') {
    fail(res, '仅货主可发布运单', 403, 403)
    return
  }

  const body = req.body as Partial<FreightOrder> & {
    pickupPoint?: Partial<AddressPoint> & { lng?: number; lat?: number };
    deliveryPoint?: Partial<AddressPoint> & { lng?: number; lat?: number };
  }
  if (!body.pickupPoint || !body.deliveryPoint || !body.cargoType || body.freightAmount === undefined) {
    fail(res, '请填写完整的运单信息(提货点/卸货点/货物类型/运费)')
    return
  }

  const pickupCity = body.pickupPoint.city || (body as any).startCity || '北京'
  const deliveryCity = body.deliveryPoint.city || (body as any).endCity || '上海'
  const distanceKm = body.distanceKm ?? Math.max(50, Math.round(Math.random() * 1500))

  const order: FreightOrder = {
    id: uuidv4(),
    orderNo: body.orderNo || genOrderNo(),
    shipperId: user.role === 'shipper' ? user.id : (body.shipperId || user.id),
    title: body.title || `${pickupCity}→${deliveryCity} ${body.cargoType}运输`,
    cargoType: body.cargoType,
    cargoWeight: body.cargoWeight ?? 18,
    cargoVolume: body.cargoVolume ?? 45,
    vehicleTypeRequired: body.vehicleTypeRequired || 'truck_13',
    pickupPoint: buildAddressPoint(body.pickupPoint, pickupCity),
    deliveryPoint: buildAddressPoint(body.deliveryPoint, deliveryCity),
    pickupStartTime: body.pickupStartTime || new Date(Date.now() + 12 * 3600 * 1000).toISOString(),
    pickupEndTime: body.pickupEndTime || new Date(Date.now() + 36 * 3600 * 1000).toISOString(),
    deliveryDeadline: body.deliveryDeadline || new Date(Date.now() + (distanceKm / 50 + 24) * 3600 * 1000).toISOString(),
    freightAmount: body.freightAmount,
    prepayRatio: body.prepayRatio ?? 0.3,
    prepayMaxAmount: body.prepayMaxAmount ?? Math.min(body.freightAmount * (body.prepayRatio ?? 0.3), 30000),
    insuranceRequired: body.insuranceRequired ?? false,
    insuranceAmount: body.insuranceRequired ? (body.insuranceAmount ?? parseFloat((body.freightAmount * 0.003).toFixed(2))) : undefined,
    status: 'published',
    distanceKm,
    estimatedDurationHours: body.estimatedDurationHours ?? Math.max(4, Math.round(distanceKm / 50)),
    remark: body.remark,
    publishedAt: new Date().toISOString(),
  }

  db.orders.push(order)
  success(res, { orderId: order.id, orderNo: order.orderNo, status: order.status }, '运单发布成功')
})

router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  const user = req.user!
  if (user.role !== 'admin' && order.shipperId !== user.id) {
    fail(res, '无权限修改此运单', 403, 403)
    return
  }

  if (!['published', 'matched'].includes(order.status)) {
    fail(res, `运单当前状态${order.status}不可修改`)
    return
  }

  const body = req.body as Partial<FreightOrder>
  Object.assign(order, body)

  success(res, { order }, '运单修改成功')
})

router.post('/:id/publish', async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (order.status === 'published') {
    success(res, { orderId: order.id, status: order.status }, '运单已处于发布状态')
    return
  }

  order.status = 'published'
  order.publishedAt = new Date().toISOString()

  success(res, { orderId: order.id, status: order.status }, '运单发布成功')
})

router.post('/:id/accept', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'driver') {
    fail(res, '仅司机可接单', 403, 403)
    return
  }
  if (user.driverDocs?.status !== 'approved') {
    fail(res, '请先完成三证认证并通过审核')
    return
  }

  const { id } = req.params
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (!canTransition(order.status, 'matched')) {
    fail(res, `运单状态${order.status}无法接单`)
    return
  }

  const driverProfile = db.driverProfiles.find(p => p.userId === user.id)
  if (driverProfile && order.vehicleTypeRequired && driverProfile.vehicleType !== order.vehicleTypeRequired) {
    fail(res, `车型不匹配，运单要求${order.vehicleTypeRequired}，当前${driverProfile.vehicleType}`)
    return
  }

  order.status = 'matched'
  order.driverId = user.id
  order.matchedAt = new Date().toISOString()

  success(res, { orderId: order.id, status: order.status, driverId: user.id }, '接单成功')
})

router.post('/:id/loading-confirm', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { id } = req.params
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }
  if (order.driverId !== user.id) {
    fail(res, '无权限操作此运单', 403, 403)
    return
  }

  if (!(canTransition(order.status, 'loading') || canTransition(order.status, 'in_transit'))) {
    fail(res, `运单状态${order.status}无法确认装车`)
    return
  }

  const now = new Date()
  order.status = 'in_transit'
  order.loadedAt = now.toISOString()
  order.departedAt = new Date(now.getTime() + 30 * 60 * 1000).toISOString()

  const { photos } = req.body as { photos?: string[] }
  if (photos?.length) {
    (order as any).loadingPhotos = photos
  }

  const driverUser = db.users.find(u => u.id === order.driverId)!
  const driverProfile = db.driverProfiles.find(p => p.userId === order.driverId)!
  const shipperUser = db.users.find(u => u.id === order.shipperId)!
  const shipperProfile = db.shipperProfiles.find(p => p.userId === order.shipperId)!
  const evaluation = evaluatePrepayRisk(order, driverUser, driverProfile, shipperUser, shipperProfile)

  let prepayOrder: PrepayOrder | null = null

  if (evaluation.decision !== 'reject') {
    const requestedAmount = Math.min(order.prepayMaxAmount, evaluation.maxApprovedAmount)
    const approvedAmount = requestedAmount
    const isAuto = evaluation.decision === 'auto_approve'
    const disbursedAmount = isAuto ? approvedAmount : 0

    const nowIso = now.toISOString()
    const status: PrepayStatus = isAuto ? 'disbursed' : 'pending'

    prepayOrder = {
      id: uuidv4(),
      prepayNo: genPrepayNo(),
      orderId: order.id,
      driverId: order.driverId!,
      shipperId: order.shipperId,
      requestedAmount: parseFloat(requestedAmount.toFixed(2)),
      approvedAmount: parseFloat(approvedAmount.toFixed(2)),
      disbursedAmount: parseFloat(disbursedAmount.toFixed(2)),
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      riskReasons: evaluation.riskReasons,
      status,
      requestedAt: nowIso,
      riskEvaluatedAt: nowIso,
      approvedAt: (isAuto || evaluation.decision === 'manual_review') ? nowIso : undefined,
      disbursedAt: isAuto ? nowIso : undefined,
    }

    db.prepayOrders.push(prepayOrder)
    order.prepayRatio = Math.min(order.prepayRatio, evaluation.approvedRatio)
    order.prepayMaxAmount = parseFloat(requestedAmount.toFixed(2))

    if (isAuto && disbursedAmount > 0) {
      const wallet = db.wallets.find(w => w.userId === order.driverId)
      if (wallet) {
        wallet.balance += disbursedAmount
        wallet.usedCredit += disbursedAmount
        wallet.totalIncome += disbursedAmount
        wallet.lastUpdatedAt = nowIso
        db.transactions.push({
          id: uuidv4(),
          walletId: wallet.id,
          userId: wallet.userId,
          type: 'prepay_disbursement',
          amount: disbursedAmount,
          balanceAfter: wallet.balance,
          relatedOrderId: order.id,
          remark: `装车预支放款 ${order.orderNo}`,
          createdAt: nowIso,
        })
      }
    }
  }

  success(res, {
    orderId: order.id,
    status: order.status,
    prepayOrderId: prepayOrder?.id,
    prepayStatus: prepayOrder?.status,
    riskResult: {
      riskScore: evaluation.riskScore,
      riskLevel: evaluation.riskLevel,
      decision: evaluation.decision,
      suggestion: evaluation.suggestions[0] || '',
    },
  }, '装车确认成功' + (prepayOrder ? `，${evaluation.suggestions[0] || ''}` : ''))
})

router.post('/:id/unloading-confirm', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { id } = req.params
  const order = db.orders.find(o => o.id === id)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  const isShipper = order.shipperId === user.id && user.role === 'shipper'
  const isDriver = order.driverId === user.id && user.role === 'driver'
  const isAdmin = user.role === 'admin'

  if (!isShipper && !isDriver && !isAdmin) {
    fail(res, '无权限操作此运单', 403, 403)
    return
  }

  if (!canTransition(order.status, 'completed')) {
    fail(res, `运单状态${order.status}无法确认签收`)
    return
  }

  const { photos, remark } = req.body as { photos?: string[]; remark?: string }
  const now = new Date()
  const nowIso = now.toISOString()

  order.status = 'completed'
  order.arrivedAt = nowIso
  order.completedAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString()
  if (remark) order.remark = remark
  if (photos?.length) (order as any).unloadingPhotos = photos

  const prepay = db.prepayOrders.find(p => p.orderId === order.id && p.disbursedAmount > 0 && p.status !== 'settled')
  if (prepay) {
    prepay.status = 'settled'
    prepay.settledAt = nowIso

    const wallet = db.wallets.find(w => w.userId === order.driverId)
    if (wallet) {
      wallet.usedCredit = Math.max(0, wallet.usedCredit - prepay.disbursedAmount)
      wallet.balance += (order.freightAmount - prepay.disbursedAmount)
      wallet.totalIncome += (order.freightAmount - prepay.disbursedAmount)
      wallet.lastUpdatedAt = nowIso

      db.transactions.push({
        id: uuidv4(),
        walletId: wallet.id,
        userId: wallet.userId,
        type: 'freight_income',
        amount: order.freightAmount - prepay.disbursedAmount,
        balanceAfter: wallet.balance,
        relatedOrderId: order.id,
        remark: `运单结算(扣除预支) ${order.orderNo}`,
        createdAt: nowIso,
      })
    }
  } else {
    const wallet = db.wallets.find(w => w.userId === order.driverId)
    if (wallet) {
      wallet.balance += order.freightAmount
      wallet.totalIncome += order.freightAmount
      wallet.lastUpdatedAt = nowIso
      db.transactions.push({
        id: uuidv4(),
        walletId: wallet.id,
        userId: wallet.userId,
        type: 'freight_income',
        amount: order.freightAmount,
        balanceAfter: wallet.balance,
        relatedOrderId: order.id,
        remark: `运单结算 ${order.orderNo}`,
        createdAt: nowIso,
      })
    }
  }

  if (order.driverId) {
    const dp = db.driverProfiles.find(p => p.userId === order.driverId)
    if (dp) {
      dp.totalOrders += 1
      dp.completedOrders += 1
      dp.totalMileage += order.distanceKm
    }
  }

  success(res, { orderId: order.id, status: order.status }, '卸货签收成功')
})

export default router
