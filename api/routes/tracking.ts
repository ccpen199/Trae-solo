import { Router, type Request, type Response } from 'express'
import { TrackingService } from '../services/TrackingService.js'

const router = Router()
const trackingService = new TrackingService()

router.get('/stats', (req: Request, res: Response) => {
  const stats = trackingService.getExceptionStats()
  res.json({ success: true, data: stats })
})

router.get('/:id', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const tracking = trackingService.getRealTimeTracking(id)
  res.json({ success: true, data: tracking })
})

router.get('/:id/timeline', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const events = trackingService.getTracking(id)
  res.json({ success: true, data: events })
})

router.post('/:id/events', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const event = trackingService.addTrackingEvent({
    order_id: id,
    ...req.body,
    event_time: req.body.event_time || new Date().toISOString(),
  })
  res.status(201).json({ success: true, data: event })
})

router.get('/', (req: Request, res: Response) => {
  const { page = 1, pageSize = 10, level, status } = req.query
  const result = trackingService.getExceptions({
    page: Number(page),
    pageSize: Number(pageSize),
    level: level ? Number(level) : undefined,
    status: status as string,
  })
  res.json({ success: true, data: result.data, total: result.total })
})

router.post('/', (req: Request, res: Response) => {
  const exception = trackingService.createException({
    ...req.body,
    detected_at: req.body.detected_at || new Date().toISOString(),
  })
  res.status(201).json({ success: true, data: exception })
})

router.put('/:id/respond', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const result = trackingService.respondToException(id, req.body)
  if (!result) {
    res.status(404).json({ success: false, error: 'Exception not found' })
    return
  }
  res.json({ success: true, data: result })
})

router.post('/:id/escalate', (req: Request, res: Response) => {
  const id = Number(req.params.id)
  const result = trackingService.escalateException(id)
  if (!result) {
    res.status(404).json({ success: false, error: 'Exception not found' })
    return
  }
  res.json({ success: true, data: result })
})

export default router
