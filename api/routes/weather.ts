import { Router, type Request, type Response } from 'express'
import { ApiResponse, WeatherData } from '../../shared/types'
import { getCurrentWeather, getWeatherByCity, getAvailableCities } from '../services/weather'

const router = Router()

router.get('/current', async (req: Request, res: Response<ApiResponse<WeatherData>>): Promise<void> => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] as string || undefined
    const weather = await getCurrentWeather(ip)

    res.json({
      success: true,
      data: weather
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取天气信息失败'
    })
  }
})

router.get('/city/:cityName', async (req: Request, res: Response<ApiResponse<WeatherData>>): Promise<void> => {
  try {
    const { cityName } = req.params
    const weather = await getWeatherByCity(cityName)

    res.json({
      success: true,
      data: weather
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取城市天气失败'
    })
  }
})

router.get('/cities', async (req: Request, res: Response<ApiResponse<string[]>>): Promise<void> => {
  try {
    const cities = getAvailableCities()

    res.json({
      success: true,
      data: cities
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取城市列表失败'
    })
  }
})

export default router
