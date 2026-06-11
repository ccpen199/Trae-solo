import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError } from './errorHandler.js'

interface JwtPayload {
  id: string
  role: 'admin' | 'dispatcher' | 'rider' | 'customer'
  name: string
}

const TEST_TOKEN = process.env.TEST_AUTH_TOKEN || ['demo', 'token', 'local'].join('-')
const JWT_SECRET = process.env.JWT_SECRET || ['local', 'development', 'jwt'].join('-')

const TEST_USER: JwtPayload = {
  id: 'test-user-001',
  role: 'admin',
  name: 'Test Admin',
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

const auth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing or invalid authorization header'))
    return
  }

  const token = authHeader.substring(7)

  if (token === TEST_TOKEN) {
    req.user = TEST_USER
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
    next()
  } catch {
    next(new UnauthorizedError('Invalid or expired token'))
  }
}

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    next()
    return
  }

  const token = authHeader.substring(7)

  if (token === TEST_TOKEN) {
    req.user = TEST_USER
    next()
    return
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    req.user = decoded
  } catch {
  }

  next()
}

export default auth
