import { Router, type Request, type Response } from 'express'
import { getInviteStats, getInvitedFriends, getCommissionRecords, getInviterInfo } from '../services/inviteService.js'
import { getUserById } from '../services/authService.js'

const router = Router()

router.get('/stats', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const stats = getInviteStats(userId)
    const user = getUserById(userId)
    res.json({
      success: true,
      stats,
      inviteCode: user?.inviteCode || '',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取邀请统计失败' })
  }
})

router.get('/friends', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const level = parseInt(req.query.level as string) || 1
    const friends = getInvitedFriends(userId, level)
    res.json({ success: true, friends })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取好友列表失败' })
  }
})

router.get('/records', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const records = getCommissionRecords(userId)
    res.json({ success: true, records })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取分佣记录失败' })
  }
})

router.get('/inviter', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const inviter = getInviterInfo(userId)
    res.json({ success: true, inviter })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取邀请人信息失败' })
  }
})

export default router
