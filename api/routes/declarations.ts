import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, taxpayer_id, period } = req.query
    let sql = `SELECT d.*, t.name as taxpayer_name, tt.name as tax_type_name, tt.code as tax_type_code
      FROM declarations d
      JOIN taxpayers t ON d.taxpayer_id = t.id
      JOIN tax_types tt ON d.tax_type_id = tt.id
      WHERE 1=1`
    const params: any[] = []
    if (req.user!.role !== 'admin') {
      sql += ' AND d.user_id = ?'
      params.push(req.user!.id)
    }
    if (status) {
      sql += ' AND d.status = ?'
      params.push(status)
    }
    if (taxpayer_id) {
      sql += ' AND d.taxpayer_id = ?'
      params.push(taxpayer_id)
    }
    if (period) {
      sql += ' AND d.period = ?'
      params.push(period)
    }
    sql += ' ORDER BY d.created_at DESC'
    const declarations = db.prepare(sql).all(...params)
    res.json({ success: true, data: declarations })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取申报列表失败' })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, tax_type_id, period, decl_type, form_data, tax_amount } = req.body
    if (!taxpayer_id || !tax_type_id || !period || !decl_type) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(
      'INSERT INTO declarations (taxpayer_id, tax_type_id, user_id, period, decl_type, form_data, tax_amount) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(taxpayer_id, tax_type_id, req.user!.id, period, decl_type, JSON.stringify(form_data || {}), tax_amount || 0)
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建申报失败' })
  }
})

router.get('/prefill', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, tax_type_id, period } = req.query
    if (!taxpayer_id || !tax_type_id) {
      res.status(400).json({ success: false, error: '缺少纳税人或税种参数' })
      return
    }
    const taxpayer = db.prepare('SELECT * FROM taxpayers WHERE id = ?').get(taxpayer_id) as any
    const taxType = db.prepare('SELECT * FROM tax_types WHERE id = ?').get(tax_type_id) as any
    if (!taxpayer || !taxType) {
      res.status(404).json({ success: false, error: '纳税人或税种不存在' })
      return
    }
    const prevDecl = db.prepare(
      'SELECT * FROM declarations WHERE taxpayer_id = ? AND tax_type_id = ? AND status IN (?,?,?) ORDER BY created_at DESC LIMIT 1'
    ).get(taxpayer_id, tax_type_id, 'submitted', 'approved', 'sealed') as any
    const prefill: any = {
      taxpayer_name: taxpayer.name,
      unified_code: taxpayer.unified_code,
      tax_type_name: taxType.name,
      default_rate: taxType.default_rate,
      period_type: taxType.period_type,
      previous_amount: prevDecl ? prevDecl.tax_amount : 0,
      business_data: {
        industry: taxpayer.industry,
        scale: taxpayer.scale,
        region: taxpayer.region,
      },
      social_security_data: {
        employee_count: 15,
        total_salary: 450000,
      },
      commercial_data: {
        registered_capital: 1000000,
        business_status: '正常',
      },
    }
    res.json({ success: true, data: prefill })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取预填数据失败' })
  }
})

router.post('/validate', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { taxpayer_id, tax_type_id, form_data, tax_amount } = req.body
    const warnings: any[] = []
    const errors: any[] = []
    const taxType = db.prepare('SELECT * FROM tax_types WHERE id = ?').get(tax_type_id) as any
    if (!taxType) {
      res.status(404).json({ success: false, error: '税种不存在' })
      return
    }
    if (form_data?.revenue && form_data.revenue > 0 && tax_amount === 0 && taxType.code === 'VAT') {
      warnings.push({ field: 'tax_amount', message: '有收入但增值税为零，请确认是否为零申报', level: 'warning' })
    }
    if (tax_amount < 0) {
      errors.push({ field: 'tax_amount', message: '应纳税额不能为负数', level: 'error' })
    }
    if (form_data?.revenue && form_data.revenue < 100000 && taxType.code === 'VAT') {
      warnings.push({ field: 'revenue', message: '月销售额低于10万元，可能符合免征增值税条件', level: 'info' })
    }
    if (form_data?.tax_rate && taxType.default_rate) {
      if (Math.abs(form_data.tax_rate - taxType.default_rate) > 0.01) {
        warnings.push({ field: 'tax_rate', message: `填入税率${form_data.tax_rate}与默认税率${taxType.default_rate}不一致，请确认`, level: 'warning' })
      }
    }
    const existingDecl = db.prepare(
      'SELECT id FROM declarations WHERE taxpayer_id = ? AND tax_type_id = ? AND period = ? AND status IN (?,?,?)'
    ).get(taxpayer_id, tax_type_id, form_data?.period, 'draft', 'submitted', 'approved') as any
    if (existingDecl) {
      warnings.push({ field: 'period', message: '该纳税期间已有申报记录，如需修改请使用更正申报', level: 'warning' })
    }
    res.json({
      success: true,
      data: {
        valid: errors.length === 0,
        errors,
        warnings,
      },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: '风险校验失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const decl = db.prepare(
      `SELECT d.*, t.name as taxpayer_name, tt.name as tax_type_name
       FROM declarations d
       JOIN taxpayers t ON d.taxpayer_id = t.id
       JOIN tax_types tt ON d.tax_type_id = tt.id
       WHERE d.id = ?`
    ).get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报记录不存在' })
      return
    }
    if (req.user!.role !== 'admin' && decl.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    if (typeof decl.form_data === 'string') {
      try { decl.form_data = JSON.parse(decl.form_data) } catch {}
    }
    if (typeof decl.risk_check === 'string') {
      try { decl.risk_check = JSON.parse(decl.risk_check) } catch {}
    }
    res.json({ success: true, data: decl })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取申报详情失败' })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报记录不存在' })
      return
    }
    if (decl.status !== 'draft') {
      res.status(400).json({ success: false, error: '仅草稿状态可编辑' })
      return
    }
    const { form_data, tax_amount } = req.body
    db.prepare('UPDATE declarations SET form_data=?, tax_amount=? WHERE id=?')
      .run(JSON.stringify(form_data || decl.form_data), tax_amount ?? decl.tax_amount, req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新申报失败' })
  }
})

router.post('/:id/submit', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报记录不存在' })
      return
    }
    if (decl.status !== 'draft') {
      res.status(400).json({ success: false, error: '仅草稿状态可提交' })
      return
    }
    db.prepare('UPDATE declarations SET status=?, submitted_at=datetime(\'now\') WHERE id=?')
      .run('submitted', req.params.id)
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '提交申报失败' })
  }
})

router.post('/:id/correct', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报记录不存在' })
      return
    }
    const { form_data, tax_amount } = req.body
    const result = db.prepare(
      'INSERT INTO declarations (taxpayer_id, tax_type_id, user_id, period, decl_type, form_data, tax_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(decl.taxpayer_id, decl.tax_type_id, req.user!.id, decl.period, 'correction', JSON.stringify(form_data || decl.form_data), tax_amount ?? decl.tax_amount, 'draft')
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: '更正申报失败' })
  }
})

router.post('/:id/seal', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报记录不存在' })
      return
    }
    if (decl.status !== 'approved' && decl.status !== 'submitted') {
      res.status(400).json({ success: false, error: '当前状态不可签章' })
      return
    }
    const sealId = `SEAL-${uuidv4().slice(0, 8).toUpperCase()}-${Date.now()}`
    db.prepare('UPDATE declarations SET status=?, seal_data=? WHERE id=?')
      .run('sealed', sealId, req.params.id)
    res.json({ success: true, data: { seal_data: sealId } })
  } catch (err) {
    res.status(500).json({ success: false, error: '电子签章失败' })
  }
})

export default router
