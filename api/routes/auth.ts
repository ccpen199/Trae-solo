import { Router, type Request, type Response } from 'express'
import db from '../database.js'

const router = Router()

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password, name, role } = req.body
    if (!phone || !password || !name || !role) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    if (!['talent', 'institution', 'admin'].includes(role)) {
      res.status(400).json({ success: false, error: '无效的角色类型' })
      return
    }
    const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(phone)
    if (existing) {
      res.status(409).json({ success: false, error: '该手机号已注册' })
      return
    }
    const userResult = db.prepare('INSERT INTO users (phone, password, name, role) VALUES (?, ?, ?, ?)').run(phone, password, name, role)
    const userId = Number(userResult.lastInsertRowid)

    if (role === 'talent') {
      db.prepare('INSERT INTO talent_profiles (user_id) VALUES (?)').run(userId)
    } else if (role === 'institution') {
      db.prepare('INSERT INTO institution_profiles (user_id, institution_name) VALUES (?, ?)').run(userId, name)
    }

    const user = db.prepare('SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?').get(userId) as any
    res.status(201).json({ success: true, data: { user, token: String(userId) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '缺少手机号或密码' })
      return
    }
    const user = db.prepare('SELECT id, phone, password, name, role, verified, created_at FROM users WHERE phone = ?').get(phone) as any
    if (!user || user.password !== password) {
      res.status(401).json({ success: false, error: '手机号或密码错误' })
      return
    }
    const { password: _, ...userWithoutPassword } = user
    res.json({ success: true, data: { user: userWithoutPassword, token: String(user.id) } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    const user = db.prepare('SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?').get(userId) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }
    let profile = null
    if (user.role === 'talent') {
      profile = db.prepare('SELECT * FROM talent_profiles WHERE user_id = ?').get(userId)
    } else if (user.role === 'institution') {
      profile = db.prepare('SELECT * FROM institution_profiles WHERE user_id = ?').get(userId)
    }
    res.json({ success: true, data: { user, profile } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.headers['x-user-id']
    const userRole = req.headers['x-user-role']
    if (!userId) {
      res.status(401).json({ success: false, error: '未登录' })
      return
    }
    if (userRole === 'talent') {
      const { practice_category, department, title, certificate_url, gender, age, email, location } = req.body
      db.prepare(`
        UPDATE talent_profiles SET practice_category = COALESCE(?, practice_category), department = COALESCE(?, department),
        title = COALESCE(?, title), certificate_url = COALESCE(?, certificate_url), gender = COALESCE(?, gender),
        age = COALESCE(?, age), email = COALESCE(?, email), location = COALESCE(?, location) WHERE user_id = ?
      `).run(practice_category, department, title, certificate_url, gender, age, email, location, userId)
    } else if (userRole === 'institution') {
      const { institution_name, institution_type, license_url, credit_code, license_expiry, location, description } = req.body
      db.prepare(`
        UPDATE institution_profiles SET institution_name = COALESCE(?, institution_name), institution_type = COALESCE(?, institution_type),
        license_url = COALESCE(?, license_url), credit_code = COALESCE(?, credit_code), license_expiry = COALESCE(?, license_expiry),
        location = COALESCE(?, location), description = COALESCE(?, description) WHERE user_id = ?
      `).run(institution_name, institution_type, license_url, credit_code, license_expiry, location, description, userId)
    }
    const user = db.prepare('SELECT id, phone, name, role, verified, created_at FROM users WHERE id = ?').get(userId) as any
    let profile = null
    if (user.role === 'talent') {
      profile = db.prepare('SELECT * FROM talent_profiles WHERE user_id = ?').get(userId)
    } else if (user.role === 'institution') {
      profile = db.prepare('SELECT * FROM institution_profiles WHERE user_id = ?').get(userId)
    }
    res.json({ success: true, data: { user, profile } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, role } = req.query
    if (!phone || !role) {
      res.status(400).json({ success: false, error: '缺少参数' })
      return
    }
    const user = db.prepare('SELECT id, verified, created_at FROM users WHERE phone = ? AND role = ?').get(phone, role) as any
    if (!user) {
      res.json({ success: true, data: { status: 'not_found', message: '未找到申请记录' } })
      return
    }
    if (user.verified) {
      res.json({ success: true, data: { status: 'approved', message: '审核已通过，您可以正常登录使用' } })
    } else {
      res.json({ success: true, data: { status: 'pending', message: '审核中，请耐心等待，预计1-3个工作日完成' } })
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
