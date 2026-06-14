import { Router, type Request, type Response } from 'express'
import { getCoinRecords, getWalletStatistics } from '../services/walletService.js'

const router = Router()

router.get('/records', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const type = req.query.type as 'income' | 'expense' | undefined
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20

    const result = getCoinRecords(userId, type, page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取流水记录失败' })
  }
})

router.get('/statistics', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const statistics = getWalletStatistics(userId)
    res.json({ success: true, statistics })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取统计数据失败' })
  }
})

export default router
