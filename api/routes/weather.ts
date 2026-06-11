import { Router, type Request, type Response } from 'express'
import { DataFusionService } from '../services/DataFusionService.js'
import type { ApiResponse, CurrentWeather, HourlyForecast, DailyForecast, MinutelyPrecipitation } from '../../shared/types.js'

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

router.get('/current', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = DataFusionService.getCurrentWeather(cityId)
    res.json(successResponse<CurrentWeather>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/hourly', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = DataFusionService.getHourlyForecast(cityId)
    res.json(successResponse<HourlyForecast[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/daily', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = DataFusionService.getDailyForecast(cityId)
    res.json(successResponse<DailyForecast[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/minutely', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = DataFusionService.getMinutelyPrecipitation(cityId)
    res.json(successResponse<MinutelyPrecipitation>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/grid', (req: Request, res: Response): void => {
  try {
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const data = DataFusionService.getMinutelyPrecipitation(cityId)
    res.json(successResponse(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
