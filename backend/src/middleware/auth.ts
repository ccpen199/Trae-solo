import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'

const JWT_SECRET = process.env.JWT_SECRET || 'petlove-secret-key-2024'

export interface AuthRequest extends Request {
  user?: {
    id: number
    username: string
  }
}

export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: '未登录，请先登录'
      })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, nickname: true, avatar: true }
    })

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    })
  }
}

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return next()
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string }
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, nickname: true, avatar: true }
    })

    if (user) {
      req.user = user
    }
    next()
  } catch {
    next()
  }
}
