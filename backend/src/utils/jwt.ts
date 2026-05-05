import jwt from 'jsonwebtoken'
import { JwtPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'tms-secret-key'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h'

export function generateToken(payload: Omit<JwtPayload, 'exp' | 'iat'>): string {
  return jwt.sign(
    payload as object,
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as jwt.SignOptions
  )
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload
    return decoded
  } catch {
    return null
  }
}
