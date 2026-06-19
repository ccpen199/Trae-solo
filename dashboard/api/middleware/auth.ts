import type { Request, Response, NextFunction } from 'express'
import { verifyToken, getTokenFromHeader, isSessionValid, isTokenBlacklisted } from '../utils/jwt.js'
import { unauthorizedResponse, forbiddenResponse } from '../utils/response.js'
import type { JwtPayload } from '../utils/jwt.js'
import type { UserRole } from '../../../shared/types/index.js'

export interface AuthRequest extends Request {
  user?: JwtPayload
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getTokenFromHeader(req.headers.authorization)
    
    if (!token) {
      unauthorizedResponse(res, 'No token provided')
      return
    }

    const payload = verifyToken(token)
    
    if (!payload) {
      unauthorizedResponse(res, 'Invalid token')
      return
    }

    if (await isTokenBlacklisted(token)) {
      unauthorizedResponse(res, 'Token has been revoked')
      return
    }

    if (!(await isSessionValid(payload.id, token))) {
      unauthorizedResponse(res, 'Session expired')
      return
    }

    req.user = payload
    next()
  } catch (error) {
    unauthorizedResponse(res, 'Authentication failed')
  }
}

export const roleMiddleware = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      unauthorizedResponse(res, 'Not authenticated')
      return
    }

    if (!roles.includes(req.user.role as UserRole)) {
      forbiddenResponse(res, 'Insufficient permissions')
      return
    }

    next()
  }
}

export const optionalAuthMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const token = getTokenFromHeader(req.headers.authorization)
    
    if (token) {
      const payload = verifyToken(token)
      if (payload && !(await isTokenBlacklisted(token)) && (await isSessionValid(payload.id, token))) {
        req.user = payload
      }
    }
    
    next()
  } catch (error) {
    next()
  }
}
