import { db, type FreightOrder, type User, type MatchResult } from '../mock/data.js'
import { v4 as uuidv4 } from 'uuid'
import { haversineDistance } from './geo.js'

export function calcMatchScore(order: FreightOrder, driver: User, driverLng?: number, driverLat?: number): MatchResult {
  // 价格分：运费指数衰减，价格越高分越低(模拟价格竞争力)
  const avgFreightPerKm = 5
  const priceRatio = (order.freightAmount / Math.max(1, order.distanceKm)) / avgFreightPerKm
  const priceScore = Math.max(0, Math.min(100, 100 * Math.exp(-Math.max(0, priceRatio - 0.8) * 2)))

  // 信用分：(标准化)×(按时完成率加权)
  const creditNorm = Math.min(100, Math.max(0, ((driver.creditScore - 300) / 600) * 100))
  const driverTotal = db.orders.filter(o => o.driverId === driver.id).length
  const driverDone = db.orders.filter(o => o.driverId === driver.id && o.status === 'completed').length
  const onTimeRate = driverTotal > 0 ? driverDone / driverTotal : 0.7
  const creditScore = creditNorm * (onTimeRate * 0.6 + 0.4)

  // 资质分：车型匹配 + 信用门槛
  const driverProfile = db.driverProfiles.find(p => p.userId === driver.id)
  const vehicleMatch = driverProfile && driverProfile.vehicleType === order.vehicleTypeRequired
  const creditMatch = driver.creditScore >= 600
  const qualificationScore = (vehicleMatch ? 60 : 20) + (creditMatch ? 40 : 10)

  // 线路分：位置临近惩罚(度数近似)
  let routeScore = 70
  if (driverLng !== undefined && driverLat !== undefined) {
    const distKm = haversineDistance(driverLat, driverLng, order.pickupPoint.latitude, order.pickupPoint.longitude)
    const distPenalty = Math.min(1, distKm / 200)
    routeScore = Math.max(30, 100 * (1 - distPenalty))
  } else if (driverProfile?.currentLocation) {
    const cl = driverProfile.currentLocation
    const distKm = haversineDistance(cl.latitude, cl.longitude, order.pickupPoint.latitude, order.pickupPoint.longitude)
    const distPenalty = Math.min(1, distKm / 200)
    routeScore = Math.max(30, 100 * (1 - distPenalty))
  }

  const score = Math.round(0.35 * priceScore + 0.25 * creditScore + 0.25 * qualificationScore + 0.15 * routeScore)

  return {
    orderId: order.id,
    driverId: driver.id,
    score,
    priceScore: Math.round(priceScore * 10) / 10,
    creditScore: Math.round(creditScore * 10) / 10,
    qualificationScore: Math.round(qualificationScore * 10) / 10,
    routeScore: Math.round(routeScore * 10) / 10,
    recommendedAt: new Date().toISOString(),
  }
}

export function recommendOrdersForDriver(driverId: string, lng?: number, lat?: number, limit = 20, filters?: { vehicleType?: string; minPrice?: number; maxDistance?: number }): MatchResult[] {
  const driver = db.users.find(u => u.id === driverId)
  if (!driver) return []

  let publishedOrders = db.orders.filter(o => o.status === 'published')

  if (filters?.vehicleType) {
    publishedOrders = publishedOrders.filter(o => o.vehicleTypeRequired === filters.vehicleType)
  }
  if (filters?.minPrice) {
    publishedOrders = publishedOrders.filter(o => o.freightAmount >= filters.minPrice!)
  }
  if (filters?.maxDistance) {
    publishedOrders = publishedOrders.filter(o => o.distanceKm <= filters.maxDistance!)
  }

  const driverProfile = db.driverProfiles.find(p => p.userId === driverId)

  const results: MatchResult[] = publishedOrders
    .map(order => {
      const existing = db.matchingLogs.find(m => m.orderId === order.id && m.driverId === driverId && m.action === 'recommend')
      // Try to find in dedicated matchResults if available, else compute new
      if (existing && existing.score) {
        return {
          orderId: order.id,
          driverId,
          score: existing.score,
          priceScore: 0,
          creditScore: 0,
          qualificationScore: 0,
          routeScore: 0,
          recommendedAt: existing.createdAt,
        }
      }
      const result = calcMatchScore(order, driver, lng, lat)
      db.matchingLogs.push({
        id: uuidv4(),
        orderId: order.id,
        driverId,
        score: result.score,
        action: 'recommend',
        createdAt: new Date().toISOString(),
      })
      return result
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return results
}

export function recommendDriversForOrder(orderId: string, limit = 10): (MatchResult & { driver: User; driverProfile?: ReturnType<typeof db.driverProfiles.find> })[] {
  const order = db.orders.find(o => o.id === orderId)
  if (!order) return []

  const drivers = db.users.filter(u => u.role === 'driver')
  return drivers
    .map(driver => {
      const profile = db.driverProfiles.find(p => p.userId === driver.id)
      const existing = db.matchingLogs.find(m => m.orderId === orderId && m.driverId === driver.id && m.action === 'recommend')
      const result: MatchResult = existing && existing.score
        ? { orderId, driverId: driver.id, score: existing.score, priceScore: 0, creditScore: 0, qualificationScore: 0, routeScore: 0, recommendedAt: existing.createdAt }
        : calcMatchScore(order, driver)
      if (!existing || !existing.score) {
        db.matchingLogs.push({
          id: uuidv4(),
          orderId,
          driverId: driver.id,
          score: result.score,
          action: 'recommend',
          createdAt: new Date().toISOString(),
        })
      }
      return { ...result, driver, driverProfile: profile }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
