import { Router, type Request, type Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getDb } from '../db/init.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { status, category, page = '1', pageSize = '10' } = req.query

    let sql = `SELECT i.*, o.category as order_category, o.status as order_status FROM inspections i JOIN orders o ON i.order_id = o.id WHERE 1=1`
    const params: unknown[] = []

    if (status) {
      sql += ` AND i.status = ?`
      params.push(status)
    }
    if (category) {
      sql += ` AND i.category = ?`
      params.push(category)
    }

    const countRow = db.prepare(`SELECT COUNT(*) as total FROM inspections i WHERE 1=1${sql.split('WHERE 1=1')[1]?.split('ORDER')[0] || ''}`).get(...params) as { total: number }

    const offset = (Number(page) - 1) * Number(pageSize)
    sql += ` ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
    params.push(Number(pageSize), offset)

    const inspections = db.prepare(sql).all(...params)

    res.json({
      success: true,
      data: {
        list: inspections,
        total: countRow.total,
        page: Number(page),
        pageSize: Number(pageSize),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取质检列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const inspection = db.prepare(`SELECT i.*, o.category as order_category FROM inspections i JOIN orders o ON i.order_id = o.id WHERE i.id = ?`).get(id) as Record<string, unknown> | undefined
    if (!inspection) {
      res.status(404).json({ success: false, error: '质检记录不存在' })
      return
    }

    const steps = db.prepare(`SELECT * FROM inspection_steps WHERE inspection_id = ? ORDER BY step_order`).all(id)
    const images = db.prepare(`SELECT * FROM inspection_images WHERE inspection_id = ?`).all(id)

    res.json({
      success: true,
      data: { ...inspection, steps, images },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取质检详情失败' })
  }
})

router.put('/:id/check', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params
    const { step_id, passed, notes } = req.body

    if (!step_id) {
      res.status(400).json({ success: false, error: '缺少步骤ID' })
      return
    }

    const step = db.prepare(`SELECT * FROM inspection_steps WHERE id = ? AND inspection_id = ?`).get(step_id, id)
    if (!step) {
      res.status(404).json({ success: false, error: '步骤不存在' })
      return
    }

    db.prepare(`UPDATE inspection_steps SET passed = ?, notes = ?, completed_at = datetime('now') WHERE id = ?`).run(
      passed ? 1 : 0, notes || null, step_id
    )

    const allSteps = db.prepare(`SELECT * FROM inspection_steps WHERE inspection_id = ? ORDER BY step_order`).all(id)
    const allChecked = allSteps.every((s: Record<string, unknown>) => s.passed !== null)
    const anyFailed = allSteps.some((s: Record<string, unknown>) => s.passed === 0)

    if (allChecked) {
      const newStatus = anyFailed ? 'rejected' : 'completed'
      db.prepare(`UPDATE inspections SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(newStatus, id)

      if (newStatus === 'completed') {
        const inspection = db.prepare(`SELECT order_id, category FROM inspections WHERE id = ?`).get(id) as { order_id: string; category: string }
        db.prepare(`UPDATE orders SET status = 'priced', updated_at = datetime('now') WHERE id = ?`).run(inspection.order_id)
      }
    } else {
      db.prepare(`UPDATE inspections SET status = 'manual_check', updated_at = datetime('now') WHERE id = ?`).run(id)
    }

    const updatedStep = db.prepare(`SELECT * FROM inspection_steps WHERE id = ?`).get(step_id)
    const updatedInspection = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(id)

    res.json({
      success: true,
      data: { step: updatedStep, inspection: updatedInspection },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '质检步骤检查失败' })
  }
})

router.post('/:id/ai-screen', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const { id } = req.params

    const inspection = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(id) as Record<string, unknown> | undefined
    if (!inspection) {
      res.status(404).json({ success: false, error: '质检记录不存在' })
      return
    }

    const category = inspection.category as string
    const conditions = ['全新', '九成新', '八成新', '七成新', '六成新']
    const aiCondition = conditions[Math.floor(Math.random() * conditions.length)]
    const score = Math.floor(Math.random() * 30 + 70)
    const confidence = Math.round((Math.random() * 0.25 + 0.75) * 100) / 100

    const defectLabels: Record<string, string[]> = {
      clothing: ['轻微起球', '色差', '面料磨损', '拉链损坏', '纽扣缺失'],
      book: ['页面泛黄', '封面磨损', '内页标注', '书脊松动', '水渍痕迹'],
      phone: ['屏幕划痕', '电池衰减', '边框磕碰', '摄像头模糊', '按键失灵'],
    }
    const defects = defectLabels[category] || defectLabels.clothing
    const detectedDefects = defects.slice(0, Math.floor(Math.random() * 3))

    const aiResult = JSON.stringify({
      score,
      label: aiCondition,
      confidence,
      defects: detectedDefects,
      recommendation: score >= 80 ? '建议通过' : score >= 60 ? '建议人工复检' : '建议驳回',
      model_version: 'AI-Recycle-v2.1',
      processing_time: `${(Math.random() * 2 + 0.5).toFixed(2)}s`,
    })

    db.prepare(`UPDATE inspections SET status = 'ai_screening', ai_result = ?, updated_at = datetime('now') WHERE id = ?`).run(aiResult, id)

    const images = db.prepare(`SELECT id FROM inspection_images WHERE inspection_id = ?`).all(id) as { id: string }[]
    for (const img of images) {
      db.prepare(`UPDATE inspection_images SET ai_analysis = ? WHERE id = ?`).run(
        `AI识别: ${aiCondition}, 评分${score}, 置信度${confidence}`,
        img.id
      )
    }

    setTimeout(() => {
      try {
        const db2 = getDb()
        const currentInsp = db2.prepare(`SELECT status FROM inspections WHERE id = ?`).get(id) as { status: string } | undefined
        if (currentInsp && currentInsp.status === 'ai_screening') {
          const nextStatus = score >= 60 ? 'manual_check' : 'rejected'
          db2.prepare(`UPDATE inspections SET status = ?, updated_at = datetime('now') WHERE id = ?`).run(nextStatus, id)
        }
      } catch {}
    }, 1000)

    const updatedInspection = db.prepare(`SELECT * FROM inspections WHERE id = ?`).get(id)

    res.json({
      success: true,
      data: {
        inspection: updatedInspection,
        ai_result: JSON.parse(aiResult),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: 'AI筛查失败' })
  }
})

export default router
