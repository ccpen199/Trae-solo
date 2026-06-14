import type { Request, Response } from 'express'
import authService from '../services/AuthService.js'
import type { RequestWithUser } from '../types/index.js'

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const demoAccounts: Record<string, string> = {
        admin: '430101197801018888',
        platform: '430101198001019999',
        ops: '430101197801018888',
        user: '430101199001011234',
      }
      const username = req.body.username as string | undefined
      const idCard = (req.body.idCard || (username ? demoAccounts[username] : '')) as string
      const password = req.body.password

      if (!idCard || !password) {
        res.status(400).json({
          success: false,
          error: '身份证号和密码不能为空',
        })
        return
      }

      const result = await authService.login({ idCard, password })

      if (!result.success) {
        res.status(401).json({
          success: false,
          error: result.error || '登录失败',
        })
        return
      }

      res.status(200).json({
        success: true,
        data: {
          token: result.token,
          user: result.user,
        },
        message: '登录成功',
      })
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      })
    }
  }

  profile(req: RequestWithUser, res: Response): void {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '请先登录',
        })
        return
      }

      const result = authService.getProfile(req.user.id)

      if (!result.success) {
        res.status(404).json({
          success: false,
          error: result.error || '用户不存在',
        })
        return
      }

      res.status(200).json({
        success: true,
        data: result.user,
        message: '获取用户信息成功',
      })
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : '获取用户信息失败',
      })
    }
  }
}

const authController = new AuthController()

export default authController
export { AuthController }
