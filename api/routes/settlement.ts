import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

const settlementConfig: Record<string, any> = {
  fee_rate: 0.05,
  min_settle_amount: 100,
  auto_settle: false,
  settle_day: 15,
  overtime_rate: 1.5
}

router.get('/pool', async (req: Request, res: Response): Promise<void> => {
  try {
    const { org_id } = req.query
    const db = getDb()

    let sql = `SELECT fp.*, o.name as org_name FROM fund_pools fp JOIN organizations o ON fp.org_id = o.id WHERE 1=1`
    const params: any[] = []

    if (org_id) {
      sql += ` AND fp.org_id = ?`
      params.push(org_id)
    }

    const pools = db.prepare(sql).all(...params)

    res.json({ success: true, data: pools.length === 1 ? pools[0] : pools })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取资金池信息失败' })
  }
})

router.post('/pool/recharge', async (req: Request, res: Response): Promise<void> => {
  try {
    const { org_id, amount } = req.body

    if (!org_id || !amount || amount <= 0) {
      res.status(400).json({ success: false, error: '机构ID和充值金额不能为空' })
      return
    }

    const db = getDb()
    const pool = db.prepare('SELECT * FROM fund_pools WHERE org_id = ?').get(org_id) as any
    if (!pool) {
      res.status(404).json({ success: false, error: '资金池不存在' })
      return
    }

    db.prepare('UPDATE fund_pools SET balance = balance + ?, updated_at = CURRENT_TIMESTAMP WHERE org_id = ?').run(amount, org_id)

    const updated = db.prepare('SELECT fp.*, o.name as org_name FROM fund_pools fp JOIN organizations o ON fp.org_id = o.id WHERE fp.org_id = ?').get(org_id)

    res.json({ success: true, data: updated })
  } catch (error) {
    res.status(500).json({ success: false, error: '充值失败' })
  }
})

router.get('/bills', async (req: Request, res: Response): Promise<void> => {
  try {
    const { org_id, status, cycle, page = '1', pageSize = '10' } = req.query
    const db = getDb()

    let sql = `SELECT s.*, o.name as org_name FROM settlements s JOIN organizations o ON s.org_id = o.id WHERE 1=1`
    const params: any[] = []

    if (org_id) {
      sql += ` AND s.org_id = ?`
      params.push(org_id)
    }
    if (status) {
      sql += ` AND s.status = ?`
      params.push(status)
    }
    if (cycle) {
      sql += ` AND s.cycle = ?`
      params.push(cycle)
    }

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM (${sql})`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const bills = db.prepare(sql).all(...params) as any[]
    for (const bill of bills) {
      bill.details = JSON.parse(bill.details || '[]')
    }

    res.json({
      success: true,
      data: {
        items: bills,
        total: countResult.total,
        page: Number(page),
        pageSize: Number(pageSize)
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取账单列表失败' })
  }
})

router.post('/settle', async (req: Request, res: Response): Promise<void> => {
  try {
    const { org_id, amount, cycle, details } = req.body

    if (!org_id || !amount) {
      res.status(400).json({ success: false, error: '机构ID和结算金额不能为空' })
      return
    }

    const db = getDb()
    const pool = db.prepare('SELECT * FROM fund_pools WHERE org_id = ?').get(org_id) as any
    if (!pool) {
      res.status(404).json({ success: false, error: '资金池不存在' })
      return
    }

    if (pool.balance < amount) {
      res.status(400).json({ success: false, error: '资金池余额不足' })
      return
    }

    const fee = Math.round(amount * settlementConfig.fee_rate * 100) / 100

    const settleResult = db.prepare(
      `INSERT INTO settlements (org_id, amount, fee, cycle, status, details) VALUES (?, ?, ?, ?, 'pending', ?)`
    ).run(org_id, amount, fee, cycle || 'monthly', JSON.stringify(details || []))

    db.prepare('UPDATE fund_pools SET balance = balance - ?, frozen = frozen + ?, updated_at = CURRENT_TIMESTAMP WHERE org_id = ?').run(amount, amount, org_id)

    const settlement = db.prepare('SELECT s.*, o.name as org_name FROM settlements s JOIN organizations o ON s.org_id = o.id WHERE s.id = ?').get(settleResult.lastInsertRowid) as any
    if (settlement) settlement.details = JSON.parse(settlement.details || '[]')

    res.status(201).json({ success: true, data: settlement })
  } catch (error) {
    res.status(500).json({ success: false, error: '执行结算失败' })
  }
})

router.get('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    res.json({ success: true, data: settlementConfig })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取结算配置失败' })
  }
})

router.put('/config', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fee_rate, min_settle_amount, auto_settle, settle_day, overtime_rate } = req.body

    if (fee_rate !== undefined) settlementConfig.fee_rate = fee_rate
    if (min_settle_amount !== undefined) settlementConfig.min_settle_amount = min_settle_amount
    if (auto_settle !== undefined) settlementConfig.auto_settle = auto_settle
    if (settle_day !== undefined) settlementConfig.settle_day = settle_day
    if (overtime_rate !== undefined) settlementConfig.overtime_rate = overtime_rate

    res.json({ success: true, data: settlementConfig })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新结算配置失败' })
  }
})

export default router
