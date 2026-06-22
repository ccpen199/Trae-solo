import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'
import db from '../database.js'

const router = Router()

router.post('/:buildingId/register', (req: Request, res: Response): void => {
  const { buildingId } = req.params
  const { name, idNumber, phone } = req.body

  if (!name || !idNumber || !phone) {
    res.status(400).json({ success: false, error: '缺少必要参数' })
    return
  }

  const building = db.prepare('SELECT id, status FROM buildings WHERE id = ?').get(buildingId) as Record<string, unknown> | undefined
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const existing = db.prepare('SELECT id FROM lottery_participants WHERE buildingId = ? AND idNumber = ?').get(buildingId, idNumber)
  if (existing) {
    res.status(400).json({ success: false, error: '该身份证已登记摇号' })
    return
  }

  const count = (db.prepare('SELECT COUNT(*) as count FROM lottery_participants WHERE buildingId = ?').get(buildingId) as { count: number }).count

  const id = uuidv4()
  db.prepare('INSERT INTO lottery_participants (id, buildingId, name, idNumber, phone, sequenceNumber) VALUES (?, ?, ?, ?, ?, ?)').run(
    id, buildingId, name, idNumber, phone, count + 1
  )

  res.json({
    success: true,
    data: {
      id,
      sequenceNumber: count + 1,
      name,
      buildingId
    }
  })
})

router.post('/:buildingId/run', (req: Request, res: Response): void => {
  const { buildingId } = req.params

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(buildingId)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const participants = db.prepare('SELECT id, name, idNumber, phone, sequenceNumber FROM lottery_participants WHERE buildingId = ?').all(buildingId) as { id: string; name: string; idNumber: string; phone: string; sequenceNumber: number }[]

  if (participants.length === 0) {
    res.status(400).json({ success: false, error: '无摇号参与者' })
    return
  }

  const existingResults = db.prepare('SELECT id FROM lottery_results WHERE buildingId = ? LIMIT 1').get(buildingId)
  if (existingResults) {
    res.status(400).json({ success: false, error: '该楼盘已执行过摇号' })
    return
  }

  const seed = crypto.randomBytes(32).toString('hex')
  const timestamp = Date.now().toString()

  const hashed = participants.map(p => {
    const hashInput = `${seed}:${p.id}:${p.idNumber}:${timestamp}`
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex')
    return { ...p, sortKey: hash }
  })

  hashed.sort((a, b) => a.sortKey.localeCompare(b.sortKey))

  db.transaction(() => {
    const insertResult = db.prepare('INSERT INTO lottery_results (id, buildingId, participantId, rank, seed, runAt) VALUES (?, ?, ?, ?, ?, ?)')
    for (let i = 0; i < hashed.length; i++) {
      insertResult.run(uuidv4(), buildingId, hashed[i].id, i + 1, seed, new Date().toISOString())
    }
  })()

  const results = db.prepare(`
    SELECT lr.rank, lr.seed, lr.runAt, lp.name, lp.idNumber, lp.phone, lp.sequenceNumber
    FROM lottery_results lr
    JOIN lottery_participants lp ON lr.participantId = lp.id
    WHERE lr.buildingId = ?
    ORDER BY lr.rank
  `).all(buildingId) as { rank: number; seed: string; runAt: string; name: string; idNumber: string; phone: string; sequenceNumber: number }[]

  res.json({
    success: true,
    data: {
      seed,
      totalParticipants: participants.length,
      results
    }
  })
})

router.get('/:buildingId/result', (req: Request, res: Response): void => {
  const { buildingId } = req.params

  const building = db.prepare('SELECT id FROM buildings WHERE id = ?').get(buildingId)
  if (!building) {
    res.status(404).json({ success: false, error: '楼盘不存在' })
    return
  }

  const results = db.prepare(`
    SELECT lr.rank, lr.seed, lr.runAt, lp.name, lp.idNumber, lp.phone, lp.sequenceNumber
    FROM lottery_results lr
    JOIN lottery_participants lp ON lr.participantId = lp.id
    WHERE lr.buildingId = ?
    ORDER BY lr.rank
  `).all(buildingId) as { rank: number; seed: string; runAt: string; name: string; idNumber: string; phone: string; sequenceNumber: number }[]

  if (results.length === 0) {
    res.json({ success: true, data: { hasResult: false, results: [] } })
    return
  }

  res.json({
    success: true,
    data: {
      hasResult: true,
      seed: results[0].seed,
      runAt: results[0].runAt,
      totalParticipants: results.length,
      results
    }
  })
})

export default router
