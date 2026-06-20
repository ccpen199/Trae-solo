import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import db from '../database.js'

const router = Router()

router.post('/', (req: Request, res: Response): void => {
  const { user_id, case_id, duration } = req.body

  if (!user_id || !case_id) {
    res.status(400).json({ success: false, error: '缺少用户ID或案例ID' })
    return
  }

  const id = uuidv4()
  db.prepare('INSERT INTO browsing_records (id, user_id, case_id, duration) VALUES (?, ?, ?, ?)').run(
    id, user_id, case_id, duration || 0
  )

  res.status(201).json({ success: true, data: { id, user_id, case_id, duration: duration || 0 } })
})

export default router
