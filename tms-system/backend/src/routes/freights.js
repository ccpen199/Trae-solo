import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'
import { FreightCalculator } from '../engines/freightCalculator.js'

const router = express.Router()
const freightCalculator = new FreightCalculator()

router.get('/', (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query
    const offset = (page - 1) * pageSize

    let whereClause = '1=1'
    const params = []
    if (status) {
      whereClause += ' AND status = ?'
      params.push(status)
    }

    const total = db.prepare(`SELECT COUNT(*) as count FROM freights WHERE ${whereClause}`).get(...params).count
    const freights = db.prepare(`SELECT * FROM freights WHERE ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`).all(...params, parseInt(pageSize), offset)

    freights.forEach(f => {
      f.calculation_basis = JSON.parse(f.calculation_basis || '{}')
      f.additional_fees = JSON.parse(f.additional_fees || '{}')
    })

    res.json({ data: freights, total })
  } catch (error) {
    res.status(500).json({ message: '获取运费列表失败' })
  }
})

router.get('/:id', (req, res) => {
  try {
    const freight = db.prepare('SELECT * FROM freights WHERE id = ?').get(req.params.id)
    if (!freight) {
      return res.status(404).json({ message: '运费不存在' })
    }

    freight.calculation_basis = JSON.parse(freight.calculation_basis || '{}')
    freight.additional_fees = JSON.parse(freight.additional_fees || '{}')

    res.json({ data: freight })
  } catch (error) {
    res.status(500).json({ message: '获取运费详情失败' })
  }
})

router.post('/calculate/:waybillId', (req, res) => {
  try {
    const waybill = db.prepare('SELECT * FROM waybills WHERE id = ?').get(req.params.waybillId)
    if (!waybill) {
      return res.status(404).json({ message: '运单不存在' })
    }

    const existingFreight = db.prepare('SELECT * FROM freights WHERE waybill_id = ?').get(req.params.waybillId)
    if (existingFreight) {
      existingFreight.calculation_basis = JSON.parse(existingFreight.calculation_basis || '{}')
      return res.json({ data: existingFreight })
    }

    const calculation = freightCalculator.calculate(waybill)

    const id = uuidv4()
    const freightNo = `FR-${Date.now()}`

    db.prepare(`
      INSERT INTO freights (id, freight_no, waybill_id, waybill_no, distance, weight, volume,
        distance_fee, weight_fee, volume_fee, pickup_fee, delivery_fee, additional_fees,
        declared_value, insurance_fee, discount, total_freight, calculation_basis, calculated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      id, freightNo, waybill.id, waybill.waybill_no,
      calculation.distance, calculation.weight, calculation.volume || 0,
      calculation.distance_fee, calculation.weight_fee, calculation.volume_fee || 0,
      calculation.pickup_fee, calculation.delivery_fee, JSON.stringify(calculation.additional_fees),
      calculation.declared_value || 0, calculation.insurance_fee || 0, calculation.discount || 0,
      calculation.total_freight, JSON.stringify(calculation.calculation_basis)
    )

    db.prepare('UPDATE waybills SET distance_fee = ?, weight_fee = ?, total_freight = ? WHERE id = ?').run(
      calculation.distance_fee, calculation.weight_fee, calculation.total_freight, waybill.id
    )

    const freight = db.prepare('SELECT * FROM freights WHERE id = ?').get(id)
    freight.calculation_basis = JSON.parse(freight.calculation_basis)
    freight.additional_fees = JSON.parse(freight.additional_fees)

    res.json({ data: freight })
  } catch (error) {
    console.error('Calculate freight error:', error)
    res.status(500).json({ message: '计算运费失败' })
  }
})

router.post('/:id/confirm', (req, res) => {
  try {
    db.prepare('UPDATE freights SET status = ?, confirmed_at = CURRENT_TIMESTAMP WHERE id = ?').run('CONFIRMED', req.params.id)
    const freight = db.prepare('SELECT * FROM freights WHERE id = ?').get(req.params.id)
    freight.calculation_basis = JSON.parse(freight.calculation_basis || '{}')
    freight.additional_fees = JSON.parse(freight.additional_fees || '{}')
    res.json({ data: freight })
  } catch (error) {
    res.status(500).json({ message: '确认运费失败' })
  }
})

export default router
