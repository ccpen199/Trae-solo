import { type Request, type Response, type NextFunction } from 'express'

const JWT_SECRET = 'demo-secret-key-for-mock'

export const generateToken = (userId: string): string => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(
    JSON.stringify({ userId, iat: Date.now(), exp: Date.now() + 24 * 60 * 60 * 1000 })
  ).toString('base64url')
  const signature = Buffer.from(`${header}.${payload}.${JWT_SECRET}`).toString('base64url')
  return `${header}.${payload}.${signature}`
}

export const parseToken = (token: string): { userId: string; valid: boolean } => {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return { userId: '', valid: false }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString())
    if (payload.exp && payload.exp < Date.now()) return { userId: '', valid: false }
    return { userId: payload.userId, valid: true }
  } catch {
    return { userId: '', valid: false }
  }
}

const authMiddleware = (optional = false) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization

    if (!authHeader) {
      if (optional) {
        next()
        return
      }
      res.status(401).json({ success: false, error: '未提供认证令牌' })
      return
    }

    if (!authHeader.startsWith('Bearer ')) {
      if (optional) {
        next()
        return
      }
      res.status(401).json({ success: false, error: '认证令牌格式错误' })
      return
    }

    const token = authHeader.slice(7)
    const { userId, valid } = parseToken(token)

    if (!valid || !userId) {
      if (optional) {
        next()
        return
      }
      res.status(401).json({ success: false, error: '认证令牌无效或已过期' })
      return
    }

    req.userId = userId
    next()
  }
}

export default authMiddleware
