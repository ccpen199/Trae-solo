import { Router, type Request, type Response } from 'express'
import { TwinService } from '../services/TwinService.js'

const router = Router()
const twinService = new TwinService()

router.get('/realtime', (req: Request, res: Response) => {
  const data = twinService.getRealtimeData()
  res.json({ success: true, data })
})

router.get('/networks', (req: Request, res: Response) => {
  const data = twinService.getNetworkData()
  res.json({ success: true, data })
})

router.get('/networks/history', (req: Request, res: Response) => {
  const { days = 7 } = req.query
  const data = twinService.getNetworkHistory(Number(days))
  res.json({ success: true, data })
})

router.get('/vehicles', (req: Request, res: Response) => {
  const data = twinService.getVehicleData()
  res.json({ success: true, data })
})

router.get('/weather', (req: Request, res: Response) => {
  const data = twinService.getWeatherForecast()
  res.json({ success: true, data })
})

export default router
