import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { redisCache, getSessionCacheKey, getTokenBlacklistKey } from './redis.js'

dotenv.config()

const JWT_SECRET = process.env.JWT_SECRET || 'shenyang-coupon-secret-key-2024'
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h'
const SESSION_TTL = 24 * 60 * 60

export interface JwtPayload {
  id: string
  username: string
  role: string
  merchantId?: string
  name: string
}

export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] })
}

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload
  } catch (error) {
    return null
  }
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload
  } catch (error) {
    return null
  }
}

export const createSession = async (payload: JwtPayload, token: string): Promise<void> => {
  await redisCache.set(getSessionCacheKey(payload.id), token, SESSION_TTL)
}

export const invalidateSession = async (userId: string): Promise<void> => {
  await redisCache.del(getSessionCacheKey(userId))
}

export const isSessionValid = async (userId: string, token: string): Promise<boolean> => {
  const storedToken = await redisCache.get<string>(getSessionCacheKey(userId))
  return storedToken === token
}

export const blacklistToken = async (token: string, expiresInSeconds: number): Promise<void> => {
  await redisCache.set(getTokenBlacklistKey(token), true, expiresInSeconds)
}

export const isTokenBlacklisted = async (token: string): Promise<boolean> => {
  return !!(await redisCache.get<boolean>(getTokenBlacklistKey(token)))
}

export const getTokenFromHeader = (authHeader: string | undefined): string | null => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  return authHeader.substring(7)
}
