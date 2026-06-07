import { Router, type Request, type Response } from 'express'
import StatsService from '../services/StatsService.js'
import db from '../db/index.js'
import { success, error } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const statsService = new StatsService(db)

router.get('/monthly', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { year } = req.query
    const result = statsService.getMonthlyStats(year ? parseInt(year as string) : undefined)
    success(res, result, '获取月度统计成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取月度统计失败'
    error(res, message)
  }
})

router.get('/efficiency', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    const result = statsService.getEfficiencyStats(
      startDate as string,
      endDate as string,
    )
    success(res, result, '获取效率统计成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取效率统计失败'
    error(res, message)
  }
})

router.get('/monitor/abnormal', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = statsService.getAbnormalOrders()
    success(res, result, '获取异常监控数据成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取异常监控数据失败'
    error(res, message)
  }
})

router.get('/dashboard', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = statsService.getDashboardStats()
    success(res, result, '获取仪表盘统计成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取仪表盘统计失败'
    error(res, message)
  }
})

export default router
