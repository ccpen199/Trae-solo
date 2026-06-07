import { Router, type Request, type Response } from 'express'
import AuthService from '../services/AuthService.js'
import db from '../db/index.js'
import { success, error, unauthorized } from '../utils/response.js'
import authMiddleware from '../middleware/auth.js'

const router = Router()
const authService = new AuthService(db)

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    if (!username || !password) {
      error(res, '用户名和密码不能为空')
      return
    }
    const result = await authService.login({ username, password })
    success(res, result, '登录成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '登录失败'
    unauthorized(res, message)
  }
})

router.get('/userinfo', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      unauthorized(res, '用户未认证')
      return
    }
    const user = await authService.getUserInfo(req.user.userId)
    success(res, user, '获取用户信息成功')
  } catch (err) {
    const message = err instanceof Error ? err.message : '获取用户信息失败'
    error(res, message)
  }
})

export default router
