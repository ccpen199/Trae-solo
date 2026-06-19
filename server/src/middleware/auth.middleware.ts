import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { findUserById } from '../data/database'

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key'

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '')

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' })
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = findUserById(decoded.userId)

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token' })
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    }

    next()
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired token' })
  }
}

export function generateToken(userId: string, email: string, role: string): string {
  return jwt.sign(
    { userId, email, role },
    JWT_SECRET as string,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
  )
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      })
    }

    next()
  }
}
