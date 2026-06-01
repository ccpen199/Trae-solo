import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/overview', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const assetTotal = db.prepare('SELECT COUNT(*) AS count FROM assets').get() as { count: number }
    const assetByType = db.prepare('SELECT type, COUNT(*) AS count FROM assets GROUP BY type').all() as { type: string; count: number }[]
    const assetValuation = db.prepare('SELECT COALESCE(SUM(valuation), 0) AS total FROM assets').get() as { total: number }

    const contractTotal = db.prepare('SELECT COUNT(*) AS count FROM contracts').get() as { count: number }
    const contractByStatus = db.prepare('SELECT status, COUNT(*) AS count FROM contracts GROUP BY status').all() as { status: string; count: number }[]
    const contractExpiring = db.prepare(
      "SELECT COUNT(*) AS count FROM contracts WHERE end_date BETWEEN date('now') AND date('now', '+90 days') AND status = 'active'"
    ).get() as { count: number }

    const revenueReceivable = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM revenues WHERE type = ?'
    ).get('receivable') as { total: number }
    const revenueReceived = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM revenues WHERE type = ?'
    ).get('received') as { total: number }
    const revenueArrears = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM revenues WHERE type = ?'
    ).get('arrears') as { total: number }
    const revenueReduction = db.prepare(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM revenues WHERE type = ?'
    ).get('reduction') as { total: number }

    const decisionTotal = db.prepare('SELECT COUNT(*) AS count FROM decisions').get() as { count: number }
    const decisionByStatus = db.prepare('SELECT status, COUNT(*) AS count FROM decisions GROUP BY status').all() as { status: string; count: number }[]

    const idleAssets = db.prepare(
      "SELECT COUNT(*) AS count FROM assets WHERE status = 'idle'"
    ).get() as { count: number }

    res.json({
      success: true,
      data: {
        assetStats: {
          total: assetTotal.count,
          byType: assetByType,
          totalValuation: assetValuation.total,
          idleCount: idleAssets.count,
        },
        contractStats: {
          total: contractTotal.count,
          byStatus: contractByStatus,
          expiring: contractExpiring.count,
        },
        revenueStats: {
          totalReceivable: revenueReceivable.total,
          totalReceived: revenueReceived.total,
          totalArrears: revenueArrears.total,
          totalReduction: revenueReduction.total,
        },
        decisionStats: {
          total: decisionTotal.count,
          byStatus: decisionByStatus,
        },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/asset-changes', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT strftime('%Y-%m', created_at) AS month, COUNT(*) AS count
      FROM assets
      WHERE created_at >= date('now', '-12 months', 'start of month')
      GROUP BY strftime('%Y-%m', created_at)
      ORDER BY month ASC
    `).all() as { month: string; count: number }[]

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/expiring-contracts', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT c.*, a.name AS asset_name
      FROM contracts c
      JOIN assets a ON c.asset_id = a.id
      WHERE c.end_date BETWEEN date('now') AND date('now', '+90 days')
        AND c.status = 'active'
      ORDER BY c.end_date ASC
    `).all()

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/arrears-risk', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const rows = db.prepare(`
      SELECT r.*, a.name AS asset_name, c.contract_no, c.lessee_name
      FROM revenues r
      JOIN assets a ON r.asset_id = a.id
      JOIN contracts c ON r.contract_id = c.id
      WHERE r.type = 'arrears'
      ORDER BY r.amount DESC
    `).all()

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/revenue-trend', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const latestYear = db.prepare('SELECT MAX(year) AS yr FROM revenues').get() as { yr: number | null }
    const year = latestYear.yr || new Date().getFullYear()
    const rows = db.prepare(`
      SELECT type, strftime('%m', created_at) AS month, SUM(amount) AS total
      FROM revenues
      WHERE year = ?
      GROUP BY type, strftime('%m', created_at)
      ORDER BY month ASC, type
    `).all(year)

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/recent-activities', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const limit = Math.min(Number(req.query.limit) || 20, 50)

    const recentAssets = db.prepare(`
      SELECT id, name, type, status, created_at, updated_at,
        CASE WHEN created_at = updated_at THEN '新增' ELSE '变更' END AS action
      FROM assets
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(limit) as any[]

    const recentContracts = db.prepare(`
      SELECT c.id, c.contract_no, c.type, c.lessee_name, c.status, c.updated_at, a.name AS asset_name,
        CASE WHEN c.created_at = c.updated_at THEN '新增' ELSE '变更' END AS action
      FROM contracts c
      LEFT JOIN assets a ON c.asset_id = a.id
      ORDER BY c.updated_at DESC
      LIMIT ?
    `).all(limit) as any[]

    const recentRevenues = db.prepare(`
      SELECT r.id, r.type, r.amount, r.year, r.period, r.updated_at, a.name AS asset_name, c.contract_no,
        CASE WHEN r.created_at = r.updated_at THEN '新增' ELSE '变更' END AS action
      FROM revenues r
      LEFT JOIN assets a ON r.asset_id = a.id
      LEFT JOIN contracts c ON r.contract_id = c.id
      ORDER BY r.updated_at DESC
      LIMIT ?
    `).all(limit) as any[]

    const recentDecisions = db.prepare(`
      SELECT id, topic, decision_type, status, updated_at,
        CASE WHEN created_at = updated_at THEN '新增' ELSE '变更' END AS action
      FROM decisions
      ORDER BY updated_at DESC
      LIMIT ?
    `).all(limit) as any[]

    const activities: any[] = []

    recentAssets.forEach((r) => {
      activities.push({
        category: 'asset',
        id: r.id,
        title: r.name,
        detail: `${r.action}资产 [${r.type}] 状态: ${r.status}`,
        action: r.action,
        time: r.updated_at,
      })
    })

    recentContracts.forEach((r) => {
      activities.push({
        category: 'contract',
        id: r.id,
        title: r.contract_no,
        detail: `${r.action}合同 ${r.asset_name ? '(' + r.asset_name + ')' : ''} 承租方: ${r.lessee_name || '-'} 状态: ${r.status}`,
        action: r.action,
        time: r.updated_at,
      })
    })

    recentRevenues.forEach((r) => {
      activities.push({
        category: 'revenue',
        id: r.id,
        title: `${r.asset_name || '-'} - ${r.period}`,
        detail: `${r.action}收益 类型: ${r.type} 金额: ¥${r.amount?.toLocaleString()}`,
        action: r.action,
        time: r.updated_at,
      })
    })

    recentDecisions.forEach((r) => {
      activities.push({
        category: 'decision',
        id: r.id,
        title: r.topic,
        detail: `${r.action}议题 类型: ${r.decision_type} 状态: ${r.status}`,
        action: r.action,
        time: r.updated_at,
      })
    })

    activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    activities.splice(limit)

    res.json({ success: true, data: activities })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/abnormal-alerts', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const expiredContracts = db.prepare(`
      SELECT c.id, c.contract_no, c.lessee_name, c.end_date, a.name AS asset_name
      FROM contracts c
      LEFT JOIN assets a ON c.asset_id = a.id
      WHERE c.end_date < date('now') AND c.status = 'active'
      ORDER BY c.end_date ASC
    `).all() as any[]

    const idleAssets = db.prepare(`
      SELECT id, name, type, location, updated_at
      FROM assets WHERE status = 'idle'
      ORDER BY updated_at DESC
    `).all() as any[]

    const largeArrears = db.prepare(`
      SELECT r.id, r.amount, r.year, r.period, a.name AS asset_name, c.contract_no, c.lessee_name
      FROM revenues r
      LEFT JOIN assets a ON r.asset_id = a.id
      LEFT JOIN contracts c ON r.contract_id = c.id
      WHERE r.type = 'arrears' AND r.amount >= 10000
      ORDER BY r.amount DESC
    `).all() as any[]

    const noPaymentContracts = db.prepare(`
      SELECT c.id, c.contract_no, c.lessee_name, c.rent_amount, a.name AS asset_name
      FROM contracts c
      LEFT JOIN assets a ON c.asset_id = a.id
      WHERE c.status = 'active' AND c.id NOT IN (SELECT DISTINCT contract_id FROM revenues WHERE contract_id IS NOT NULL)
      ORDER BY c.rent_amount DESC
    `).all() as any[]

    const alerts: any[] = []

    expiredContracts.forEach((c) => {
      alerts.push({
        level: 'critical',
        category: 'contract',
        type: 'expired',
        id: c.id,
        title: `合同已过期未处理`,
        detail: `合同 ${c.contract_no} (${c.asset_name || '-'}) 已于 ${c.end_date} 到期，承租方: ${c.lessee_name || '-'}`,
      })
    })

    idleAssets.forEach((a) => {
      alerts.push({
        level: 'warning',
        category: 'asset',
        type: 'idle',
        id: a.id,
        title: `资产长期闲置`,
        detail: `${a.name} (${a.type}) 位于 ${a.location || '-'}，当前状态为闲置`,
      })
    })

    largeArrears.forEach((r) => {
      alerts.push({
        level: 'critical',
        category: 'revenue',
        type: 'large_arrears',
        id: r.id,
        title: `大额欠缴风险`,
        detail: `${r.asset_name || '-'} ${r.period} 欠缴 ¥${r.amount?.toLocaleString()}，承租方: ${r.lessee_name || '-'}`,
      })
    })

    noPaymentContracts.forEach((c) => {
      alerts.push({
        level: 'warning',
        category: 'contract',
        type: 'no_payment',
        id: c.id,
        title: `活跃合同无收款记录`,
        detail: `合同 ${c.contract_no} (${c.asset_name || '-'}) 状态为活跃，年租金 ¥${c.rent_amount?.toLocaleString()}，但无收益流水`,
      })
    })

    alerts.sort((a, b) => {
      const levelOrder: Record<string, number> = { critical: 0, warning: 1 }
      return (levelOrder[a.level] ?? 2) - (levelOrder[b.level] ?? 2)
    })

    res.json({ success: true, data: alerts })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.post('/query-log', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { query_type, query_params, queried_by } = req.body

    db.prepare(
      'INSERT INTO query_logs (query_type, query_params, queried_by) VALUES (?, ?, ?)'
    ).run(query_type ?? '', query_params ?? '', queried_by ?? '')

    res.json({ success: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

router.get('/query-logs', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const limit = Math.min(Number(req.query.limit) || 50, 200)
    const rows = db.prepare(
      'SELECT * FROM query_logs ORDER BY created_at DESC LIMIT ?'
    ).all(limit)

    res.json({ success: true, data: rows })
  } catch (error) {
    console.error(error)
    res.status(500).json({ success: false, error: 'Server internal error' })
  }
})

export default router
