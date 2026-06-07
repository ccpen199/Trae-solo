import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1
    const pageSize = Number(req.query.pageSize) || 10
    const category_id = req.query.category_id as string
    const keyword = req.query.keyword as string
    const offset = (page - 1) * pageSize

    let whereClause = 'WHERE is_published = 1'
    const params: any[] = []

    if (category_id) {
      whereClause += ' AND category_id = ?'
      params.push(category_id)
    }

    if (keyword) {
      whereClause += ' AND title LIKE ?'
      params.push(`%${keyword}%`)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM news ${whereClause}`).get(...params) as { total: number }

    const list = db.prepare(
      `SELECT * FROM news ${whereClause} ORDER BY is_top DESC, published_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, offset)

    res.json({
      success: true,
      data: {
        list,
        total: countRow.total,
        page,
        pageSize
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取新闻列表失败' })
  }
})

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    db.prepare('UPDATE news SET view_count = view_count + 1 WHERE id = ?').run(id)

    const news = db.prepare('SELECT * FROM news WHERE id = ?').get(id)

    if (!news) {
      res.status(404).json({ success: false, error: '新闻不存在' })
      return
    }

    res.json({ success: true, data: news })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取新闻详情失败' })
  }
})

router.post('/', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content, summary, category_id, cover_image, author, source, is_published } = req.body

    const published_at = is_published === 1 ? "datetime('now')" : null

    let stmt: any
    let result: any

    if (published_at) {
      stmt = db.prepare(
        `INSERT INTO news (title, content, summary, category_id, cover_image, author, source, is_published, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`
      )
      result = stmt.run(title, content || null, summary || null, category_id || null, cover_image || null, author || null, source || '百姓关注', is_published ?? 1)
    } else {
      stmt = db.prepare(
        `INSERT INTO news (title, content, summary, category_id, cover_image, author, source, is_published) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      result = stmt.run(title, content || null, summary || null, category_id || null, cover_image || null, author || null, source || '百姓关注', is_published ?? 0)
    }

    const news = db.prepare('SELECT * FROM news WHERE id = ?').get(result.lastInsertRowid)

    res.json({ success: true, data: news })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建新闻失败' })
  }
})

router.put('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { title, content, summary, category_id, cover_image, author, source, is_published } = req.body

    const existing = db.prepare('SELECT * FROM news WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '新闻不存在' })
      return
    }

    if (is_published === 1 && !(existing as any).published_at) {
      db.prepare(
        `UPDATE news SET title = ?, content = ?, summary = ?, category_id = ?, cover_image = ?, author = ?, source = ?, is_published = ?, published_at = datetime('now') WHERE id = ?`
      ).run(title, content || null, summary || null, category_id || null, cover_image || null, author || null, source || '百姓关注', is_published, id)
    } else {
      db.prepare(
        `UPDATE news SET title = ?, content = ?, summary = ?, category_id = ?, cover_image = ?, author = ?, source = ?, is_published = ? WHERE id = ?`
      ).run(title, content || null, summary || null, category_id || null, cover_image || null, author || null, source || '百姓关注', is_published, id)
    }

    const news = db.prepare('SELECT * FROM news WHERE id = ?').get(id)

    res.json({ success: true, data: news })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新新闻失败' })
  }
})

router.delete('/:id', adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const result = db.prepare('DELETE FROM news WHERE id = ?').run(id)

    if (result.changes === 0) {
      res.status(404).json({ success: false, error: '新闻不存在' })
      return
    }

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除新闻失败' })
  }
})

export default router
