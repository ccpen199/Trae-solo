import { Router, type Request, type Response } from 'express'
import { ExpressService } from '../services/ExpressService.js'

const router = Router()
const expressService = new ExpressService()

router.get('/', (req: Request, res: Response) => {
  const { user_id } = req.query
  const orders = expressService.getExpressOrders(user_id ? Number(user_id) : undefined)
  res.json({ success: true, data: orders })
})

router.post('/', (req: Request, res: Response) => {
  const order = expressService.createExpressOrder(req.body)
  res.status(201).json({ success: true, data: order })
})

router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = expressService.getExpressOrder(id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Express order not found' })
    return
  }
  res.json({ success: true, data: order })
})

router.get('/:id/rider', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = expressService.getExpressOrder(id)
  if (!order || !order.rider_id) {
    res.status(404).json({ success: false, error: 'Rider not assigned' })
    return
  }
  const location = expressService.getRiderLocation(order.rider_id)
  res.json({ success: true, data: location })
})

router.put('/:id/status', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { status } = req.body
  const order = expressService.updateExpressOrderStatus(id, status)
  if (!order) {
    res.status(404).json({ success: false, error: 'Express order not found' })
    return
  }
  res.json({ success: true, data: order })
})

router.get('/riders/available', (req: Request, res: Response) => {
  const riders = expressService.getAvailableRiders()
  res.json({ success: true, data: riders })
})

router.put('/riders/:id/location', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const { latitude, longitude } = req.body
  const rider = expressService.updateRiderLocation(id, latitude, longitude)
  if (!rider) {
    res.status(404).json({ success: false, error: 'Rider not found' })
    return
  }
  res.json({ success: true, data: rider })
})

router.get('/protocols', (req: Request, res: Response) => {
  const protocols = expressService.getProtocols()
  res.json({ success: true, data: protocols })
})

router.post('/protocols', (req: Request, res: Response) => {
  const protocol = expressService.createProtocol(req.body)
  res.status(201).json({ success: true, data: protocol })
})

router.put('/protocols/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const protocol = expressService.updateProtocol(id, req.body)
  if (!protocol) {
    res.status(404).json({ success: false, error: 'Protocol not found' })
    return
  }
  res.json({ success: true, data: protocol })
})

export default router
