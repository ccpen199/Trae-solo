import { Router, type Request, type Response } from 'express'
import { getWithdrawRecords, applyWithdraw, getWithdrawMethods, getTodayWithdrawAmount } from '../services/withdrawService.js'

const router = Router()

router.get('/methods', (req: Request, res: Response) => {
  try {
    const methods = getWithdrawMethods()
    res.json({ success: true, methods })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取提现方式失败' })
  }
})

router.get('/records', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const result = getWithdrawRecords(userId, page, pageSize)
    res.json({ success: true, ...result })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取提现记录失败' })
  }
})

router.get('/today-limit', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const todayAmount = getTodayWithdrawAmount(userId)
    res.json({ success: true, todayAmount })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取今日提现额度失败' })
  }
})

router.post('/apply', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { amount, method } = req.body
    const result = applyWithdraw(userId, parseFloat(amount), method)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '提现申请失败' })
  }
})

export default router
