import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { randomUUID } from 'crypto'

const router = Router()

router.get('/suppliers', (req: Request, res: Response): void => {
  try {
    const { status, category } = req.query
    let sql = 'SELECT * FROM supplier WHERE 1=1'
    const params: any[] = []

    if (status) {
      sql += ' AND status = ?'
      params.push(status)
    }
    if (category) {
      sql += ' AND category = ?'
      params.push(category)
    }
    sql += ' ORDER BY score DESC'

    const suppliers = db.prepare(sql).all(...params) as any[]
    const assessStmt = db.prepare('SELECT * FROM supplier_assessment WHERE supplier_id = ? ORDER BY date DESC')

    const result = suppliers.map(s => {
      const assessments = assessStmt.all(s.id) as any[]
      return {
        id: s.id,
        name: s.name,
        category: s.category,
        status: s.status,
        score: s.score,
        contact: s.contact,
        description: s.description,
        createdAt: s.created_at,
        assessmentHistory: assessments.map(a => ({
          id: a.id,
          score: a.score,
          comment: a.comment,
          assessor: a.assessor,
          date: a.date,
        })),
      }
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/suppliers', (req: Request, res: Response): void => {
  try {
    const { name, category, contact, description } = req.body
    if (!name || !category) {
      res.status(400).json({ success: false, message: '请填写供应商名称和类别' })
      return
    }

    const id = `sup-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO supplier (id, name, category, status, score, contact, description) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(id, name, category, 'applying', 0, contact || '', description || '')

    res.json({ success: true, data: { id }, message: '供应商申请已提交' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/suppliers/:id/approve', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const supplier = db.prepare('SELECT * FROM supplier WHERE id = ?').get(id) as any
    if (!supplier) {
      res.status(404).json({ success: false, message: '供应商不存在' })
      return
    }

    db.prepare("UPDATE supplier SET status = 'approved' WHERE id = ?").run(id)
    res.json({ success: true, message: '供应商已准入' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/suppliers/:id/assess', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { score, comment, assessor } = req.body
    if (score === undefined || !assessor) {
      res.status(400).json({ success: false, message: '请提供评分和评估人' })
      return
    }

    const supplier = db.prepare('SELECT * FROM supplier WHERE id = ?').get(id) as any
    if (!supplier) {
      res.status(404).json({ success: false, message: '供应商不存在' })
      return
    }

    const assessId = `sa-${randomUUID().slice(0, 8)}`
    const date = new Date().toISOString().slice(0, 10)

    db.transaction(() => {
      db.prepare('INSERT INTO supplier_assessment (id, supplier_id, score, comment, assessor, date) VALUES (?, ?, ?, ?, ?, ?)')
        .run(assessId, id, score, comment || '', assessor, date)

      const avgResult = db.prepare('SELECT AVG(score) as avg_score FROM supplier_assessment WHERE supplier_id = ?').get(id) as any
      db.prepare('UPDATE supplier SET score = ? WHERE id = ?').run(Math.round(avgResult.avg_score * 10) / 10, id)
    })()

    res.json({ success: true, message: '考核评分已添加' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/analytics/funnel', (_req: Request, res: Response): void => {
  try {
    const totalMembers = (db.prepare("SELECT COUNT(*) as count FROM member WHERE status = 'active'").get() as any).count
    const voucherIssued = (db.prepare('SELECT COUNT(*) as count FROM voucher').get() as any).count
    const voucherUsed = (db.prepare("SELECT COUNT(*) as count FROM voucher WHERE status = 'used'").get() as any).count
    const pointsExchanged = (db.prepare('SELECT COUNT(*) as count FROM points_order').get() as any).count
    const bookingCount = (db.prepare('SELECT COUNT(*) as count FROM booking').get() as any).count

    const funnel = [
      { stage: '注册会员', count: totalMembers, rate: 1.0 },
      { stage: '领取福利', count: voucherIssued, rate: totalMembers > 0 ? +(voucherIssued / totalMembers).toFixed(2) : 0 },
      { stage: '使用福利', count: voucherUsed, rate: voucherIssued > 0 ? +(voucherUsed / voucherIssued).toFixed(2) : 0 },
      { stage: '积分兑换', count: pointsExchanged, rate: totalMembers > 0 ? +(pointsExchanged / totalMembers).toFixed(2) : 0 },
      { stage: '服务预约', count: bookingCount, rate: totalMembers > 0 ? +(bookingCount / totalMembers).toFixed(2) : 0 },
    ]

    res.json({ success: true, data: funnel })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/analytics/member-stats', (_req: Request, res: Response): void => {
  try {
    const totalMembers = (db.prepare('SELECT COUNT(*) as count FROM member').get() as any).count
    const activeMembers = (db.prepare("SELECT COUNT(*) as count FROM member WHERE status = 'active'").get() as any).count
    const newMembersThisMonth = (db.prepare("SELECT COUNT(*) as count FROM member WHERE join_date >= date('now', 'start of month')").get() as any).count
    const membersWithVoucher = (db.prepare('SELECT COUNT(DISTINCT member_id) as count FROM voucher').get() as any).count
    const benefitCoverageRate = activeMembers > 0 ? +(membersWithVoucher / activeMembers).toFixed(2) : 0

    res.json({
      success: true,
      data: {
        totalMembers,
        activeMembers,
        newMembersThisMonth,
        benefitCoverageRate,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.get('/analytics/trends', (_req: Request, res: Response): void => {
  const months = ['2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06']
  const data = months.map((month, i) => ({
    month,
    newMembers: [5, 3, 4, 2, 6, 3][i],
    activeMembers: [15, 17, 19, 20, 22, 18][i],
    vouchersIssued: [12, 8, 5, 10, 6, 4][i],
    vouchersUsed: [8, 10, 4, 7, 5, 3][i],
    pointsExchanged: [6, 4, 3, 8, 5, 2][i],
    totalAmount: [25000, 18000, 12000, 30000, 15000, 10000][i],
  }))

  res.json({ success: true, data })
})

router.get('/recommendations', (_req: Request, res: Response): void => {
  try {
    const rules = db.prepare('SELECT * FROM recommendation_rule ORDER BY priority DESC').all() as any[]
    res.json({
      success: true,
      data: rules.map(r => ({
        id: r.id,
        name: r.name,
        conditions: JSON.parse(r.conditions_json),
        benefitIds: JSON.parse(r.benefit_ids_json),
        priority: r.priority,
        enabled: !!r.enabled,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.post('/recommendations', (req: Request, res: Response): void => {
  try {
    const { name, conditions, benefitIds, priority } = req.body
    if (!name || !conditions || !benefitIds) {
      res.status(400).json({ success: false, message: '请填写完整的推荐规则' })
      return
    }

    const id = `rr-${randomUUID().slice(0, 8)}`
    db.prepare('INSERT INTO recommendation_rule (id, name, conditions_json, benefit_ids_json, priority, enabled) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, name, JSON.stringify(conditions), JSON.stringify(benefitIds), priority || 0, 1)

    res.json({ success: true, data: { id }, message: '推荐规则创建成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

router.put('/recommendations/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const { name, conditions, benefitIds, priority, enabled } = req.body

    const rule = db.prepare('SELECT * FROM recommendation_rule WHERE id = ?').get(id) as any
    if (!rule) {
      res.status(404).json({ success: false, message: '推荐规则不存在' })
      return
    }

    const updates: string[] = []
    const params: any[] = []

    if (name !== undefined) { updates.push('name = ?'); params.push(name) }
    if (conditions !== undefined) { updates.push('conditions_json = ?'); params.push(JSON.stringify(conditions)) }
    if (benefitIds !== undefined) { updates.push('benefit_ids_json = ?'); params.push(JSON.stringify(benefitIds)) }
    if (priority !== undefined) { updates.push('priority = ?'); params.push(priority) }
    if (enabled !== undefined) { updates.push('enabled = ?'); params.push(enabled ? 1 : 0) }

    if (updates.length === 0) {
      res.status(400).json({ success: false, message: '没有需要更新的字段' })
      return
    }

    params.push(id)
    db.prepare(`UPDATE recommendation_rule SET ${updates.join(', ')} WHERE id = ?`).run(...params)

    res.json({ success: true, message: '推荐规则更新成功' })
  } catch (error) {
    res.status(500).json({ success: false, message: '服务器内部错误' })
  }
})

export default router
