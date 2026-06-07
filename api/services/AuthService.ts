import Database from 'better-sqlite3'
import type { Database as DatabaseType } from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { User } from '../db/index.js'

function toCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj as T
  const result: any = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
  }
  return result as T
}

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token: string
  user: any
}

export interface TokenPayload {
  userId: number
  username: string
  role: string
}

export default class AuthService {
  private db: DatabaseType

  constructor(db: DatabaseType) {
    this.db = db
  }

  async login(req: LoginRequest): Promise<LoginResponse> {
    const user = this.db.prepare('SELECT * FROM users WHERE id_card = ?').get(req.username) as any

    if (!user) {
      throw new Error('用户不存在')
    }

    if (user.status !== 'active') {
      throw new Error('账户已被禁用')
    }

    const passwordValid = await bcrypt.compare(req.password, user.password_hash)
    if (!passwordValid) {
      throw new Error('密码错误')
    }

    const token = this.generateToken({
      userId: user.id,
      username: user.id_card,
      role: user.role,
    })

    const { password_hash, ...userWithoutPassword } = user

    return {
      token,
      user: toCamelCase(userWithoutPassword),
    }
  }

  async getUserInfo(userId: number): Promise<any> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any

    if (!user) {
      throw new Error('用户不存在')
    }

    const { password_hash, ...userWithoutPassword } = user
    return toCamelCase(userWithoutPassword)
  }

  generateToken(payload: TokenPayload): string {
    const secret = process.env.JWT_SECRET || 'traffic-admin-secret-key-2024'
    return jwt.sign(payload, secret, { expiresIn: '24h' })
  }

  verifyToken(token: string): TokenPayload {
    const secret = process.env.JWT_SECRET || 'traffic-admin-secret-key-2024'
    try {
      return jwt.verify(token, secret) as TokenPayload
    } catch (error) {
      throw new Error('Token无效或已过期')
    }
  }

  async registerUser(userData: any): Promise<any> {
    const existingUser = this.db.prepare('SELECT id FROM users WHERE username = ? OR id_card = ?').get(userData.username, userData.idCard)
    
    if (existingUser) {
      throw new Error('用户名或身份证号已存在')
    }

    const passwordHash = await bcrypt.hash(userData.password, 10)

    const result = this.db.prepare(`
      INSERT INTO users (username, password_hash, name, id_card, phone, role, avatar, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
    `).run(
      userData.username,
      passwordHash,
      userData.name,
      userData.idCard,
      userData.phone,
      userData.role || 'user',
      userData.avatar || null,
    )

    const userId = result.lastInsertRowid as number
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any
    
    const { password_hash, ...userWithoutPassword } = user
    return toCamelCase(userWithoutPassword)
  }

  changePassword(userId: number, oldPassword: string, newPassword: string): boolean {
    const user = this.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(userId) as { password_hash: string } | undefined

    if (!user) {
      throw new Error('用户不存在')
    }

    const passwordValid = bcrypt.compareSync(oldPassword, user.password_hash)
    if (!passwordValid) {
      throw new Error('原密码错误')
    }

    const newPasswordHash = bcrypt.hashSync(newPassword, 10)
    
    this.db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(
      newPasswordHash,
      userId,
    )

    return true
  }
}
