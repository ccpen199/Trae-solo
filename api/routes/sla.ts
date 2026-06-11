import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.get('/overview', (req: Request, res: Response): void => {
  const orders = db.prepare('SELECT * FROM orders').all() as any[]

  const completedOrders = orders.filter((o) => ['completed', 'verifying', 'disputed'].includes(o.status))

  let totalResponseMin = 0
  let totalArrivalMin = 0
  let totalCompletionMin = 0
  let responseCount = 0
  let arrivalCount = 0
  let completionCount = 0
  let responseTimeouts = 0
  let arrivalTimeouts = 0
  let completionTimeouts = 0

  for (const order of completedOrders) {
    const timeline = db.prepare('SELECT * FROM timeline_events WHERE order_id = ? ORDER BY created_at ASC').all(order.id) as any[]
    const byStatus: Record<string, any> = {}
    for (const e of timeline) {
      byStatus[e.status] = new Date(e.created_at)
    }

    if (byStatus.pending && byStatus.accepted) {
      const diff = (byStatus.accepted - byStatus.pending) / 60000
      totalResponseMin += diff
      responseCount++
      if (diff > 30) responseTimeouts++
    }
    if (byStatus.accepted && byStatus.arrived) {
      const diff = (byStatus.arrived - byStatus.accepted) / 60000
      totalArrivalMin += diff
      arrivalCount++
      if (diff > 60) arrivalTimeouts++
    }
    if (byStatus.repairing && byStatus.verifying) {
      const diff = (byStatus.verifying - byStatus.repairing) / 60000
      totalCompletionMin += diff
      completionCount++
      if (diff > 120) completionTimeouts++
    }
  }

  res.json({
    success: true,
    data: {
      avgResponseTime: responseCount > 0 ? Math.round(totalResponseMin / responseCount) : 0,
      avgArrivalTime: arrivalCount > 0 ? Math.round(totalArrivalMin / arrivalCount) : 0,
      avgCompletionTime: completionCount > 0 ? Math.round(totalCompletionMin / completionCount) : 0,
      responseTimeoutRate: responseCount > 0 ? Math.round((responseTimeouts / responseCount) * 100) / 100 : 0,
      arrivalTimeoutRate: arrivalCount > 0 ? Math.round((arrivalTimeouts / arrivalCount) * 100) / 100 : 0,
      completionTimeoutRate: completionCount > 0 ? Math.round((completionTimeouts / completionCount) * 100) / 100 : 0,
      totalOrders: orders.length,
    },
  })
})

router.get('/trends', (req: Request, res: Response): void => {
  const period = req.query.period as string || 'day'
  const trends = []

  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    trends.push({
      date: d.toISOString().slice(0, 10),
      avgResponseTime: Math.round(15 + Math.random() * 20),
      avgArrivalTime: Math.round(35 + Math.random() * 30),
      avgCompletionTime: Math.round(80 + Math.random() * 60),
      responseTimeoutRate: Math.round((0.05 + Math.random() * 0.15) * 100) / 100,
      arrivalTimeoutRate: Math.round((0.03 + Math.random() * 0.1) * 100) / 100,
      completionTimeoutRate: Math.round((0.02 + Math.random() * 0.08) * 100) / 100,
      orderCount: Math.floor(5 + Math.random() * 20),
    })
  }

  res.json({ success: true, data: { trends, period } })
})

router.get('/alerts', (req: Request, res: Response): void => {
  const alerts = [
    {
      id: 'ALERT001',
      type: 'response_timeout',
      orderId: 'ORD004',
      message: '工单 ORD004 响应超时，已超过30分钟无人接单',
      severity: 'high',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'ALERT002',
      type: 'arrival_timeout',
      orderId: 'ORD006',
      message: '工单 ORD006 技师到场超时，已超过60分钟',
      severity: 'medium',
      createdAt: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'ALERT003',
      type: 'completion_timeout',
      orderId: 'ORD002',
      message: '工单 ORD002 维修超时，已超过120分钟',
      severity: 'low',
      createdAt: new Date(Date.now() - 600000).toISOString(),
    },
  ]

  res.json({ success: true, data: { alerts } })
})

export default router
