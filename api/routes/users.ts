import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/me', (req: Request, res: Response): void => {
  const { user_id } = req.query
  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(user_id)) as any
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const profile = db.prepare('SELECT verified FROM match_profiles WHERE user_id = ?').get(Number(user_id)) as any
  res.json({
    success: true,
    data: {
      ...user,
      verified: profile ? profile.verified : 0,
    },
  })
})

router.put('/me', (req: Request, res: Response): void => {
  const { nickname, avatar, region } = req.body
  const { user_id } = req.query

  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(user_id))
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  db.prepare(`
    UPDATE users
    SET nickname = COALESCE(?, nickname),
        avatar = COALESCE(?, avatar),
        region = COALESCE(?, region)
    WHERE id = ?
  `).run(nickname || null, avatar || null, region || null, Number(user_id))

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(Number(user_id))
  res.json({ success: true, data: updated })
})

export default router
