import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../utils/prisma'
import { authMiddleware, AuthRequest } from '../middleware/auth'

const router = Router()
const JWT_SECRET = process.env.JWT_SECRET || 'petlove-secret-key-2024'

router.post('/register', async (req, res) => {
  try {
    const { username, password, email, phone, nickname } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }, { phone }] }
    })

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '用户名、邮箱或手机号已存在'
      })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        email,
        phone,
        nickname: nickname || username
      },
      select: { id: true, username: true, nickname: true, avatar: true, bio: true }
    })

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

    res.json({
      success: true,
      data: { user, token },
      message: '注册成功'
    })
  } catch (error) {
    console.error('注册错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      })
    }

    const user = await prisma.user.findUnique({ where: { username } })

    if (!user) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const isValid = await bcrypt.compare(password, user.password)

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' })

    const userData = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      bio: user.bio
    }

    res.json({
      success: true,
      data: { user: userData, token },
      message: '登录成功'
    })
  } catch (error) {
    console.error('登录错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.get('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { id: true, username: true, nickname: true, avatar: true, bio: true, email: true, phone: true }
    })

    res.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { nickname, avatar, bio } = req.body

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { nickname, avatar, bio },
      select: { id: true, username: true, nickname: true, avatar: true, bio: true }
    })

    res.json({
      success: true,
      data: user,
      message: '更新成功'
    })
  } catch (error) {
    console.error('更新用户信息错误:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

export default router
