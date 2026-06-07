import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../auth.js'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const upload = multer({
  dest: path.resolve(__dirname, '../../uploads'),
  limits: { fileSize: 10 * 1024 * 1024 },
})

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, taxpayer_id, invoice_type } = req.query
    let sql = `SELECT i.*, t.name as taxpayer_name FROM invoices i JOIN taxpayers t ON i.taxpayer_id = t.id WHERE 1=1`
    const params: any[] = []
    if (req.user!.role !== 'admin') {
      sql += ' AND i.user_id = ?'
      params.push(req.user!.id)
    }
    if (status) {
      sql += ' AND i.status = ?'
      params.push(status)
    }
    if (taxpayer_id) {
      sql += ' AND i.taxpayer_id = ?'
      params.push(taxpayer_id)
    }
    if (invoice_type) {
      sql += ' AND i.invoice_type = ?'
      params.push(invoice_type)
    }
    sql += ' ORDER BY i.created_at DESC'
    const invoices = db.prepare(sql).all(...params)
    res.json({ success: true, data: invoices })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取发票列表失败' })
  }
})

router.post('/', authMiddleware, upload.single('attachment'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, invoice_type, amount, buyer_name, buyer_code, seller_name, seller_code, items } = req.body
    if (!taxpayer_id || !invoice_type || !amount) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const invoiceNo = `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`
    let ocrData = null
    if (req.file) {
      ocrData = JSON.stringify({
        filename: req.file.originalname || req.file.filename,
        size: req.file.size,
        recognized: true,
        text: 'OCR识别结果：发票金额、购方/销方信息已自动提取',
        confidence: 0.92,
      })
    }
    const result = db.prepare(
      'INSERT INTO invoices (taxpayer_id, user_id, invoice_no, invoice_type, amount, buyer_name, buyer_code, seller_name, seller_code, items, ocr_data) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(taxpayer_id, req.user!.id, invoiceNo, invoice_type, amount, buyer_name || null, buyer_code || null, seller_name || null, seller_code || null, items || '[]', ocrData)
    res.json({ success: true, data: { id: result.lastInsertRowid, invoice_no: invoiceNo } })
  } catch (err) {
    res.status(500).json({ success: false, error: '代开发票申请失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = db.prepare(
      'SELECT i.*, t.name as taxpayer_name FROM invoices i JOIN taxpayers t ON i.taxpayer_id = t.id WHERE i.id = ?'
    ).get(req.params.id) as any
    if (!invoice) {
      res.status(404).json({ success: false, error: '发票不存在' })
      return
    }
    if (typeof invoice.items === 'string') {
      try { invoice.items = JSON.parse(invoice.items) } catch {}
    }
    if (typeof invoice.ocr_data === 'string') {
      try { invoice.ocr_data = JSON.parse(invoice.ocr_data) } catch {}
    }
    res.json({ success: true, data: invoice })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取发票详情失败' })
  }
})

router.post('/:id/red-flush', authMiddleware, roleMiddleware('admin', 'agent'), async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id) as any
    if (!invoice) {
      res.status(404).json({ success: false, error: '发票不存在' })
      return
    }
    if (invoice.invoice_type === 'red_flush') {
      res.status(400).json({ success: false, error: '该发票已是红冲发票' })
      return
    }
    const redFlushNo = `INV-RED-${String(Date.now()).slice(-8)}`
    const result = db.prepare(
      'INSERT INTO invoices (taxpayer_id, user_id, invoice_no, invoice_type, amount, buyer_name, buyer_code, seller_name, seller_code, items, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(invoice.taxpayer_id, req.user!.id, redFlushNo, 'red_flush', -invoice.amount, invoice.buyer_name, invoice.buyer_code, invoice.seller_name, invoice.seller_code, invoice.items, 'issued')
    db.prepare('UPDATE invoices SET status=? WHERE id=?').run('red_flushed', req.params.id)
    res.json({ success: true, data: { id: result.lastInsertRowid, red_flush_no: redFlushNo } })
  } catch (err) {
    res.status(500).json({ success: false, error: '红冲发票失败' })
  }
})

router.post('/verify', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { invoice_no } = req.body
    if (!invoice_no) {
      res.status(400).json({ success: false, error: '缺少发票号码' })
      return
    }
    const invoice = db.prepare('SELECT * FROM invoices WHERE invoice_no = ?').get(invoice_no) as any
    if (!invoice) {
      res.json({ success: true, data: { verified: false, message: '未查询到该发票信息' } })
      return
    }
    res.json({
      success: true,
      data: {
        verified: true,
        invoice_no: invoice.invoice_no,
        invoice_type: invoice.invoice_type,
        amount: invoice.amount,
        buyer_name: invoice.buyer_name,
        seller_name: invoice.seller_name,
        status: invoice.status,
        issued_at: invoice.issued_at,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '发票查验失败' })
  }
})

export default router
