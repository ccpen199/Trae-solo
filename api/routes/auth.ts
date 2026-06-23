import { Router, type Request, type Response } from 'express'
import type { ApiResponse } from '../../shared/types'
import * as userService from '../services/userService.js'

const router = Router()

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, code } = req.body
    const result = userService.login(phone, code)
    if (!result) {
      const response: ApiResponse<null> = { code: 401, message: '验证码错误', data: null }
      res.status(401).json(response)
      return
    }
    const response: ApiResponse<typeof result> = { code: 0, message: '登录成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

router.post('/admin-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body
    const result = userService.adminLogin(username, password)
    if (!result) {
      const response: ApiResponse<null> = { code: 401, message: '用户名或密码错误', data: null }
      res.status(401).json(response)
      return
    }
    const response: ApiResponse<typeof result> = { code: 0, message: '登录成功', data: result }
    res.json(response)
  } catch (error) {
    const response: ApiResponse<null> = { code: 500, message: '服务器内部错误', data: null }
    res.status(500).json(response)
  }
})

export default router
