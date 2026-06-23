import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.post('/verify', (req: Request, res: Response): void => {
  const { user_id, real_name, education, profession, preferences } = req.body
  if (!user_id || !real_name) {
    res.status(400).json({ success: false, error: 'user_id和real_name为必填项' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM match_profiles WHERE user_id = ?').get(Number(user_id))

  let profile
  if (existing) {
    db.prepare(`
      UPDATE match_profiles
      SET real_name = COALESCE(?, real_name),
          education = COALESCE(?, education),
          profession = COALESCE(?, profession),
          preferences = COALESCE(?, preferences),
          verified = 0
      WHERE user_id = ?
    `).run(real_name, education || null, profession || null, preferences || null, Number(user_id))
    profile = db.prepare('SELECT * FROM match_profiles WHERE user_id = ?').get(Number(user_id))
  } else {
    const result = db.prepare(`
      INSERT INTO match_profiles (user_id, real_name, education, profession, preferences, verified)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(Number(user_id), real_name, education || null, profession || null, preferences || null)
    profile = db.prepare('SELECT * FROM match_profiles WHERE id = ?').get(result.lastInsertRowid)
  }

  res.json({ success: true, data: profile })
})

router.put('/profile', (req: Request, res: Response): void => {
  const { user_id, real_name, education, profession, preferences } = req.body
  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const existing = db.prepare('SELECT id FROM match_profiles WHERE user_id = ?').get(Number(user_id))

  let profile
  if (existing) {
    db.prepare(`
      UPDATE match_profiles
      SET real_name = COALESCE(?, real_name),
          education = COALESCE(?, education),
          profession = COALESCE(?, profession),
          preferences = COALESCE(?, preferences)
      WHERE user_id = ?
    `).run(real_name || null, education || null, profession || null, preferences || null, Number(user_id))
    profile = db.prepare('SELECT * FROM match_profiles WHERE user_id = ?').get(Number(user_id))
  } else {
    const result = db.prepare(`
      INSERT INTO match_profiles (user_id, real_name, education, profession, preferences, verified)
      VALUES (?, ?, ?, ?, ?, 0)
    `).run(Number(user_id), real_name || '', education || null, profession || null, preferences || null)
    profile = db.prepare('SELECT * FROM match_profiles WHERE id = ?').get(result.lastInsertRowid)
  }

  res.json({ success: true, data: profile })
})

router.get('/recommend', (req: Request, res: Response): void => {
  const { user_id } = req.query
  const db = getDb()

  let sql = `
    SELECT mp.*, u.nickname, u.avatar, u.region
    FROM match_profiles mp
    LEFT JOIN users u ON mp.user_id = u.id
    WHERE mp.verified = 1
  `
  const params: any[] = []

  if (user_id) {
    sql += " AND mp.user_id != ?"
    params.push(Number(user_id))
  }

  sql += " ORDER BY RANDOM() LIMIT 5"
  const rows = db.prepare(sql).all(...params)

  res.json({ success: true, data: rows })
})

router.post('/intent', (req: Request, res: Response): void => {
  const { from_user_id, to_user_id } = req.body
  if (!from_user_id || !to_user_id) {
    res.status(400).json({ success: false, error: 'from_user_id和to_user_id为必填项' })
    return
  }

  if (Number(from_user_id) === Number(to_user_id)) {
    res.status(400).json({ success: false, error: '不能向自己表达意向' })
    return
  }

  const db = getDb()
  const existing = db.prepare(
    'SELECT id FROM match_intents WHERE from_user_id = ? AND to_user_id = ?'
  ).get(Number(from_user_id), Number(to_user_id))

  if (existing) {
    res.status(409).json({ success: false, error: '已表达过意向' })
    return
  }

  const reverse = db.prepare(
    'SELECT id FROM match_intents WHERE from_user_id = ? AND to_user_id = ?'
  ).get(Number(to_user_id), Number(from_user_id)) as any

  const tx = db.transaction(() => {
    if (reverse) {
      db.prepare('UPDATE match_intents SET mutual = 1 WHERE id = ?').run(reverse.id)
      db.prepare(
        'INSERT INTO match_intents (from_user_id, to_user_id, mutual) VALUES (?, ?, 1)'
      ).run(Number(from_user_id), Number(to_user_id))
    } else {
      db.prepare(
        'INSERT INTO match_intents (from_user_id, to_user_id, mutual) VALUES (?, ?, 0)'
      ).run(Number(from_user_id), Number(to_user_id))
    }
  })

  tx()
  res.json({ success: true, data: { mutual: reverse ? 1 : 0, message: reverse ? '双向匹配成功！' : '意向已发送' } })
})

router.get('/mutual', (req: Request, res: Response): void => {
  const { user_id } = req.query
  if (!user_id) {
    res.status(400).json({ success: false, error: 'user_id为必填项' })
    return
  }

  const db = getDb()
  const rows = db.prepare(`
    SELECT mi.*, u.nickname as other_nickname, u.avatar as other_avatar, u.region as other_region,
           mp.real_name as other_real_name, mp.education as other_education, mp.profession as other_profession
    FROM match_intents mi
    LEFT JOIN users u ON (
      CASE
        WHEN mi.from_user_id = ? THEN mi.to_user_id
        ELSE mi.from_user_id
      END
    ) = u.id
    LEFT JOIN match_profiles mp ON u.id = mp.user_id
    WHERE mi.mutual = 1 AND (mi.from_user_id = ? OR mi.to_user_id = ?)
    ORDER BY mi.created_at DESC
  `).all(Number(user_id), Number(user_id), Number(user_id))

  res.json({ success: true, data: rows })
})

export default router
