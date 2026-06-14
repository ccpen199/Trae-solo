import getDatabase from '../config/database.js'
import { toCamelCase } from './utils.js'
import type { User } from '../../shared/types/index.js'

interface UserWithPassword extends User {
  passwordHash?: string
}

const userRepository = {
  findById(id: number): User | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT id, phone, role, name, avatar, school_name, province, relationship, expert_certified, created_at FROM users WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<User>(row) : null
  },

  findByIdWithPassword(id: number): UserWithPassword | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?')
    const row = stmt.get(id)
    return row ? toCamelCase<UserWithPassword>(row) : null
  },

  findByPhone(phone: string): User | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT id, phone, role, name, avatar, school_name, province, relationship, expert_certified, created_at FROM users WHERE phone = ?')
    const row = stmt.get(phone)
    return row ? toCamelCase<User>(row) : null
  },

  findByPhoneWithPassword(phone: string): UserWithPassword | null {
    const db = getDatabase()
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?')
    const row = stmt.get(phone)
    return row ? toCamelCase<UserWithPassword>(row) : null
  },

  findAll(): User[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT id, phone, role, name, avatar, school_name, province, relationship, expert_certified, created_at FROM users ORDER BY id')
    const rows = stmt.all()
    return toCamelCase<User[]>(rows)
  },

  findByRole(role: string): User[] {
    const db = getDatabase()
    const stmt = db.prepare('SELECT id, phone, role, name, avatar, school_name, province, relationship, expert_certified, created_at FROM users WHERE role = ? ORDER BY id')
    const rows = stmt.all(role)
    return toCamelCase<User[]>(rows)
  },

  create(data: Omit<User, 'id' | 'createdAt'> & { passwordHash: string }): number {
    const db = getDatabase()
    const stmt = db.prepare(`
      INSERT INTO users (phone, role, name, password_hash, avatar, school_name, province, relationship, expert_certified)
      VALUES (@phone, @role, @name, @passwordHash, @avatar, @schoolName, @province, @relationship, @expertCertified)
    `)
    const result = stmt.run(data)
    return Number(result.lastInsertRowid)
  },

  update(id: number, data: Partial<Omit<User, 'id' | 'createdAt' | 'passwordHash'>>): boolean {
    const db = getDatabase()
    const fields: string[] = []
    const params: Record<string, unknown> = { id }

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
        fields.push(`${snakeKey} = @${key}`)
        params[key] = value
      }
    }

    if (fields.length === 0) return false

    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = @id`)
    const result = stmt.run(params)
    return result.changes > 0
  },

  updatePassword(id: number, passwordHash: string): boolean {
    const db = getDatabase()
    const stmt = db.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
    const result = stmt.run(passwordHash, id)
    return result.changes > 0
  },

  delete(id: number): boolean {
    const db = getDatabase()
    const stmt = db.prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    return result.changes > 0
  }
}

export default userRepository
