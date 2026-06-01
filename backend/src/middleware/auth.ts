import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
    role: string
    name: string
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'dental_clinic_secret_key_2024'

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as any
    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: '无效的认证令牌' })
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: '未认证' })
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' })
    }
    next()
  }
}

export function maskPatientData(patient: any, role: string) {
  const masked = { ...patient }
  
  if (role !== 'doctor' && role !== 'admin') {
    if (masked.id_card) {
      masked.id_card = masked.id_card.substring(0, 6) + '********' + masked.id_card.substring(14)
    }
    if (masked.phone) {
      masked.phone = masked.phone.substring(0, 3) + '****' + masked.phone.substring(7)
    }
    if (masked.address && role === 'nurse') {
      masked.address = masked.address.substring(0, 10) + '...'
    }
  }
  
  return masked
}
