import { get, query } from '../config/database.js'
import { comparePassword, generateToken } from '../utils/auth.js'
import type { User, LoginResponse, UserRole } from '../types/index.js'

interface UserWithPassword extends User {
  password_hash: string
}

export async function login(username: string, password: string, role: string): Promise<LoginResponse> {
  const user = get<UserWithPassword>(
    'SELECT id, username, name, role, phone, email, status, password_hash, created_at as createdAt FROM users WHERE username = ?',
    [username]
  )

  if (!user) {
    throw new Error('用户名或密码错误')
  }

  if (user.role !== role) {
    throw new Error('用户角色不匹配')
  }

  if (user.status !== 'active') {
    throw new Error('账号已被禁用')
  }

  const passwordValid = comparePassword(password, user.password_hash)
  if (!passwordValid) {
    throw new Error('用户名或密码错误')
  }

  const token = generateToken(user.id, user.role)

  const permissions = await getUserPermissions(user.role as UserRole)

  const { password_hash, ...userWithoutPassword } = user

  return {
    user: userWithoutPassword,
    token,
    permissions
  }
}

export async function getProfile(userId: number): Promise<User> {
  const user = get<User>(
    'SELECT id, username, name, role, phone, email, status, created_at as createdAt FROM users WHERE id = ?',
    [userId]
  )

  if (!user) {
    throw new Error('用户不存在')
  }

  return user
}

async function getUserPermissions(role: UserRole): Promise<string[]> {
  const permissions = query<{ resource: string; action: string }>(
    'SELECT resource, action FROM permissions WHERE role = ?',
    [role]
  )

  return permissions.map(p => `${p.resource}:${p.action}`)
}
