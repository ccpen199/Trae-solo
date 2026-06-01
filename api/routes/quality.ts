import { Router, type Request, type Response } from 'express'
import db from '../lib/db.js'

const router = Router()

router.get('/', (req: Request, res: Response) => {
  const { mold_id } = req.query
  let query = `
    SELECT qr.*, m.mold_number, m.product_name
    FROM quality_records qr
    JOIN molds m ON qr.mold_id = m.id
    WHERE 1=1
  `
  const params: (string | number)[] = []

  if (mold_id) {
    query += ' AND qr.mold_id = ?'
    params.push(mold_id as string)
  }

  query += ' ORDER BY qr.record_time DESC LIMIT 50'
  const records = db.prepare(query).all(...params)
  res.json({ success: true, data: records })
})

router.post('/', (req: Request, res: Response) => {
  const { mold_id, work_order, defect_type, defect_count, inspector, notes } = req.body

  db.prepare(`
    INSERT INTO quality_records (
      mold_id, work_order, defect_type, defect_count, inspector, notes
    ) VALUES (?, ?, ?, ?, ?, ?)
  `).run(mold_id, work_order, defect_type, defect_count, inspector, notes || '')

  res.json({ success: true, message: '质量记录已创建' })
})

router.get('/stats', (req: Request, res: Response) => {
  const totalMolds = db.prepare('SELECT COUNT(*) as count FROM molds').get() as { count: number }
  const inUseMolds = db.prepare("SELECT COUNT(*) as count FROM molds WHERE status = 'in_use'").get() as { count: number }
  const maintenanceMolds = db.prepare("SELECT COUNT(*) as count FROM molds WHERE status = 'maintenance'").get() as { count: number }
  const idleMolds = db.prepare("SELECT COUNT(*) as count FROM molds WHERE status = 'idle'").get() as { count: number }

  const nearEndOfLife = db.prepare(`
    SELECT COUNT(*) as count 
    FROM molds 
    WHERE current_usage >= total_life * 0.9
  `).get() as { count: number }

  const totalProduced = db.prepare(`
    SELECT COALESCE(SUM(produced_quantity), 0) as total 
    FROM production_usage
  `).get() as { total: number }

  const pendingMaintenance = db.prepare(`
    SELECT COUNT(*) as count 
    FROM maintenance_records 
    WHERE acceptance_result IS NULL
  `).get() as { count: number }

  const repeatedFaults = db.prepare(`
    SELECT COUNT(*) as count 
    FROM maintenance_records 
    WHERE is_repeated_fault = 1
  `).get() as { count: number }

  res.json({
    success: true,
    data: {
      totalMolds: totalMolds.count,
      inUseMolds: inUseMolds.count,
      maintenanceMolds: maintenanceMolds.count,
      idleMolds: idleMolds.count,
      nearEndOfLife: nearEndOfLife.count,
      totalProduced: totalProduced.total,
      pendingMaintenance: pendingMaintenance.count,
      repeatedFaults: repeatedFaults.count,
    }
  })
})

export default router
