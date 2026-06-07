import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, page = '1', pageSize = '10' } = req.query
    const p = Number(page)
    const ps = Number(pageSize)
    const offset = (p - 1) * ps

    let whereClause = ''
    const params: any[] = []

    if (status) {
      whereClause = 'WHERE gb.status = ?'
      params.push(status)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM group_buys gb ${whereClause}`).get(...params) as any).count

    const list = db.prepare(`
      SELECT gb.*, p.name as product_name, p.cover_image as product_cover_image, p.original_price as product_original_price
      FROM group_buys gb
      LEFT JOIN products p ON gb.product_id = p.id
      ${whereClause}
      ORDER BY gb.created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, ps, offset)

    res.json({ success: true, data: { list, total, page: p, pageSize: ps } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取团购列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const row = db.prepare(`
      SELECT gb.*, p.name as product_name, p.cover_image as product_cover_image, p.original_price as product_original_price, p.description as product_description
      FROM group_buys gb
      LEFT JOIN products p ON gb.product_id = p.id
      WHERE gb.id = ?
    `).get(req.params.id) as any

    if (!row) {
      res.status(404).json({ success: false, error: '团购不存在' })
      return
    }

    const participantCount = (db.prepare('SELECT COUNT(*) as count FROM group_buy_orders WHERE group_buy_id = ?').get(req.params.id) as any).count

    res.json({ success: true, data: { ...row, participant_count: participantCount } })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取团购详情失败' })
  }
})

router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { product_id, title, target_count, discount_price, original_price, start_time, end_time, cover_image, description } = req.body

    const result = db.prepare(`
      INSERT INTO group_buys (product_id, title, target_count, discount_price, original_price, start_time, end_time, cover_image, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(product_id, title, target_count, discount_price, original_price, start_time, end_time, cover_image, description)

    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建团购失败' })
  }
})

router.post('/:id/join', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { quantity = 1 } = req.body
    const userId = (req as any).user.userId

    const groupBuy = db.prepare('SELECT * FROM group_buys WHERE id = ?').get(id) as any

    if (!groupBuy) {
      res.status(404).json({ success: false, error: '团购不存在' })
      return
    }

    if (groupBuy.status !== 'active') {
      res.status(400).json({ success: false, error: '团购已结束' })
      return
    }

    const now = new Date().toISOString()
    if (groupBuy.end_time && now > groupBuy.end_time) {
      res.status(400).json({ success: false, error: '团购已过期' })
      return
    }

    const newCount = groupBuy.current_count + quantity

    const updateGroupBuy = db.transaction(() => {
      db.prepare('INSERT INTO group_buy_orders (group_buy_id, user_id, quantity) VALUES (?, ?, ?)').run(id, userId, quantity)

      if (newCount >= groupBuy.target_count) {
        db.prepare('UPDATE group_buys SET current_count = ?, status = ? WHERE id = ?').run(newCount, 'completed', id)
      } else {
        db.prepare('UPDATE group_buys SET current_count = ? WHERE id = ?').run(newCount, id)
      }
    })

    updateGroupBuy()

    res.json({ success: true, data: { current_count: newCount, status: newCount >= groupBuy.target_count ? 'completed' : 'active' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '参与团购失败' })
  }
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { product_id, title, target_count, discount_price, original_price, start_time, end_time, cover_image, description, status } = req.body

    const result = db.prepare(`
      UPDATE group_buys SET
        product_id = COALESCE(?, product_id),
        title = COALESCE(?, title),
        target_count = COALESCE(?, target_count),
        discount_price = COALESCE(?, discount_price),
        original_price = COALESCE(?, original_price),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        cover_image = COALESCE(?, cover_image),
        description = COALESCE(?, description),
        status = COALESCE(?, status)
      WHERE id = ?
    `).run(product_id, title, target_count, discount_price, original_price, start_time, end_time, cover_image, description, status, id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '团购不存在' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新团购失败' })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const result = db.prepare('DELETE FROM group_buys WHERE id = ?').run(req.params.id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '团购不存在' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除团购失败' })
  }
})

export default router
