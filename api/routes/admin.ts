import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../db.js'

const router = Router()

function dashboardPayload() {
  try {
    const totalUsers = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count
    const totalStations = (db.prepare('SELECT COUNT(*) as count FROM charging_stations').get() as any).count
    const totalPiles = (db.prepare('SELECT COUNT(*) as count FROM charging_piles').get() as any).count
    const availablePiles = (db.prepare("SELECT COUNT(*) as count FROM charging_piles WHERE status = '空闲'").get() as any).count
    const totalOrders = (db.prepare('SELECT COUNT(*) as count FROM charging_orders').get() as any).count
    const activeOrders = (db.prepare("SELECT COUNT(*) as count FROM charging_orders WHERE status = '充电中'").get() as any).count
    const completedOrders = (db.prepare("SELECT COUNT(*) as count FROM charging_orders WHERE status = '已完成'").get() as any).count
    const totalRevenue = (db.prepare("SELECT COALESCE(SUM(cost), 0) as total FROM charging_orders WHERE status = '已完成'").get() as any).total
    const totalChargedKwh = (db.prepare("SELECT COALESCE(SUM(charged_kwh), 0) as total FROM charging_orders WHERE status = '已完成'").get() as any).total
    const totalOperators = (db.prepare('SELECT COUNT(*) as count FROM operators').get() as any).count

    const operatorStats = db.prepare(`
      SELECT o.name, COUNT(cs.id) as station_count
      FROM operators o
      LEFT JOIN charging_stations cs ON o.id = cs.operator_id
      GROUP BY o.id
    `).all()

    const recentOrders = db.prepare(`
      SELECT co.*, u.nickname, cs.name as station_name, cp.code as pile_code
      FROM charging_orders co
      JOIN users u ON co.user_id = u.id
      JOIN charging_stations cs ON co.station_id = cs.id
      JOIN charging_piles cp ON co.pile_id = cp.id
      ORDER BY co.created_at DESC LIMIT 5
    `).all()

    const alerts = db.prepare(`
      SELECT cp.code as id, cs.name as station, cp.status as type, cp.created_at as time,
        CASE WHEN cp.status = '故障' THEN '未处理' ELSE '处理中' END as status
      FROM charging_piles cp
      JOIN charging_stations cs ON cp.station_id = cs.id
      WHERE cp.status IN ('故障', '充电中')
      ORDER BY cp.created_at DESC LIMIT 8
    `).all()

    const stationOrders = db.prepare(`
      SELECT cs.name, COUNT(co.id) as orders
      FROM charging_stations cs
      LEFT JOIN charging_orders co ON co.station_id = cs.id
      GROUP BY cs.id
      ORDER BY orders DESC LIMIT 10
    `).all()

    const onlinePiles = totalPiles - (db.prepare("SELECT COUNT(*) as count FROM charging_piles WHERE status = '离线'").get() as any).count
    const utilization = totalPiles > 0 ? +((totalPiles - availablePiles) / totalPiles * 100).toFixed(1) : 0
    const onlineRate = totalPiles > 0 ? +((onlinePiles / totalPiles) * 100).toFixed(1) : 0

    return {
      success: true,
      kpi: { onlineRate, utilization, todayRevenue: +Number(totalRevenue).toFixed(2) },
      stats: {
        onlinePiles,
        totalPiles,
        charging: activeOrders,
        chargingPiles: activeOrders,
        faultPiles: totalPiles - availablePiles - activeOrders > 0 ? totalPiles - availablePiles - activeOrders : 0,
        todayOrders: totalOrders,
      },
      alerts,
      stationOrders,
      data: {
        overview: { totalUsers, totalStations, totalPiles, availablePiles, totalOrders, activeOrders, completedOrders, totalRevenue: +totalRevenue.toFixed(2), totalChargedKwh: +totalChargedKwh.toFixed(2), totalOperators, utilizationRate: utilization },
        operatorStats,
        recentOrders,
      },
    }
  } catch (error) {
    return { success: false, error: (error as Error).message }
  }
}

router.get('/dashboard', (req: Request, res: Response): void => {
  const payload = dashboardPayload()
  res.status(payload.success ? 200 : 500).json(payload)
})

router.get('/stats', (req: Request, res: Response): void => {
  const payload = dashboardPayload()
  res.status(payload.success ? 200 : 500).json(payload)
})

router.get('/settlement/rules', (req: Request, res: Response): void => {
  try {
    const rules = db.prepare(`
      SELECT sr.*, o.name as operator_name
      FROM settlement_rules sr
      JOIN operators o ON sr.operator_id = o.id
    `).all()
    res.json({ success: true, data: rules })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.post('/settlement/rules', (req: Request, res: Response): void => {
  try {
    const { operatorId, ruleName, basePrice, peakPrice, valleyPrice, peakStart, peakEnd, valleyStart, valleyEnd } = req.body
    if (!operatorId || !ruleName || basePrice === undefined || peakPrice === undefined || valleyPrice === undefined) {
      res.status(400).json({ success: false, error: '缺少必要参数' })
      return
    }

    const id = uuidv4()
    db.prepare(`
      INSERT INTO settlement_rules (id, operator_id, rule_name, base_price, peak_price, valley_price, peak_start, peak_end, valley_start, valley_end)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, operatorId, ruleName, basePrice, peakPrice, valleyPrice, peakStart || '08:00', peakEnd || '21:00', valleyStart || '23:00', valleyEnd || '06:00')

    const rule = db.prepare(`
      SELECT sr.*, o.name as operator_name
      FROM settlement_rules sr
      JOIN operators o ON sr.operator_id = o.id
      WHERE sr.id = ?
    `).get(id)
    res.json({ success: true, data: rule })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/settlement/bills', (req: Request, res: Response): void => {
  try {
    const { operatorId, period } = req.query
    let sql = `
      SELECT sb.*, o.name as operator_name
      FROM settlement_bills sb
      JOIN operators o ON sb.operator_id = o.id
      WHERE 1=1
    `
    const params: any[] = []

    if (operatorId) {
      sql += ' AND sb.operator_id = ?'
      params.push(operatorId)
    }
    if (period) {
      sql += ' AND sb.period_start <= ? AND sb.period_end >= ?'
      params.push(period, period)
    }

    sql += ' ORDER BY sb.created_at DESC'
    const bills = db.prepare(sql).all(...params)
    res.json({ success: true, data: bills })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/revenue/analysis', (req: Request, res: Response): void => {
  try {
    const { stationId, period = 'month' } = req.query

    let stationFilter = ''
    const params: any[] = []
    if (stationId) {
      stationFilter = ' AND co.station_id = ?'
      params.push(stationId)
    }

    const totalRevenue = (db.prepare(`SELECT COALESCE(SUM(cost), 0) as total FROM charging_orders co WHERE status = '已完成'${stationFilter}`).get(...params) as any).total
    const totalKwh = (db.prepare(`SELECT COALESCE(SUM(charged_kwh), 0) as total FROM charging_orders co WHERE status = '已完成'${stationFilter}`).get(...params) as any).total
    const avgOrderCost = (db.prepare(`SELECT COALESCE(AVG(cost), 0) as avg FROM charging_orders co WHERE status = '已完成'${stationFilter}`).get(...params) as any).avg

    const stationInfo = stationId
      ? db.prepare('SELECT * FROM charging_stations WHERE id = ?').get(stationId)
      : null

    const investmentCost = stationInfo ? (stationInfo as any).total_piles * 50000 : 1500000
    const roi = investmentCost > 0 ? +((totalRevenue / investmentCost) * 100).toFixed(2) : 0

    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
    const trend = months.map(m => {
      const base = totalRevenue / 6
      const variation = (Math.random() - 0.3) * base * 0.4
      return {
        period: m,
        revenue: +Math.max(0, base + variation).toFixed(2),
        orders: Math.floor(20 + Math.random() * 40),
        chargedKwh: +Math.max(0, totalKwh / 6 + variation * 10).toFixed(2),
      }
    })

    const dailyDistribution = Array.from({ length: 7 }, (_, i) => {
      const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      return {
        day: days[i],
        revenue: +(totalRevenue / 30 * (0.8 + Math.random() * 0.5)).toFixed(2),
        orders: Math.floor(totalRevenue / 30 / avgOrderCost * (0.7 + Math.random() * 0.6)),
      }
    })

    res.json({
      success: true,
      data: {
        summary: { totalRevenue: +totalRevenue.toFixed(2), totalKwh: +totalKwh.toFixed(2), avgOrderCost: +avgOrderCost.toFixed(2), totalOrders: Math.floor(totalRevenue / Math.max(avgOrderCost, 1)), roi, investmentCost, paybackMonths: roi > 0 ? Math.ceil(100 / (roi / 6)) : 999 },
        trend,
        dailyDistribution,
        station: stationInfo,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/user-profiles', (req: Request, res: Response): void => {
  try {
    const { tag, page = '1', pageSize = '10' } = req.query

    let sql = `
      SELECT u.id, u.phone, u.nickname, u.avatar, u.created_at,
        GROUP_CONCAT(ut.tag) as tags,
        (SELECT COUNT(*) FROM vehicle_bindings vb WHERE vb.user_id = u.id) as vehicle_count,
        (SELECT COUNT(*) FROM charging_orders co WHERE co.user_id = u.id) as order_count,
        (SELECT COALESCE(SUM(cost), 0) FROM charging_orders co WHERE co.user_id = u.id AND co.status = '已完成') as total_spent
      FROM users u
      LEFT JOIN user_tags ut ON u.id = ut.user_id
    `

    const params: any[] = []
    if (tag) {
      sql += ' WHERE u.id IN (SELECT user_id FROM user_tags WHERE tag = ?)'
      params.push(tag)
    }

    sql += ' GROUP BY u.id'

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }
    const total = countResult.total

    const limit = parseInt(pageSize as string, 10)
    const offset = (parseInt(page as string, 10) - 1) * limit
    sql += ' LIMIT ? OFFSET ?'

    const users = db.prepare(sql).all(...params, limit, offset)

    res.json({
      success: true,
      data: {
        list: users.map((u: any) => ({ ...u, tags: u.tags ? u.tags.split(',') : [], total_spent: +u.total_spent.toFixed(2) })),
        total,
        page: parseInt(page as string, 10),
        pageSize: limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
