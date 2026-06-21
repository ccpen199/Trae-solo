import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import db from '../db/index.js'
import { signToken } from '../middleware/auth.js'

export interface User {
  id: string
  username: string
  email: string
  password?: string
  avatar?: string
  phone?: string
  role: string
  created_at: string
  updated_at: string
}

export function register(username: string, email: string, password: string, phone?: string): { success: boolean; user?: Omit<User, 'password'>; token?: string; error?: string } {
  const existingUser = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(username, email)
  if (existingUser) {
    return { success: false, error: '用户名或邮箱已被注册' }
  }
  const id = nanoid()
  const hashedPassword = bcrypt.hashSync(password, 10)
  const role = 'user'
  db.prepare('INSERT INTO users (id, username, email, password, phone, role) VALUES (?, ?, ?, ?, ?, ?)').run(id, username, email, hashedPassword, phone || '', role)
  const user = db.prepare('SELECT id, username, email, avatar, phone, role, created_at, updated_at FROM users WHERE id = ?').get(id) as Omit<User, 'password'>
  const token = signToken({ id: user.id, username: user.username, role: user.role })
  return { success: true, user, token }
}

export function login(identifier: string, password: string): { success: boolean; user?: Omit<User, 'password'>; token?: string; error?: string } {
  const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier) as User | undefined
  if (!user) {
    return { success: false, error: '用户不存在' }
  }
  const valid = bcrypt.compareSync(password, user.password || '')
  if (!valid) {
    return { success: false, error: '密码错误' }
  }
  const { password: _p, ...userWithoutPassword } = user
  const token = signToken({ id: user.id, username: user.username, role: user.role })
  return { success: true, user: userWithoutPassword, token }
}

export function getProfile(userId: string): Omit<User, 'password'> | undefined {
  return db.prepare('SELECT id, username, email, avatar, phone, role, created_at, updated_at FROM users WHERE id = ?').get(userId) as Omit<User, 'password'> | undefined
}

export function updateProfile(userId: string, data: Partial<Pick<User, 'avatar' | 'phone'>>): boolean {
  const fields: string[] = []
  const values: any[] = []
  if (data.avatar !== undefined) { fields.push('avatar = ?'); values.push(data.avatar) }
  if (data.phone !== undefined) { fields.push('phone = ?'); values.push(data.phone) }
  if (fields.length === 0) return false
  fields.push("updated_at = datetime('now')")
  values.push(userId)
  const info = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values)
  return info.changes > 0
}

export function changePassword(userId: string, oldPassword: string, newPassword: string): { success: boolean; error?: string } {
  const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId) as { password: string } | undefined
  if (!user) return { success: false, error: '用户不存在' }
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return { success: false, error: '原密码错误' }
  }
  const hashed = bcrypt.hashSync(newPassword, 10)
  db.prepare("UPDATE users SET password = ?, updated_at = datetime('now') WHERE id = ?").run(hashed, userId)
  return { success: true }
}
