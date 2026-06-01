import { Router } from 'express'
import db from '../db/index.js'
import { z } from 'zod'
import { authenticateToken, AuthRequest } from '../middleware/auth.js'

const router = Router()

const planItemSchema = z.object({
  treatment_id: z.number(),
  tooth_position: z.string().optional(),
  phase: z.number().optional(),
  price: z.number(),
  quantity: z.number().default(1),
  notes: z.string().optional()
})

const planSchema = z.object({
  patient_id: z.number(),
  doctor_id: z.number(),
  appointment_id: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  doctor_opinion: z.string().optional(),
  items: z.array(planItemSchema)
})

router.get('/', authenticateToken, (req, res) => {
  try {
    const { patient_id, status } = req.query

    let query = `
      SELECT tp.*, p.name as patient_name, u.name as doctor_name
      FROM treatment_plans tp
      LEFT JOIN patients p ON tp.patient_id = p.id
      LEFT JOIN users u ON tp.doctor_id = u.id
      WHERE 1=1
    `
    const params: any[] = []

    if (patient_id) {
      query += ' AND tp.patient_id = ?'
      params.push(patient_id)
    }
    if (status) {
      query += ' AND tp.status = ?'
      params.push(status)
    }

    query += ' ORDER BY tp.created_at DESC'
    const plans = db.prepare(query).all(...params) as any[]

    const plansWithItems = plans.map(plan => {
      const items = db.prepare(`
        SELECT tpi.*, t.name as treatment_name
        FROM treatment_plan_items tpi
        LEFT JOIN treatments t ON tpi.treatment_id = t.id
        WHERE tpi.plan_id = ?
      `).all(plan.id)
      return { ...plan, items }
    })

    res.json(plansWithItems)
  } catch (error) {
    res.status(500).json({ error: '获取治疗计划失败' })
  }
})

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const plan = db.prepare(`
      SELECT tp.*, p.name as patient_name, p.phone as patient_phone, u.name as doctor_name
      FROM treatment_plans tp
      LEFT JOIN patients p ON tp.patient_id = p.id
      LEFT JOIN users u ON tp.doctor_id = u.id
      WHERE tp.id = ?
    `).get(req.params.id) as any

    if (!plan) {
      return res.status(404).json({ error: '治疗计划不存在' })
    }

    const items = db.prepare(`
      SELECT tpi.*, t.name as treatment_name
      FROM treatment_plan_items tpi
      LEFT JOIN treatments t ON tpi.treatment_id = t.id
      WHERE tpi.plan_id = ?
    `).all(req.params.id)

    res.json({ ...plan, items })
  } catch (error) {
    res.status(500).json({ error: '获取治疗计划详情失败' })
  }
})

router.post('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = planSchema.parse(req.body)
    const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const result = db.prepare(`
      INSERT INTO treatment_plans (patient_id, doctor_id, appointment_id, name, description, total_price, doctor_opinion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.patient_id, data.doctor_id, data.appointment_id,
      data.name, data.description, totalPrice, data.doctor_opinion
    )

    const planId = result.lastInsertRowid as number
    const insertItem = db.prepare(`
      INSERT INTO treatment_plan_items (plan_id, treatment_id, tooth_position, phase, price, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    data.items.forEach(item => {
      insertItem.run(
        planId, item.treatment_id, item.tooth_position,
        item.phase, item.price, item.quantity, item.notes
      )
    })

    res.json({ id: planId, ...data, total_price: totalPrice })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '创建治疗计划失败' })
  }
})

router.put('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const data = planSchema.parse(req.body)
    const planId = Number(req.params.id)
    const totalPrice = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    db.prepare(`
      UPDATE treatment_plans 
      SET patient_id=?, doctor_id=?, appointment_id=?, name=?, description=?, total_price=?, doctor_opinion=?, status='draft', updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(
      data.patient_id, data.doctor_id, data.appointment_id,
      data.name, data.description, totalPrice, data.doctor_opinion, planId
    )

    db.prepare('DELETE FROM treatment_plan_items WHERE plan_id = ?').run(planId)
    
    const insertItem = db.prepare(`
      INSERT INTO treatment_plan_items (plan_id, treatment_id, tooth_position, phase, price, quantity, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    data.items.forEach(item => {
      insertItem.run(
        planId, item.treatment_id, item.tooth_position,
        item.phase, item.price, item.quantity, item.notes
      )
    })

    res.json({ id: planId, ...data, total_price: totalPrice })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message })
    }
    res.status(500).json({ error: '更新治疗计划失败' })
  }
})

router.post('/:id/confirm', authenticateToken, (req, res) => {
  try {
    const planId = Number(req.params.id)

    db.prepare(`
      UPDATE treatment_plans 
      SET status='confirmed', patient_confirmed=1, confirmed_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP
      WHERE id=?
    `).run(planId)

    const plan = db.prepare('SELECT * FROM treatment_plans WHERE id = ?').get(planId) as any
    
    db.prepare(`
      INSERT INTO invoices (patient_id, plan_id, total_amount, status, created_by)
      VALUES (?, ?, ?, 'pending', ?)
    `).run(plan.patient_id, planId, plan.total_price, (req as AuthRequest).user?.id || 1)

    res.json({ success: true, message: '治疗计划已确认，收费单已生成' })
  } catch (error) {
    res.status(500).json({ error: '确认治疗计划失败' })
  }
})

export default router
