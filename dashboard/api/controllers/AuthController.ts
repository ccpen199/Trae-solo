import type { Request, Response } from 'express'
import { authService } from '../services/AuthService.js'
import { successResponse, errorResponse, notFoundResponse, unauthorizedResponse, serverErrorResponse } from '../utils/response.js'
import { getTokenFromHeader } from '../utils/jwt.js'
import type { AuthRequest } from '../middleware/auth.js'
import type { LoginRequest } from '../../../shared/types/index.js'

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const request: LoginRequest = req.body
      
      if (!request.username || !request.password) {
        errorResponse(res, '用户名和密码不能为空')
        return
      }

      const result = await authService.login(request)
      
      if (!result) {
        unauthorizedResponse(res, '用户名或密码错误')
        return
      }

      successResponse(res, result, '登录成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const token = getTokenFromHeader(req.headers.authorization)

      if (!userId || !token) {
        errorResponse(res, '无效的请求')
        return
      }

      await authService.logout(userId, token)
      successResponse(res, null, '退出登录成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        unauthorizedResponse(res, '未登录')
        return
      }

      const account = await authService.getAccountById(req.user.id)
      
      if (!account) {
        notFoundResponse(res, '用户不存在')
        return
      }

      const userData = {
        id: account.id,
        username: account.username,
        name: account.name,
        role: account.role,
        merchantId: account.merchantId,
      }

      successResponse(res, userData)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id
      const { oldPassword, newPassword } = req.body

      if (!userId || !oldPassword || !newPassword) {
        errorResponse(res, '参数不完整')
        return
      }

      if (newPassword.length < 6) {
        errorResponse(res, '新密码长度不能少于6位')
        return
      }

      const result = await authService.changePassword(userId, oldPassword, newPassword)
      
      if (!result) {
        errorResponse(res, '原密码错误')
        return
      }

      successResponse(res, null, '密码修改成功')
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }

  async listAccounts(req: AuthRequest, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1
      const pageSize = parseInt(req.query.pageSize as string) || 20

      const result = await authService.listAccounts(page, pageSize)
      successResponse(res, result)
    } catch (error) {
      serverErrorResponse(res, error)
    }
  }
}

export const authController = new AuthController()
