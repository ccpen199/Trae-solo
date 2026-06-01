// @ts-nocheck
import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

function getClientIp(req: Request): string {
  return (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown'
}

function createLog(
  user_name: string,
  module: string,
  action: string,
  target_id: number | null,
  details: string,
  ip_address: string
): void {
  const insertLog = db.prepare(`
    INSERT INTO operation_logs (user_name, module, action, target_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  insertLog.run(user_name, module, action, target_id, details, ip_address)
}

router.post('/login', (req: Request, res: Response): void => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({
        success: false,
        message: '用户名和密码不能为空',
      })
      return
    }

    const defaultUsers = [
      { id: 1, username: 'admin', password: 'admin123', name: '管理员', role: 'admin' },
      { id: 2, username: 'dispatcher', password: 'disp123', name: '调度员', role: 'dispatcher' },
      { id: 3, username: 'operator', password: 'oper123', name: '操作员', role: 'operator' },
    ]

    const user = defaultUsers.find(
      (u) => u.username === username && u.password === password
    )

    if (!user) {
      createLog(username, '用户认证', '登录失败', null, '用户名或密码错误', getClientIp(req))
      res.status(401).json({
        success: false,
        message: '用户名或密码错误',
      })
      return
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    }

    createLog(user.name, '用户认证', '登录', user.id, '用户登录系统', getClientIp(req))

    res.json({
      success: true,
      data: userInfo,
      message: '登录成功',
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '登录失败',
    })
  }
})

router.post('/logout', (req: Request, res: Response): void => {
  try {
    const { user_name, user_id } = req.body
    createLog(
      user_name || '未知用户',
      '用户认证',
      '登出',
      user_id || null,
      '用户退出系统',
      getClientIp(req)
    )

    res.json({
      success: true,
      message: '登出成功',
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '登出失败',
    })
  }
})

router.get('/me', (req: Request, res: Response): void => {
  try {
    const { user_id } = req.query

    if (!user_id) {
      res.status(401).json({
        success: false,
        message: '未登录',
      })
      return
    }

    const defaultUsers = [
      { id: 1, username: 'admin', name: '管理员', role: 'admin' },
      { id: 2, username: 'dispatcher', name: '调度员', role: 'dispatcher' },
      { id: 3, username: 'operator', name: '操作员', role: 'operator' },
    ]

    const user = defaultUsers.find((u) => u.id === Number(user_id))

    if (!user) {
      res.status(404).json({
        success: false,
        message: '用户不存在',
      })
      return
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('Get current user error:', error)
    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : '获取用户信息失败',
    })
  }
})

export default router
