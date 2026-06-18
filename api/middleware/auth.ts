import { type Request, type Response, type NextFunction } from 'express'

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

export function generateToken(userId: number, role: string): string {
  const payload = JSON.stringify({ userId, role })
  return Buffer.from(payload).toString('base64')
}

function decodeToken(token: string): { userId: number; role: string } | null {
  try {
    const payload = Buffer.from(token, 'base64').toString('utf-8')
    const parsed = JSON.parse(payload)
    if (typeof parsed.userId === 'number' && typeof parsed.role === 'string') {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

export function auth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ ok: false, error: '未提供认证令牌' })
    return
  }

  const token = header.slice(7)
  const decoded = decodeToken(token)
  if (!decoded) {
    res.status(401).json({ ok: false, error: '无效的认证令牌' })
    return
  }

  req.user = decoded
  next()
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ ok: false, error: '需要管理员权限' })
    return
  }
  next()
}
