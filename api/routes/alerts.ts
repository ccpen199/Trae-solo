import { Router, type Request, type Response } from 'express'
import { AlertService } from '../services/AlertService.js'
import type { ApiResponse, WeatherAlert } from '../../shared/types.js'

const router = Router()

function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
    timestamp: new Date().toISOString(),
  }
}

function errorResponse(code: number, message: string): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = AlertService.getAlerts(cityId)
    res.json(successResponse<WeatherAlert[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const data = AlertService.getAlertById(id)
    if (!data) {
      res.status(404).json(errorResponse(404, 'Alert not found'))
      return
    }
    res.json(successResponse<WeatherAlert>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.post('/:id/notify', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { method, phone } = req.body

    if (!method || (method !== 'sms' && method !== 'system')) {
      res.status(400).json(errorResponse(400, 'method must be "sms" or "system"'))
      return
    }

    if (method === 'sms' && !phone) {
      res.status(400).json(errorResponse(400, 'phone is required for sms method'))
      return
    }

    const alert = AlertService.getAlertById(id)
    if (!alert) {
      res.status(404).json(errorResponse(404, 'Alert not found'))
      return
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
    const sentAt = new Date().toISOString()

    res.json(successResponse({ success: true, messageId, sentAt }))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
