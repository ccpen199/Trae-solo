import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDatabase } from '../database.js'
import { optionalAuth, authenticateToken } from '../middleware/auth.js'
import { requireRole } from '../middleware/rbac.js'
import type { Hospital, HospitalReview, HospitalService } from '@shared/types'

const router = Router()

function rowToHospital(row: any, db: any): Hospital {
  const serviceRows = db.prepare('SELECT * FROM hospital_services WHERE hospital_id = ?').all(row.user_id) as any[]
  const services: HospitalService[] = serviceRows.map((s: any) => ({
    id: s.id,
    hospitalId: s.hospital_id,
    name: s.name,
    description: s.description,
    price: s.price,
    duration: s.duration,
  }))

  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    address: row.address,
    latitude: row.latitude,
    longitude: row.longitude,
    phone: row.phone,
    businessHours: row.business_hours,
    rating: row.rating,
    reviewCount: row.review_count,
    services,
    verified: row.verified === 1,
  }
}

function rowToReview(row: any): HospitalReview {
  return {
    id: row.id,
    hospitalId: row.hospital_id,
    ownerId: row.owner_id,
    rating: row.rating,
    content: row.content,
    isVerified: row.is_verified === 1,
    antiFraudScore: row.anti_fraud_score,
    createdAt: row.created_at,
  }
}

router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { verified } = req.query as any

    let sql = 'SELECT * FROM hospitals WHERE 1=1'
    const params: any[] = []

    if (verified !== undefined) {
      sql += ' AND verified = ?'
      params.push(verified === 'true' ? 1 : 0)
    }

    sql += ' ORDER BY rating DESC, review_count DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const hospitals = rows.map((row) => rowToHospital(row, db))

    res.json({
      success: true,
      data: hospitals,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取医院列表失败',
    })
  }
})

router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any

    if (!row) {
      res.status(404).json({
        success: false,
        error: '医院不存在',
      })
      return
    }

    const hospital = rowToHospital(row, db)

    res.json({
      success: true,
      data: hospital,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取医院详情失败',
    })
  }
})

router.get('/:id/reviews', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any

    if (!hospital) {
      res.status(404).json({
        success: false,
        error: '医院不存在',
      })
      return
    }

    const rows = db.prepare('SELECT * FROM hospital_reviews WHERE hospital_id = ? ORDER BY created_at DESC').all(hospital.user_id) as any[]
    const reviews = rows.map(rowToReview)

    res.json({
      success: true,
      data: reviews,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取医院评价失败',
    })
  }
})

router.post('/:id/reviews', authenticateToken, requireRole('owner'), async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const hospital = db.prepare('SELECT * FROM hospitals WHERE id = ?').get(req.params.id) as any

    if (!hospital) {
      res.status(404).json({
        success: false,
        error: '医院不存在',
      })
      return
    }

    const { rating, content } = req.body

    if (!rating || rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        error: '评分必须在1-5之间',
      })
      return
    }

    const id = uuidv4()
    const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')
    const antiFraudScore = 0.8 + Math.random() * 0.2
    const isVerified = Math.random() > 0.3 ? 1 : 0

    const tx = db.transaction(() => {
      db.prepare(
        'INSERT INTO hospital_reviews (id, hospital_id, owner_id, rating, content, is_verified, anti_fraud_score, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).run(id, hospital.user_id, req.user!.id, rating, content || null, isVerified, antiFraudScore, createdAt)

      const avgRow = db.prepare('SELECT AVG(rating) as avg_rating FROM hospital_reviews WHERE hospital_id = ?').get(hospital.user_id) as any
      const countRow = db.prepare('SELECT COUNT(*) as count FROM hospital_reviews WHERE hospital_id = ?').get(hospital.user_id) as any

      db.prepare('UPDATE hospitals SET rating = ?, review_count = ? WHERE id = ?').run(
        avgRow.avg_rating || 5.0,
        countRow.count,
        hospital.id
      )
    })

    tx()

    const row = db.prepare('SELECT * FROM hospital_reviews WHERE id = ?').get(id) as any
    const review = rowToReview(row)

    res.json({
      success: true,
      data: review,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '提交评价失败',
    })
  }
})

export default router
