import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const pageSize = Math.max(1, Number(req.query.pageSize) || 20)
    const offset = (page - 1) * pageSize

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (req.query.status) {
      where += ' AND status = ?'
      params.push(req.query.status)
    }
    if (req.query.is_novice !== undefined) {
      where += ' AND is_novice = ?'
      params.push(Number(req.query.is_novice))
    }
    if (req.query.search) {
      where += ' AND (name LIKE ? OR phone LIKE ?)'
      params.push(`%${req.query.search}%`, `%${req.query.search}%`)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM riders ${where}`).get(...params) as any).count
    const rows = db.prepare(`SELECT * FROM riders ${where} ORDER BY id DESC LIMIT ? OFFSET ?`).all(...params, pageSize, offset)

    res.json({ success: true, data: { list: rows, total, page, pageSize } })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
    if (!rider) {
      res.status(404).json({ success: false, error: 'Rider not found' })
      return
    }
    const violations = db.prepare('SELECT * FROM rider_violations WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)
    const mentorshipsAsMentor = db.prepare('SELECT m.*, r.name as mentee_name FROM mentorships m JOIN riders r ON m.mentee_id = r.id WHERE m.mentor_id = ?').all(req.params.id)
    const mentorshipsAsMentee = db.prepare('SELECT m.*, r.name as mentor_name FROM mentorships m JOIN riders r ON m.mentor_id = r.id WHERE m.mentee_id = ?').all(req.params.id)
    const noviceCards = db.prepare('SELECT * FROM novice_cards WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)

    res.json({
      success: true,
      data: { ...rider, violations, mentorships: { asMentor: mentorshipsAsMentor, asMentee: mentorshipsAsMentee }, noviceCards }
    })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { name, phone, device_model, battery_health, max_load, is_novice } = req.body
    if (!name || !phone) {
      res.status(400).json({ success: false, error: 'name and phone are required' })
      return
    }

    const now = new Date().toISOString()
    const result = db.prepare(
      `INSERT INTO riders (name, phone, device_model, battery_health, max_load, is_novice, novice_start_date, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'online', ?, ?)`
    ).run(name, phone, device_model || null, battery_health ?? 100, max_load ?? 5, is_novice ?? 1, is_novice !== 0 ? now : null, now, now)

    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: rider })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: 'Phone number already exists' })
      return
    }
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Rider not found' })
      return
    }

    const { name, phone, device_model, battery_health, max_load, status, latitude, longitude, is_novice } = req.body
    const now = new Date().toISOString()

    db.prepare(
      `UPDATE riders SET name=?, phone=?, device_model=?, battery_health=?, max_load=?, status=?, latitude=?, longitude=?, is_novice=?, updated_at=?
       WHERE id=?`
    ).run(
      name ?? (existing as any).name,
      phone ?? (existing as any).phone,
      device_model ?? (existing as any).device_model,
      battery_health ?? (existing as any).battery_health,
      max_load ?? (existing as any).max_load,
      status ?? (existing as any).status,
      latitude ?? (existing as any).latitude,
      longitude ?? (existing as any).longitude,
      is_novice ?? (existing as any).is_novice,
      now,
      req.params.id
    )

    const rider = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
    res.json({ success: true, data: rider })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM riders WHERE id = ?').get(req.params.id)
    if (!existing) {
      res.status(404).json({ success: false, error: 'Rider not found' })
      return
    }

    db.prepare('DELETE FROM riders WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/violations', (req: Request, res: Response): void => {
  try {
    const violations = db.prepare('SELECT * FROM rider_violations WHERE rider_id = ? ORDER BY created_at DESC').all(req.params.id)
    res.json({ success: true, data: violations })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/violations', (req: Request, res: Response): void => {
  try {
    const { type, description, order_id, penalty_points } = req.body
    if (!type) {
      res.status(400).json({ success: false, error: 'type is required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO rider_violations (rider_id, type, description, order_id, penalty_points) VALUES (?, ?, ?, ?, ?)`
    ).run(req.params.id, type, description || null, order_id || null, penalty_points ?? 0)

    const violation = db.prepare('SELECT * FROM rider_violations WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: violation })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.get('/:id/income', (req: Request, res: Response): void => {
  try {
    const income = db.prepare(
      `SELECT COALESCE(SUM(base_fee), 0) as total_base_fee,
              COALESCE(SUM(reward), 0) as total_reward,
              COALESCE(SUM(subsidy), 0) as total_subsidy,
              COALESCE(SUM(base_fee + reward + subsidy), 0) as total_income
       FROM delivery_orders WHERE rider_id = ? AND status = 'delivered'`
    ).get(req.params.id) as any

    res.json({ success: true, data: income })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/mentor', (req: Request, res: Response): void => {
  try {
    const { mentor_id } = req.body
    if (!mentor_id) {
      res.status(400).json({ success: false, error: 'mentor_id is required' })
      return
    }

    const mentor = db.prepare('SELECT * FROM riders WHERE id = ?').get(mentor_id)
    if (!mentor) {
      res.status(404).json({ success: false, error: 'Mentor not found' })
      return
    }

    const existing = db.prepare('SELECT * FROM mentorships WHERE mentee_id = ? AND status = ?').get(req.params.id, 'active')
    if (existing) {
      res.status(409).json({ success: false, error: 'Rider already has an active mentorship' })
      return
    }

    const result = db.prepare(
      `INSERT INTO mentorships (mentor_id, mentee_id, status, started_at) VALUES (?, ?, 'active', ?)`
    ).run(mentor_id, req.params.id, new Date().toISOString())

    const mentorship = db.prepare('SELECT * FROM mentorships WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: mentorship })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.post('/:id/novice-card', (req: Request, res: Response): void => {
  try {
    const { card_type, reason } = req.body
    if (!card_type) {
      res.status(400).json({ success: false, error: 'card_type is required' })
      return
    }

    const result = db.prepare(
      `INSERT INTO novice_cards (rider_id, card_type, reason) VALUES (?, ?, ?)`
    ).run(req.params.id, card_type, reason || null)

    const card = db.prepare('SELECT * FROM novice_cards WHERE id = ?').get(result.lastInsertRowid)
    res.status(201).json({ success: true, data: card })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

router.put('/:id/novice-card/:cardId/use', (req: Request, res: Response): void => {
  try {
    const card = db.prepare('SELECT * FROM novice_cards WHERE id = ? AND rider_id = ?').get(req.params.cardId, req.params.id)
    if (!card) {
      res.status(404).json({ success: false, error: 'Novice card not found' })
      return
    }
    if ((card as any).used) {
      res.status(400).json({ success: false, error: 'Card already used' })
      return
    }

    db.prepare('UPDATE novice_cards SET used = 1 WHERE id = ?').run(req.params.cardId)
    const updated = db.prepare('SELECT * FROM novice_cards WHERE id = ?').get(req.params.cardId)
    res.json({ success: true, data: updated })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message })
  }
})

export default router
