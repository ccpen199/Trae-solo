import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import crypto from 'crypto-js'

const router = Router()

function hashPassword(password: string): string {
  return crypto.SHA256(password).toString()
}

function getRoleWorkspace(role: string): { name: string; path: string; description: string } {
  switch (role) {
    case 'admin':
      return {
        name: '超级管理员工作台',
        path: '/',
        description: '全平台数据概览、系统管理、督办考核',
      }
    case 'editor':
      return {
        name: '编审工作台',
        path: '/news',
        description: '新闻采编审核、内容发布、视听创作',
      }
    case 'user':
      return {
        name: '市民服务工作台',
        path: '/complaints',
        description: '诉求提交、办事预约、满意度评价',
      }
    default:
      return {
        name: '工作台',
        path: '/',
        description: '通用工作台',
      }
  }
}

router.post('/login', (req: Request, res: Response): void => {
  const { username, password } = req.body

  if (!username && !password) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_CREDENTIALS',
      error: '请输入账号和密码',
    })
    return
  }

  if (!username) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_USERNAME',
      error: '账号不能为空',
    })
    return
  }

  if (!password) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_PASSWORD',
      error: '密码不能为空',
    })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any

  if (!user) {
    res.status(401).json({
      success: false,
      error_code: 'USER_NOT_FOUND',
      error: '账号不存在',
    })
    return
  }

  if (user.password_hash !== hashPassword(password)) {
    res.status(401).json({
      success: false,
      error_code: 'INVALID_PASSWORD',
      error: '密码错误，请重新输入',
    })
    return
  }

  const roleInfo = getRoleWorkspace(user.role)

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        credit_score: user.credit_score,
      },
      token: 'mock-jwt-' + user.id,
      workspace: roleInfo,
    },
  })
})

router.post('/register', (req: Request, res: Response): void => {
  const { username, password, display_name } = req.body

  if (!username && !password) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_CREDENTIALS',
      error: '请输入账号和密码',
    })
    return
  }

  if (!username) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_USERNAME',
      error: '账号不能为空',
    })
    return
  }

  if (!password) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_PASSWORD',
      error: '密码不能为空',
    })
    return
  }

  if (!display_name) {
    res.status(400).json({
      success: false,
      error_code: 'EMPTY_DISPLAY_NAME',
      error: '昵称不能为空',
    })
    return
  }

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username) as any
  if (existing) {
    res.status(409).json({
      success: false,
      error_code: 'USERNAME_EXISTS',
      error: '该账号已被注册',
    })
    return
  }

  const result = db.prepare('INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)').run(username, hashPassword(password), display_name)
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid) as any

  const roleInfo = getRoleWorkspace(user.role)

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        username: user.username,
        display_name: user.display_name,
        role: user.role,
        credit_score: user.credit_score,
      },
      token: 'mock-jwt-' + user.id,
      workspace: roleInfo,
    },
  })
})

router.get('/me', (req: Request, res: Response): void => {
  const { userId } = req.query
  if (!userId) {
    res.status(400).json({
      success: false,
      error_code: 'MISSING_USER_ID',
      error: '缺少用户ID参数',
    })
    return
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
  if (!user) {
    res.status(404).json({
      success: false,
      error_code: 'USER_NOT_FOUND',
      error: '用户不存在',
    })
    return
  }

  const roleInfo = getRoleWorkspace(user.role)

  res.json({
    success: true,
    data: {
      id: user.id,
      username: user.username,
      display_name: user.display_name,
      role: user.role,
      credit_score: user.credit_score,
      created_at: user.created_at,
      workspace: roleInfo,
    },
  })
})

export default router
