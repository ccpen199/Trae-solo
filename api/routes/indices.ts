import { Router, type Request, type Response } from 'express'
import { IndexService } from '../services/IndexService.js'
import { DataFusionService } from '../services/DataFusionService.js'
import type { ApiResponse, LifeIndex, LifeIndexType } from '../../shared/types.js'

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
    const weatherData = DataFusionService.getCurrentWeather(cityId)
    const data = IndexService.calculateAllIndices(cityId, weatherData)
    res.json(successResponse<LifeIndex[]>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

router.get('/:type', (req: Request, res: Response): void => {
  try {
    const { type } = req.params
    const { cityId } = req.query
    if (!cityId || typeof cityId !== 'string') {
      res.status(400).json(errorResponse(400, 'cityId is required'))
      return
    }
    const weatherData = DataFusionService.getCurrentWeather(cityId)
    const data = IndexService.calculateSingleIndex(type as LifeIndexType, weatherData)
    if (!data) {
      res.status(404).json(errorResponse(404, 'Index not found'))
      return
    }
    res.json(successResponse<LifeIndex>(data))
  } catch (error) {
    res.status(500).json(errorResponse(500, error instanceof Error ? error.message : 'Internal server error'))
  }
})

export default router
