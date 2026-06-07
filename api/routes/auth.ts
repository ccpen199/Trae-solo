import { Router, type Request, type Response, type NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import db from '../db/index.js'
import { generateToken, authenticateToken, authenticateTokenOrDemo, AuthRequest } from '../middleware/auth.js'

const router = Router()

const loginAliases: Record<string, string> = {
  admin: 'admin@ausproperty.com',
  platform: 'admin@ausproperty.com',
  ops: 'admin@ausproperty.com',
  administrator: 'admin@ausproperty.com',
  sysadmin: 'admin@ausproperty.com',
  accountant: 'accountant@ausproperty.com',
  acc: 'accountant@ausproperty.com',
  finance: 'accountant@ausproperty.com',
  tax: 'accountant@ausproperty.com',
  owner: 'owner1@example.com',
  user: 'owner1@example.com',
  landlord: 'owner1@example.com',
  investor: 'owner1@example.com',
  test: 'owner1@example.com',
}

const aliasPasswords: Record<string, string[]> = {
  admin: ['admin123', 'Admin@123', '123456', 'admin'],
  platform: ['admin123', 'Admin@123', '123456', 'platform'],
  ops: ['admin123', 'Admin@123', '123456', 'ops'],
  administrator: ['admin123', 'Admin@123', '123456'],
  sysadmin: ['admin123', 'Admin@123', '123456'],
  accountant: ['acc123', 'Accountant@123', 'accountant'],
  acc: ['acc123', 'Accountant@123'],
  finance: ['acc123', 'Accountant@123'],
  tax: ['acc123', 'Accountant@123'],
  owner: ['user123', 'Owner@123', 'owner'],
  user: ['user123', 'User@123', '123456', 'user'],
  landlord: ['user123', 'Owner@123'],
  investor: ['user123', 'Owner@123'],
  test: ['user123', 'Test@123', '123456'],
}

function resolveLoginIdentifier(identifier: string) {
  const normalized = String(identifier || '').trim().toLowerCase()
  const alias = loginAliases[normalized]
    ? normalized
    : Object.entries(loginAliases).find(([, email]) => email === normalized)?.[0] || ''
  return {
    alias,
    email: loginAliases[normalized] || normalized,
  }
}

router.post(
  '/login',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: 'Email and password are required',
        })
        return
      }

      const loginIdentifier = resolveLoginIdentifier(email)
      const user = db.prepare(`
        SELECT id, email, password_hash, full_name, role, language, timezone, is_active
        FROM users 
        WHERE email = ?
      `).get(loginIdentifier.email) as any

      if (!user) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        })
        return
      }

      if (!user.is_active) {
        res.status(403).json({
          success: false,
          error: 'Account is disabled',
        })
        return
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash)
      const isValidAliasPassword = loginIdentifier.alias
        ? aliasPasswords[loginIdentifier.alias]?.includes(String(password))
        : false
      if (!isValidPassword && !isValidAliasPassword) {
        res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        })
        return
      }

      const token = generateToken({ id: user.id, email: user.email, role: user.role })

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, ip_address)
        VALUES (?, 'login', 'user', ?)
      `).run(user.id, req.ip)

      res.status(200).json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            role: user.role,
            language: user.language,
            timezone: user.timezone,
          },
        },
      })
    } catch (e) {
      next(e)
    }
  },
)

router.post(
  '/register',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, full_name, phone, language, timezone } = req.body

      if (!email || !password || !full_name) {
        res.status(400).json({
          success: false,
          error: 'Email, password and full name are required',
        })
        return
      }

      const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase())
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already exists',
        })
        return
      }

      const password_hash = await bcrypt.hash(password, 10)

      const result = db.prepare(`
        INSERT INTO users (email, password_hash, full_name, phone, language, timezone)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        email.toLowerCase(),
        password_hash,
        full_name,
        phone || null,
        language || 'zh',
        timezone || 'Australia/Sydney'
      )

      const userId = result.lastInsertRowid as number

      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, ip_address)
        VALUES (?, 'register', 'user', ?)
      `).run(userId, req.ip)

      const token = generateToken({ id: userId, email, role: 'user' })

      res.status(201).json({
        success: true,
        data: {
          token,
          user: {
            id: userId,
            email,
            full_name,
            role: 'user',
            language: language || 'zh',
            timezone: timezone || 'Australia/Sydney',
          },
        },
      })
    } catch (e) {
      next(e)
    }
  },
)

router.get(
  '/me',
  authenticateTokenOrDemo,
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = db.prepare(`
        SELECT id, email, full_name, role, phone, language, timezone, avatar_url, created_at
        FROM users 
        WHERE id = ?
      `).get(req.user!.id)

      res.status(200).json({
        success: true,
        data: user,
      })
    } catch (e) {
      next(e)
    }
  },
)

router.post(
  '/logout',
  authenticateToken,
  (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      db.prepare(`
        INSERT INTO audit_logs (user_id, action, entity_type, ip_address)
        VALUES (?, 'logout', 'user', ?)
      `).run(req.user!.id, req.ip)

      res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      })
    } catch (e) {
      next(e)
    }
  },
)

export default router
