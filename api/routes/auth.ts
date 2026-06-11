/**
 * This is a user authentication API route demo.
 * Handle user registration, login, token management, etc.
 */
import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

function formatMember(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar,
    phone: row.phone,
    role: row.role,
    permissions: typeof row.permissions === 'string' ? JSON.parse(row.permissions) : row.permissions,
    joinedAt: row.joined_at,
    invitedBy: row.invited_by,
  }
}

function currentProfile() {
  const db = getDb()
  const row = db.prepare(`
    SELECT * FROM members
    WHERE role = 'primary_guardian'
    ORDER BY joined_at ASC
    LIMIT 1
  `).get() as Record<string, unknown> | undefined

  if (row) return formatMember(row)

  return {
    id: 'local-guardian',
    name: '本地监护人',
    avatar: '/avatars/local.jpg',
    phone: '13800138000',
    role: 'primary_guardian',
    permissions: ['device:manage', 'member:manage', 'privacy:manage', 'analytics:view'],
    joinedAt: new Date().toISOString(),
    invitedBy: null,
  }
}

router.get('/me', (_req: Request, res: Response): void => {
  res.json({ success: true, data: currentProfile() })
})

/**
 * User Login
 * POST /api/auth/register
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement register logic
})

/**
 * User Login
 * POST /api/auth/login
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement login logic
})

/**
 * User Logout
 * POST /api/auth/logout
 */
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  // TODO: Implement logout logic
})

export default router
