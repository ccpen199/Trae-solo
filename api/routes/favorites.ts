import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'
import { toCaseItem, toDesigner } from '../utils.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { user_id, type = 'case' } = req.query

  if (!user_id) {
    res.status(400).json({ success: false, error: '缺少用户ID' })
    return
  }

  if (type === 'designer') {
    const rows = db.prepare(`
      SELECT f.id as favorite_id, f.created_at as favorited_at, d.*
      FROM favorites f
      JOIN designers d ON f.designer_id = d.id
      WHERE f.user_id = ? AND f.target_type = 'designer'
      ORDER BY f.created_at DESC
    `).all(user_id) as Record<string, unknown>[]
    res.json({ success: true, data: rows.map(toDesigner) })
    return
  }

  const rows = db.prepare(`
    SELECT f.id as favorite_id, f.created_at as favorited_at, c.*,
      d.name as designer_name
    FROM favorites f
    JOIN cases c ON f.case_id = c.id
    LEFT JOIN designers d ON c.designer_id = d.id
    WHERE f.user_id = ? AND (f.target_type = 'case' OR f.target_type IS NULL)
    ORDER BY f.created_at DESC
  `).all(user_id) as Record<string, unknown>[]
  res.json({ success: true, data: rows.map(toCaseItem) })
})

router.post('/', (req: Request, res: Response): void => {
  const { user_id, case_id, designer_id, target_type } = req.body

  if (!user_id || (!case_id && !designer_id)) {
    res.status(400).json({ success: false, error: '缺少参数' })
    return
  }

  const id = uuidv4()
  const tType = target_type || (case_id ? 'case' : 'designer')
  db.prepare('INSERT INTO favorites (id, user_id, case_id, designer_id, target_type) VALUES (?, ?, ?, ?, ?)').run(
    id, user_id, case_id || null, designer_id || null, tType
  )

  if (case_id) {
    db.prepare('UPDATE cases SET likes = likes + 1 WHERE id = ?').run(case_id)
  }

  res.status(201).json({ success: true, data: { id, user_id, case_id, designer_id, targetType: tType } })
})

router.delete('/:id', (req: Request, res: Response): void => {
  const { id } = req.params

  const favorite = db.prepare('SELECT * FROM favorites WHERE id = ?').get(id) as Record<string, unknown> | undefined
  if (!favorite) {
    res.status(404).json({ success: false, error: '收藏记录不存在' })
    return
  }

  if (favorite.case_id) {
    db.prepare('UPDATE cases SET likes = CASE WHEN likes > 0 THEN likes - 1 ELSE 0 END WHERE id = ?').run(favorite.case_id)
  }

  db.prepare('DELETE FROM favorites WHERE id = ?').run(id)

  res.json({ success: true })
})

export default router
