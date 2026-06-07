import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status, intentType, keyword, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('c.status = ?'); params.push(status) }
    if (intentType) { conditions.push('c.intent_type = ?'); params.push(intentType) }
    if (keyword) {
      conditions.push('(c.name LIKE ? OR c.phone LIKE ?)')
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    if (req.user!.role === 'agent') {
      conditions.push('c.agent_id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('c.agent_id IN (SELECT id FROM users WHERE org_id = ?)')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM clients c ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT c.*, u.name as agent_name
       FROM clients c LEFT JOIN users u ON c.agent_id = u.id
       ${where}
       ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', authenticate, auditLog('create', 'client'), async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      name, phone, intentType, budgetMin, budgetMax,
      preferredArea, houseTypePref, source, remark,
    } = req.body

    if (!name || !phone) {
      res.status(400).json({ success: false, error: '姓名和电话为必填项' })
      return
    }

    const result = db.prepare(
      `INSERT INTO clients (name, phone, intent_type, budget_min, budget_max, preferred_area, house_type_pref, source, remark, agent_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, phone, intentType || 'buy', budgetMin || null, budgetMax || null,
      preferredArea || null, houseTypePref || null, source || null, remark || null,
      req.user!.id
    )

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid) as any
    res.status(201).json({ success: true, data: client })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const client = db.prepare(
      `SELECT c.*, u.name as agent_name
       FROM clients c LEFT JOIN users u ON c.agent_id = u.id
       WHERE c.id = ?`
    ).get(Number(req.params.id)) as any

    if (!client) {
      res.status(404).json({ success: false, error: '客户不存在' })
      return
    }

    const followups = db.prepare(
      `SELECT f.*, u.name as agent_name
       FROM followups f LEFT JOIN users u ON f.agent_id = u.id
       WHERE f.client_id = ?
       ORDER BY f.created_at DESC`
    ).all(Number(req.params.id)) as any[]

    res.json({ success: true, data: { ...client, followups } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', authenticate, auditLog('update', 'client'), async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id)
    const client = db.prepare('SELECT agent_id FROM clients WHERE id = ?').get(clientId) as any
    if (!client) {
      res.status(404).json({ success: false, error: '客户不存在' })
      return
    }

    const isOwner = client.agent_id === req.user!.id
    const isPrivileged = ['director', 'manager'].includes(req.user!.role)
    if (!isOwner && !isPrivileged) {
      res.status(403).json({ success: false, error: '无权修改此客户' })
      return
    }

    const fields: string[] = []
    const params: any[] = []
    const allowedFields: Record<string, string> = {
      name: 'name', phone: 'phone', intentType: 'intent_type',
      budgetMin: 'budget_min', budgetMax: 'budget_max',
      preferredArea: 'preferred_area', houseTypePref: 'house_type_pref',
      source: 'source', remark: 'remark', status: 'status',
    }

    for (const [bodyKey, colKey] of Object.entries(allowedFields)) {
      if (req.body[bodyKey] !== undefined) {
        fields.push(`${colKey} = ?`)
        params.push(req.body[bodyKey])
      }
    }

    if (fields.length === 0) {
      res.status(400).json({ success: false, error: '没有需要更新的字段' })
      return
    }

    fields.push('updated_at = CURRENT_TIMESTAMP')
    params.push(clientId)
    db.prepare(`UPDATE clients SET ${fields.join(', ')} WHERE id = ?`).run(...params)

    const updated = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as any
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.delete('/:id', authenticate, requireRole('director', 'manager', 'admin'), auditLog('delete', 'client'), async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id)
    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId) as any
    if (!client) {
      res.status(404).json({ success: false, error: '客户不存在' })
      return
    }

    db.prepare("UPDATE clients SET status = 'closed', updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(clientId)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/followup', authenticate, auditLog('followup', 'client'), async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id)
    const { content, type, nextFollowup } = req.body

    if (!content) {
      res.status(400).json({ success: false, error: '跟进内容为必填项' })
      return
    }

    const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(clientId) as any
    if (!client) {
      res.status(404).json({ success: false, error: '客户不存在' })
      return
    }

    const result = db.prepare(
      `INSERT INTO followups (client_id, agent_id, content, type, next_followup)
       VALUES (?, ?, ?, ?, ?)`
    ).run(clientId, req.user!.id, content, type || 'other', nextFollowup || null)

    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(result.lastInsertRowid) as any
    res.status(201).json({ success: true, data: followup })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id/match', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const clientId = Number(req.params.id)
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId) as any
    if (!client) {
      res.status(404).json({ success: false, error: '客户不存在' })
      return
    }

    const conditions: string[] = ["h.status = 'available'"]
    const params: any[] = []

    if (client.intent_type) {
      conditions.push('h.unit_type = ?')
      params.push(client.intent_type === 'buy' ? 'sell' : 'rent')
    }
    if (client.budget_min) {
      conditions.push('h.price >= ?')
      params.push(client.budget_min)
    }
    if (client.budget_max) {
      conditions.push('h.price <= ?')
      params.push(client.budget_max)
    }
    if (client.preferred_area) {
      conditions.push('(h.community LIKE ? OR h.address LIKE ?)')
      params.push(`%${client.preferred_area}%`, `%${client.preferred_area}%`)
    }
    if (client.house_type_pref) {
      conditions.push('h.house_type = ?')
      params.push(client.house_type_pref)
    }

    const where = 'WHERE ' + conditions.join(' AND ')
    const rows = db.prepare(
      `SELECT h.*, u.name as agent_name
       FROM houses h LEFT JOIN users u ON h.agent_id = u.id
       ${where}
       ORDER BY h.created_at DESC LIMIT 10`
    ).all(...params) as any[]

    res.json({ success: true, data: rows })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
