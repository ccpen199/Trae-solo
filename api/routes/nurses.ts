import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../middleware.js'

const router = Router()

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { page = '1', limit = '10', status, qualification } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string)))
    const offset = (pageNum - 1) * limitNum

    let where = '1=1'
    const params: any[] = []

    if (status) {
      where += ' AND n.status = ?'
      params.push(status)
    }
    if (qualification) {
      where += ' AND n.qualification = ?'
      params.push(qualification)
    }

    const total = (db.prepare(`SELECT COUNT(*) as count FROM nurses n WHERE ${where}`).get(...params) as any).count

    const nurses = db.prepare(
      `SELECT n.*, u.username, u.name, u.phone FROM nurses n JOIN users u ON n.user_id = u.id WHERE ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limitNum, offset) as any[]

    res.json({
      success: true,
      data: {
        items: nurses,
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const nurse = db.prepare(
      'SELECT n.*, u.username, u.name, u.phone FROM nurses n JOIN users u ON n.user_id = u.id WHERE n.id = ?'
    ).get(req.params.id) as any

    if (!nurse) {
      res.status(404).json({ success: false, error: '护士不存在' })
      return
    }

    const verification = db.prepare(
      'SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(nurse.id) as any

    const educationRecords = db.prepare(
      'SELECT er.*, ec.title, ec.credit_value, ec.category FROM education_records er JOIN education_courses ec ON er.course_id = ec.id WHERE er.nurse_id = ?'
    ).all(nurse.id) as any[]

    res.json({
      success: true,
      data: { ...nurse, verification, education_records: educationRecords }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/verification/ocr', authMiddleware, roleMiddleware('admin', 'nurse'), (req: Request, res: Response): void => {
  try {
    const { nurse_id } = req.body

    const nurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(nurse_id) as any
    if (!nurse) {
      res.status(404).json({ success: false, error: '护士不存在' })
      return
    }

    const ocrResult = JSON.stringify({
      name: nurse.license_number ? '模拟姓名' : '未知',
      license_number: nurse.license_number || 'NUR-NEW-000',
      qualification: nurse.qualification || 'registered_nurse',
      issue_date: '2023-06-15',
      expiry_date: '2025-06-15',
      issuing_authority: '上海市卫生健康委员会',
      ocr_confidence: 0.95
    })

    let verification = db.prepare(
      'SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(nurse_id) as any

    if (verification) {
      db.prepare(
        'UPDATE nurse_verifications SET ocr_result = ?, status = ? WHERE id = ?'
      ).run(ocrResult, 'ocr_done', verification.id)
      verification.status = 'ocr_done'
    } else {
      db.prepare(
        'INSERT INTO nurse_verifications (nurse_id, ocr_result, status) VALUES (?, ?, ?)'
      ).run(nurse_id, ocrResult, 'ocr_done')
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'ocr_verify', 'nurse', nurse_id, req.ip)

    res.json({
      success: true,
      data: { ocr_result: JSON.parse(ocrResult), status: 'ocr_done' }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/verification/compare', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { nurse_id } = req.body

    const nurse = db.prepare('SELECT * FROM nurses WHERE id = ?').get(nurse_id) as any
    if (!nurse) {
      res.status(404).json({ success: false, error: '护士不存在' })
      return
    }

    const healthCommitteeResult = JSON.stringify({
      name: '模拟姓名',
      license_number: nurse.license_number || 'NUR-NEW-000',
      qualification: nurse.qualification || 'registered_nurse',
      valid: true,
      registration_date: '2023-06-15',
      expiry_date: '2025-06-15',
      disciplinary_actions: false
    })

    const verification = db.prepare(
      'SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(nurse_id) as any

    if (verification) {
      db.prepare(
        'UPDATE nurse_verifications SET health_committee_result = ?, status = ? WHERE id = ?'
      ).run(healthCommitteeResult, 'compared', verification.id)
    } else {
      db.prepare(
        'INSERT INTO nurse_verifications (nurse_id, health_committee_result, status) VALUES (?, ?, ?)'
      ).run(nurse_id, healthCommitteeResult, 'compared')
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'health_committee_compare', 'nurse', nurse_id, req.ip)

    res.json({
      success: true,
      data: { health_committee_result: JSON.parse(healthCommitteeResult), status: 'compared' }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/verification/credits', authMiddleware, roleMiddleware('admin'), (req: Request, res: Response): void => {
  try {
    const { nurse_id } = req.body

    const records = db.prepare(
      'SELECT er.*, ec.credit_value FROM education_records er JOIN education_courses ec ON er.course_id = ec.id WHERE er.nurse_id = ? AND er.status = ?'
    ).all(nurse_id, 'completed') as any[]

    const totalCredits = records.reduce((sum: number, r: any) => sum + r.credit_value, 0)
    const creditScore = Math.min(100, totalCredits * 10)

    const verification = db.prepare(
      'SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(nurse_id) as any

    const newStatus = creditScore >= 60 ? 'verified' : 'rejected'

    if (verification) {
      db.prepare(
        'UPDATE nurse_verifications SET credit_score = ?, status = ?, verified_at = datetime(\'now\') WHERE id = ?'
      ).run(creditScore, newStatus, verification.id)
    } else {
      db.prepare(
        'INSERT INTO nurse_verifications (nurse_id, credit_score, status, verified_at) VALUES (?, ?, ?, datetime(\'now\'))'
      ).run(nurse_id, creditScore, newStatus)
    }

    if (newStatus === 'verified') {
      db.prepare('UPDATE nurses SET status = ? WHERE id = ?').run('verified', nurse_id)
    }

    db.prepare(
      'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(req.user!.id, 'credits_verify', 'nurse', nurse_id, req.ip)

    res.json({
      success: true,
      data: { total_credits: totalCredits, credit_score: creditScore, status: newStatus }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/verification/status', authMiddleware, (req: Request, res: Response): void => {
  try {
    const nurse = db.prepare('SELECT * FROM nurses WHERE user_id = ?').get(req.user!.id) as any
    if (!nurse) {
      res.status(404).json({ success: false, error: '护士记录不存在' })
      return
    }

    const verification = db.prepare(
      'SELECT * FROM nurse_verifications WHERE nurse_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(nurse.id) as any

    res.json({
      success: true,
      data: {
        nurse_status: nurse.status,
        verification: verification || null
      }
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
