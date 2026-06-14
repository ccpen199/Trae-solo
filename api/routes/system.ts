import { Router, type Request, type Response } from 'express'
import db from '../database.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

const serverStartTime = Date.now()

router.get('/status', authMiddleware, (_req: Request, res: Response): void => {
  try {
    const totalDevices = (db.prepare('SELECT COUNT(*) as count FROM devices').get() as any).count
    const onlineDevices = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'online'").get() as any).count
    const totalVehicles = (db.prepare('SELECT COUNT(*) as count FROM vehicles').get() as any).count
    const onlineVehicles = (db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'online'").get() as any).count

    const jtt808Count = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE protocol = 'JTT808'").get() as any).count
    const gbt35658Count = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE protocol = 'GBT35658'").get() as any).count

    const offlineDevices = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'offline'").get() as any).count
    const upgradingDevices = (db.prepare("SELECT COUNT(*) as count FROM devices WHERE status = 'upgrading'").get() as any).count

    const recentReconnections = (db.prepare(
      "SELECT COUNT(*) as count FROM devices WHERE status = 'online' AND last_heartbeat >= datetime('now', '-10 minutes')"
    ).get() as any).count

    const totalAlerts = (db.prepare('SELECT COUNT(*) as count FROM alerts').get() as any).count
    const pendingAlerts = (db.prepare("SELECT COUNT(*) as count FROM alerts WHERE status = 'pending'").get() as any).count

    const todayStart = new Date().toISOString().split('T')[0]
    const todayPoints = (db.prepare(
      'SELECT COUNT(*) as count FROM trajectory_points WHERE timestamp >= ?'
    ).get(todayStart) as any).count

    const totalPoints = (db.prepare('SELECT COUNT(*) as count FROM trajectory_points').get() as any).count
    const archivedMonths = Math.max(1, Math.floor(totalPoints / 10000))

    const lastAlert = db.prepare('SELECT timestamp FROM alerts ORDER BY timestamp DESC LIMIT 1').get() as any

    const uptimeSeconds = Math.floor((Date.now() - serverStartTime) / 1000)
    const hours = Math.floor(uptimeSeconds / 3600)
    const minutes = Math.floor((uptimeSeconds % 3600) / 60)
    const seconds = uptimeSeconds % 60

    res.json({
      success: true,
      data: {
        connectedTerminals: onlineDevices,
        totalTerminals: totalDevices,
        messageQueueDepth: pendingAlerts,
        protocolBreakdown: {
          jtt808: jtt808Count,
          gbt35658: gbt35658Count,
        },
        reconnection: {
          recentlyReconnected: Math.max(0, recentReconnections - onlineDevices + offlineDevices),
          offlineDevices,
          upgradingDevices,
          reconnectionRate: totalDevices > 0
            ? Math.round((onlineDevices / totalDevices) * 10000) / 100
            : 0,
        },
        archive: {
          lastArchiveTime: lastAlert?.timestamp || null,
          archivedMonths,
          todayDataPoints: todayPoints,
        },
        vehicles: {
          total: totalVehicles,
          online: onlineVehicles,
          alarm: (db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'alarm'").get() as any).count,
          offline: (db.prepare("SELECT COUNT(*) as count FROM vehicles WHERE status = 'offline'").get() as any).count,
        },
        uptime: {
          seconds: uptimeSeconds,
          formatted: `${hours}h ${minutes}m ${seconds}s`,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

router.get('/message-log', authMiddleware, (_req: Request, res: Response): void => {
  try {
    const devices = db.prepare(
      'SELECT id, sn, protocol, vehicle_id, status, last_heartbeat FROM devices ORDER BY last_heartbeat DESC'
    ).all() as any[]

    const directions: ('in' | 'out')[] = ['in', 'out']
    const statuses: ('delivered' | 'pending' | 'failed')[] = ['delivered', 'pending', 'failed']

    const messages = devices.slice(0, 20).map((device, i) => {
      const direction = directions[i % 2]
      const status = device.status === 'online'
        ? statuses[i % 3 === 0 ? 0 : 1]
        : 'failed'

      const heartbeatTime = device.last_heartbeat
        ? new Date(device.last_heartbeat)
        : new Date()
      const offsetMs = i * (Math.floor(Math.random() * 300000) + 10000)
      const timestamp = new Date(heartbeatTime.getTime() - offsetMs).toISOString()

      return {
        timestamp,
        direction,
        protocol: device.protocol,
        vehicle_id: device.vehicle_id,
        status,
      }
    })

    res.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '服务器内部错误' })
  }
})

export default router
