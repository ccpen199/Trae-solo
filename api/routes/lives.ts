import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import authMiddleware from '../middleware/auth.js'
import { broadcastDanmaku } from '../ws.js'

const router = Router()

interface AuthRequest extends Request {
  user?: any
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const category = req.query.category as string
    const status = req.query.status as string

    let whereClauses = []
    let params: any[] = []

    if (category) {
      whereClauses.push('category = ?')
      params.push(category)
    }
    if (status) {
      whereClauses.push('status = ?')
      params.push(status)
    }

    const whereSql = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as count FROM lives ${whereSql}`)
    const total = (countStmt.get(...params) as any).count

    const offset = (page - 1) * pageSize
    const livesStmt = db.prepare(`
      SELECT l.*, u.nickname as host_name, u.avatar as host_avatar
      FROM lives l
      LEFT JOIN users u ON l.host_id = u.id
      ${whereSql}
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const lives = livesStmt.all(...params, pageSize, offset) as any[]

    const livesWithImages = lives.map(live => ({
      ...live,
      images: live.cover_image ? [live.cover_image] : []
    }))

    res.status(200).json({
      success: true,
      data: {
        list: livesWithImages,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取直播列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const stmt = db.prepare(`
      SELECT l.*, u.nickname as host_name, u.avatar as host_avatar, u.certification_type, u.certification_status
      FROM lives l
      LEFT JOIN users u ON l.host_id = u.id
      WHERE l.id = ?
    `)
    const live = stmt.get(id) as any

    if (!live) {
      res.status(404).json({ success: false, error: '直播不存在' })
      return
    }

    live.images = live.cover_image ? [live.cover_image] : []

    res.status(200).json({
      success: true,
      data: {
        detail: live
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取直播详情失败' })
  }
})

router.post('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, cover_image, category, scheduled_at } = req.body

    if (!title) {
      res.status(400).json({ success: false, error: '直播标题不能为空' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO lives (host_id, title, cover_image, category, scheduled_at)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(req.user.id, title, cover_image, category || 'house_viewing', scheduled_at)

    const newLive = db.prepare(`
      SELECT l.*, u.nickname as host_name, u.avatar as host_avatar
      FROM lives l
      LEFT JOIN users u ON l.host_id = u.id
      WHERE l.id = ?
    `).get(result.lastInsertRowid) as any

    res.status(201).json({
      success: true,
      data: {
        live: newLive
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建直播失败' })
  }
})

router.post('/:id/danmaku', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { content } = req.body

    if (!content) {
      res.status(400).json({ success: false, error: '弹幕内容不能为空' })
      return
    }

    const live = db.prepare('SELECT * FROM lives WHERE id = ?').get(id) as any
    if (!live) {
      res.status(404).json({ success: false, error: '直播不存在' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO danmaku (live_id, user_id, username, content)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(id, req.user.id, req.user.nickname || req.user.username, content)

    const danmaku = db.prepare('SELECT * FROM danmaku WHERE id = ?').get(result.lastInsertRowid) as any

    broadcastDanmaku(Number(id), danmaku)

    res.status(200).json({
      success: true,
      data: {
        danmaku
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '发送弹幕失败' })
  }
})

router.post('/:id/redpacket', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { total_amount, total_count } = req.body

    if (!total_amount || !total_count) {
      res.status(400).json({ success: false, error: '红包金额和数量不能为空' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO red_packets (live_id, sender_id, total_amount, total_count, remain_count)
      VALUES (?, ?, ?, ?, ?)
    `)
    const result = stmt.run(id, req.user.id, total_amount, total_count, total_count)

    const redPacket = db.prepare('SELECT * FROM red_packets WHERE id = ?').get(result.lastInsertRowid) as any

    res.status(201).json({
      success: true,
      data: {
        redPacket
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建红包失败' })
  }
})

router.post('/:id/redpacket/grab', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { red_packet_id } = req.body

    if (!red_packet_id) {
      res.status(400).json({ success: false, error: '红包ID不能为空' })
      return
    }

    const redPacket = db.prepare('SELECT * FROM red_packets WHERE id = ?').get(red_packet_id) as any
    if (!redPacket) {
      res.status(404).json({ success: false, error: '红包不存在' })
      return
    }

    if (redPacket.status !== 'active' || redPacket.remain_count <= 0) {
      res.status(400).json({ success: false, error: '红包已被抢完' })
      return
    }

    const existingGrab = db.prepare('SELECT * FROM red_packet_grabs WHERE red_packet_id = ? AND user_id = ?').get(red_packet_id, req.user.id) as any
    if (existingGrab) {
      res.status(400).json({ success: false, error: '您已经抢过这个红包了' })
      return
    }

    const amount = parseFloat((Math.random() * (redPacket.total_amount / redPacket.total_count * 2)).toFixed(2)) || 0.01

    const insertStmt = db.prepare(`
      INSERT INTO red_packet_grabs (red_packet_id, user_id, amount)
      VALUES (?, ?, ?)
    `)
    const insertResult = insertStmt.run(red_packet_id, req.user.id, amount)

    const updateStmt = db.prepare(`
      UPDATE red_packets 
      SET remain_count = remain_count - 1, status = CASE WHEN remain_count - 1 = 0 THEN 'expired' ELSE status END
      WHERE id = ?
    `)
    updateStmt.run(red_packet_id)

    const grab = db.prepare('SELECT * FROM red_packet_grabs WHERE id = ?').get(insertResult.lastInsertRowid) as any

    res.status(200).json({
      success: true,
      data: {
        grab
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '抢红包失败' })
  }
})

router.post('/:id/cohost', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const live = db.prepare('SELECT * FROM lives WHERE id = ?').get(id) as any
    if (!live) {
      res.status(404).json({ success: false, error: '直播不存在' })
      return
    }

    const existingRequest = db.prepare('SELECT * FROM cohost_requests WHERE live_id = ? AND user_id = ?').get(id, req.user.id) as any
    if (existingRequest) {
      res.status(400).json({ success: false, error: '您已经申请过连麦了' })
      return
    }

    const stmt = db.prepare(`
      INSERT INTO cohost_requests (live_id, user_id)
      VALUES (?, ?)
    `)
    const result = stmt.run(id, req.user.id)

    const request = db.prepare(`
      SELECT cr.*, u.nickname, u.avatar
      FROM cohost_requests cr
      LEFT JOIN users u ON cr.user_id = u.id
      WHERE cr.id = ?
    `).get(result.lastInsertRowid) as any

    res.status(201).json({
      success: true,
      data: {
        request
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '申请连麦失败' })
  }
})

router.get('/:id/messages', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 50

    const offset = (page - 1) * pageSize

    const countStmt = db.prepare('SELECT COUNT(*) as count FROM danmaku WHERE live_id = ?')
    const total = (countStmt.get(id) as any).count

    const messagesStmt = db.prepare(`
      SELECT d.*, u.avatar
      FROM danmaku d
      LEFT JOIN users u ON d.user_id = u.id
      WHERE d.live_id = ?
      ORDER BY d.created_at DESC
      LIMIT ? OFFSET ?
    `)
    const messages = (messagesStmt.all(id, pageSize, offset) as any[]).reverse()

    res.status(200).json({
      success: true,
      data: {
        list: messages,
        total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取聊天记录失败' })
  }
})

export default router
