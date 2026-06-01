import { Router, type Request, type Response } from 'express'
import db from '../lib/db.js'

const router = Router()

router.post('/checkout', (req: Request, res: Response) => {
  const { mold_id, work_order, operator } = req.body

  if (!mold_id) {
    return res.status(400).json({ success: false, error: '请选择模具' })
  }

  if (!work_order || !/^WO\d{6,12}$/.test(work_order)) {
    return res.status(400).json({ success: false, error: '工单号格式错误，应为 WO + 6-12位数字' })
  }

  if (!operator || operator.trim().length < 2) {
    return res.status(400).json({ success: false, error: '请选择有效的操作员' })
  }

  const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(mold_id) as {
    id: number
    mold_number: string
    status: string
    current_usage: number
    total_life: number
    current_work_order: string | null
  } | undefined

  if (!mold) {
    return res.status(404).json({ success: false, error: '模具不存在' })
  }

  if (mold.status === 'maintenance') {
    return res.status(400).json({ success: false, error: '模具正在维修中，无法领用' })
  }

  if (mold.status === 'in_use') {
    return res.status(400).json({ 
      success: false, 
      error: `模具正在被工单 ${mold.current_work_order} 占用` 
    })
  }

  if (mold.current_usage >= mold.total_life) {
    return res.status(400).json({ success: false, error: '模具已超过使用寿命，请先维修或报废' })
  }

  const lifeRemaining = mold.total_life - mold.current_usage
  const nearEndOfLife = lifeRemaining < mold.total_life * 0.1

  db.prepare(`
    UPDATE molds SET 
      status = 'in_use', 
      current_work_order = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(work_order, mold_id)

  db.prepare(`
    INSERT INTO production_usage (mold_id, work_order, operator, status)
    VALUES (?, ?, ?, 'active')
  `).run(mold_id, work_order, operator)

  res.json({ 
    success: true, 
    message: '领用成功',
    warning: nearEndOfLife ? '模具接近寿命上限，请留意换模' : null
  })
})

router.post('/checkin', (req: Request, res: Response) => {
  const { mold_id, produced_quantity, quality_issues } = req.body

  const mold = db.prepare('SELECT * FROM molds WHERE id = ?').get(mold_id) as {
    id: number
    status: string
    current_usage: number
  } | undefined

  if (!mold) {
    return res.status(404).json({ success: false, error: '模具不存在' })
  }

  const usage = db.prepare(`
    SELECT * FROM production_usage 
    WHERE mold_id = ? AND status = 'active'
    ORDER BY start_time DESC LIMIT 1
  `).get(mold_id) as { id: number } | undefined

  if (!usage) {
    return res.status(400).json({ success: false, error: '该模具没有正在进行的生产' })
  }

  db.prepare(`
    UPDATE production_usage SET
      end_time = CURRENT_TIMESTAMP,
      produced_quantity = ?,
      quality_issues = ?,
      status = 'completed'
    WHERE id = ?
  `).run(produced_quantity || 0, quality_issues || '', usage.id)

  const newUsage = mold.current_usage + (produced_quantity || 0)
  db.prepare(`
    UPDATE molds SET
      status = 'idle',
      current_usage = ?,
      current_work_order = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newUsage, mold_id)

  res.json({ success: true, message: '归还成功' })
})

router.get('/usage', (req: Request, res: Response) => {
  const records = db.prepare(`
    SELECT pu.*, m.mold_number, m.product_name
    FROM production_usage pu
    JOIN molds m ON pu.mold_id = m.id
    ORDER BY pu.start_time DESC
    LIMIT 50
  `).all()

  res.json({ success: true, data: records })
})

router.get('/active', (req: Request, res: Response) => {
  const records = db.prepare(`
    SELECT pu.*, m.mold_number, m.product_name
    FROM production_usage pu
    JOIN molds m ON pu.mold_id = m.id
    WHERE pu.status = 'active'
  `).all()

  res.json({ success: true, data: records })
})

export default router
