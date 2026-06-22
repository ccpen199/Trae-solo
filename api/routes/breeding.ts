import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, species } = req.query
  let sql = `SELECT b.*, p.name as pet_name, p.breed, p.species, p.gender, p.avatar_url as pet_avatar, u.name as owner_name
    FROM breedings b
    JOIN pets p ON b.pet_id = p.id
    JOIN users u ON b.owner_id = u.id
    WHERE 1=1`
  const params: any[] = []

  if (status) {
    sql += ' AND b.status = ?'
    params.push(status)
  }
  if (species) {
    sql += ' AND p.species = ?'
    params.push(species)
  }
  sql += ' ORDER BY b.created_at DESC'

  const breedings = db.prepare(sql).all(...params)
  res.json({ success: true, data: breedings })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { pet_id, pedigree_cert_url, fee, requirements, images } = req.body
  if (!pet_id) {
    res.status(400).json({ success: false, error: '宠物ID为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO breedings (pet_id, owner_id, pedigree_cert_url, fee, requirements, images) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(pet_id, Number(userId), pedigree_cert_url || null, fee || 0, requirements || null, images ? JSON.stringify(images) : null)

  db.prepare(
    'INSERT INTO filing_records (filing_type, related_id, status, request_data) VALUES (?, ?, ?, ?)'
  ).run('breeding', Number(result.lastInsertRowid), 'pending', JSON.stringify({ breeding_id: result.lastInsertRowid, pet_id }))

  const breeding = db.prepare('SELECT * FROM breedings WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: breeding })
})

router.get('/:id', (req: Request, res: Response): void => {
  const breeding = db.prepare(
    `SELECT b.*, p.name as pet_name, p.breed, p.species, p.gender, p.birth_date, p.weight, p.avatar_url as pet_avatar,
      u.name as owner_name, u.phone as owner_phone
    FROM breedings b
    JOIN pets p ON b.pet_id = p.id
    JOIN users u ON b.owner_id = u.id
    WHERE b.id = ?`
  ).get(Number(req.params.id)) as any

  if (!breeding) {
    res.status(404).json({ success: false, error: '配种信息不存在' })
    return
  }

  const matches = db.prepare(
    `SELECT bm.*, p.name as matched_pet_name, p.breed as matched_breed, p.species as matched_species
    FROM breeding_matches bm
    JOIN pets p ON bm.matched_pet_id = p.id
    WHERE bm.breeding_id = ?`
  ).all(Number(req.params.id))

  const escrow = db.prepare('SELECT * FROM escrow_payments WHERE breeding_id = ?').all(Number(req.params.id))

  res.json({ success: true, data: { ...breeding, matches, escrow_payments: escrow } })
})

router.post('/:id/match', (req: Request, res: Response): void => {
  const breeding = db.prepare('SELECT * FROM breedings WHERE id = ?').get(Number(req.params.id)) as any
  if (!breeding) {
    res.status(404).json({ success: false, error: '配种信息不存在' })
    return
  }

  const candidates = db.prepare(
    'SELECT * FROM pets WHERE species = (SELECT species FROM pets WHERE id = ?) AND id != ? AND gender != (SELECT gender FROM pets WHERE id = ?) LIMIT 5'
  ).all(breeding.pet_id, breeding.pet_id, breeding.pet_id) as any[]

  const matches = candidates.map(pet => ({
    ...pet,
    match_score: Math.round((0.5 + Math.random() * 0.5) * 100) / 100
  })).sort((a, b) => b.match_score - a.match_score)

  res.json({ success: true, data: matches })
})

router.post('/:id/agreement', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const breeding = db.prepare('SELECT * FROM breedings WHERE id = ?').get(Number(req.params.id))
  if (!breeding) {
    res.status(404).json({ success: false, error: '配种信息不存在' })
    return
  }

  const { matched_pet_id } = req.body
  if (!matched_pet_id) {
    res.status(400).json({ success: false, error: '匹配宠物ID为必填项' })
    return
  }

  db.prepare(
    'INSERT INTO breeding_matches (breeding_id, matched_pet_id, match_score, status) VALUES (?, ?, ?, ?)'
  ).run(Number(req.params.id), matched_pet_id, 0.85, 'agreed')

  db.prepare('UPDATE breedings SET status = ? WHERE id = ?').run('agreed', Number(req.params.id))

  res.json({ success: true, data: { message: '配种协议已签署' } })
})

router.post('/:id/escrow', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { amount } = req.body
  if (!amount) {
    res.status(400).json({ success: false, error: '金额为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO escrow_payments (breeding_id, amount, payer_id, status) VALUES (?, ?, ?, ?)'
  ).run(Number(req.params.id), amount, Number(userId), 'pending')

  const payment = db.prepare('SELECT * FROM escrow_payments WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: payment })
})

router.put('/:id/complete', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const breeding = db.prepare('SELECT * FROM breedings WHERE id = ?').get(Number(req.params.id))
  if (!breeding) {
    res.status(404).json({ success: false, error: '配种信息不存在' })
    return
  }

  db.prepare('UPDATE breedings SET status = ? WHERE id = ?').run('completed', Number(req.params.id))
  db.prepare('UPDATE escrow_payments SET status = ? WHERE breeding_id = ?').run('released', Number(req.params.id))

  const updated = db.prepare('SELECT * FROM breedings WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

export default router
