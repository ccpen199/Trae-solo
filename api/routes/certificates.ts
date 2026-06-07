import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, cert_type } = req.query
    let sql = `SELECT c.*, t.name as taxpayer_name FROM certificates c JOIN taxpayers t ON c.taxpayer_id = t.id WHERE 1=1`
    const params: any[] = []
    if (req.user!.role !== 'admin') {
      sql += ' AND c.user_id = ?'
      params.push(req.user!.id)
    }
    if (status) {
      sql += ' AND c.status = ?'
      params.push(status)
    }
    if (cert_type) {
      sql += ' AND c.cert_type = ?'
      params.push(cert_type)
    }
    sql += ' ORDER BY c.created_at DESC'
    const certificates = db.prepare(sql).all(...params)
    res.json({ success: true, data: certificates })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取证明列表失败' })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, cert_type } = req.body
    if (!taxpayer_id || !cert_type) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const certNo = `CERT-${cert_type === 'tax_paid' ? 'W' : 'N'}-${new Date().getFullYear()}-${String(Date.now()).slice(-8)}`
    const taxpayer = db.prepare('SELECT * FROM taxpayers WHERE id = ?').get(taxpayer_id) as any
    let content = ''
    if (cert_type === 'tax_paid') {
      content = `兹证明${taxpayer?.name || ''}（统一社会信用代码：${taxpayer?.unified_code || ''}）已按规定缴纳${new Date().getFullYear()}年度各项税款，无欠缴记录。`
    } else {
      content = `兹证明${taxpayer?.name || ''}（统一社会信用代码：${taxpayer?.unified_code || ''}）截至开具日无欠缴税款记录。`
    }
    const result = db.prepare(
      'INSERT INTO certificates (taxpayer_id, user_id, cert_type, cert_no, content) VALUES (?, ?, ?, ?, ?)'
    ).run(taxpayer_id, req.user!.id, cert_type, certNo, content)
    res.json({ success: true, data: { id: result.lastInsertRowid, cert_no: certNo } })
  } catch (err) {
    res.status(500).json({ success: false, error: '申请证明失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const cert = db.prepare(
      'SELECT c.*, t.name as taxpayer_name, t.unified_code FROM certificates c JOIN taxpayers t ON c.taxpayer_id = t.id WHERE c.id = ?'
    ).get(req.params.id) as any
    if (!cert) {
      res.status(404).json({ success: false, error: '证明不存在' })
      return
    }
    res.json({ success: true, data: cert })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取证明详情失败' })
  }
})

export default router
