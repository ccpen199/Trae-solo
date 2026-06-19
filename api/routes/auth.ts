/**
 * 用户认证 API 路由
 * 处理用户注册、登录、登出、会话管理等
 */
import { Router, type Request, type Response } from 'express'

const router = Router()

interface User {
  id: string
  name: string
  role: 'direct_seller' | 'store_owner' | 'hq_admin'
  phone: string
  region: string
  level?: string
  teamId?: string
  storeId?: string
}

const mockUsers: Record<string, User & { password: string }> = {
  '13888888888': {
    id: 'DS001',
    name: '李明',
    role: 'direct_seller',
    phone: '138****8888',
    region: '华东区-上海市',
    level: '高级经销商',
    teamId: 'TEAM_HS_001',
    password: '123456',
  },
  '13966666666': {
    id: 'ST001',
    name: '王芳',
    role: 'store_owner',
    phone: '139****6666',
    region: '华东区-上海市浦东新区',
    storeId: 'SH_PD_001',
    password: '123456',
  },
  '13799999999': {
    id: 'HQ001',
    name: '张伟',
    role: 'hq_admin',
    phone: '137****9999',
    region: '总部',
    password: '123456',
  },
}

interface LoginSession {
  token: string
  user: User
  createdAt: number
}

const sessions = new Map<string, LoginSession>()

const generateToken = () => {
  return 'token_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

/**
 * 用户注册
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role, name } = req.body

    if (!phone || !password || !role || !name) {
      res.status(400).json({
        success: false,
        error: '缺少必要参数',
      })
      return
    }

    if (mockUsers[phone]) {
      res.status(409).json({
        success: false,
        error: '该手机号已注册',
      })
      return
    }

    const idPrefix = role === 'direct_seller' ? 'DS' : role === 'store_owner' ? 'ST' : 'HQ'
    const newUser: User & { password: string } = {
      id: idPrefix + String(Object.keys(mockUsers).length + 1).padStart(3, '0'),
      name,
      role,
      phone: phone.slice(0, 3) + '****' + phone.slice(7),
      region: '待分配',
      password,
    }

    mockUsers[phone] = newUser

    const { password: _p, ...userWithoutPassword } = newUser

    res.status(201).json({
      success: true,
      data: {
        user: userWithoutPassword,
      },
      message: '注册成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '注册失败',
    })
  }
})

/**
 * 用户登录
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, role } = req.body

    if (!phone) {
      res.status(400).json({
        success: false,
        error: '请输入手机号',
      })
      return
    }

    let user = mockUsers[phone]

    if (!user) {
      const defaultPhones: Record<string, string> = {
        direct_seller: '13888888888',
        store_owner: '13966666666',
        hq_admin: '13799999999',
      }
      const defaultPhone = role ? defaultPhones[role] : '13888888888'
      user = mockUsers[defaultPhone]

      if (!user) {
        res.status(401).json({
          success: false,
          error: '用户不存在',
        })
        return
      }
    }

    if (password && user.password !== password && password !== '') {
      res.status(401).json({
        success: false,
        error: '密码错误（演示环境密码可留空）',
      })
      return
    }

    if (role && user.role !== role) {
      res.status(403).json({
        success: false,
        error: '角色与账号不匹配',
      })
      return
    }

    const token = generateToken()
    const { password: _p, ...userWithoutPassword } = user

    sessions.set(token, {
      token,
      user: userWithoutPassword,
      createdAt: Date.now(),
    })

    res.json({
      success: true,
      data: {
        token,
        user: userWithoutPassword,
      },
      message: '登录成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登录失败',
    })
  }
})

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未登录',
      })
      return
    }

    const session = sessions.get(token)
    if (!session) {
      res.status(401).json({
        success: false,
        error: '登录已过期',
      })
      return
    }

    res.json({
      success: true,
      data: {
        user: session.user,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
    })
  }
})

/**
 * 用户登出
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (token) {
      sessions.delete(token)
    }

    res.json({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '登出失败',
    })
  }
})

export default router
