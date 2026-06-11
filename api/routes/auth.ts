import { Router, type Request, type Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import db from '../db.js'
import { auth, JWT_SECRET } from '../middleware/auth.js'

const router = Router()

const aliasMap: Record<string, string> = {
  admin: '13800000001',
  street: '13800000001',
  street_admin: '13800000001',
  platform: '13800000002',
  community: '13800000002',
  community_admin: '13800000002',
  ops: '13800000003',
  property: '13800000003',
  property_admin: '13800000003',
  owner_committee: '13800000004',
  committee: '13800000004',
  owner: '13800000005',
  owner_a: '13800000005',
  owner_b: '13800000006',
  owner_c: '13800000007',
  repair: '13800000008',
  worker: '13800000008',
}

function resolvePhone(identifier: string): string {
  if (/^\d{11}$/.test(identifier)) return identifier
  return aliasMap[identifier.toLowerCase()] || aliasMap[identifier] || identifier
}

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ success: false, error: '账号和密码不能为空', errorCode: 'EMPTY_CREDENTIALS' })
      return
    }

    const resolvedPhone = resolvePhone(String(phone))
    const isPhone = /^\d{11}$/.test(resolvedPhone)
    if (!isPhone) {
      res.status(401).json({ success: false, error: '账号不存在，请输入正确的手机号或账号别名', errorCode: 'INVALID_ACCOUNT' })
      return
    }

    const user = db.prepare(
      'SELECT id, phone, password, name, role_id, organization_id, status FROM users WHERE phone = ?'
    ).get(resolvedPhone) as any

    if (!user) {
      res.status(401).json({ success: false, error: '用户不存在，请检查账号是否正确', errorCode: 'USER_NOT_FOUND' })
      return
    }

    if (user.status === 'disabled') {
      res.status(403).json({ success: false, error: '账号已被禁用，请联系管理员', errorCode: 'ACCOUNT_DISABLED' })
      return
    }

    const valid = bcrypt.compareSync(password, user.password)
    if (!valid) {
      res.status(401).json({ success: false, error: '密码错误，请重试或使用"忘记密码"功能', errorCode: 'WRONG_PASSWORD' })
      return
    }

    const token = jwt.sign(
      { id: user.id, role_id: user.role_id, organization_id: user.organization_id },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    const role = db.prepare('SELECT name, display_name, permissions FROM roles WHERE id = ?').get(user.role_id) as any
    const org = db.prepare('SELECT name, type FROM organizations WHERE id = ?').get(user.organization_id) as any

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          role: role ? { id: user.role_id, ...role } : null,
          organization: org ? { id: user.organization_id, ...org } : null,
        },
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: `系统异常：${err.message || '请稍后重试'}`, errorCode: 'SYSTEM_ERROR' })
  }
})

router.get('/me', auth, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare(
      'SELECT id, phone, name, role_id, organization_id, avatar, status FROM users WHERE id = ?'
    ).get(req.user!.id) as any

    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const role = db.prepare('SELECT name, display_name, permissions FROM roles WHERE id = ?').get(user.role_id) as any
    const org = db.prepare('SELECT name, type FROM organizations WHERE id = ?').get(user.organization_id) as any

    res.json({
      success: true,
      data: {
        ...user,
        role: role ? { id: user.role_id, ...role } : null,
        organization: org ? { id: user.organization_id, ...org } : null,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
