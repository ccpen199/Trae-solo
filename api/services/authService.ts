import crypto from 'crypto'
import db from '../db/index.js'
import type { User } from '../../shared/types.js'

function hashPassword(pwd: string) {
  return crypto.createHash('sha256').update(pwd).digest('hex')
}

function generateToken(user: { id: number; role: string }) {
  return Buffer.from(JSON.stringify({ id: user.id, role: user.role })).toString('base64')
}

function fromDbUser(u: any): User {
  return {
    id: u.id,
    phone: u.phone,
    passwordHash: u.password_hash,
    realName: u.real_name,
    idCard: u.id_card,
    role: u.role,
    creditScore: u.credit_score,
    zhimaUserId: u.zhima_user_id,
    createdAt: u.created_at,
  }
}

export const authService = {
  async register(data: { phone: string; password: string; realName: string; idCard: string; role?: string }) {
    const existing = db.prepare('SELECT id FROM users WHERE phone = ? OR id_card = ?').get(data.phone, data.idCard)
    if (existing) throw new Error('手机号或身份证已注册')

    const result = db
      .prepare('INSERT INTO users (phone, password_hash, real_name, id_card, role, credit_score) VALUES (?, ?, ?, ?, ?, ?)')
      .run(data.phone, hashPassword(data.password), data.realName, data.idCard, data.role || 'user', 600)

    const user = fromDbUser(db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid))
    const token = generateToken(user)
    return { user, token }
  },

  async login(data: { phone: string; password: string }) {
    const row = db.prepare('SELECT * FROM users WHERE phone = ?').get(data.phone)
    const user = row ? fromDbUser(row) : undefined
    if (!user || user.passwordHash !== hashPassword(data.password)) {
      throw new Error('手机号或密码错误')
    }
    const token = generateToken(user)
    return { user, token }
  },

  async getMe(userId: number) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
    if (!row) throw new Error('用户不存在')
    return fromDbUser(row)
  },
}
