import { Router, type Request, type Response } from 'express'
import { getDb } from '../database.js'

const router = Router()

router.get('/status/:userId', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId } = req.params

  const user = db.prepare('SELECT * FROM user WHERE id = ?').get(userId) as Record<string, any> | undefined
  if (!user) {
    res.status(404).json({ success: false, error: '用户不存在' })
    return
  }

  const nationalNetworkStatus = {
    synced: true,
    syncTime: new Date().toISOString(),
    source: '全国社保联网查询接口',
    verificationCode: `NAT-${Date.now()}`
  }

  const records = db.prepare('SELECT * FROM insurance_record WHERE user_id = ?').all(userId)

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        id_card: user.id_card,
        real_name_verified: !!user.real_name_verified
      },
      nationalNetworkStatus,
      insuranceRecords: records
    }
  })
})

router.get('/payment-records/:userId', (req: Request, res: Response): void => {
  const db = getDb()
  const { userId } = req.params
  const { insurance_type, payment_month, page = '1', pageSize = '10' } = req.query

  let sql = 'SELECT * FROM payment_record WHERE user_id = ?'
  const params: string[] = [userId]

  if (insurance_type) {
    sql += ' AND insurance_type = ?'
    params.push(insurance_type as string)
  }
  if (payment_month) {
    sql += ' AND payment_month = ?'
    params.push(payment_month as string)
  }

  sql += ' ORDER BY payment_date DESC'

  const total = db.prepare(`SELECT COUNT(*) as count FROM (${sql})`).get(...params) as { count: number }

  const offset = (Number(page) - 1) * Number(pageSize)
  sql += ' LIMIT ? OFFSET ?'
  params.push(String(Number(pageSize)), String(offset))

  const records = db.prepare(sql).all(...params)

  res.json({
    success: true,
    data: {
      total: total.count,
      page: Number(page),
      pageSize: Number(pageSize),
      records
    }
  })
})

export default router
