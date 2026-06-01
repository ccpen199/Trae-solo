import { Router, type Request, type Response } from 'express'
import { OrderService } from '../services/OrderService.js'

const router = Router()
const orderService = new OrderService()

router.get('/stats', (req: Request, res: Response) => {
  const stats = orderService.getStats()
  res.json({ success: true, data: stats })
})

router.get('/dashboard', (req: Request, res: Response) => {
  const data = orderService.getDashboardData()
  res.json({ success: true, data })
})

router.get('/', (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, status, user_id } = req.query
  const result = orderService.getOrders({
    page: Number(page),
    pageSize: Number(pageSize),
    status: status as string,
    user_id: user_id ? Number(user_id) : undefined,
  })
  res.json({ success: true, data: result.data, total: result.total })
})

router.post('/', (req: Request, res: Response) => {
  const order = orderService.createOrder(req.body)
  res.status(201).json({ success: true, data: order })
})

router.post('/batch', (req: Request, res: Response) => {
  const { orders } = req.body
  const result = orderService.batchCreateOrders(orders)
  res.status(201).json({ success: true, data: result, count: result.length })
})

router.post('/scan', (req: Request, res: Response) => {
  const result = orderService.processScanOrder(req.body)
  res.status(201).json({ success: true, data: result })
})

router.post('/voice', (req: Request, res: Response) => {
  const { voiceText, user_id } = req.body
  const result = orderService.processVoiceOrder(voiceText, Number(user_id))
  res.status(201).json({ success: true, data: result })
})

router.get('/routing-options', (req: Request, res: Response) => {
  const { goodsType, urgency, weight, fromCity, toCity } = req.query
  const options = orderService.getRoutingOptions(
    goodsType as string,
    urgency as string,
    Number(weight),
    fromCity as string,
    toCity as string
  )
  res.json({ success: true, data: options })
})

router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = orderService.getOrder(id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' })
    return
  }
  res.json({ success: true, data: order })
})

router.post('/:id/routing', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = orderService.getOrder(id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' })
    return
  }
  const routing = orderService.calculateRouting(order.goods_type, order.urgency, order.weight)
  res.json({ success: true, data: routing })
})

router.put('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = orderService.updateOrder(id, req.body)
  if (!order) {
    res.status(404).json({ success: false, error: 'Order not found' })
    return
  }
  res.json({ success: true, data: order })
})

router.delete('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const deleted = orderService.deleteOrder(id)
  if (!deleted) {
    res.status(404).json({ success: false, error: 'Order not found' })
    return
  }
  res.json({ success: true, message: 'Order deleted' })
})

export default router
