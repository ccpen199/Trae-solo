import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type FuelStation, type FuelRedeem, type FuelType, type FuelPlanSegment } from '../mock/data.js'
import { findNearbyStations, calcOptimalFuelPlan } from '../utils/fuel.js'
import { haversineDistance } from '../utils/geo.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

function getUserName(userId?: string): string | undefined {
  const u = db.users.find(x => x.id === userId)
  return u?.realName || u?.nickname
}

router.get('/nearby', async (req: AuthRequest, res: Response): Promise<void> => {
  const params = parsePagination(req.query as Record<string, unknown>)
  const lng = parseFloat((req.query.lng as string) || (req.query.longitude as string) || '0')
  const lat = parseFloat((req.query.lat as string) || (req.query.latitude as string) || '0')
  const radiusKm = parseFloat((req.query.radiusKm as string) || '20')
  const fuelType = (req.query.fuelType as FuelType | undefined) || undefined
  const sortBy = (req.query.sortBy as string) || 'distance'
  const minDiscount = parseFloat((req.query.minDiscount as string) || '0')

  if (!lng || !lat) {
    fail(res, '请输入经纬度参数(lng,lat)')
    return
  }

  const nearby = findNearbyStations(
    { lng, lat },
    db.fuelStations,
    { radiusKm, fuelType, minDiscount }
  )

  let list = nearby
  if (sortBy === 'price') {
    list = nearby.sort((a, b) => {
      const pa = fuelType ? (a.prices[fuelType] ?? 999) : Math.min(...Object.values(a.prices))
      const pb = fuelType ? (b.prices[fuelType] ?? 999) : Math.min(...Object.values(b.prices))
      return pa - pb
    })
  } else if (sortBy === 'discount') {
    list = nearby.sort((a, b) => (b.discountRate || 0) - (a.discountRate || 0))
  }

  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(s => {
      const price = fuelType ? s.prices[fuelType] : undefined
      const marketPrice = price ? parseFloat((price / (1 - (s.discountRate || 0))).toFixed(2)) : undefined
      return {
        ...s,
        distance: s.distance,
        currentPrice: price,
        marketPrice,
        savingPerLiter: price && marketPrice ? parseFloat((marketPrice - price).toFixed(2)) : undefined,
      }
    }),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    queryMeta: {
      lng, lat, radiusKm, fuelType,
      avgPrice: list.length
        ? parseFloat((list.reduce((s, st) => {
            const p = fuelType ? (st.prices[fuelType] ?? 0) : (Object.values(st.prices)[0] ?? 0)
            return s + p
          }, 0) / list.length).toFixed(2))
        : 0,
      minPrice: list.length
        ? Math.min(...list.map(st => fuelType ? (st.prices[fuelType] ?? 9999) : Math.min(...Object.values(st.prices))))
        : 0,
    },
  })
})

router.get('/recommend-for-order', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { orderId } = req.query

  if (!orderId) {
    fail(res, '请传入运单ID(orderId)')
    return
  }

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId as string)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (user.role !== 'admin' && order.shipperId !== user.id && order.driverId !== user.id) {
    fail(res, '无权限查看此运单的加油方案', 403, 403)
    return
  }

  const { lng, lat } = req.query
  const startLng = lng ? parseFloat(lng as string) : order.pickupPoint.longitude
  const startLat = lat ? parseFloat(lat as string) : order.pickupPoint.latitude
  const fuelType = ((req.query.fuelType as FuelType) || 'diesel') as FuelType
  const currentVolume = parseFloat((req.query.currentVolume as string) || '200')
  const tankCapacity = parseFloat((req.query.tankCapacity as string) || '800')
  const avgConsumption = parseFloat((req.query.avgConsumption as string) || '30')

  const plan = calcOptimalFuelPlan(
    { lng: startLng, lat: startLat },
    order.deliveryPoint,
    db.fuelStations,
    {
      fuelType,
      currentFuelLiters: currentVolume,
      tankCapacity,
      avgConsumption,
      totalDistanceKm: order.distanceKm,
    }
  )

  success(res, {
    orderId: order.id,
    orderNo: order.orderNo,
    totalDistance: order.distanceKm,
    fuelPlan: {
      totalFuelLiters: plan.totalLiters,
      totalFuelCost: plan.totalCost,
      estimatedSaving: plan.totalSaving,
      savingsRatio: plan.totalCost > 0 ? parseFloat((plan.totalSaving / (plan.totalCost + plan.totalSaving) * 100).toFixed(1)) : 0,
      stationsNeeded: plan.segments.length,
      segments: plan.segments.map((seg, idx) => ({
        segmentIndex: idx,
        fromPoint: seg.startPoint,
        toPoint: seg.endPoint,
        segmentDistance: seg.distanceKm,
        station: {
          ...(seg.station as FuelStation),
          distance: seg.detourKm,
        },
        fuelType,
        liters: seg.liters,
        unitPrice: seg.unitPrice,
        segmentCost: seg.cost,
        segmentSaving: seg.saving,
        detourKm: seg.detourKm,
      })),
    },
    routeOverview: {
      startPoint: { lng: startLng, lat: startLat },
      endPoint: order.deliveryPoint,
      estimatedFuelTotal: Math.ceil(order.distanceKm * avgConsumption / 100),
    },
  })
})

router.post('/redeem', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  if (user.role !== 'driver') {
    fail(res, '仅司机可进行加油核销', 403, 403)
    return
  }

  const { stationId, orderId, fuelType, liters, actualPrice, marketPrice, odometer } = req.body as {
    stationId?: string; orderId?: string; fuelType?: FuelType; liters?: number;
    actualPrice?: number; marketPrice?: number; odometer?: number;
  }

  if (!stationId || !fuelType || !liters || !actualPrice) {
    fail(res, '请填写完整核销信息(油站/油品/升数/单价)')
    return
  }

  const station = db.fuelStations.find(s => s.id === stationId)
  if (!station) {
    notFound(res, '油站不存在')
    return
  }

  const litersNum = liters
  const actualPriceNum = actualPrice
  const totalAmount = parseFloat((litersNum * actualPriceNum).toFixed(2))
  const marketTotal = marketPrice ? parseFloat((litersNum * marketPrice).toFixed(2)) : parseFloat((litersNum * (actualPriceNum / (1 - (station.discountRate || 0)))).toFixed(2))
  const actualSaving = parseFloat((marketTotal - totalAmount).toFixed(2))
  const discountRate = marketTotal > 0 ? parseFloat(((1 - totalAmount / marketTotal) * 100).toFixed(2)) : 0

  const nowIso = new Date().toISOString()

  const redeem: FuelRedeem = {
    id: uuidv4(),
    redeemNo: 'RDM' + Date.now().toString().padStart(8, '0'),
    driverId: user.id,
    stationId,
    orderId,
    fuelType,
    liters: litersNum,
    unitPrice: actualPriceNum,
    totalAmount,
    marketUnitPrice: marketPrice || parseFloat((actualPriceNum / (1 - (station.discountRate || 0))).toFixed(2)),
    discountRate,
    actualSaving,
    odometer,
    status: 'success',
    createdAt: nowIso,
  }
  db.fuelRedeems.push(redeem)

  if (orderId) {
    const order = db.orders.find(o => o.id === orderId)
    if (order) {
      if (!order.fuelCost) order.fuelCost = 0
      order.fuelCost += totalAmount
    }
  }

  station.redeemCount = (station.redeemCount || 0) + 1
  station.lastRedeemAt = nowIso

  success(res, {
    redeemId: redeem.id,
    redeemNo: redeem.redeemNo,
    status: redeem.status,
    station: {
      id: station.id,
      name: station.name,
      brand: station.brand,
    },
    fuelDetail: {
      fuelType,
      liters: litersNum,
      unitPrice: actualPriceNum,
      marketUnitPrice: redeem.marketUnitPrice,
      totalAmount,
      marketTotal,
      saving: actualSaving,
      savingRate: discountRate,
    },
    createdAt: nowIso,
  }, '加油核销成功')
})

router.get('/redeem/list', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const params = parsePagination(req.query as Record<string, unknown>)
  const { stationId, startDate, endDate } = req.query

  let list = [...db.fuelRedeems]
  if (user.role === 'driver') {
    list = list.filter(r => r.driverId === user.id)
  }
  if (stationId) {
    list = list.filter(r => r.stationId === stationId)
  }
  if (startDate) {
    const d = new Date(startDate as string).getTime()
    list = list.filter(r => new Date(r.createdAt).getTime() >= d)
  }
  if (endDate) {
    const d = new Date(endDate as string).getTime()
    list = list.filter(r => new Date(r.createdAt).getTime() <= d)
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(r => ({
      ...r,
      stationName: db.fuelStations.find(s => s.id === r.stationId)?.name,
      driverName: getUserName(r.driverId),
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    summary: {
      totalLiters: list.reduce((s, r) => s + r.liters, 0),
      totalAmount: list.reduce((s, r) => s + r.totalAmount, 0),
      totalSaving: list.reduce((s, r) => s + r.actualSaving, 0),
      redeemCount: list.length,
    },
  })
})

export default router
