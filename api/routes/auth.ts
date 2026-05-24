import { Router, type Request, type Response } from 'express'
import { successResponse, errorResponse } from '../utils/response.js'
import { authenticate } from '../middleware/auth.js'
import { login, getProfile } from '../services/auth.service.js'
import type { LoginRequest } from '../types/index.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, role } = req.body as LoginRequest

    if (!username || !password || !role) {
      res.status(400).json(errorResponse('用户名、密码和角色不能为空', 400))
      return
    }

    const result = await login(username, password, role)
    res.json(successResponse(result, '登录成功'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败'
    res.status(401).json(errorResponse(message, 401))
  }
})

router.get('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json(errorResponse('用户未认证', 401))
      return
    }

    const user = await getProfile(req.user.userId)
    res.json(successResponse(user, '获取用户信息成功'))
  } catch (error) {
    const message = error instanceof Error ? error.message : '获取用户信息失败'
    res.status(400).json(errorResponse(message, 400))
  }
})

export default router
