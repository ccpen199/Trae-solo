import { Router, type Request, type Response } from 'express'
import db from '../lib/db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { mold_id, status } = req.query
  let query = `
    SELECT mr.*, m.mold_number, m.product_name
    FROM maintenance_records mr
    JOIN molds m ON mr.mold_id = m.id
    WHERE 1=1
  `
  const params: (string | number)[] = []

  if (mold_id) {
    query += ' AND mr.mold_id = ?'
    params.push(mold_id as string)
  }
  if (status === 'pending') {
    query += ' AND mr.acceptance_result IS NULL'
  }

  query += ' ORDER BY mr.start_time DESC LIMIT 50'
  const records = db.prepare(query).all(...params)
  res.json({ success: true, data: records })
})

router.post('/start', (req: Request, res: Response) => {
  const { mold_id, fault_symptom, repair_person } = req.body

  const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(mold_id) as {
    id: number
    status: string
  } | undefined

  if (!mold) {
    return res.status(404).json({ success: false, error: '模具不存在' })
  }

  const recentFaults = db.prepare(`
    SELECT COUNT(*) as count FROM maintenance_records 
    WHERE mold_id = ? AND fault_symptom = ? AND start_time > datetime('now', '-30 days')
  `).get(mold_id, fault_symptom) as { count: number }

  const isRepeatedFault = recentFaults.count > 0

  db.prepare(`
    UPDATE molds SET 
      status = 'maintenance', 
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(mold_id)

  const result = db.prepare(`
    INSERT INTO maintenance_records (
      mold_id, fault_symptom, repair_content, spare_parts, repair_person, is_repeated_fault
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(mold_id, fault_symptom, '', '', repair_person, isRepeatedFault ? 1 : 0)

  res.json({ 
    success: true, 
    data: { id: result.lastInsertRowid },
    warning: isRepeatedFault ? '检测到重复故障，建议深入分析原因' : null
  })
})

router.post('/complete', (req: Request, res: Response) => {
  const { id, repair_content, spare_parts, downtime_minutes } = req.body

  const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id) as {
    id: number
    mold_id: number
  } | undefined

  if (!record) {
    return res.status(404).json({ success: false, error: '维修记录不存在' })
  }

  db.prepare(`
    UPDATE maintenance_records SET
      repair_content = ?,
      spare_parts = ?,
      downtime_minutes = ?,
      end_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(repair_content, spare_parts || '', downtime_minutes || 0, id)

  res.json({ success: true, message: '维修完成，待验收' })
})

router.post('/accept', (req: Request, res: Response) => {
  const { id, acceptance_result, acceptance_person } = req.body

  const record = db.prepare('SELECT * FROM maintenance_records WHERE id = ?').get(id) as {
    id: number
    mold_id: number
  } | undefined

  if (!record) {
    return res.status(404).json({ success: false, error: '维修记录不存在' })
  }

  db.prepare(`
    UPDATE maintenance_records SET
      acceptance_result = ?,
      acceptance_person = ?
    WHERE id = ?
  `).run(acceptance_result, acceptance_person, id)

  if (acceptance_result === 'pass') {
    db.prepare(`
      UPDATE molds SET 
        status = 'idle',
        last_maintenance = (
          SELECT COALESCE(SUM(produced_quantity), 0) 
          FROM production_usage 
          WHERE mold_id = ? AND status = 'completed'
        ),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(record.mold_id, record.mold_id)
  }

  res.json({ success: true, message: '验收完成' })
})

export default router
