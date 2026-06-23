import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const status = req.query.status as string
    const type = req.query.type as string
    const severity = req.query.severity as string
    const userId = req.query.userId as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (status) {
      whereClauses.push('w.status = @status')
      params.status = status
    }
    if (type) {
      whereClauses.push('w.type = @type')
      params.type = type
    }
    if (severity) {
      whereClauses.push('w.severity = @severity')
      params.severity = severity
    }
    if (userId) {
      whereClauses.push('w.user_id = @userId')
      params.userId = userId
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM warning_events w ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT w.*, u.name as user_name, u.account_no, u.address
      FROM warning_events w
      LEFT JOIN users u ON w.user_id = u.id
      ${whereClause}
      ORDER BY w.detected_at DESC
      LIMIT @limit OFFSET @offset
    `)
    const warnings = listStmt.all({ ...params, limit: pageSize, offset })

    res.json({
      success: true,
      data: {
        list: warnings,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取预警列表失败',
    })
  }
})

router.get('/rules', (req: Request, res: Response): void => {
  try {
    const enabled = req.query.enabled as string

    let whereClause = ''
    const params: Record<string, unknown> = {}

    if (enabled !== undefined) {
      whereClause = 'WHERE enabled = @enabled'
      params.enabled = enabled === 'true' ? 1 : 0
    }

    const stmt = db.prepare(`SELECT * FROM warning_rules ${whereClause} ORDER BY severity DESC`)
    const rules = stmt.all(params)

    res.json({
      success: true,
      data: rules,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取预警规则失败',
    })
  }
})

router.post('/rules', (req: Request, res: Response): void => {
  try {
    const { id, name, type, threshold, unit, severity, auto_create_work_order, auto_outbound_call, enabled } = req.body

    if (!name || !type || threshold === undefined || !unit || !severity) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    if (id) {
      const checkStmt = db.prepare('SELECT id FROM warning_rules WHERE id = ?')
      const existing = checkStmt.get(id)
      if (!existing) {
        res.status(404).json({
          success: false,
          error: '规则不存在',
        })
        return
      }

      const updateStmt = db.prepare(`
        UPDATE warning_rules SET
          name = @name,
          type = @type,
          threshold = @threshold,
          unit = @unit,
          severity = @severity,
          auto_create_work_order = @auto_create_work_order,
          auto_outbound_call = @auto_outbound_call,
          enabled = @enabled
        WHERE id = @id
      `)
      updateStmt.run({
        id,
        name,
        type,
        threshold,
        unit,
        severity,
        auto_create_work_order: auto_create_work_order ? 1 : 0,
        auto_outbound_call: auto_outbound_call ? 1 : 0,
        enabled: enabled !== undefined ? (enabled ? 1 : 0) : 1,
      })

      const rule = checkStmt.get(id)
      res.json({
        success: true,
        data: rule,
      })
    } else {
      const newId = generateId('rule')

      const insertStmt = db.prepare(`
        INSERT INTO warning_rules (id, name, type, threshold, unit, severity, auto_create_work_order, auto_outbound_call, enabled)
        VALUES (@id, @name, @type, @threshold, @unit, @severity, @auto_create_work_order, @auto_outbound_call, @enabled)
      `)
      insertStmt.run({
        id: newId,
        name,
        type,
        threshold,
        unit,
        severity,
        auto_create_work_order: auto_create_work_order ? 1 : 0,
        auto_outbound_call: auto_outbound_call ? 1 : 0,
        enabled: enabled !== undefined ? (enabled ? 1 : 0) : 1,
      })

      const stmt = db.prepare('SELECT * FROM warning_rules WHERE id = ?')
      const rule = stmt.get(newId)

      res.json({
        success: true,
        data: rule,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '保存预警规则失败',
    })
  }
})

router.post('/:id/acknowledge', (req: Request, res: Response): void => {
  try {
    const { id } = req.params

    const checkStmt = db.prepare('SELECT * FROM warning_events WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '预警不存在',
      })
      return
    }

    if ((existing as { status: string }).status !== 'active') {
      res.status(400).json({
        success: false,
        error: '预警状态不可确认',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE warning_events SET status = 'acknowledged' WHERE id = ?
    `)
    updateStmt.run(id)

    const warning = checkStmt.get(id)

    res.json({
      success: true,
      data: warning,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '确认预警失败',
    })
  }
})

router.post('/:id/resolve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { work_order_id } = req.body

    const checkStmt = db.prepare('SELECT * FROM warning_events WHERE id = ?')
    const existing = checkStmt.get(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '预警不存在',
      })
      return
    }

    const updateStmt = db.prepare(`
      UPDATE warning_events SET status = 'resolved', work_order_id = ? WHERE id = ?
    `)
    updateStmt.run(work_order_id || null, id)

    const warning = checkStmt.get(id)

    res.json({
      success: true,
      data: warning,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '解决预警失败',
    })
  }
})

router.post('/detect', (req: Request, res: Response): void => {
  try {
    const rulesStmt = db.prepare('SELECT * FROM warning_rules WHERE enabled = 1')
    const rules = rulesStmt.all() as Array<{ id: string; type: string; name: string; severity: string; threshold: number; unit: string }>

    const userStmt = db.prepare('SELECT id, name FROM users WHERE status = ?')
    const users = userStmt.all('active') as Array<{ id: string; name: string }>

    const insertWarning = db.prepare(`
      INSERT INTO warning_events (id, user_id, type, severity, message, trigger_rule, detected_at, status, outbound_call_made, outbound_call_result, work_order_id)
      VALUES (@id, @user_id, @type, @severity, @message, @trigger_rule, @detected_at, 'active', 0, NULL, NULL)
    `)

    const detectedWarnings: Array<Record<string, unknown>> = []
    const now = new Date().toISOString().replace('T', ' ').split('.')[0]

    const numDetections = 2 + Math.floor(Math.random() * 3)
    const shuffledUsers = [...users].sort(() => Math.random() - 0.5)

    for (let i = 0; i < Math.min(numDetections, shuffledUsers.length); i++) {
      const user = shuffledUsers[i]
      const rule = rules[Math.floor(Math.random() * rules.length)]

      const messages: Record<string, string> = {
        zero_usage: `用户已连续${rule.threshold}日零用气，请关注`,
        spike: `用户本期用量环比增长${rule.threshold}%，存在异常`,
        leak_suspect: `用户用量突增${rule.threshold}%以上，疑似燃气泄漏`,
        high_usage: `用户月用气量已超${rule.threshold}${rule.unit}`,
      }

      const warningId = generateId('warning')
      insertWarning.run({
        id: warningId,
        user_id: user.id,
        type: rule.type,
        severity: rule.severity,
        message: messages[rule.type] || rule.name,
        trigger_rule: rule.id,
        detected_at: now,
      })

      detectedWarnings.push({
        id: warningId,
        user_id: user.id,
        user_name: user.name,
        type: rule.type,
        severity: rule.severity,
        message: messages[rule.type] || rule.name,
        trigger_rule: rule.id,
        detected_at: now,
      })
    }

    res.json({
      success: true,
      data: {
        detected: detectedWarnings.length,
        warnings: detectedWarnings,
        mock: true,
        detected_at: now,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'AI检测失败',
    })
  }
})

export default router
