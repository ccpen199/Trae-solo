import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { unauthorized, forbidden } from './response.js'
import { db, type User } from '../mock/data.js'

export interface JwtPayload {
  userId: string
  role: User['role']
  phone: string
  iat?: number
  exp?: number
}

export interface AuthRequest extends Request {
  user?: User
}

const JWT_SECRET = process.env.JWT_SECRET || 'freight-platform-secret-key-2024'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'

export function signToken(user: User): string {
  return jwt.sign(
    { userId: user.id, role: user.role, phone: user.phone },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  )
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload
  } catch {
    return null
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }
  const queryToken = req.query.token as string
  if (queryToken) return queryToken
  return null
}

const WHITELIST_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/driver-auth',
  '/api/v1/auth/shipper-auth',
  '/api/v1/auth/send-code',
  '/api/v1/health',
]

function isWhitelist(path: string): boolean {
  return WHITELIST_PATHS.some(p => path.startsWith(p))
}

export function authMiddleware(requiredRoles?: User['role'][]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const fullPath = (req.originalUrl || req.url || req.path).split('?')[0]
    if (isWhitelist(fullPath)) {
      next()
      return
    }

    const token = extractToken(req)
    if (!token) {
      unauthorized(res)
      return
    }

    const payload = verifyToken(token)
    if (!payload) {
      unauthorized(res)
      return
    }

    const user = db.users.find(u => u.id === payload.userId)
    if (!user) {
      unauthorized(res, '用户不存在')
      return
    }

    if (requiredRoles && !requiredRoles.includes(user.role)) {
      forbidden(res)
      return
    }

    req.user = user
    next()
  }
}

export function genVerifyCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}
