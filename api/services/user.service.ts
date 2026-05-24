import { run, get, query } from '../config/database.js'
import { hashPassword } from '../utils/auth.js'
import type { User, UserRole } from '../types/index.js'

export async function getUsers(): Promise<User[]> {
  const users = query<User>(
    'SELECT id, username, name, role, phone, email, status, created_at as createdAt FROM users ORDER BY id ASC'
  )

  return users
}

export async function createUser(data: Partial<User> & { password: string }): Promise<User> {
  const existingUser = get<User>(
    'SELECT id FROM users WHERE username = ?',
    [data.username]
  )

  if (existingUser) {
    throw new Error('用户名已存在')
  }

  const passwordHash = hashPassword(data.password)

  const result = run(
    `INSERT INTO users (username, password_hash, name, role, phone, email, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      data.username,
      passwordHash,
      data.name,
      data.role,
      data.phone,
      data.email || null,
      data.status || 'active'
    ]
  )

  const userId = result.lastInsertRowid as number

  const user = get<User>(
    'SELECT id, username, name, role, phone, email, status, created_at as createdAt FROM users WHERE id = ?',
    [userId]
  )

  if (!user) {
    throw new Error('创建用户失败')
  }

  return user
}

export async function updateUser(id: number, data: Partial<User>): Promise<User> {
  const existingUser = get<User>(
    'SELECT id FROM users WHERE id = ?',
    [id]
  )

  if (!existingUser) {
    throw new Error('用户不存在')
  }

  if (data.username && data.username !== existingUser.username) {
    const usernameTaken = get<User>(
      'SELECT id FROM users WHERE username = ? AND id != ?',
      [data.username, id]
    )
    if (usernameTaken) {
      throw new Error('用户名已存在')
    }
  }

  const fields: string[] = []
  const values = []

  if (data.username !== undefined) {
    fields.push('username = ?')
    values.push(data.username)
  }
  if (data.name !== undefined) {
    fields.push('name = ?')
    values.push(data.name)
  }
  if (data.role !== undefined) {
    fields.push('role = ?')
    values.push(data.role)
  }
  if (data.phone !== undefined) {
    fields.push('phone = ?')
    values.push(data.phone)
  }
  if (data.email !== undefined) {
    fields.push('email = ?')
    values.push(data.email)
  }
  if (data.status !== undefined) {
    fields.push('status = ?')
    values.push(data.status)
  }

  if (fields.length === 0) {
    return existingUser
  }

  fields.push('updated_at = CURRENT_TIMESTAMP')
  values.push(id)

  run(
    `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
    values
  )

  const updatedUser = get<User>(
    'SELECT id, username, name, role, phone, email, status, created_at as createdAt FROM users WHERE id = ?',
    [id]
  )

  if (!updatedUser) {
    throw new Error('更新用户失败')
  }

  return updatedUser
}

export async function getUserPermissions(role: UserRole): Promise<string[]> {
  const permissions = query<{ resource: string; action: string }>(
    'SELECT resource, action FROM permissions WHERE role = ?',
    [role]
  )

  return permissions.map(p => `${p.resource}:${p.action}`)
}
