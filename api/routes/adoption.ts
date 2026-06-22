import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { status, species } = req.query
  let sql = `SELECT a.*, p.name as pet_name, p.breed, p.species, p.gender, p.avatar_url as pet_avatar, u.name as owner_name
    FROM adoptions a
    JOIN pets p ON a.pet_id = p.id
    JOIN users u ON a.owner_id = u.id
    WHERE 1=1`
  const params: any[] = []

  if (status) {
    sql += ' AND a.status = ?'
    params.push(status)
  }
  if (species) {
    sql += ' AND p.species = ?'
    params.push(species)
  }
  sql += ' ORDER BY a.created_at DESC'

  const adoptions = db.prepare(sql).all(...params)
  res.json({ success: true, data: adoptions })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { pet_id, reason, requirements, images } = req.body
  if (!pet_id) {
    res.status(400).json({ success: false, error: '宠物ID为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO adoptions (pet_id, owner_id, reason, requirements, images) VALUES (?, ?, ?, ?, ?)'
  ).run(pet_id, Number(userId), reason || null, requirements || null, images ? JSON.stringify(images) : null)

  db.prepare(
    'INSERT INTO filing_records (filing_type, related_id, status, request_data) VALUES (?, ?, ?, ?)'
  ).run('adoption', Number(result.lastInsertRowid), 'pending', JSON.stringify({ adoption_id: result.lastInsertRowid, pet_id }))

  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: adoption })
})

router.get('/:id', (req: Request, res: Response): void => {
  const adoption = db.prepare(
    `SELECT a.*, p.name as pet_name, p.breed, p.species, p.gender, p.birth_date, p.weight, p.avatar_url as pet_avatar,
      u.name as owner_name, u.phone as owner_phone
    FROM adoptions a
    JOIN pets p ON a.pet_id = p.id
    JOIN users u ON a.owner_id = u.id
    WHERE a.id = ?`
  ).get(Number(req.params.id)) as any

  if (!adoption) {
    res.status(404).json({ success: false, error: '领养信息不存在' })
    return
  }

  const applications = db.prepare(
    `SELECT aa.*, u.name as applicant_name, u.phone as applicant_phone
    FROM adoption_applications aa
    JOIN users u ON aa.applicant_id = u.id
    WHERE aa.adoption_id = ?`
  ).all(Number(req.params.id))

  res.json({ success: true, data: { ...adoption, applications } })
})

router.post('/:id/apply', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(Number(req.params.id))
  if (!adoption) {
    res.status(404).json({ success: false, error: '领养信息不存在' })
    return
  }

  const { experience, living_condition, has_other_pets } = req.body
  const result = db.prepare(
    'INSERT INTO adoption_applications (adoption_id, applicant_id, experience, living_condition, has_other_pets) VALUES (?, ?, ?, ?, ?)'
  ).run(Number(req.params.id), Number(userId), experience || null, living_condition || null, has_other_pets ? 1 : 0)

  const application = db.prepare('SELECT * FROM adoption_applications WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: application })
})

router.put('/:id/review', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { status, application_id } = req.body
  if (!status || !application_id) {
    res.status(400).json({ success: false, error: '审核状态和申请ID为必填项' })
    return
  }

  const application = db.prepare('SELECT * FROM adoption_applications WHERE id = ?').get(application_id)
  if (!application) {
    res.status(404).json({ success: false, error: '申请不存在' })
    return
  }

  db.prepare('UPDATE adoption_applications SET status = ? WHERE id = ?').run(status, Number(application_id))

  if (status === 'approved') {
    db.prepare('UPDATE adoptions SET status = ? WHERE id = ?').run('approved', Number(req.params.id))
  } else if (status === 'rejected') {
    db.prepare('UPDATE adoptions SET status = ? WHERE id = ?').run('rejected', Number(req.params.id))
  }

  const updated = db.prepare('SELECT * FROM adoption_applications WHERE id = ?').get(Number(application_id))
  res.json({ success: true, data: updated })
})

router.put('/:id/confirm', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { applicant_id } = req.body
  if (!applicant_id) {
    res.status(400).json({ success: false, error: '领养人ID为必填项' })
    return
  }

  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(Number(req.params.id)) as any
  if (!adoption) {
    res.status(404).json({ success: false, error: '领养信息不存在' })
    return
  }

  db.prepare('UPDATE adoptions SET status = ? WHERE id = ?').run('completed', Number(req.params.id))
  db.prepare('UPDATE pets SET owner_id = ? WHERE id = ?').run(Number(applicant_id), adoption.pet_id)

  const updated = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

router.get('/:id/flow', (req: Request, res: Response): void => {
  const adoption = db.prepare('SELECT * FROM adoptions WHERE id = ?').get(Number(req.params.id)) as any
  if (!adoption) {
    res.status(404).json({ success: false, error: '领养信息不存在' })
    return
  }

  const steps = [
    { step: 'submit', label: '提交领养', completed: true },
    { step: 'pending_review', label: '待审核', completed: ['pending_review', 'approved', 'completed'].includes(adoption.status) },
    { step: 'approved', label: '审核通过', completed: ['approved', 'completed'].includes(adoption.status) },
    { step: 'completed', label: '线下交接', completed: adoption.status === 'completed' }
  ]

  res.json({ success: true, data: { current_status: adoption.status, steps } })
})

export default router
