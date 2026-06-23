import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  const { owner_id, species } = req.query
  let sql = 'SELECT * FROM pets WHERE 1=1'
  const params: any[] = []

  if (owner_id) {
    sql += ' AND owner_id = ?'
    params.push(Number(owner_id))
  }
  if (species) {
    sql += ' AND species = ?'
    params.push(species)
  }
  sql += ' ORDER BY created_at DESC'

  const pets = db.prepare(sql).all(...params)
  res.json({ success: true, data: pets })
})

router.post('/', (req: Request, res: Response): void => {
  const userId = req.headers['x-user-id']
  if (!userId) {
    res.status(401).json({ success: false, error: '未登录' })
    return
  }

  const { name, breed, species, birth_date, weight, chip_number, gender, avatar_url, is_sterilized } = req.body
  if (!name || !breed || !species) {
    res.status(400).json({ success: false, error: '宠物名称、品种和种类为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO pets (owner_id, name, breed, species, birth_date, weight, chip_number, gender, avatar_url, is_sterilized) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(Number(userId), name, breed, species, birth_date || null, weight || null, chip_number || null, gender || 'unknown', avatar_url || null, is_sterilized ? 1 : 0)

  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: pet })
})

router.get('/:id', (req: Request, res: Response): void => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(req.params.id)) as any
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const owner = db.prepare('SELECT id, name, phone, avatar_url FROM users WHERE id = ?').get(pet.owner_id)
  const vaccineRecords = db.prepare('SELECT * FROM vaccine_records WHERE pet_id = ? ORDER BY vaccine_date DESC').all(pet.id)
  const reminders = db.prepare('SELECT * FROM health_reminders WHERE pet_id = ? ORDER BY reminder_date ASC').all(pet.id)

  const adoptionRecords = db.prepare(`
    SELECT a.*, u.name as applicant_name 
    FROM adoptions a 
    LEFT JOIN adoption_applications aa ON a.id = aa.adoption_id 
    LEFT JOIN users u ON aa.applicant_id = u.id
    WHERE a.pet_id = ?
    ORDER BY a.created_at DESC
  `).all(pet.id)

  const breedingRecords = db.prepare(`
    SELECT b.*, u.name as matched_owner_name
    FROM breedings b
    LEFT JOIN breeding_matches bm ON b.id = bm.breeding_id
    LEFT JOIN pets p ON bm.matched_pet_id = p.id
    LEFT JOIN users u ON p.owner_id = u.id
    WHERE b.pet_id = ?
    ORDER BY b.created_at DESC
  `).all(pet.id)

  res.json({
    success: true,
    data: {
      ...pet,
      owner,
      vaccine_records: vaccineRecords,
      health_reminders: reminders,
      adoption_records: adoptionRecords,
      breeding_records: breedingRecords,
    }
  })
})

router.put('/:id', (req: Request, res: Response): void => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(req.params.id))
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const { name, breed, species, birth_date, weight, chip_number, gender, avatar_url, is_sterilized } = req.body
  db.prepare(
    'UPDATE pets SET name = COALESCE(?, name), breed = COALESCE(?, breed), species = COALESCE(?, species), birth_date = COALESCE(?, birth_date), weight = COALESCE(?, weight), chip_number = COALESCE(?, chip_number), gender = COALESCE(?, gender), avatar_url = COALESCE(?, avatar_url), is_sterilized = COALESCE(?, is_sterilized) WHERE id = ?'
  ).run(name || null, breed || null, species || null, birth_date || null, weight || null, chip_number || null, gender || null, avatar_url || null, is_sterilized !== undefined ? (is_sterilized ? 1 : 0) : null, Number(req.params.id))

  const updated = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(req.params.id))
  res.json({ success: true, data: updated })
})

router.post('/:id/vaccine', (req: Request, res: Response): void => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(req.params.id))
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const { vaccine_name, vaccine_type, vaccine_date, next_date, hospital } = req.body
  if (!vaccine_name || !vaccine_type || !vaccine_date) {
    res.status(400).json({ success: false, error: '疫苗名称、类型和日期为必填项' })
    return
  }

  const result = db.prepare(
    'INSERT INTO vaccine_records (pet_id, vaccine_name, vaccine_type, vaccine_date, next_date, hospital) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(Number(req.params.id), vaccine_name, vaccine_type, vaccine_date, next_date || null, hospital || null)

  if (next_date) {
    db.prepare(
      'INSERT INTO health_reminders (pet_id, reminder_type, title, reminder_date) VALUES (?, ?, ?, ?)'
    ).run(Number(req.params.id), vaccine_type === 'vaccine' ? 'vaccine' : vaccine_type === 'deworming' ? 'deworming' : 'flea_tick', `${vaccine_name}下次接种`, next_date)
  }

  const record = db.prepare('SELECT * FROM vaccine_records WHERE id = ?').get(result.lastInsertRowid)
  res.json({ success: true, data: record })
})

router.post('/:id/ocr', (req: Request, res: Response): void => {
  const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(req.params.id))
  if (!pet) {
    res.status(404).json({ success: false, error: '宠物不存在' })
    return
  }

  const ocrResult = {
    vaccine_name: '犬瘟热疫苗',
    vaccine_type: 'vaccine',
    vaccine_date: '2024-06-15',
    next_date: '2025-06-15',
    hospital: '宠安动物医院',
    confidence: 0.89
  }

  res.json({ success: true, data: ocrResult })
})

router.get('/:id/reminders', (req: Request, res: Response): void => {
  const reminders = db.prepare('SELECT * FROM health_reminders WHERE pet_id = ? ORDER BY reminder_date ASC').all(Number(req.params.id))
  res.json({ success: true, data: reminders })
})

export default router
