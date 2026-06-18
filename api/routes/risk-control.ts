import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/warnings', (req: Request, res: Response): void => {
  const db = getDb()
  const { status, severity, page = '1', pageSize = '10' } = req.query

  let sql = `SELECT rw.*, rcr.name as rule_name, u.name as user_name
    FROM risk_warning rw
    LEFT JOIN risk_control_rule rcr ON rw.rule_id = rcr.id
    LEFT JOIN user u ON rw.user_id = u.id
    WHERE 1=1`
  const params: string[] = []

  if (status) {
    sql += ' AND rw.status = ?'
    params.push(status as string)
  }
  if (severity) {
    sql += ' AND rw.severity = ?'
    params.push(severity as string)
  }

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' ORDER BY rw.created_at DESC LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const warnings = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      warnings
    }
  })
})

router.put('/warnings/:id/handle', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params
  const { handlerId, handleResult, status } = req.body

  if (!handlerId || !handleResult) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const warning = db.prepare('SELECT * FROM risk_warning WHERE id = ?').get(id)
  if (!warning) {
    res.status(404).json({ success: false, error: '预警记录不存在' })
    return
  }

  db.prepare(`
    UPDATE risk_warning SET handler_id = ?, handled_at = datetime('now'), handle_result = ?, status = ?
    WHERE id = ?
  `).run(handlerId, handleResult, status || 'handled', id)

  res.json({
    success: true,
    data: { id, status: status || 'handled', handlerId, handleResult }
  })
})

router.get('/rules', (req: Request, res: Response): void => {
  const db = getDb()
  const { type, enabled } = req.query

  let sql = 'SELECT * FROM risk_control_rule WHERE 1=1'
  const params: string[] = []

  if (type) {
    sql += ' AND type = ?'
    params.push(type as string)
  }
  if (enabled !== undefined) {
    sql += ' AND enabled = ?'
    params.push(enabled as string)
  }

  sql += ' ORDER BY created_at DESC'

  const rules = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: rules
  })
})

router.post('/rules', (req: Request, res: Response): void => {
  const db = getDb()
  const { name, type, severity, conditionExpr, action, enabled } = req.body

  if (!name || !type || !severity || !action) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const id = randomUUID()
  db.prepare(`
    INSERT INTO risk_control_rule (id, name, type, severity, condition_expr, action, enabled)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, severity, conditionExpr || null, action, enabled !== undefined ? (enabled ? 1 : 0) : 1)

  res.json({
    success: true,
    data: { id, name, type, severity, action }
  })
})

router.put('/rules/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params
  const { name, type, severity, conditionExpr, action, enabled } = req.body

  const rule = db.prepare('SELECT * FROM risk_control_rule WHERE id = ?').get(id)
  if (!rule) {
    res.status(404).json({ success: false, error: '规则不存在' })
    return
  }

  const updates: string[] = []
  const params: any[] = []

  if (name !== undefined) { updates.push('name = ?'); params.push(name) }
  if (type !== undefined) { updates.push('type = ?'); params.push(type) }
  if (severity !== undefined) { updates.push('severity = ?'); params.push(severity) }
  if (conditionExpr !== undefined) { updates.push('condition_expr = ?'); params.push(conditionExpr) }
  if (action !== undefined) { updates.push('action = ?'); params.push(action) }
  if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled ? 1 : 0) }

  if (updates.length === 0) {
    res.status(400).json({ success: false, error: '没有需要更新的字段' })
    return
  }

  params.push(id)
  db.prepare(`UPDATE risk_control_rule SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  res.json({ success: true, data: { id } })
})

router.delete('/rules/:id', (req: Request, res: Response): void => {
  const db = getDb()
  const { id } = req.params

  const rule = db.prepare('SELECT * FROM risk_control_rule WHERE id = ?').get(id)
  if (!rule) {
    res.status(404).json({ success: false, error: '规则不存在' })
    return
  }

  db.prepare('DELETE FROM risk_control_rule WHERE id = ?').run(id)

  res.json({ success: true, data: { id } })
})

router.post('/verify-benefit', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId, applicationType, amount } = req.body

  if (!userId || !applicationType || !amount) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const rules = db.prepare("SELECT * FROM risk_control_rule WHERE enabled = 1").all() as any[]

  const results: any[] = []
  let passed = true

  for (const rule of rules) {
    let triggered = false
    let detail = ''

    switch (rule.type) {
      case 'duplicate_application': {
        const existing = db.prepare("SELECT * FROM benefit_application WHERE user_id = ? AND application_type = ? AND status IN ('pending', 'approved') AND created_at > datetime('now', '-30 days')").get(userId, applicationType)
        if (existing) {
          triggered = true
          detail = '30天内存在重复申领'
        }
        break
      }
      case 'abnormal_amount': {
        if (amount > 10000) {
          triggered = true
          detail = `申领金额${amount}元超过阈值`
        }
        break
      }
      case 'identity_mismatch': {
        const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId) as any
        if (user && !user.real_name_verified) {
          triggered = true
          detail = '用户未完成实名认证'
        }
        break
      }
      default:
        break
    }

    if (triggered) {
      passed = rule.action !== 'block'
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        action: rule.action,
        triggered: true,
        detail
      })
    }
  }

  res.json({
    success: true,
    data: {
      passed,
      results,
      verifyTime: new Date().toISOString()
    }
  })
})

export default router
