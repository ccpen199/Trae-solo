import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from './auth.js'

const router = Router()

router.use(authMiddleware)

router.get('/policies', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tags, keyword } = req.query
    let sql = 'SELECT * FROM policies WHERE 1=1'
    const params: any[] = []

    if (category) { sql += ' AND category = ?'; params.push(category as string) }
    if (tags) { sql += ' AND tags LIKE ?'; params.push(`%${tags}%`) }
    if (keyword) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }

    sql += ' ORDER BY publish_date DESC'
    const policies = db.prepare(sql).all(...params)
    res.json({ success: true, data: policies })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/policies/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(req.params.id)
    if (!policy) {
      res.status(404).json({ success: false, error: '政策不存在' })
      return
    }
    res.json({ success: true, data: policy })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/safety', async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, tags, keyword } = req.query
    let sql = 'SELECT * FROM safety_entries WHERE 1=1'
    const params: any[] = []

    if (category) { sql += ' AND category = ?'; params.push(category as string) }
    if (tags) { sql += ' AND tags LIKE ?'; params.push(`%${tags}%`) }
    if (keyword) { sql += ' AND (title LIKE ? OR content LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`) }

    sql += ' ORDER BY created_at DESC'
    const entries = db.prepare(sql).all(...params)
    res.json({ success: true, data: entries })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/safety/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = db.prepare('SELECT * FROM safety_entries WHERE id = ?').get(req.params.id)
    if (!entry) {
      res.status(404).json({ success: false, error: '安全知识不存在' })
      return
    }
    res.json({ success: true, data: entry })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/expert-sessions', async (req: Request, res: Response): Promise<void> => {
  try {
    const { tags, keyword } = req.query
    let sql = 'SELECT * FROM expert_sessions WHERE 1=1'
    const params: any[] = []

    if (tags) { sql += ' AND tags LIKE ?'; params.push(`%${tags}%`) }
    if (keyword) { sql += ' AND (title LIKE ? OR expert_name LIKE ? OR description LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`) }

    sql += ' ORDER BY live_date DESC'
    const sessions = db.prepare(sql).all(...params)
    res.json({ success: true, data: sessions })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/expert-sessions/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const session = db.prepare('SELECT * FROM expert_sessions WHERE id = ?').get(req.params.id)
    if (!session) {
      res.status(404).json({ success: false, error: '专家直播不存在' })
      return
    }

    db.prepare('UPDATE expert_sessions SET viewer_count = viewer_count + 1 WHERE id = ?').run(req.params.id)
    const updated = db.prepare('SELECT * FROM expert_sessions WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: updated })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
