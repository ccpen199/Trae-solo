import { Router, type Request, type Response } from 'express'
import type { ApiResponse } from '../../shared/types/index.js'
import {
  getDashboardOverview,
  getDailyOrderStats,
  getHourlyOrderStats,
  getRiderPerformance,
  getTopGoodsTypes,
  getRecentOrders,
  getOrderStatusCounts,
} from '../services/dashboardService.js'

const router = Router()

router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const overview = getDashboardOverview()
    const dailyStats = getDailyOrderStats(7)
    const hourlyStats = getHourlyOrderStats()
    const riderPerformance = getRiderPerformance(5)
    const topGoodsTypes = getTopGoodsTypes(5)
    const statusCounts = getOrderStatusCounts()

    const response: ApiResponse = {
      success: true,
      data: {
        overview,
        dailyStats,
        hourlyStats,
        riderPerformance,
        topGoodsTypes,
        statusCounts,
      },
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats',
    })
  }
})

router.get('/realtime', async (req: Request, res: Response): Promise<void> => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const recentOrders = getRecentOrders(limit)
    const statusCounts = getOrderStatusCounts()

    const response: ApiResponse = {
      success: true,
      data: {
        orders: recentOrders,
        statusCounts,
        timestamp: new Date().toISOString(),
      },
    }
    res.status(200).json(response)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch realtime data',
    })
  }
})

export default router
