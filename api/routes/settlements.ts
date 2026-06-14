import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, method, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT s.*, o.category, o.user_id FROM settlements s JOIN orders o ON s.order_id = o.id WHERE 1=1`
    const params: unknown[] = []

    if (status) {
      sql += ` AND s.status = ?`
      params.push(status)
    }
    if (method) {
      sql += ` AND s.method = ?`
      params.push(method)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM settlements s WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY s.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const settlements = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: settlements,
        total: countRow.total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取结算列表失败' })
  }
})

router.post('/:id/execute', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const settlement = db.prepare(`SELECT s.*, o.category, o.user_id FROM settlements s JOIN orders o ON s.order_id = o.id WHERE s.id = ?`).get(id) as Record<string, unknown> | undefined
    if (!settlement) {
      res.status(404).json({ success: false, error: '结算记录不存在' })
      return
    }

    if (settlement.status === 'completed') {
      res.status(400).json({ success: false, error: '结算已完成' })
      return
    }

    db.prepare(`UPDATE settlements SET status = 'processing' WHERE id = ?`).run(id)

    const success = Math.random() > 0.1

    if (success) {
      db.prepare(`UPDATE settlements SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(id)
      db.prepare(`UPDATE orders SET status = 'settled', updated_at = datetime('now') WHERE id = ?`).run(settlement.order_id)

      const userId = settlement.user_id as string
      const amount = settlement.amount as number
      db.prepare(`UPDATE users SET total_earnings = total_earnings + ?, total_recycled = total_recycled + 1, updated_at = datetime('now') WHERE id = ?`).run(amount, userId)
    } else {
      db.prepare(`UPDATE settlements SET status = 'failed' WHERE id = ?`).run(id)
    }

    const updatedSettlement = db.prepare(`SELECT * FROM settlements WHERE id = ?`).get(id)

    res.json({
      success: true,
      data: updatedSettlement,
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '执行结算失败' })
  }
})

router.post('/batch', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { settlement_ids } = req.body

    if (!settlement_ids || !Array.isArray(settlement_ids) || settlement_ids.length === 0) {
      res.status(400).json({ success: false, error: '请提供结算ID列表' })
      return
    }

    const results: { id: string; status: string; message: string }[] = []

    for (const sid of settlement_ids) {
      const settlement = db.prepare(`SELECT s.*, o.user_id FROM settlements s JOIN orders o ON s.order_id = o.id WHERE s.id = ?`).get(sid) as Record<string, unknown> | undefined

      if (!settlement) {
        results.push({ id: sid, status: 'failed', message: '结算记录不存在' })
        continue
      }

      if (settlement.status === 'completed') {
        results.push({ id: sid, status: 'skipped', message: '结算已完成' })
        continue
      }

      db.prepare(`UPDATE settlements SET status = 'processing' WHERE id = ?`).run(sid)

      const success = Math.random() > 0.1
      if (success) {
        db.prepare(`UPDATE settlements SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(sid)
        db.prepare(`UPDATE orders SET status = 'settled', updated_at = datetime('now') WHERE id = ?`).run(settlement.order_id)
        db.prepare(`UPDATE users SET total_earnings = total_earnings + ?, total_recycled = total_recycled + 1, updated_at = datetime('now') WHERE id = ?`).run(settlement.amount as number, settlement.user_id as string)
        results.push({ id: sid, status: 'completed', message: '结算成功' })
      } else {
        db.prepare(`UPDATE settlements SET status = 'failed' WHERE id = ?`).run(sid)
        results.push({ id: sid, status: 'failed', message: '结算失败，请重试' })
      }
    }

    const completedCount = results.filter(r => r.status === 'completed').length
    const failedCount = results.filter(r => r.status === 'failed').length

    res.json({
      success: true,
      data: {
        total: settlement_ids.length,
        completed: completedCount,
        failed: failedCount,
        results,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '批量结算失败' })
  }
})

export default router
