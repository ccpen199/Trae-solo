import { Router, type Request, type Response } from 'express'
import db from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 10
    const userId = req.query.userId as string
    const method = req.query.method as string
    const startDate = req.query.startDate as string
    const endDate = req.query.endDate as string

    const offset = (page - 1) * pageSize

    const whereClauses: string[] = []
    const params: Record<string, unknown> = {}

    if (userId) {
      whereClauses.push('user_id = @userId')
      params.userId = userId
    }
    if (method) {
      whereClauses.push('method = @method')
      params.method = method
    }
    if (startDate) {
      whereClauses.push('reading_date >= @startDate')
      params.startDate = startDate
    }
    if (endDate) {
      whereClauses.push('reading_date <= @endDate')
      params.endDate = endDate
    }

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''

    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM meter_readings ${whereClause}`)
    const { total } = countStmt.get(params) as { total: number }

    const listStmt = db.prepare(`
      SELECT mr.*, u.name as user_name, u.account_no, m.meter_no 
      FROM meter_readings mr
      LEFT JOIN users u ON mr.user_id = u.id
      LEFT JOIN meters m ON mr.meter_id = m.id
      ${whereClause}
      ORDER BY reading_date DESC
      LIMIT @limit OFFSET @offset
    `)
    const readings = listStmt.all({ ...params, limit: pageSize, offset })

    res.json({
      success: true,
      data: {
        list: readings,
        total,
        page,
        pageSize,
      },
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取抄表记录失败',
    })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const { user_id, meter_id, reading, reading_date, method, ocr_confidence, image_url } = req.body

    if (!user_id || !meter_id || reading === undefined || !reading_date || !method) {
      res.status(400).json({
        success: false,
        error: '缺少必填字段',
      })
      return
    }

    const meterStmt = db.prepare('SELECT * FROM meters WHERE id = ?')
    const meter = meterStmt.get(meter_id) as { current_reading: number } | undefined

    if (!meter) {
      res.status(400).json({
        success: false,
        error: '表具不存在',
      })
      return
    }

    const previousReading = meter.current_reading
    const consumption = Math.max(0, reading - previousReading)

    const id = generateId('reading')

    const insertStmt = db.prepare(`
      INSERT INTO meter_readings (id, user_id, meter_id, reading, previous_reading, consumption, reading_date, method, ocr_confidence, image_url)
      VALUES (@id, @user_id, @meter_id, @reading, @previous_reading, @consumption, @reading_date, @method, @ocr_confidence, @image_url)
    `)
    insertStmt.run({
      id,
      user_id,
      meter_id,
      reading,
      previous_reading: previousReading,
      consumption,
      reading_date,
      method,
      ocr_confidence: ocr_confidence || null,
      image_url: image_url || null,
    })

    const updateMeterStmt = db.prepare('UPDATE meters SET current_reading = ? WHERE id = ?')
    updateMeterStmt.run(reading, meter_id)

    const readingStmt = db.prepare('SELECT * FROM meter_readings WHERE id = ?')
    const newReading = readingStmt.get(id)

    res.json({
      success: true,
      data: newReading,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '提交抄表记录失败',
    })
  }
})

router.post('/ocr', (req: Request, res: Response): void => {
  try {
    const mockReading = 100 + Math.floor(Math.random() * 500) + Math.random()
    const confidence = 0.92 + Math.random() * 0.07

    setTimeout(() => {
      res.json({
        success: true,
        data: {
          reading: Math.round(mockReading * 100) / 100,
          confidence: Math.round(confidence * 100) / 100,
          mock: true,
          processed_at: new Date().toISOString(),
        },
      })
    }, 300)
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'OCR识别失败',
    })
  }
})

router.get('/history/:userId', (req: Request, res: Response): void => {
  try {
    const { userId } = req.params
    const limit = parseInt(req.query.limit as string) || 12

    const stmt = db.prepare(`
      SELECT mr.*, m.meter_no 
      FROM meter_readings mr
      LEFT JOIN meters m ON mr.meter_id = m.id
      WHERE mr.user_id = ?
      ORDER BY reading_date DESC
      LIMIT ?
    `)
    const readings = stmt.all(userId, limit)

    res.json({
      success: true,
      data: readings,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : '获取用户抄表历史失败',
    })
  }
})

export default router
