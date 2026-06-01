import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest, maskPatientData } from '../middleware/auth.js'

const router = Router()

const patientSchema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  gender: z.string().optional(),
  birth_date: z.string().optional(),
  phone: z.string().optional(),
  id_card: z.string().optional(),
  address: z.string().optional(),
  email: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional()
})

router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { keyword, page = 1, pageSize = 20 } = req.query
    const offset = (Number(page) - 1) * Number(pageSize)

    let query = 'SELECT * FROM patients WHERE 1=1'
    const params: any[] = []

    if (keyword) {
      query += ' AND (name LIKE ? OR phone LIKE ?)'
      params.push(`%${keyword}%`, `%${keyword}%`)
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
    params.push(Number(pageSize), offset)

    const patients = db.prepare(query).all(...params) as any[]
    const total = db.prepare('SELECT COUNT(*) as count FROM patients WHERE 1=1').get() as { count: number }

    const maskedPatients = patients.map(p => maskPatientData(p, req.user?.role || ''))

    res.json({
      list: maskedPatients,
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize)
    })
  } catch (error) {
    res.status(500).json({ error: '获取患者列表失败' })
  }
})

router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(req.params.id) as any
    
    if (!patient) {
      return res.status(404).json({ error: '患者不存在' })
    }

    const images = db.prepare('SELECT * FROM patient_images WHERE patient_id = ?').all(req.params.id)
    const visits = db.prepare(`
      SELECT vr.*, u.name as doctor_name 
      FROM visit_records vr 
      LEFT JOIN users u ON vr.doctor_id = u.id 
      WHERE vr.patient_id = ? 
      ORDER BY vr.created_at DESC
    `).all(req.params.id)

    const maskedPatient = maskPatientData(patient, req.user?.role || '')

    res.json({
      ...maskedPatient,
      images,
      visits
    })
  } catch (error) {
    res.status(500).json({ error: '获取患者详情失败' })
  }
})

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = patientSchema.parse(req.body)

    const result = db.prepare(`
      INSERT INTO patients (name, gender, birth_date, phone, id_card, address, email, medical_history, allergies)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.name, data.gender, data.birth_date, data.phone, data.id_card,
      data.address, data.email, data.medical_history, data.allergies
    )

    res.json({ id: result.lastInsertRowid, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建患者失败' })
  }
})

router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = patientSchema.parse(req.body)

    db.prepare(`
      UPDATE patients 
      SET name=?, gender=?, birth_date=?, phone=?, id_card=?, address=?, email=?, medical_history=?, allergies=?, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      data.name, data.gender, data.birth_date, data.phone, data.id_card,
      data.address, data.email, data.medical_history, data.allergies, req.params.id
    )

    res.json({ id: req.params.id, ...data })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '更新患者失败' })
  }
})

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM patients WHERE id = ?').run(req.params.id)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: '删除患者失败' })
  }
})

export default router
