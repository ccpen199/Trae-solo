import { Router, type Request, type Response } from 'express'
import dayjs from 'dayjs'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/audits', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { audit_type, target_type } = req.query

    let sql = 'SELECT * FROM audit_records WHERE 1=1'
    const params: any[] = []

    if (audit_type) { sql += ' AND audit_type = ?'; params.push(audit_type as string) }
    if (target_type) { sql += ' AND target_type = ?'; params.push(target_type as string) }

    sql += ' ORDER BY created_at DESC'
    const audits = db.prepare(sql).all(...params)
    res.json({ success: true, data: audits })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/audits', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { audit_type, target_id, target_type, result, details } = req.body

    if (!audit_type) {
      res.status(400).json({ success: false, error: '请提供审核类型' })
      return
    }

    const resultId = db.prepare(`
      INSERT INTO audit_records (auditor_id, audit_type, target_id, target_type, result, details)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, audit_type, target_id || null, target_type || null, result || null, details || null)

    const audit = db.prepare('SELECT * FROM audit_records WHERE id = ?').get(resultId.lastInsertRowid)
    res.status(201).json({ success: true, data: audit, message: '审核记录创建成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/subsidies', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { status, type } = req.query

    let sql = 'SELECT * FROM subsidies WHERE user_id = ?'
    const params: any[] = [userId]

    if (status) { sql += ' AND status = ?'; params.push(status as string) }
    if (type) { sql += ' AND type = ?'; params.push(type as string) }

    sql += ' ORDER BY applied_at DESC'
    const subsidies = db.prepare(sql).all(...params)
    res.json({ success: true, data: subsidies })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/subsidies', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { type, amount, notes } = req.body

    if (!type || !amount) {
      res.status(400).json({ success: false, error: '请提供补贴类型和金额' })
      return
    }

    const result = db.prepare(`
      INSERT INTO subsidies (user_id, type, amount, status, applied_at, notes)
      VALUES (?, ?, ?, 'pending', ?, ?)
    `).run(userId, type, amount, dayjs().format('YYYY-MM-DD HH:mm:ss'), notes || null)

    db.prepare(`
      INSERT INTO audit_records (auditor_id, audit_type, target_id, target_type, result, details)
      VALUES (?, 'subsidy_apply', ?, 'subsidy', 'pending', ?)
    `).run(userId, result.lastInsertRowid, `补贴申请：${type}，金额：${amount}`)

    const subsidy = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: subsidy, message: '补贴申请已提交' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/subsidies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { status, notes } = req.body

    if (!status || !['pending', 'approved', 'disbursed', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

    const subsidy = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(req.params.id) as any
    if (!subsidy) {
      res.status(404).json({ success: false, error: '补贴申请不存在' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')
    const updates: string[] = ['status = ?']
    const values: any[] = [status]

    if (status === 'approved') { updates.push('approved_at = ?'); values.push(now) }
    if (status === 'disbursed') { updates.push('disbursed_at = ?'); values.push(now) }
    if (notes) { updates.push('notes = ?'); values.push(notes) }

    values.push(req.params.id)
    db.prepare(`UPDATE subsidies SET ${updates.join(', ')} WHERE id = ?`).run(...values)

    const resultStr = status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : status
    db.prepare(`
      INSERT INTO audit_records (auditor_id, audit_type, target_id, target_type, result, details)
      VALUES (?, 'subsidy_audit', ?, 'subsidy', ?, ?)
    `).run(userId, req.params.id, resultStr, notes || `补贴状态更新为${status}`)

    const updated = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated, message: `补贴状态已更新为${status}` })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/green-rights', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { status, type } = req.query

    let sql = 'SELECT * FROM green_rights WHERE user_id = ?'
    const params: any[] = [userId]

    if (status) { sql += ' AND status = ?'; params.push(status as string) }
    if (type) { sql += ' AND type = ?'; params.push(type as string) }

    sql += ' ORDER BY issued_at DESC'
    const rights = db.prepare(sql).all(...params)

    const summary = db.prepare(`
      SELECT
        type, status,
        SUM(value) as total_value,
        COUNT(*) as count
      FROM green_rights WHERE user_id = ?
      GROUP BY type, status
    `).all(userId)

    res.json({ success: true, data: { records: rights, summary } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/green-rights', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const { type, value, source, expired_at } = req.body

    if (!type || !value) {
      res.status(400).json({ success: false, error: '请提供权益类型和数量' })
      return
    }

    const result = db.prepare(`
      INSERT INTO green_rights (user_id, type, value, source, status, issued_at, expired_at)
      VALUES (?, ?, ?, ?, 'issued', ?, ?)
    `).run(userId, type, value, source || null, dayjs().format('YYYY-MM-DD HH:mm:ss'),
      expired_at || dayjs().add(1, 'year').format('YYYY-MM-DD HH:mm:ss'))

    const right = db.prepare('SELECT * FROM green_rights WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: right, message: '绿色权益已发放' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/price-audit', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user

    const baseQuery = user.role === 'admin' ? `
      SELECT 
        eb.id, eb.user_id, u.username, u.real_name, u.customer_type,
        eb.billing_period, eb.total_kwh, eb.total_amount,
        eb.peak_kwh, eb.peak_amount,
        eb.valley_kwh, eb.valley_amount,
        eb.flat_kwh, eb.flat_amount,
        (eb.total_amount / eb.total_kwh) as avg_price,
        pt.peak_price, pt.valley_price, pt.flat_price
      FROM electricity_bills eb
      JOIN users u ON eb.user_id = u.id
      JOIN (
        SELECT customer_type, 
               MAX(CASE WHEN period_type = 'peak' THEN price_per_kwh END) as peak_price,
               MAX(CASE WHEN period_type = 'valley' THEN price_per_kwh END) as valley_price,
               MAX(CASE WHEN period_type = 'flat' THEN price_per_kwh END) as flat_price
        FROM price_tariffs WHERE effective_to IS NULL
        GROUP BY customer_type
      ) pt ON u.customer_type = pt.customer_type
      WHERE eb.total_kwh > 0
      ORDER BY eb.billing_period DESC
      LIMIT 50
    ` : `
      SELECT 
        eb.id, eb.billing_period, eb.total_kwh, eb.total_amount,
        eb.peak_kwh, eb.peak_amount,
        eb.valley_kwh, eb.valley_amount,
        eb.flat_kwh, eb.flat_amount,
        (eb.total_amount / eb.total_kwh) as avg_price,
        pt.peak_price, pt.valley_price, pt.flat_price
      FROM electricity_bills eb
      JOIN users u ON eb.user_id = u.id
      JOIN (
        SELECT customer_type, 
               MAX(CASE WHEN period_type = 'peak' THEN price_per_kwh END) as peak_price,
               MAX(CASE WHEN period_type = 'valley' THEN price_per_kwh END) as valley_price,
               MAX(CASE WHEN period_type = 'flat' THEN price_per_kwh END) as flat_price
        FROM price_tariffs WHERE effective_to IS NULL
        GROUP BY customer_type
      ) pt ON u.customer_type = pt.customer_type
      WHERE eb.user_id = ? AND eb.total_kwh > 0
      ORDER BY eb.billing_period DESC
      LIMIT 12
    `

    const bills = user.role === 'admin' 
      ? db.prepare(baseQuery).all() 
      : db.prepare(baseQuery).all(userId)

    const auditResults = bills.map((b: any) => {
      const expectedAmount = b.peak_kwh * b.peak_price + b.valley_kwh * b.valley_price + b.flat_kwh * b.flat_price
      const diffAmount = b.total_amount - expectedAmount
      const diffPercent = expectedAmount > 0 ? (diffAmount / expectedAmount * 100).toFixed(2) : '0'

      const priceChecks = [
        {
          type: 'peak',
          actual: b.peak_kwh > 0 ? b.peak_amount / b.peak_kwh : 0,
          standard: b.peak_price,
          normal: b.peak_kwh === 0 || Math.abs((b.peak_amount / b.peak_kwh) - b.peak_price) < b.peak_price * 0.01,
          diff: b.peak_kwh > 0 ? b.peak_amount - b.peak_kwh * b.peak_price : 0
        },
        {
          type: 'valley',
          actual: b.valley_kwh > 0 ? b.valley_amount / b.valley_kwh : 0,
          standard: b.valley_price,
          normal: b.valley_kwh === 0 || Math.abs((b.valley_amount / b.valley_kwh) - b.valley_price) < b.valley_price * 0.01,
          diff: b.valley_kwh > 0 ? b.valley_amount - b.valley_kwh * b.valley_price : 0
        },
        {
          type: 'flat',
          actual: b.flat_kwh > 0 ? b.flat_amount / b.flat_kwh : 0,
          standard: b.flat_price,
          normal: b.flat_kwh === 0 || Math.abs((b.flat_amount / b.flat_kwh) - b.flat_price) < b.flat_price * 0.01,
          diff: b.flat_kwh > 0 ? b.flat_amount - b.flat_kwh * b.flat_price : 0
        }
      ]

      const allNormal = priceChecks.every(c => c.normal)
      const abnormalItems = priceChecks.filter(c => !c.normal)

      return {
        ...b,
        expectedAmount: parseFloat(expectedAmount.toFixed(2)),
        diffAmount: parseFloat(diffAmount.toFixed(2)),
        diffPercent: parseFloat(diffPercent),
        priceChecks,
        status: allNormal ? 'normal' : Math.abs(diffAmount) < 1 ? 'warning' : 'abnormal',
        abnormalCount: abnormalItems.length,
        abnormalDetails: abnormalItems.map(a => {
          const labels: any = { peak: '峰时', valley: '谷时', flat: '平时' }
          return `${labels[a.type]}电价异常：标准${a.standard}元，实际${a.actual.toFixed(4)}元，差额${a.diff.toFixed(2)}元`
        })
      }
    })

    const summary = {
      totalBills: auditResults.length,
      normalCount: auditResults.filter(r => r.status === 'normal').length,
      warningCount: auditResults.filter(r => r.status === 'warning').length,
      abnormalCount: auditResults.filter(r => r.status === 'abnormal').length,
      totalDiff: parseFloat(auditResults.reduce((s: number, r: any) => s + r.diffAmount, 0).toFixed(2))
    }

    res.json({
      success: true,
      data: {
        auditResults: auditResults,
        anomalyCount: auditResults.filter(r => r.status === 'abnormal').length,
        totalDeviation: parseFloat(auditResults.reduce((s: number, r: any) => s + r.diffAmount, 0).toFixed(2)),
        summary
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/subsidies/:id/timeline', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user

    const subsidy = db.prepare('SELECT * FROM subsidies WHERE id = ?').get(req.params.id) as any
    if (!subsidy) {
      res.status(404).json({ success: false, error: '补贴申请不存在' })
      return
    }

    if (user.role !== 'admin' && subsidy.user_id !== userId) {
      res.status(403).json({ success: false, error: '无权查看此申请' })
      return
    }

    let timeline: Record<string, string> = {}
    if (subsidy.timeline) {
      try {
        timeline = JSON.parse(subsidy.timeline)
      } catch {
        timeline = {}
      }
    }

    const timelineEvents: any[] = []

    if (timeline.submitted) {
      timelineEvents.push({
        status: 'submitted',
        label: '提交申请',
        time: timeline.submitted,
        description: '用户提交补贴申请，等待审核',
        completed: true
      })
    }

    if (timeline.reviewed) {
      timelineEvents.push({
        status: 'reviewed',
        label: '材料审核',
        time: timeline.reviewed,
        description: '工作人员审核申请材料完整性',
        completed: true
      })
    }

    if (timeline.approved) {
      timelineEvents.push({
        status: 'approved',
        label: '审批通过',
        time: timeline.approved,
        description: '补贴申请已通过审批，等待发放',
        completed: true
      })
    }

    if (timeline.notified) {
      timelineEvents.push({
        status: 'notified',
        label: '用户通知',
        time: timeline.notified,
        description: '已通知用户审批结果',
        completed: true
      })
    }

    if (timeline.disbursed) {
      timelineEvents.push({
        status: 'disbursed',
        label: '资金发放',
        time: timeline.disbursed,
        description: '补贴资金已发放至用户账户',
        completed: true
      })
    }

    if (timeline.completed) {
      timelineEvents.push({
        status: 'completed',
        label: '流程完成',
        time: timeline.completed,
        description: '补贴发放完成，流程归档',
        completed: true
      })
    }

    if (timeline.rejected) {
      timelineEvents.push({
        status: 'rejected',
        label: '申请驳回',
        time: timeline.rejected,
        description: subsidy.notes || '申请材料不符合要求，已驳回',
        completed: true
      })
    }

    const statusLabels: any = {
      pending: '待审核',
      approved: '已审批',
      disbursed: '已发放',
      rejected: '已驳回'
    }

    res.json({
      success: true,
      data: {
        subsidy: {
          ...subsidy,
          statusLabel: statusLabels[subsidy.status] || subsidy.status
        },
        timeline: timelineEvents,
        progress: Math.round((timelineEvents.filter(e => e.completed).length / 6) * 100)
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/green-rights/:id/trace', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const user = (req as any).user

    const right = db.prepare('SELECT * FROM green_rights WHERE id = ?').get(req.params.id) as any
    if (!right) {
      res.status(404).json({ success: false, error: '绿色权益不存在' })
      return
    }

    if (user.role !== 'admin' && right.user_id !== userId) {
      res.status(403).json({ success: false, error: '无权查看此权益' })
      return
    }

    const traces = db.prepare(`
      SELECT grt.*, u.real_name as operator_name
      FROM green_rights_trace grt
      LEFT JOIN users u ON grt.operator_id = u.id
      WHERE grt.right_id = ?
      ORDER BY grt.created_at ASC
    `).all(req.params.id)

    const statusLabels: any = {
      issued: '已发放',
      used: '已使用',
      expired: '已过期'
    }

    const actionLabels: any = {
      issued: '权益发放',
      redeemed: '申请核销',
      approved: '核销通过',
      rejected: '核销驳回',
      expired: '权益过期',
      transferred: '权益转让'
    }

    res.json({
      success: true,
      data: {
        right: {
          ...right,
          statusLabel: statusLabels[right.status] || right.status
        },
        trace: traces.map((t: any) => ({
          ...t,
          actionLabel: actionLabels[t.action] || t.action
        }))
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/green-rights/:id/redeem', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id
    const rightId = req.params.id

    const right = db.prepare('SELECT * FROM green_rights WHERE id = ? AND user_id = ?').get(rightId, userId) as any
    if (!right) {
      res.status(404).json({ success: false, error: '绿色权益不存在或无权操作' })
      return
    }

    if (right.status !== 'issued') {
      res.status(400).json({ success: false, error: '此权益状态不可核销' })
      return
    }

    const now = dayjs().format('YYYY-MM-DD HH:mm:ss')

    db.prepare("UPDATE green_rights SET status = 'used', used_at = ? WHERE id = ?").run(now, rightId)

    db.prepare(`
      INSERT INTO green_rights_trace (right_id, action, operator_id, details)
      VALUES (?, 'redeemed', ?, ?)
    `).run(rightId, userId, '用户申请核销绿色权益，用于抵扣电费')

    db.prepare(`
      INSERT INTO points_transactions (user_id, type, amount, source, description)
      VALUES (?, 'earn', ?, 'green_rights', ?)
    `).run(userId, Math.floor(right.value), `绿色权益核销奖励`)

    db.prepare('UPDATE users SET points_balance = points_balance + ? WHERE id = ?').run(Math.floor(right.value), userId)

    res.json({ success: true, message: '绿色权益核销成功，积分已到账' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
