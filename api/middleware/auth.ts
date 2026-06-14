import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { User } from '../../shared/types/index.js'

type UserPayload = Pick<User, 'id' | 'userType'>

declare global {
  namespace Express {
    interface Request {
      user?: UserPayload
    }
  }
}

const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    if (process.env.NODE_ENV === 'development') {
      const isAdminRoute = req.originalUrl.startsWith('/api/admin')
      req.user = {
        id: isAdminRoute ? 4 : 1,
        userType: isAdminRoute ? 'admin_ops' : 'resident',
      }
      next()
      return
    }

    res.status(401).json({
      success: false,
      error: '未提供认证令牌',
    })
    return
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'hunan_social_insurance_jwt_secret_key_2024') as { userId: number; userType: string }
    req.user = {
      id: decoded.userId,
      userType: decoded.userType as User['userType'],
    }
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证令牌无效或已过期',
    })
  }
}

const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '请先登录',
    })
    return
  }

  const adminTypes: User['userType'][] = ['admin_tax', 'admin_ops']
  if (!adminTypes.includes(req.user.userType)) {
    res.status(403).json({
      success: false,
      error: '需要管理员权限',
    })
    return
  }

  next()
}

export { authMiddleware, requireAdmin }
export type { UserPayload }
