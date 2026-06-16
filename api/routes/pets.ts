import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { Pet, VaccineRecord, DewormingRecord } from '@shared/types'

const router = Router()

function rowToPet(row: any, db: any): Pet {
  const vaccineRows = db.prepare('SELECT * FROM vaccine_records WHERE pet_id = ?').all(row.id) as any[]
  const dewormingRows = db.prepare('SELECT * FROM deworming_records WHERE pet_id = ?').all(row.id) as any[]

  const vaccineRecords: VaccineRecord[] = vaccineRows.map((v: any) => ({
    id: v.id,
    petId: v.pet_id,
    vaccineName: v.vaccine_name,
    date: v.date,
    nextDate: v.next_date,
    hospitalId: v.hospital_id,
  }))

  const dewormingRecords: DewormingRecord[] = dewormingRows.map((d: any) => ({
    id: d.id,
    petId: d.pet_id,
    type: d.type,
    productName: d.product_name,
    date: d.date,
    nextDate: d.next_date,
  }))

  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    gender: row.gender,
    birthday: row.birthday,
    weight: row.weight,
    avatar: row.avatar,
    healthStatus: row.health_status,
    vaccineRecords,
    dewormingRecords,
  }
}

router.get('/', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const rows = db.prepare('SELECT * FROM pets WHERE owner_id = ?').all(req.user!.id) as any[]
    const pets = rows.map((row) => rowToPet(row, db))

    res.json({
      success: true,
      data: pets,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取宠物列表失败',
    })
  }
})

router.post('/', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, species, breed, gender, birthday, weight, avatar, healthStatus } = req.body
    const db = getDatabase()

    if (!name || !species || !gender) {
      res.status(400).json({
        success: false,
        error: '宠物名称、物种和性别不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO pets (id, owner_id, name, species, breed, gender, birthday, weight, avatar, health_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      id,
      req.user!.id,
      name,
      species,
      breed || null,
      gender,
      birthday || null,
      weight || null,
      avatar || null,
      healthStatus || 'healthy',
      createdAt
    )

    const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(id) as any
    const pet = rowToPet(row, db)

    res.json({
      success: true,
      data: pet,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建宠物档案失败',
    })
  }
})

router.get('/:id', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(req.params.id, req.user!.id) as any

    if (!row) {
      res.status(404).json({
        success: false,
        error: '宠物不存在或无权访问',
      })
      return
    }

    const pet = rowToPet(row, db)

    res.json({
      success: true,
      data: pet,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取宠物详情失败',
    })
  }
})

router.put('/:id', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const existing = db.prepare('SELECT * FROM pets WHERE id = ? AND owner_id = ?').get(req.params.id, req.user!.id) as any

    if (!existing) {
      res.status(404).json({
        success: false,
        error: '宠物不存在或无权访问',
      })
      return
    }

    const { name, species, breed, gender, birthday, weight, avatar, healthStatus } = req.body

    db.prepare(
      `UPDATE pets SET 
        name = COALESCE(?, name),
        species = COALESCE(?, species),
        breed = COALESCE(?, breed),
        gender = COALESCE(?, gender),
        birthday = COALESCE(?, birthday),
        weight = COALESCE(?, weight),
        avatar = COALESCE(?, avatar),
        health_status = COALESCE(?, health_status)
      WHERE id = ?`
    ).run(
      name || null,
      species || null,
      breed || null,
      gender || null,
      birthday || null,
      weight || null,
      avatar || null,
      healthStatus || null,
      req.params.id
    )

    const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id) as any
    const pet = rowToPet(row, db)

    res.json({
      success: true,
      data: pet,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '更新宠物档案失败',
    })
  }
})

router.post('/:id/vaccine', authenticateToken, requireRole('owner', 'doctor', 'hospital'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id) as any

    if (!pet) {
      res.status(404).json({
        success: false,
        error: '宠物不存在',
      })
      return
    }

    const { vaccineName, date, nextDate, hospitalId } = req.body

    if (!vaccineName || !date) {
      res.status(400).json({
        success: false,
        error: '疫苗名称和接种日期不能为空',
      })
      return
    }

    const id = uuidv4()
    db.prepare(
      'INSERT INTO vaccine_records (id, pet_id, vaccine_name, date, next_date, hospital_id) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, vaccineName, date, nextDate || null, hospitalId || null)

    const record = db.prepare('SELECT * FROM vaccine_records WHERE id = ?').get(id) as any

    res.json({
      success: true,
      data: {
        id: record.id,
        petId: record.pet_id,
        vaccineName: record.vaccine_name,
        date: record.date,
        nextDate: record.next_date,
        hospitalId: record.hospital_id,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '添加疫苗记录失败',
    })
  }
})

router.post('/:id/deworming', authenticateToken, requireRole('owner', 'doctor', 'hospital'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const pet = db.prepare('SELECT * FROM pets WHERE id = ?').get(req.params.id) as any

    if (!pet) {
      res.status(404).json({
        success: false,
        error: '宠物不存在',
      })
      return
    }

    const { type, productName, date, nextDate } = req.body

    if (!type || !productName || !date) {
      res.status(400).json({
        success: false,
        error: '驱虫类型、产品名称和日期不能为空',
      })
      return
    }

    const id = uuidv4()
    db.prepare(
      'INSERT INTO deworming_records (id, pet_id, type, product_name, date, next_date) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, type, productName, date, nextDate || null)

    const record = db.prepare('SELECT * FROM deworming_records WHERE id = ?').get(id) as any

    res.json({
      success: true,
      data: {
        id: record.id,
        petId: record.pet_id,
        type: record.type,
        productName: record.product_name,
        date: record.date,
        nextDate: record.next_date,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '添加驱虫记录失败',
    })
  }
})

export default router
