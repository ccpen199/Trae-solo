import { Router, type Request, type Response } from 'express'
import { users } from '../store/memory.js'
import authMiddleware, { generateToken } from '../middleware/auth.js'
import type { LoginRequest } from '../../shared/types.js'

const router = Router()

const validCodes = new Map<string, { code: string; expireAt: number }>()

router.post('/send-code', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body as { phone?: string }

  if (!phone) {
    res.status(400).json({ success: false, error: '请提供手机号' })
    return
  }

  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phone)) {
    res.status(400).json({ success: false, error: '手机号格式不正确' })
    return
  }

  const code = '123456'
  const expireAt = Date.now() + 5 * 60 * 1000
  validCodes.set(phone, { code, expireAt })

  setTimeout(() => {
    validCodes.delete(phone)
  }, 5 * 60 * 1000)

  req.auditAction = 'send_sms_code'
  req.auditModule = 'auth'

  res.json({
    success: true,
    message: '验证码已发送，测试验证码：123456，5分钟内有效',
    expireAt,
  })
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const { phone, idCard, verifyCode, ssoToken, realName } = req.body as LoginRequest & { realName?: string }

  if (!phone && !idCard && !ssoToken) {
    res.status(400).json({ success: false, error: '请提供手机号、身份证号或SSO令牌' })
    return
  }

  if (phone) {
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(phone)) {
      res.status(400).json({ success: false, error: '手机号格式不正确' })
      return
    }

    if (!verifyCode) {
      res.status(400).json({ success: false, error: '请输入验证码' })
      return
    }

    if (verifyCode.length < 4) {
      res.status(400).json({ success: false, error: '验证码格式不正确' })
      return
    }

    const validEntry = validCodes.get(phone)
    if (!validEntry) {
      res.status(400).json({ success: false, error: '验证码已过期或未发送，请重新获取' })
      return
    }

    if (Date.now() > validEntry.expireAt) {
      validCodes.delete(phone)
      res.status(400).json({ success: false, error: '验证码已过期，请重新获取' })
      return
    }

    if (verifyCode !== validEntry.code) {
      res.status(400).json({ success: false, error: '验证码错误，请检查后重试' })
      return
    }

    validCodes.delete(phone)
  }

  if (idCard) {
    const idRegex = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
    if (!idRegex.test(idCard)) {
      res.status(400).json({ success: false, error: '身份证号格式不正确' })
      return
    }

    if (!realName || realName.trim().length < 2) {
      res.status(400).json({ success: false, error: '请输入真实姓名' })
      return
    }
  }

  const user = users.get('demo-user')
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在，请先注册或实名认证' })
    return
  }

  if (!user.realNameVerified) {
    res.status(403).json({ success: false, error: '账号未完成实名认证，请先完成实名认证' })
    return
  }

  const token = generateToken(user.id)

  req.auditAction = 'login'
  req.auditModule = 'auth'

  res.json({
    success: true,
    token,
    user,
    message: '登录成功',
  })
})

router.get('/userinfo', authMiddleware(), async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId || 'demo-user'
  const user = users.get(userId) || users.get('demo-user')

  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  req.auditAction = 'get_userinfo'
  req.auditModule = 'auth'

  res.json({
    success: true,
    data: user,
  })
})

router.post('/logout', authMiddleware(true), async (req: Request, res: Response): Promise<void> => {
  req.auditAction = 'logout'
  req.auditModule = 'auth'

  res.json({
    success: true,
    message: '已退出登录',
  })
})

export default router
