import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

function formatPolicy(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    enabled: !!row.enabled,
    config: typeof row.config === 'string' ? JSON.parse(row.config) : row.config || {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

router.get('/policies', (_req: Request, res: Response): void => {
  const db = getDb()
  const rows = db.prepare('SELECT * FROM privacy_policies ORDER BY category ASC').all() as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(formatPolicy) })
})

router.put('/policies/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const row = db.prepare('SELECT * FROM privacy_policies WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined

  if (!row) {
    res.status(404).json({ success: false, error: 'Privacy policy not found' })
    return
  }

  const updates: string[] = []
  const params: unknown[] = []

  if (req.body.enabled !== undefined) {
    updates.push('enabled = ?')
    params.push(req.body.enabled ? 1 : 0)
  }
  if (req.body.name !== undefined) {
    updates.push('name = ?')
    params.push(req.body.name)
  }
  if (req.body.description !== undefined) {
    updates.push('description = ?')
    params.push(req.body.description)
  }
  if (req.body.config !== undefined) {
    updates.push('config = ?')
    params.push(typeof req.body.config === 'string' ? req.body.config : JSON.stringify(req.body.config))
  }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: 'No fields to update' })
    return
  }

  updates.push("updated_at = datetime('now')")
  params.push(req.params.id)
  db.prepare(`UPDATE privacy_policies SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const updated = db.prepare('SELECT * FROM privacy_policies WHERE id = ?').get(req.params.id) as Record<string, unknown>
  res.json({ success: true, data: formatPolicy(updated) })
})

router.get('/encryption/status', (_req: Request, res: Response): void => {
  const db = getDb()
  const policies = db.prepare('SELECT * FROM privacy_policies').all() as Record<string, unknown>[]

  const encryptionPolicy = policies.find(p => p.category === 'call_encrypt')
  const isEncrypted = encryptionPolicy ? !!encryptionPolicy.enabled : false

  res.json({
    success: true,
    data: {
      callEncryption: {
        enabled: isEncrypted,
        algorithm: 'AES-256',
        keyRotation: 'daily',
        lastRotated: new Date().toISOString().replace('T', ' ').split(' ')[0],
      },
      dataMasking: {
        enabled: policies.some(p => p.category === 'data_mask' && p.enabled),
        maskPhone: true,
        maskName: false,
      },
      faceBlur: {
        enabled: policies.some(p => p.category === 'face_blur' && p.enabled),
        blurLevel: 'high',
      },
      locationStrip: {
        enabled: policies.some(p => p.category === 'location_strip' && p.enabled),
        precisionLevel: 'district',
      },
      overallStatus: policies.every(p => p.enabled) ? 'fully_protected' : 'partially_protected',
    },
  })
})

export default router
