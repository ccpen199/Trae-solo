import { Router } from 'express'
import { logisticsOrders } from '../data/mockData.js'

export const logisticsRouter = Router()

let orders = [...logisticsOrders]

logisticsRouter.get('/', (_req, res) => {
  res.json(orders)
})

logisticsRouter.get('/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: '物流订单未找到' })
  }
  res.json(order)
})

logisticsRouter.post('/:id/alerts/:alertId/resolve', (req, res) => {
  const order = orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: '物流订单未找到' })
  }
  const alert = order.alerts.find(a => a.id === req.params.alertId)
  if (!alert) {
    return res.status(404).json({ error: '告警未找到' })
  }
  alert.resolved = true
  res.json({ ok: true, alert })
})
