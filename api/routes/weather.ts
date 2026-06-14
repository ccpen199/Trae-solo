import { Router, type Request, type Response } from 'express'
import { mockWeather } from '../data/mock.js'
import type { WeatherInfo } from '../../shared/types.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    res.json({
      success: true,
      data: mockWeather as WeatherInfo,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取天气信息失败',
    })
  }
})

export default router
