import { Router, type Request, type Response } from 'express'
import { getDatabase } from '../database.js'
import { optionalAuth, authenticateToken } from '../middleware/auth.js'
import type { Doctor } from '@shared/types'

const router = Router()

function rowToDoctor(row: any): Doctor {
  return {
    id: row.id,
    userId: row.user_id,
    hospitalId: row.hospital_id,
    name: row.name,
    title: row.title,
    department: row.department,
    licenseNumber: row.license_number,
    licenseVerified: row.license_verified === 1,
    rating: row.rating,
    consultationCount: row.consultation_count,
    isOnline: row.is_online === 1,
  }
}

router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const { department, hospitalId, isOnline } = req.query as any

    let sql = 'SELECT * FROM doctors WHERE 1=1'
    const params: any[] = []

    if (department) {
      sql += ' AND department = ?'
      params.push(department)
    }

    if (hospitalId) {
      sql += ' AND hospital_id = ?'
      params.push(hospitalId)
    }

    if (isOnline !== undefined) {
      sql += ' AND is_online = ?'
      params.push(isOnline === 'true' ? 1 : 0)
    }

    sql += ' ORDER BY rating DESC, consultation_count DESC'

    const rows = db.prepare(sql).all(...params) as any[]
    const doctors = rows.map(rowToDoctor)

    res.json({
      success: true,
      data: doctors,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取医生列表失败',
    })
  }
})

router.get('/:id', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM doctors WHERE id = ?').get(req.params.id) as any

    if (!row) {
      res.status(404).json({
        success: false,
        error: '医生不存在',
      })
      return
    }

    const doctor = rowToDoctor(row)

    res.json({
      success: true,
      data: doctor,
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      error: '获取医生详情失败',
    })
  }
})

export default router
