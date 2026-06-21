import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type MatchingLog } from '../mock/data.js'
import { recommendOrdersForDriver, recommendDriversForOrder } from '../services/matchingEngine.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

router.get('/recommend/orders', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'driver') {
    fail(res, '仅司机可查看推荐订单', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const lng = parseFloat((req.query.lng as string) || (req.query.longitude as string) || '116.4074')
  const lat = parseFloat((req.query.lat as string) || (req.query.latitude as string) || '39.9042')
  const radiusKm = parseFloat((req.query.radiusKm as string) || '300')
  const vehicleType = (req.query.vehicleType as string) || undefined
  const minFreight = parseFloat((req.query.minFreight as string) || '0')
  const cargoType = (req.query.cargoType as string) || undefined

  const driverProfile = db.driverProfiles.find(p => p.userId === user.id)
  if (!driverProfile) {
    fail(res, '司机资料不存在')
    return
  }

  const recommendations = recommendOrdersForDriver(
    user,
    driverProfile,
    db.orders,
    db.users,
    db.shipperProfiles,
    { lng, lat },
    { vehicleType, minFreight, cargoType, radiusKm }
  )

  const list = recommendations
    .filter(r => {
      if (vehicleType && r.order.vehicleTypeRequired !== vehicleType) return false
      if (r.order.freightAmount < minFreight) return false
      if (cargoType && !r.order.cargoType.includes(cargoType)) return false
      return true
    })

  const pageData = paginate(list, params)

  pageData.list.forEach(r => {
    const log: MatchingLog = {
      id: uuidv4(),
      orderId: r.order.id,
      driverId: user.id,
      score: r.score,
      action: 'view',
      createdAt: new Date().toISOString(),
    }
    db.matchingLogs.push(log)
  })

  success(res, {
    list: pageData.list.map(r => ({
      orderId: r.order.id,
      orderNo: r.order.orderNo,
      title: r.order.title,
      cargoType: r.order.cargoType,
      cargoWeight: r.order.cargoWeight,
      cargoVolume: r.order.cargoVolume,
      vehicleTypeRequired: r.order.vehicleTypeRequired,
      pickupPoint: r.order.pickupPoint,
      deliveryPoint: r.order.deliveryPoint,
      distanceKm: r.order.distanceKm,
      freightAmount: r.order.freightAmount,
      prepayRatio: r.order.prepayRatio,
      prepayMaxAmount: r.order.prepayMaxAmount,
      status: r.order.status,
      publishedAt: r.order.publishedAt,
      score: r.score,
      distanceToPickup: r.distanceToPickup,
      matchReasons: r.matchReasons,
      shipperName: db.users.find(u => u.id === r.order.shipperId)?.nickname,
      shipperRating: db.shipperProfiles.find(p => p.userId === r.order.shipperId)?.rating,
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    queryMeta: {
      lng, lat, radiusKm,
      matchedTotal: recommendations.length,
      avgScore: recommendations.length ? (recommendations.reduce((s, r) => s + r.score, 0) / recommendations.length).toFixed(1) : '0',
    },
  })
})

router.get('/recommend/drivers/:orderId', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { orderId } = req.params

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (user.role !== 'admin' && order.shipperId !== user.id) {
    fail(res, '无权限查看司机推荐', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const limit = parseInt((req.query.limit as string) || '10', 10)
  const minCredit = parseInt((req.query.minCredit as string) || '600', 10)
  const minCompletedOrders = parseInt((req.query.minCompletedOrders as string) || '10', 10)

  const shipperProfile = db.shipperProfiles.find(p => p.userId === order.shipperId)
  const filteredProfiles = db.driverProfiles.filter(p =>
    (p.creditScore ?? 650) >= minCredit &&
    p.completedOrders >= minCompletedOrders
  )

  const recommendations = recommendDriversForOrder(
    order,
    filteredProfiles,
    db.users,
    shipperProfile
  ).slice(0, limit)

  const pageData = paginate(recommendations, params)

  success(res, {
    list: pageData.list.map(r => ({
      driverId: r.driver.id,
      driverName: r.driver.realName || r.driver.nickname,
      driverPhone: r.driver.phone,
      avatar: r.driver.avatar,
      creditScore: r.driver.creditScore,
      vehicleType: r.profile.vehicleType,
      plateNumber: r.profile.plateNumber,
      vehicleModel: r.profile.vehicleModel,
      currentLocation: r.profile.currentLocation,
      totalOrders: r.profile.totalOrders,
      completedOrders: r.profile.completedOrders,
      rating: r.profile.rating,
      yearsOfExperience: r.profile.yearsOfExperience,
      score: r.score,
      availabilityScore: r.availabilityScore,
      distanceFromPickup: r.distanceFromPickup,
      historicalPerformance: r.historicalPerformance,
      matchReasons: r.matchReasons,
      onTimeRate: r.profile.completedOrders > 0
        ? (r.profile.onTimeDeliveries / r.profile.completedOrders * 100).toFixed(1) + '%'
        : '95%',
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    queryMeta: {
      orderId,
      matchedTotal: recommendations.length,
      avgScore: recommendations.length ? (recommendations.reduce((s, r) => s + r.score, 0) / recommendations.length).toFixed(1) : '0',
    },
  })
})

router.post('/actions/match', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'shipper' && user.role !== 'admin') {
    fail(res, '仅货主或管理员可发起匹配', 403, 403)
    return
  }

  const { orderId, driverId } = req.body as { orderId?: string; driverId?: string }
  if (!orderId || !driverId) {
    fail(res, '请选择运单和司机')
    return
  }

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }
  if (user.role !== 'admin' && order.shipperId !== user.id) {
    fail(res, '无权限操作此运单', 403, 403)
    return
  }
  if (order.status !== 'published' && order.status !== 'matched') {
    fail(res, `运单状态${order.status}不可匹配`)
    return
  }

  const driver = db.users.find(u => u.id === driverId)
  if (!driver || driver.role !== 'driver') {
    notFound(res, '司机不存在')
    return
  }

  order.status = 'matched'
  order.driverId = driverId
  order.matchedAt = new Date().toISOString()

  const log: MatchingLog = {
    id: uuidv4(),
    orderId: order.id,
    driverId,
    score: 90,
    action: 'match',
    createdAt: new Date().toISOString(),
  }
  db.matchingLogs.push(log)

  success(res, {
    orderId: order.id,
    orderNo: order.orderNo,
    status: order.status,
    driverId,
  }, '匹配成功')
})

export default router
