import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, roleMiddleware } from '../auth.js'

const router = Router()

router.get('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    let taxpayers
    if (req.user!.role === 'admin') {
      taxpayers = db.prepare('SELECT * FROM taxpayers ORDER BY created_at DESC').all()
    } else {
      taxpayers = db.prepare('SELECT * FROM taxpayers WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id)
    }
    
    const taxpayersWithDetails = (taxpayers as any[]).map((tp: any) => {
      const certs = db.prepare('SELECT * FROM digital_certificates WHERE taxpayer_id = ?').all(tp.id)
      const authorizations = db.prepare(`
        SELECT aa.*, u.real_name as agent_name, u.username as agent_username
        FROM agent_authorizations aa
        JOIN users u ON aa.agent_user_id = u.id
        WHERE aa.taxpayer_id = ?
      `).all(tp.id)
      const taxTypes = db.prepare(`
        SELECT ttt.*, tt.name as tax_type_name, tt.code as tax_type_code, tt.category as tax_type_category
        FROM taxpayer_tax_types ttt
        JOIN tax_types tt ON ttt.tax_type_id = tt.id
        WHERE ttt.taxpayer_id = ?
      `).all(tp.id)
      
      return {
        ...tp,
        digital_certificates: certs,
        agent_authorizations: authorizations,
        tax_type_adaptations: taxTypes,
      }
    })
    
    res.json({ success: true, data: taxpayersWithDetails })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取纳税人列表失败' })
  }
})

router.post('/', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, type, unified_code, id_number, legal_person, address, industry, scale, region } = req.body
    if (!name || !type) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }
    const result = db.prepare(
      'INSERT INTO taxpayers (user_id, name, type, unified_code, id_number, legal_person, address, industry, scale, region) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(req.user!.id, name, type, unified_code || null, id_number || null, legal_person || null, address || null, industry || null, scale || null, region || null)
    res.json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (err) {
    res.status(500).json({ success: false, error: '创建纳税人失败' })
  }
})

router.get('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taxpayer = db.prepare('SELECT * FROM taxpayers WHERE id = ?').get(req.params.id) as any
    if (!taxpayer) {
      res.status(404).json({ success: false, error: '纳税人不存在' })
      return
    }
    if (req.user!.role !== 'admin' && taxpayer.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    res.json({ success: true, data: taxpayer })
  } catch (err) {
    res.status(500).json({ success: false, error: '获取纳税人详情失败' })
  }
})

router.put('/:id', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const taxpayer = db.prepare('SELECT * FROM taxpayers WHERE id = ?').get(req.params.id) as any
    if (!taxpayer) {
      res.status(404).json({ success: false, error: '纳税人不存在' })
      return
    }
    if (req.user!.role !== 'admin' && taxpayer.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '权限不足' })
      return
    }
    const { name, type, unified_code, id_number, legal_person, address, industry, scale, region } = req.body
    db.prepare(
      'UPDATE taxpayers SET name=?, type=?, unified_code=?, id_number=?, legal_person=?, address=?, industry=?, scale=?, region=? WHERE id=?'
    ).run(
      name || taxpayer.name,
      type || taxpayer.type,
      unified_code ?? taxpayer.unified_code,
      id_number ?? taxpayer.id_number,
      legal_person ?? taxpayer.legal_person,
      address ?? taxpayer.address,
      industry ?? taxpayer.industry,
      scale ?? taxpayer.scale,
      region ?? taxpayer.region,
      req.params.id
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: '更新纳税人失败' })
  }
})

export default router
