import { Request, Response } from 'express'
import { z } from 'zod'
import prisma from '../utils/prisma'
import { generateToken, hashPassword, comparePassword } from '../utils/auth'

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2).max(50),
  password: z.string().min(6),
  role: z.enum(['EMPLOYER', 'PROVIDER', 'BOTH']).default('EMPLOYER'),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

export async function register(req: Request, res: Response) {
  try {
    const data = registerSchema.parse(req.body)
    
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    })
    
    if (existingUser) {
      return res.status(400).json({ error: '邮箱或用户名已存在' })
    }
    
    const passwordHash = await hashPassword(data.password)
    
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    })
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    res.status(201).json({ user, token })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: '注册失败' })
  }
}

export async function login(req: Request, res: Response) {
  try {
    const data = loginSchema.parse(req.body)
    
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    })
    
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    
    const valid = await comparePassword(data.password, user.passwordHash)
    
    if (!valid) {
      return res.status(401).json({ error: '邮箱或密码错误' })
    }
    
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({ error: '账户已被禁用，请联系客服' })
    }
    
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        avatar: user.avatar,
        rating: user.rating,
        level: user.level,
      },
      token,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors })
    }
    res.status(500).json({ error: '登录失败' })
  }
}

export async function getCurrentUser(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    
    if (!userId) {
      return res.status(401).json({ error: '未授权' })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        phone: true,
        realName: true,
        bio: true,
        location: true,
        rating: true,
        totalOrders: true,
        completedOrders: true,
        complaintCount: true,
        level: true,
        experience: true,
        balance: true,
        frozenBalance: true,
        status: true,
        createdAt: true,
        skills: true,
      },
    })
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    res.json(user)
  } catch {
    res.status(500).json({ error: '获取用户信息失败' })
  }
}

export async function updateProfile(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { avatar, phone, realName, bio, location, role } = req.body
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        avatar,
        phone,
        realName,
        bio,
        location,
        role,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatar: true,
        phone: true,
        bio: true,
        location: true,
      },
    })
    
    res.json(user)
  } catch {
    res.status(500).json({ error: '更新失败' })
  }
}

export async function getUserById(req: Request, res: Response) {
  try {
    const { id } = req.params
    
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        username: true,
        avatar: true,
        role: true,
        bio: true,
        location: true,
        rating: true,
        totalOrders: true,
        completedOrders: true,
        complaintCount: true,
        level: true,
        skills: true,
        createdAt: true,
      },
    })
    
    if (!user) {
      return res.status(404).json({ error: '用户不存在' })
    }
    
    res.json(user)
  } catch {
    res.status(500).json({ error: '获取用户信息失败' })
  }
}

export async function updateUserSkills(req: Request, res: Response) {
  try {
    const userId = req.user?.userId
    if (!userId) return res.status(401).json({ error: '未授权' })
    
    const { skillIds } = req.body
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        skills: {
          set: skillIds.map((id: number) => ({ id })),
        },
      },
      include: { skills: true },
    })
    
    res.json(user.skills)
  } catch {
    res.status(500).json({ error: '更新技能失败' })
  }
}
