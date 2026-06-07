import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authenticate } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { auditLog } from '../middleware/audit.js'

const router = Router()

router.get('/', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      status, agentId, page = '1', pageSize = '10',
    } = req.query as any

    const conditions: string[] = []
    const params: any[] = []

    if (status) { conditions.push('co.status = ?'); params.push(status) }
    if (agentId) { conditions.push('co.agent_id = ?'); params.push(Number(agentId)) }

    if (req.user!.role === 'agent') {
      conditions.push('co.agent_id = ?')
      params.push(req.user!.id)
    } else if (req.user!.role === 'manager') {
      conditions.push('co.agent_id IN (SELECT id FROM users WHERE org_id = ?)')
      params.push(req.user!.org_id)
    }

    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Math.min(100, Number(pageSize)))
    const offset = (pageNum - 1) * pageSizeNum
    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''

    const totalRow = db.prepare(`SELECT COUNT(*) as count FROM commissions co ${where}`).get(...params) as { count: number }
    const rows = db.prepare(
      `SELECT co.*, t.title as transaction_title, u.name as agent_name
       FROM commissions co
       LEFT JOIN transactions t ON co.transaction_id = t.id
       LEFT JOIN users u ON co.agent_id = u.id
       ${where}
       ORDER BY co.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSizeNum, offset) as any[]

    res.json({ success: true, data: rows, total: totalRow.count, page: pageNum, pageSize: pageSizeNum })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/rules', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const rules = db.prepare(
      'SELECT * FROM commission_rules WHERE org_id = ? ORDER BY role'
    ).all(req.user!.org_id) as any[]

    res.json({ success: true, data: rules })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/rules', authenticate, requireRole('director'), auditLog('update_rules', 'commission_rule'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { rules } = req.body as { rules: Array<{ role: string; rate: number }> }
    if (!Array.isArray(rules) || rules.length === 0) {
      res.status(400).json({ success: false, error: '佣金规则数据无效' })
      return
    }

    db.transaction(() => {
      db.prepare('DELETE FROM commission_rules WHERE org_id = ?').run(req.user!.org_id)
      const insert = db.prepare(
        'INSERT INTO commission_rules (org_id, role, rate) VALUES (?, ?, ?)'
      )
      for (const rule of rules) {
        insert.run(req.user!.org_id, rule.role, rule.rate)
      }
    })()

    const updatedRules = db.prepare(
      'SELECT * FROM commission_rules WHERE org_id = ? ORDER BY role'
    ).all(req.user!.org_id) as any[]

    res.json({ success: true, data: updatedRules })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/settle', authenticate, requireRole('director', 'manager'), auditLog('settle', 'commission'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, pay } = req.body
    if (!id) {
      res.status(400).json({ success: false, error: '佣金ID为必填项' })
      return
    }

    const commission = db.prepare('SELECT * FROM commissions WHERE id = ?').get(Number(id)) as any
    if (!commission) {
      res.status(404).json({ success: false, error: '佣金记录不存在' })
      return
    }

    if (pay) {
      db.prepare(
        "UPDATE commissions SET status = 'paid', paid_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).run(Number(id))
    } else {
      db.prepare(
        "UPDATE commissions SET status = 'approved' WHERE id = ?"
      ).run(Number(id))
    }

    const updated = db.prepare('SELECT * FROM commissions WHERE id = ?').get(Number(id)) as any
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/summary', authenticate, requireRole('director', 'manager', 'admin', 'platform'), async (req: Request, res: Response): Promise<void> => {
  try {
    const orgFilter = req.user!.role === 'manager'
      ? 'AND co.agent_id IN (SELECT id FROM users WHERE org_id = ?)'
      : ''

    const params: any[] = []
    if (req.user!.role === 'manager') {
      params.push(req.user!.org_id)
    }

    const total = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM commissions co WHERE 1=1 ${orgFilter}`
    ).get(...params) as { total: number }

    const pending = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM commissions co WHERE co.status = 'pending' ${orgFilter}`
    ).get(...params) as { total: number }

    const paid = db.prepare(
      `SELECT COALESCE(SUM(amount), 0) as total FROM commissions co WHERE co.status = 'paid' ${orgFilter}`
    ).get(...params) as { total: number }

    const byMonth = db.prepare(
      `SELECT strftime('%Y-%m', co.created_at) as month,
              COALESCE(SUM(CASE WHEN co.status = 'paid' THEN amount ELSE 0 END), 0) as paid_amount,
              COALESCE(SUM(CASE WHEN co.status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
       FROM commissions co WHERE 1=1 ${orgFilter}
       GROUP BY strftime('%Y-%m', co.created_at)
       ORDER BY month DESC LIMIT 12`
    ).all(...params) as any[]

    res.json({
      success: true,
      data: {
        total: total.total,
        pending: pending.total,
        paid: paid.total,
        byMonth,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
