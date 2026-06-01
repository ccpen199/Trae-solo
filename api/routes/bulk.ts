import { Router, type Request, type Response } from 'express'
import { BulkService } from '../services/BulkService.js'

const router = Router()
const bulkService = new BulkService()

router.get('/providers', (req: Request, res: Response) => {
  const providers = bulkService.getProviders()
  res.json({ success: true, data: providers })
})

router.get('/providers/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const provider = bulkService.getProvider(id)
  if (!provider) {
    res.status(404).json({ success: false, error: 'Provider not found' })
    return
  }
  res.json({ success: true, data: provider })
})

router.post('/providers/:id/book', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const success = bulkService.bookProvider(id)
  if (!success) {
    res.status(404).json({ success: false, error: 'Provider not found' })
    return
  }
  res.json({ success: true, message: 'Provider booked successfully' })
})

router.get('/calculator', (req: Request, res: Response) => {
  const { floors, has_elevator, floor_height, disassembly_required, weight } = req.query
  const fee = bulkService.calculateFee({
    floors: Number(floors),
    has_elevator: has_elevator === 'true',
    floor_height: floor_height ? Number(floor_height) : undefined,
    disassembly_required: disassembly_required === 'true',
    weight: weight ? Number(weight) : undefined,
  })
  res.json({ success: true, data: fee })
})

router.get('/', (req: Request, res: Response) => {
  const { user_id } = req.query
  const orders = bulkService.getBulkOrders(user_id ? Number(user_id) : undefined)
  res.json({ success: true, data: orders })
})

router.post('/', (req: Request, res: Response) => {
  const order = bulkService.createBulkOrder(req.body)
  res.status(201).json({ success: true, data: order })
})

router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const order = bulkService.getBulkOrder(id)
  if (!order) {
    res.status(404).json({ success: false, error: 'Bulk order not found' })
    return
  }
  res.json({ success: true, data: order })
})

export default router
