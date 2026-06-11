import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
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

const rolePermissions: Record<string, string[]> = {
  primary_guardian: ['device:manage', 'member:manage', 'geofence:manage', 'call:manage', 'alert:manage', 'privacy:manage', 'analytics:view'],
  temporary_caregiver: ['location:view', 'alert:receive', 'call:make'],
  school_admin: ['location:view', 'alert:receive', 'geofence:view', 'device:view'],
}

router.get('/', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM members ORDER BY joined_at ASC').all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatMember) })
})

router.post('/invite', (req: Request, res: Response): void => {
  const { name, phone, role, invitedBy } = req.body

  if (!name || !phone || !role) {
    res.status(400).json({ success: false, error: 'name, phone, and role are required' })
    return
  }

  if (!['primary_guardian', 'temporary_caregiver', 'school_admin'].includes(role)) {
    res.status(400).json({ success: false, error: 'Invalid role value' })
    return
  }

  const db = getDb()

  const existing = db.prepare('SELECT id FROM members WHERE phone = ?').get(phone)
  if (existing) {
    res.status(409).json({ success: false, error: 'Member with this phone already exists' })
    return
  }

  const id = uuidv4()
  const permissions = JSON.stringify(rolePermissions[role] || [])

  db.prepare(`
    INSERT INTO members (id, name, avatar, phone, role, permissions, invited_by)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, `/avatars/${id}.jpg`, phone, role, permissions, invitedBy || null)

  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(id) as Record<string, unknown>
  res.status(201).json({ success: true, data: formatMember(row) })
})

router.put('/:id/role', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Member not found' })
    return
  }

  const { role } = req.body
  if (!role || !['primary_guardian', 'temporary_caregiver', 'school_admin'].includes(role)) {
    res.status(400).json({ success: false, error: 'Valid role is required' })
    return
  }

  const permissions = JSON.stringify(rolePermissions[role] || [])
  db.prepare('UPDATE members SET role = ?, permissions = ? WHERE id = ?').run(role, permissions, req.params.id)

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatMember(updated) })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Member not found' })
    return
  }

  db.prepare('DELETE FROM members WHERE id = ?').run(req.params.id)
  res.json({ success: true, message: 'Member removed successfully' })
})

export default router
