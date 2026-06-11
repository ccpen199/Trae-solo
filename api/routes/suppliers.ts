import { Router, type Request, type Response } from 'express'
import { db } from '../db.js'

const router = Router()

interface SupplierRow {
  id: string
  user_id: string
  name: string
  type: string
  location: string
  credit_score: number
  fulfillment_rate: number
  complaint_rate: number
  qc_pass_rate: number
  crafts: string
  capacity_current: number
  capacity_max: number
  certifications: string
  description: string
  is_online: number
  created_at: string
}

function formatRow(row: SupplierRow) {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    type: row.type,
    location: row.location,
    creditScore: row.credit_score,
    fulfillmentRate: row.fulfillment_rate,
    complaintRate: row.complaint_rate,
    qcPassRate: row.qc_pass_rate,
    crafts: JSON.parse(row.crafts || '[]'),
    capacity: {
      current: row.capacity_current,
      max: row.capacity_max,
      available: row.capacity_max - row.capacity_current,
    },
    certifications: JSON.parse(row.certifications || '[]'),
    description: row.description,
    isOnline: row.is_online === 1,
    createdAt: row.created_at,
  }
}

router.get('/', (req: Request, res: Response): void => {
  try {
    const { type, location } = req.query
    let sql = 'SELECT * FROM suppliers WHERE 1=1'
    const params: unknown[] = []

    if (type) {
      sql += ' AND type = ?'
      params.push(type)
    }
    if (location) {
      sql += ' AND location LIKE ?'
      params.push(`%${location}%`)
    }

    sql += ' ORDER BY credit_score DESC'

    const rows = db.prepare(sql).all(...params) as SupplierRow[]
    res.json({ success: true, data: rows.map(formatRow) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取供应商列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id) as SupplierRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '供应商不存在' })
      return
    }
    res.json({ success: true, data: formatRow(row) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取供应商详情失败' })
  }
})

router.get('/:id/credit', (req: Request, res: Response): void => {
  try {
    const row = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id) as SupplierRow | undefined
    if (!row) {
      res.status(404).json({ success: false, error: '供应商不存在' })
      return
    }
    res.json({
      success: true,
      data: {
        supplierId: row.id,
        supplierName: row.name,
        creditScore: row.credit_score,
        fulfillmentRate: row.fulfillment_rate,
        complaintRate: row.complaint_rate,
        qcPassRate: row.qc_pass_rate,
        certifications: JSON.parse(row.certifications || '[]'),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取信用评分详情失败' })
  }
})

export default router
