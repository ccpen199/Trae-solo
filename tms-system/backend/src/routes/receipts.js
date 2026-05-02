import express from 'express'
import { v4 as uuidv4 } from 'uuid'
import { db } from '../models/database.js'

const router = express.Router()

router.get('/:waybillId', (req, res) => {
  try {
    const receipt = db.prepare('SELECT * FROM receipts WHERE waybill_id = ?').get(req.params.waybillId)
    if (!receipt) {
      return res.status(404).json({ message: '回单不存在' })
    }
    receipt.photos = JSON.parse(receipt.photos || '[]')
    receipt.damage_photos = JSON.parse(receipt.damage_photos || '[]')
    res.json({ data: receipt })
  } catch (error) {
    res.status(500).json({ message: '获取回单失败' })
  }
})

router.post('/:waybillId', (req, res) => {
  try {
    const { signed_by, signature_data, photos, remark } = req.body

    const existing = db.prepare('SELECT * FROM receipts WHERE waybill_id = ?').get(req.params.waybillId)
    if (existing) {
      return res.status(400).json({ message: '回单已存在' })
    }

    const id = uuidv4()
    const receiptNo = `RC-${Date.now()}`

    db.prepare(`
      INSERT INTO receipts (id, receipt_no, waybill_id, signed_by, signed_at, photos, remark, status)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?, 'UPLOADED')
    `).run(id, receiptNo, req.params.waybillId, signed_by, JSON.stringify(photos || []), remark)

    db.prepare("UPDATE waybills SET status = 'SIGNED', signed_at = CURRENT_TIMESTAMP WHERE id = ?").run(req.params.waybillId)

    const receipt = db.prepare('SELECT * FROM receipts WHERE id = ?').get(id)
    res.json({ data: receipt })
  } catch (error) {
    res.status(500).json({ message: '创建回单失败' })
  }
})

export default router
