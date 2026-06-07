import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware } from '../auth.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taxTypes = db.prepare('SELECT * FROM tax_types ORDER BY category, id').all()
    res.json({ success: true, data: taxTypes })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取税种列表失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taxType = db.prepare('SELECT * FROM tax_types WHERE id = ?').get(req.params.id) as any
    if (!taxType) {
      res.status(404).json({ success: false, error: '税种不存在' })
      return
    }
    res.json({ success: true, data: taxType })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取税种详情失败' })
  }
})

export default router
