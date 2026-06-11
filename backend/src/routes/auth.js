const express = require('express')
const bcrypt = require('bcryptjs')
const prisma = require('../lib/prisma')
const { generateToken } = require('../middleware/auth')
const { successResponse, AppError } = require('../utils/response')

const router = express.Router()

router.post('/register', async (req, res, next) => {
  try {
    const { username, phone, password, role, realName, email } = req.body

    if (!username || !phone || !password) {
      throw new AppError('用户名、手机号和密码不能为空', 400)
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { phone }],
      },
    })

    if (existingUser) {
      throw new AppError('用户名或手机号已存在', 400)
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        phone,
        email,
        realName,
        passwordHash,
        role: role || 'CAR_OWNER',
      },
      select: {
        id: true,
        username: true,
        phone: true,
        role: true,
        realName: true,
        email: true,
        createdAt: true,
      },
    })

    const token = generateToken(user.id)

    successResponse(res, { user, token }, '注册成功')
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      throw new AppError('用户名和密码不能为空', 400)
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { phone: username }],
      },
    })

    if (!user) {
      throw new AppError('用户不存在', 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new AppError('密码错误', 401)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = generateToken(user.id)

    successResponse(
      res,
      {
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          role: user.role,
          realName: user.realName,
          avatar: user.avatar,
          stationId: user.stationId,
        },
        token,
      },
      '登录成功'
    )
  } catch (error) {
    next(error)
  }
})

router.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    successResponse(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (error) {
    res.status(503).json({
      code: 503,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    })
  }
})

module.exports = router
