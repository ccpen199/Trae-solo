import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { type JwtPayload, type UserRole } from '../types/index.js'

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload
    }
  }
}

export const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'No token provided'
    })
    return
  }

  const token = authHeader.slice(7)
  const secret = process.env.JWT_SECRET

  if (!secret) {
    res.status(500).json({
      success: false,
      error: 'Server error',
      message: 'JWT_SECRET not configured'
    })
    return
  }

  try {
    const decoded = jwt.verify(token, secret) as JwtPayload
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    })
  }
}

export const requireRoles = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'No user authenticated'
      })
      return
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Required roles: ${roles.join(', ')}`
      })
      return
    }

    next()
  }
}

export default auth
