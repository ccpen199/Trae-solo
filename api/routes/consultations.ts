import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import { encryptConsultationMessage, decryptConsultationMessage } from '../services/crypto.js'
import type { Consultation, ConsultationMessage, Prescription, PrescriptionItem } from '@shared/types'

const router = Router()

function rowToConsultation(row: any): Consultation {
  return {
    id: row.id,
    ownerId: row.owner_id,
    doctorId: row.doctor_id,
    petId: row.pet_id,
    type: row.type,
    status: row.status,
    symptoms: row.symptoms,
    diagnosis: row.diagnosis,
    prescriptionId: row.prescription_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

function rowToMessage(row: any): ConsultationMessage {
  return {
    id: row.id,
    consultationId: row.consultation_id,
    senderId: row.sender_id,
    contentEncrypted: row.content_encrypted,
    messageType: row.message_type,
    createdAt: row.created_at,
  }
}

router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const userId = req.user!.id
    const role = req.user!.role

    let sql = 'SELECT * FROM consultations WHERE 1=1'
    const params: any[] = []

    if (role === 'owner') {
      sql += ' AND owner_id = ?'
      params.push(userId)
    } else if (role === 'doctor') {
      sql += ' AND doctor_id = ?'
      params.push(userId)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const consultations = rows.map(rowToConsultation)

    res.json({
      success: true,
      data: consultations,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取问诊列表失败',
    })
  }
})

router.post('/', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { doctorId, petId, type, symptoms } = req.body
    const db = getDatabase()

    if (!doctorId || !petId || !type) {
      res.status(400).json({
        success: false,
        error: '医生、宠物和问诊类型不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO consultations (id, owner_id, doctor_id, pet_id, type, status, symptoms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(id, req.user!.id, doctorId, petId, type, 'pending', symptoms || null, createdAt)

    const row = db.prepare('SELECT * FROM consultations WHERE id = ?').get(id) as any
    const consultation = rowToConsultation(row)

    res.json({
      success: true,
      data: consultation,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '创建问诊失败',
    })
  }
})

router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const userId = req.user!.id
    const role = req.user!.role

    let sql = 'SELECT * FROM consultations WHERE id = ?'
    const params: any[] = [req.params.id]

    if (role === 'owner') {
      sql += ' AND owner_id = ?'
      params.push(userId)
    } else if (role === 'doctor') {
      sql += ' AND doctor_id = ?'
      params.push(userId)
    }

    const row = db.prepare(sql).get(...params) as any

    if (!row) {
      res.status(404).json({
        success: false,
        error: '问诊不存在或无权访问',
      })
      return
    }

    const consultation = rowToConsultation(row)

    const messageRows = db.prepare('SELECT * FROM consultation_messages WHERE consultation_id = ? ORDER BY created_at ASC').all(req.params.id) as any[]
    const messages = messageRows.map(rowToMessage)

    const decryptedMessages = messages.map((m) => ({
      ...m,
      content: decryptConsultationMessage(m.contentEncrypted),
    }))

    res.json({
      success: true,
      data: {
        ...consultation,
        messages: decryptedMessages,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取问诊详情失败',
    })
  }
})

router.post('/:id/messages', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const userId = req.user!.id
    const role = req.user!.role

    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ?').get(req.params.id) as any

    if (!consultation) {
      res.status(404).json({
        success: false,
        error: '问诊不存在',
      })
      return
    }

    if (role === 'owner' && consultation.owner_id !== userId) {
      res.status(403).json({
        success: false,
        error: '无权访问该问诊',
      })
      return
    }

    if (role === 'doctor' && consultation.doctor_id !== userId) {
      res.status(403).json({
        success: false,
        error: '无权访问该问诊',
      })
      return
    }

    const { content, messageType } = req.body

    if (!content) {
      res.status(400).json({
        success: false,
        error: '消息内容不能为空',
      })
      return
    }

    const id = uuidv4()
    const contentEncrypted = encryptConsultationMessage(content)
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'INSERT INTO consultation_messages (id, consultation_id, sender_id, content_encrypted, message_type, created_at) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(id, req.params.id, userId, contentEncrypted, messageType || 'text', createdAt)

    const row = db.prepare('SELECT * FROM consultation_messages WHERE id = ?').get(id) as any
    const message = rowToMessage(row)

    res.json({
      success: true,
      data: {
        ...message,
        content,
      },
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '发送消息失败',
    })
  }
})

router.post('/:id/prescription', authenticateToken, requireRole('doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const userId = req.user!.id

    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ? AND doctor_id = ?').get(req.params.id, userId) as any

    if (!consultation) {
      res.status(404).json({
        success: false,
        error: '问诊不存在或无权操作',
      })
      return
    }

    const { medicines } = req.body

    if (!medicines || !Array.isArray(medicines) || medicines.length === 0) {
      res.status(400).json({
        success: false,
        error: '处方药品不能为空',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const doctorSignature = `DR_SIG_${uuidv4().slice(0, 8).toUpperCase()}`

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO prescriptions (id, consultation_id, doctor_id, owner_id, pet_id, doctor_signature, owner_acknowledged, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)'
      ).run(id, consultation.id, userId, consultation.owner_id, consultation.pet_id, doctorSignature, createdAt)

      const insertItem = db.prepare(
        'INSERT INTO prescription_items (id, prescription_id, product_id, product_name, dosage, frequency, duration, is_prescription) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      )

      for (const item of medicines) {
        insertItem.run(
          uuidv4(),
          id,
          item.productId || null,
          item.productName,
          item.dosage,
          item.frequency,
          item.duration,
          item.isPrescription ? 1 : 0
        )
      }

      db.prepare('UPDATE consultations SET prescription_id = ? WHERE id = ?').run(id, consultation.id)
    })

    tx()

    const prescriptionRow = db.prepare('SELECT * FROM prescriptions WHERE id = ?').get(id) as any
    const itemRows = db.prepare('SELECT * FROM prescription_items WHERE prescription_id = ?').all(id) as any[]

    const items: PrescriptionItem[] = itemRows.map((row: any) => ({
      productId: row.product_id,
      productName: row.product_name,
      dosage: row.dosage,
      frequency: row.frequency,
      duration: row.duration,
      isPrescription: row.is_prescription === 1,
    }))

    const prescription: Prescription = {
      id: prescriptionRow.id,
      consultationId: prescriptionRow.consultation_id,
      doctorId: prescriptionRow.doctor_id,
      ownerId: prescriptionRow.owner_id,
      petId: prescriptionRow.pet_id,
      medicines: items,
      doctorSignature: prescriptionRow.doctor_signature,
      ownerAcknowledged: prescriptionRow.owner_acknowledged === 1,
      createdAt: prescriptionRow.created_at,
    }

    res.json({
      success: true,
      data: prescription,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '开具处方失败',
    })
  }
})

router.post('/:id/complete', authenticateToken, requireRole('doctor'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const userId = req.user!.id

    const consultation = db.prepare('SELECT * FROM consultations WHERE id = ? AND doctor_id = ?').get(req.params.id, userId) as any

    if (!consultation) {
      res.status(404).json({
        success: false,
        error: '问诊不存在或无权操作',
      })
      return
    }

    const { diagnosis } = req.body
    const completedAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

    db.prepare(
      'UPDATE consultations SET status = ?, diagnosis = COALESCE(?, diagnosis), completed_at = ? WHERE id = ?'
    ).run('completed', diagnosis || null, completedAt, consultation.id)

    db.prepare('UPDATE doctors SET consultation_count = consultation_count + 1 WHERE user_id = ?').run(userId)

    const row = db.prepare('SELECT * FROM consultations WHERE id = ?').get(consultation.id) as any
    const updated = rowToConsultation(row)

    res.json({
      success: true,
      data: updated,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '完成问诊失败',
    })
  }
})

export default router
