import { Request, Response } from 'express'
import { UserService } from '../services/user.service'
import { successResponse, errorResponse } from '../utils/response'
import { AuthenticatedRequest } from '../middleware/auth.middleware'
import { UserRole } from '../entities'

export class UserController {
  static async login(req: Request, res: Response) {
    try {
      const { username, password } = req.body

      if (!username || !password) {
        return res.status(400).json(errorResponse('用户名和密码不能为空', 400))
      }

      const userService = UserService.getInstance()
      const result = await userService.login(username, password)

      if (!result.success) {
        return res.status(401).json(errorResponse(result.message || '登录失败', 401))
      }

      return res.json(successResponse({
        token: result.token,
        user: result.user,
      }, '登录成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '登录失败', 500))
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { username, password, name, phone, email } = req.body

      if (!username || !password) {
        return res.status(400).json(errorResponse('用户名和密码不能为空', 400))
      }

      const userService = UserService.getInstance()
      const result = await userService.register(
        username,
        password,
        UserRole.MEMBER,
        { name, phone, email }
      )

      if (!result.success) {
        return res.status(400).json(errorResponse(result.message || '注册失败', 400))
      }

      return res.json(successResponse({
        id: result.user?.id,
        username: result.user?.username,
      }, '注册成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '注册失败', 500))
    }
  }

  static async getCurrentUser(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const userService = UserService.getInstance()
      const user = await userService.getUserById(req.user.userId)

      if (!user) {
        return res.status(404).json(errorResponse('用户不存在', 404))
      }

      let memberInfo: any = null
      if (user.role === UserRole.MEMBER) {
        const member = await userService.getMemberByUserId(user.id)
        if (member) {
          memberInfo = {
            memberNo: member.memberNo,
            level: member.level,
            totalConsumption: member.totalConsumption,
            totalPointsEarned: member.totalPointsEarned,
            totalPointsSpent: member.totalPointsSpent,
            totalPointsExpired: member.totalPointsExpired,
          }
        }
      }

      return res.json(successResponse({
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        phone: user.phone,
        email: user.email,
        isActive: user.isActive,
        memberInfo,
      }))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '获取用户信息失败', 500))
    }
  }

  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { name, phone, email } = req.body

      const userService = UserService.getInstance()
      const updatedUser = await userService.updateUser(req.user.userId, {
        name,
        phone,
        email,
      })

      if (!updatedUser) {
        return res.status(404).json(errorResponse('用户不存在', 404))
      }

      return res.json(successResponse({
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        email: updatedUser.email,
      }, '更新成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '更新失败', 500))
    }
  }

  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json(errorResponse('未授权访问', 401))
      }

      const { oldPassword, newPassword } = req.body

      if (!oldPassword || !newPassword) {
        return res.status(400).json(errorResponse('原密码和新密码不能为空', 400))
      }

      const userService = UserService.getInstance()
      const result = await userService.changePassword(req.user.userId, oldPassword, newPassword)

      if (!result.success) {
        return res.status(400).json(errorResponse(result.message || '修改密码失败', 400))
      }

      return res.json(successResponse(null, '密码修改成功'))
    } catch (error: any) {
      return res.status(500).json(errorResponse(error.message || '修改密码失败', 500))
    }
  }
}
