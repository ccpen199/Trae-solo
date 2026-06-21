import { Router, type Response } from 'express'
import { success, fail, notFound } from '../utils/response.js'
import { parsePagination, paginate } from '../utils/pagination.js'
import { type AuthRequest } from '../utils/auth.js'
import { db, type TrackPoint, type TrackAlert, type TrackAlertType } from '../mock/data.js'
import { haversineDistance } from '../utils/geo.js'
import { v4 as uuidv4 } from '../utils/uuid.js'

const router = Router()

function getUserName(userId?: string): string | undefined {
  const u = db.users.find(x => x.id === userId)
  return u?.realName || u?.nickname
}

function detectAlert(points: TrackPoint[]): TrackAlert | null {
  if (points.length < 2) return null
  const first = points[0]
  const last = points[points.length - 1]

  const order = db.orders.find(o => o.id === first.orderId)
  if (!order || !order.driverId) return null

  const latest = last
  const prev = points[points.length - 2]

  const timeDiff = Math.abs(new Date(latest.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000
  const dist = haversineDistance(
    prev.longitude, prev.latitude,
    latest.longitude, latest.latitude
  )

  const speedKmh = timeDiff > 0 ? (dist / (timeDiff / 3600)) : 0
  const distanceLimit = order.distanceKm * 1.3
  const accumulatedDistance = points.length > 1
    ? points.slice(1).reduce((sum, p, i) =>
        sum + haversineDistance(
          points[i].longitude, points[i].latitude,
          p.longitude, p.latitude
        ), 0)
    : 0

  let alertType: TrackAlertType | null = null
  let alertMsg = ''
  let alertLevel: 'low' | 'medium' | 'high' = 'low'

  if (speedKmh > 120) {
    alertType = 'over_speed'
    alertMsg = `超速行驶 ${speedKmh.toFixed(0)}km/h，限速120km/h`
    alertLevel = 'high'
  } else if (timeDiff > 15 * 60 && dist < 0.1) {
    alertType = 'stoppage'
    alertMsg = `长时间停留 ${(timeDiff / 60).toFixed(0)}分钟，移动距离${(dist * 1000).toFixed(0)}米`
    alertLevel = 'medium'
  } else if (accumulatedDistance > distanceLimit) {
    alertType = 'off_route'
    alertMsg = `疑似偏离规划路线，已行驶${accumulatedDistance.toFixed(0)}km，规划${order.distanceKm}km`
    alertLevel = 'medium'
  } else if (latest.status === 'idle' && timeDiff > 30 * 60) {
    alertType = 'abnormal_idle'
    alertMsg = `异常怠速 ${(timeDiff / 60).toFixed(0)}分钟`
    alertLevel = 'low'
  }

  if (!alertType) return null

  return {
    id: uuidv4(),
    orderId: order.id,
    driverId: order.driverId,
    alertType: alertType,
    alertLevel,
    message: alertMsg,
    data: {
      speedKmh: parseFloat(speedKmh.toFixed(1)),
      distanceKm: parseFloat(accumulatedDistance.toFixed(2)),
      stoppageMinutes: parseFloat((timeDiff / 60).toFixed(0)),
      location: { lng: latest.longitude, lat: latest.latitude },
      latestPoint: latest,
    },
    status: 'pending',
    createdAt: new Date().toISOString(),
  }
}

router.post('/report', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { points, orderId } = req.body as {
    points?: Array<Partial<TrackPoint> & { lng?: number; lat?: number }>;
    orderId?: string;
  }

  const pts = points || []
  if (!pts.length) {
    fail(res, '请上传至少一条轨迹点')
    return
  }

  const nowIso = new Date().toISOString()
  let detectedAlerts: TrackAlert[] = []
  const orderPointsMap: Record<string, TrackPoint[]> = {}

  const savedPoints = pts.map(p => {
    const oid = p.orderId || orderId
    if (!oid) return null

    const longitude = p.longitude ?? p.lng ?? 0
    const latitude = p.latitude ?? p.lat ?? 0

    const point: TrackPoint = {
      id: p.id || uuidv4(),
      orderId: oid,
      driverId: user.role === 'driver' ? user.id : p.driverId,
      timestamp: p.timestamp || nowIso,
      longitude,
      latitude,
      speedKmh: p.speedKmh ?? 0,
      heading: p.heading ?? 0,
      altitude: p.altitude ?? 0,
      status: p.status || 'in_transit',
    }

    if (!orderPointsMap[oid]) orderPointsMap[oid] = []
    orderPointsMap[oid].push(point)
    return point
  }).filter(Boolean) as TrackPoint[]

  savedPoints.forEach(p => {
    db.trackPoints.push(p)
  })

  Object.keys(orderPointsMap).forEach(oid => {
    const existingPts = db.trackPoints
      .filter(tp => tp.orderId === oid)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    const alert = detectAlert(existingPts)
    if (alert) {
      db.trackAlerts.push(alert)
      detectedAlerts.push(alert)
    }
  })

  success(res, {
    savedCount: savedPoints.length,
    alertsCount: detectedAlerts.length,
    alerts: detectedAlerts.map(a => ({
      id: a.id,
      orderId: a.orderId,
      alertType: a.alertType,
      alertLevel: a.alertLevel,
      message: a.message,
      status: a.status,
    })),
  }, `轨迹上报成功，共${savedPoints.length}条${detectedAlerts.length ? `，检测到${detectedAlerts.length}条告警` : ''}`)
})

router.get('/:orderId/list', async (req: AuthRequest, res: Response): Promise<void> => {
  const { orderId } = req.params
  const user = req.user!

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (user.role !== 'admin' && order.shipperId !== user.id && order.driverId !== user.id) {
    fail(res, '无权限查看此运单轨迹', 403, 403)
    return
  }

  const { startTime, endTime, pageSize } = req.query
  const params = parsePagination(req.query as Record<string, unknown>)
  if (pageSize) params.pageSize = Math.max(100, parseInt(pageSize as string))

  let list = db.trackPoints
    .filter(t => t.orderId === orderId || t.orderId === order.id)

  if (startTime) {
    const d = new Date(startTime as string).getTime()
    list = list.filter(t => new Date(t.timestamp).getTime() >= d)
  }
  if (endTime) {
    const d = new Date(endTime as string).getTime()
    list = list.filter(t => new Date(t.timestamp).getTime() <= d)
  }

  list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  const pageData = paginate(list, params)

  const distanceSummary = list.length > 1
    ? list.slice(1).reduce((sum, p, i) =>
        sum + haversineDistance(
          list[i].longitude, list[i].latitude,
          p.longitude, p.latitude
        ), 0)
    : 0

  success(res, {
    list: pageData.list,
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    summary: {
      pointsCount: list.length,
      totalDistanceKm: parseFloat(distanceSummary.toFixed(2)),
      startTime: list[0]?.timestamp,
      endTime: list[list.length - 1]?.timestamp,
      avgSpeed: list.filter(p => p.speedKmh > 0).length
        ? parseFloat((list.filter(p => p.speedKmh > 0).reduce((s, p) => s + p.speedKmh, 0) / list.filter(p => p.speedKmh > 0).length).toFixed(1))
        : 0,
      maxSpeed: list.length ? Math.max(...list.map(p => p.speedKmh || 0)) : 0,
    },
  })
})

router.get('/:orderId/alerts', async (req: AuthRequest, res: Response): Promise<void> => {
  const { orderId } = req.params
  const user = req.user!

  const order = db.orders.find(o => o.id === orderId || o.orderNo === orderId)
  if (!order) {
    notFound(res, '运单不存在')
    return
  }

  if (user.role !== 'admin' && order.shipperId !== user.id && order.driverId !== user.id) {
    fail(res, '无权限查看此运单告警', 403, 403)
    return
  }

  const params = parsePagination(req.query as Record<string, unknown>)
  const { alertType, status, alertLevel } = req.query

  let list = db.trackAlerts.filter(a => a.orderId === orderId || a.orderId === order.id)

  if (alertType) list = list.filter(a => a.alertType === alertType)
  if (status) list = list.filter(a => a.status === status)
  if (alertLevel) list = list.filter(a => a.alertLevel === alertLevel)

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  const pageData = paginate(list, params)

  success(res, {
    list: pageData.list.map(a => ({
      ...a,
      driverName: getUserName(a.driverId),
    })),
    total: pageData.total,
    page: pageData.page,
    pageSize: pageData.pageSize,
    stats: {
      total: list.length,
      pending: list.filter(a => a.status === 'pending').length,
      handled: list.filter(a => a.status === 'handled').length,
      high: list.filter(a => a.alertLevel === 'high').length,
      medium: list.filter(a => a.alertLevel === 'medium').length,
      low: list.filter(a => a.alertLevel === 'low').length,
    },
  })
})

router.post('/alerts/:id/handle', async (req: AuthRequest, res: Response): Promise<void> => {
  const user = req.user!
  const { id } = req.params

  const alert = db.trackAlerts.find(a => a.id === id)
  if (!alert) {
    notFound(res, '告警记录不存在')
    return
  }

  const order = db.orders.find(o => o.id === alert.orderId)
  if (!order) {
    notFound(res, '关联运单不存在')
    return
  }

  if (user.role !== 'admin' && order.shipperId !== user.id && order.driverId !== user.id) {
    fail(res, '无权限处理此告警', 403, 403)
    return
  }

  const { action = 'ignore', remark } = req.body as { action?: string; remark?: string }

  if (alert.status === 'handled') {
    success(res, {
      alertId: alert.id,
      status: alert.status,
      handledAt: alert.handledAt,
    }, '告警已处理')
    return
  }

  alert.status = 'handled'
  alert.handledBy = user.id
  alert.handledAt = new Date().toISOString()
  alert.handledAction = action
  if (remark) alert.handledRemark = remark

  success(res, {
    alertId: alert.id,
    status: alert.status,
    handledBy: getUserName(user.id),
    handledAt: alert.handledAt,
    handledAction: action,
  }, '告警处理成功')
})

export default router
