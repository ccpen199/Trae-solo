import { Router, type Request, type Response } from 'express'
import { dashboardData, revenueTrend, deviceUsageTrend } from '../data/mockData.js'

const router = Router()

router.get('/overview', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: dashboardData,
    message: '获取经营数据概览成功',
  })
})

router.get('/revenue-trend', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: revenueTrend,
    message: '获取收入趋势数据成功',
  })
})

router.get('/device-usage', async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    data: deviceUsageTrend,
    message: '获取设备使用率趋势成功',
  })
})

export default router
