import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { search = '', status = '', page = '1', pageSize = '10' } = req.query
    const pageNum = Math.max(1, Number(page))
    const pageSizeNum = Math.max(1, Number(pageSize))
    const offset = (pageNum - 1) * pageSizeNum

    let where = 'WHERE 1=1'
    const params: any[] = []

    if (status) {
      where += ' AND d.status = ?'
      params.push(status)
    }
    if (search) {
      where += ' AND (v.name LIKE ? OR v.code LIKE ? OR d.sea_area LIKE ?)'
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }

    const countRow = db.prepare(`
      SELECT COUNT(*) AS total FROM declarations d JOIN vessels v ON v.id = d.vessel_id ${where}
    `).get(...params) as { total: number }

    const rows = db.prepare(`
      SELECT d.*, v.name AS vessel_name, v.code AS vessel_code, v.owner_name, v.status AS vessel_status
      FROM declarations d JOIN vessels v ON v.id = d.vessel_id
      ${where} ORDER BY d.id DESC LIMIT ? OFFSET ?
    `).all(...params, pageSizeNum, offset) as any[]

    const declIds = rows.map(r => r.id)
    const crewMap: Record<number, any[]> = {}
    if (declIds.length > 0) {
      const crews = db.prepare(`SELECT * FROM declaration_crews WHERE declaration_id IN (${declIds.map(() => '?').join(',')})`).all(...declIds) as any[]
      for (const c of crews) {
        if (!crewMap[c.declaration_id]) crewMap[c.declaration_id] = []
        crewMap[c.declaration_id].push(c)
      }
    }

    const list = rows.map(r => ({ ...r, crews: crewMap[r.id] || [] }))

    res.json({ success: true, data: { list, total: countRow.total, page: pageNum, pageSize: pageSizeNum } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const decl = db.prepare(`
      SELECT d.*, v.name AS vessel_name, v.code AS vessel_code, v.owner_name, v.owner_phone, v.vessel_type, v.fishing_type, v.status AS vessel_status
      FROM declarations d JOIN vessels v ON v.id = d.vessel_id WHERE d.id = ?
    `).get(req.params.id)
    if (!decl) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    const crews = db.prepare('SELECT * FROM declaration_crews WHERE declaration_id = ?').all(req.params.id)
    const certificates = db.prepare('SELECT * FROM certificates WHERE vessel_id = ?').all((decl as any).vessel_id)
    res.json({ success: true, data: { ...(decl as any), crews, certificates } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { vessel_id, sea_area, departure_time, expected_return, work_permit, work_permit_status, insurance_status, crews } = req.body
    if (!vessel_id || !sea_area || !departure_time || !expected_return) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const result = db.prepare(`
      INSERT INTO declarations (vessel_id, sea_area, departure_time, expected_return, work_permit, work_permit_status, insurance_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(vessel_id, sea_area, departure_time, expected_return, work_permit || '', work_permit_status || '有效', insurance_status || '已投保')

    const declId = Number(result.lastInsertRowid)

    if (Array.isArray(crews) && crews.length > 0) {
      const insertCrew = db.prepare(`
        INSERT INTO declaration_crews (declaration_id, name, id_number, role, phone)
        VALUES (?, ?, ?, ?, ?)
      `)
      for (const c of crews) {
        if (c.name && c.id_number && c.role) {
          insertCrew.run(declId, c.name, c.id_number, c.role, c.phone || '')
        }
      }
    }

    res.json({ success: true, data: { id: declId } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const existing = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    if (existing.status !== '待核验') {
      res.status(400).json({ success: false, error: '只能修改待核验状态的申报' })
      return
    }
    const { sea_area, departure_time, expected_return, work_permit, work_permit_status, insurance_status, crews } = req.body

    db.prepare(`
      UPDATE declarations SET sea_area=?, departure_time=?, expected_return=?, work_permit=?, work_permit_status=?, insurance_status=?, updated_at=datetime('now','localtime')
      WHERE id=?
    `).run(
      sea_area ?? existing.sea_area,
      departure_time ?? existing.departure_time,
      expected_return ?? existing.expected_return,
      work_permit ?? existing.work_permit,
      work_permit_status ?? existing.work_permit_status,
      insurance_status ?? existing.insurance_status,
      req.params.id
    )

    if (Array.isArray(crews)) {
      db.prepare('DELETE FROM declaration_crews WHERE declaration_id = ?').run(req.params.id)
      const insertCrew = db.prepare(`
        INSERT INTO declaration_crews (declaration_id, name, id_number, role, phone)
        VALUES (?, ?, ?, ?, ?)
      `)
      for (const c of crews) {
        if (c.name && c.id_number && c.role) {
          insertCrew.run(Number(req.params.id), c.name, c.id_number, c.role, c.phone || '')
        }
      }
    }

    res.json({ success: true, message: '更新成功' })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/verify', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    if (decl.status !== '待核验') {
      res.status(400).json({ success: false, error: '只能核验待核验状态的申报' })
      return
    }

    const { verified_by } = req.body
    const reasons: string[] = []

    const certs = db.prepare('SELECT * FROM certificates WHERE vessel_id = ?').all(decl.vessel_id) as any[]
    const now = new Date()
    for (const cert of certs) {
      if (cert.status === '已过期' || new Date(cert.expiry_date) < now) {
        reasons.push(`证书"${cert.cert_type}"(${cert.cert_number})已过期`)
      }
    }

    if (decl.insurance_status !== '已投保') {
      reasons.push('保险未投保')
    }
    if (decl.work_permit_status !== '有效') {
      reasons.push('作业许可证无效')
    }

    if (reasons.length > 0) {
      db.prepare(`
        UPDATE declarations SET status='已驳回', reject_reason=?, verified_by=?, verified_at=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?
      `).run(reasons.join('；'), verified_by || '', req.params.id)
      res.json({ success: true, data: { status: '已驳回', reject_reason: reasons.join('；') } })
    } else {
      db.prepare(`
        UPDATE declarations SET status='已核验', verified_by=?, verified_at=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?
      `).run(verified_by || '', req.params.id)
      res.json({ success: true, data: { status: '已核验' } })
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/approve', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    if (decl.status !== '已核验') {
      res.status(400).json({ success: false, error: '只能审批已核验状态的申报' })
      return
    }

    const { approved_by } = req.body
    db.prepare(`
      UPDATE declarations SET status='已通过', approved_by=?, approved_at=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?
    `).run(approved_by || '', req.params.id)

    db.prepare("UPDATE vessels SET status='在航', updated_at=datetime('now','localtime') WHERE id=?").run(decl.vessel_id)

    res.json({ success: true, data: { status: '已通过' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/reject', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    if (decl.status !== '待核验' && decl.status !== '已核验') {
      res.status(400).json({ success: false, error: '当前状态不允许驳回' })
      return
    }

    const { reason } = req.body
    db.prepare(`
      UPDATE declarations SET status='已驳回', reject_reason=?, updated_at=datetime('now','localtime') WHERE id=?
    `).run(reason || '', req.params.id)

    res.json({ success: true, data: { status: '已驳回' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.post('/:id/return', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const decl = db.prepare('SELECT * FROM declarations WHERE id = ?').get(req.params.id) as any
    if (!decl) {
      res.status(404).json({ success: false, error: '申报不存在' })
      return
    }
    if (decl.status !== '已通过') {
      res.status(400).json({ success: false, error: '只能确认已通过状态的申报返港' })
      return
    }

    db.prepare(`
      UPDATE declarations SET status='已返港', actual_return=datetime('now','localtime'), updated_at=datetime('now','localtime') WHERE id=?
    `).run(req.params.id)

    db.prepare("UPDATE vessels SET status='在港', updated_at=datetime('now','localtime') WHERE id=?").run(decl.vessel_id)

    res.json({ success: true, data: { status: '已返港' } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
