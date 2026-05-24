import { type Request, type Response, type NextFunction } from 'express'
import { verifyToken } from '../utils/auth.js'
import { errorResponse } from '../utils/response.js'

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number
        role: string
      }
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json(errorResponse('未提供认证令牌', 401))
    return
  }

  const token = authHeader.substring(7)

  try {
    const decoded = verifyToken(token)
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    }
    next()
  } catch (error) {
    res.status(401).json(errorResponse('认证令牌无效或已过期', 401))
  }
}
