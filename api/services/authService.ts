import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import type { User, UserRole, UserStatus } from '@shared/types'

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

export class AuthError extends Error {
  code: string
  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'AuthError'
  }
}

export const AUTH_ERRORS = {
  ACCOUNT_NOT_FOUND: 'ACCOUNT_NOT_FOUND',
  WRONG_PASSWORD: 'WRONG_PASSWORD',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  LICENSE_PENDING: 'LICENSE_PENDING',
} as const

function rowToUser(row: any): User {
  return {
    id: row.id,
    role: row.role as UserRole,
    phone: row.phone,
    nickname: row.nickname,
    avatar: row.avatar,
    status: (row.status as UserStatus) || 'active',
    licenseVerified: !!row.license_verified,
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
    throw new AuthError(AUTH_ERRORS.ACCOUNT_NOT_FOUND, '账号不存在，请检查手机号或注册新账号')
  }

  const userRow = row as any

  if (!verifyPassword(payload.password, userRow.password_hash)) {
    throw new AuthError(AUTH_ERRORS.WRONG_PASSWORD, '密码错误，请重新输入或找回密码')
  }

  if (userRow.status === 'disabled') {
    throw new AuthError(AUTH_ERRORS.ACCOUNT_DISABLED, '账号已被禁用，请联系平台管理员客服申诉')
  }

  if (userRow.status === 'pending_review') {
    throw new AuthError(AUTH_ERRORS.ACCOUNT_DISABLED, '账号资质待审核，请耐心等待平台审核完成后再登录')
  }

  const user = rowToUser(userRow)

  if (user.role === 'doctor' && user.licenseVerified === false) {
    throw new AuthError(AUTH_ERRORS.LICENSE_PENDING, '医生执业资质审核中，请耐心等待平台审核通过')
  }

  if ((user.role === 'hospital' || user.role === 'merchant') && user.status === 'pending_review') {
    throw new AuthError(AUTH_ERRORS.LICENSE_PENDING, '商家资质备案审核中，请耐心等待平台审核通过')
  }

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
