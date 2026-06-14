import { Router, type Request, type Response } from 'express'
import { login, register, getUserById, updateProfile, verifyIdentity, updateWithdrawAccount } from '../services/authService.js'

const router = Router()

router.post('/login', (req: Request, res: Response) => {
  try {
    const { phone, password } = req.body
    const result = login(phone, password || '123456')
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '登录失败' })
  }
})

router.post('/register', (req: Request, res: Response) => {
  try {
    const { phone, nickname, inviteCode } = req.body
    if (!phone || !nickname) {
      return res.json({ success: false, message: '手机号和昵称不能为空' })
    }
    const result = register(phone, nickname, inviteCode)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '注册失败' })
  }
})

router.get('/profile', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const user = getUserById(userId)
    if (!user) {
      return res.json({ success: false, message: '用户不存在' })
    }
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: '获取用户信息失败' })
  }
})

router.put('/profile', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const user = updateProfile(userId, req.body)
    res.json({ success: true, user })
  } catch (error) {
    res.status(500).json({ success: false, message: '更新失败' })
  }
})

router.post('/verify', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { realName, idCard } = req.body
    if (!realName || !idCard) {
      return res.json({ success: false, message: '请填写完整的实名信息' })
    }
    const result = verifyIdentity(userId, realName, idCard)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '实名认证失败' })
  }
})

router.post('/withdraw-account', (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string
    if (!userId) {
      return res.json({ success: false, message: '未登录' })
    }
    const { method, account, bankName } = req.body
    const result = updateWithdrawAccount(userId, method, account, bankName)
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, message: '更新提现账户失败' })
  }
})

export default router
