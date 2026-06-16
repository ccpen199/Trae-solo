import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import type { User, UserRole } from '@shared/types'

const JWT_SECRET = process.env.JWT_SECRET || 'petlife-dev-secret-change-me'
const JWT_EXPIRES_IN = '7d'
const SALT_ROUNDS = 10

export interface LoginPayload {
  phone: string
  password: string
}

export interface RegisterPayload {
  phone: string
  password: string
  nickname: string
  role?: UserRole
  avatar?: string
}

export interface AuthResult {
  user: User
  token: string
}

function rowToUser(row: any): User {
  return {
    id: row.id,
    role: row.role as UserRole,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    createdAt: row.created_at,
  }
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      role: user.role,
      user,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, SALT_ROUNDS)
}

export function verifyPassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash)
}

export function login(payload: LoginPayload): AuthResult {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM users WHERE phone = ?').get(payload.phone)

  if (!row) {
    throw new Error('手机号或密码错误')
  }

  const userRow = row as any
  if (!verifyPassword(payload.password, userRow.password_hash)) {
    throw new Error('手机号或密码错误')
  }

  const user = rowToUser(userRow)
  const token = generateToken(user)

  return { user, token }
}

export function register(payload: RegisterPayload): AuthResult {
  const db = getDatabase()

  const existing = db.prepare('SELECT id FROM users WHERE phone = ?').get(payload.phone)
  if (existing) {
    throw new Error('该手机号已注册')
  }

  const id = uuidv4()
  const role = payload.role || 'owner'
  const passwordHash = hashPassword(payload.password)
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

  db.prepare(
    'INSERT INTO users (id, role, phone, password_hash, nickname, avatar, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(id, role, payload.phone, passwordHash, payload.nickname, payload.avatar || null, createdAt)

  const user: User = {
    id,
    role,
    phone: payload.phone,
    nickname: payload.nickname,
    avatar: payload.avatar,
    createdAt,
  }

  const token = generateToken(user)

  return { user, token }
}

export function getUserById(userId: string): User | null {
  const db = getDatabase()
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId)
  return row ? rowToUser(row) : null
}
