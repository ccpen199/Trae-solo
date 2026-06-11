import { Router, type Request, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/health', (_req: Request, res: Response): void => {
  try {
    const metrics = db.prepare(`SELECT h.*, d.name as department_name FROM health_metrics h JOIN departments d ON h.department_id = d.id ORDER BY h.checked_at DESC`).all() as Record<string, unknown>[]

    const latestByDept = new Map<string, Record<string, unknown>>()
    for (const m of metrics) {
      if (!latestByDept.has(m.department_id as string)) {
        latestByDept.set(m.department_id as string, m)
      }
    }

    const result = Array.from(latestByDept.values())
    const healthy = result.filter((r) => r.status === 'healthy').length
    const warning = result.filter((r) => r.status === 'warning').length
    const critical = result.filter((r) => r.status === 'critical').length

    res.json({
      success: true,
      data: {
        summary: { total: result.length, healthy, warning, critical },
        departments: result,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/health/:departmentId', (req: Request, res: Response): void => {
  try {
    const metric = db.prepare(`SELECT h.*, d.name as department_name, d.contact FROM health_metrics h JOIN departments d ON h.department_id = d.id WHERE h.department_id = ? ORDER BY h.checked_at DESC LIMIT 1`).get(req.params.departmentId) as Record<string, unknown> | undefined

    if (!metric) {
      res.status(404).json({ success: false, error: 'Department health data not found' })
      return
    }

    const services = db.prepare(`SELECT id, name, status FROM services WHERE department_id = ?`).all(req.params.departmentId)

    res.json({
      success: true,
      data: {
        ...metric,
        services,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/heatmap', (req: Request, res: Response): void => {
  try {
    const { region, timeSlot, category, date } = req.query

    let sql = `SELECT hd.*, s.name as service_name, s.category FROM heatmap_data hd JOIN services s ON hd.service_id = s.id WHERE 1=1`
    const params: unknown[] = []

    if (region) {
      sql += ` AND hd.region = ?`
      params.push(region)
    }
    if (timeSlot) {
      sql += ` AND hd.time_slot = ?`
      params.push(timeSlot)
    }
    if (category) {
      sql += ` AND s.category = ?`
      params.push(category)
    }
    if (date) {
      sql += ` AND hd.date = ?`
      params.push(date)
    } else {
      sql += ` AND hd.date = (SELECT MAX(date) FROM heatmap_data)`
    }

    sql += ` ORDER BY hd.count DESC`

    const data = db.prepare(sql).all(...params) as Record<string, unknown>[]

    const regionSummary = new Map<string, number>()
    for (const d of data) {
      const r = d.region as string
      regionSummary.set(r, (regionSummary.get(r) || 0) + (d.count as number))
    }

    const timeSlotSummary = new Map<string, number>()
    for (const d of data) {
      const ts = d.time_slot as string
      timeSlotSummary.set(ts, (timeSlotSummary.get(ts) || 0) + (d.count as number))
    }

    res.json({
      success: true,
      data: {
        records: data,
        regionSummary: Object.fromEntries(regionSummary),
        timeSlotSummary: Object.fromEntries(timeSlotSummary),
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/material-reduction', (_req: Request, res: Response): void => {
  try {
    const materials = db.prepare(`SELECT m.*, s.name as service_name FROM materials m JOIN services s ON m.service_id = s.id`).all() as Record<string, unknown>[]

    const parsedMaterials = materials.map((m) => {
      const parsed = { ...m }
      if (typeof parsed.ocr_fields === 'string') {
        try { parsed.ocr_fields = JSON.parse(parsed.ocr_fields) } catch { parsed.ocr_fields = [] }
      }
      return parsed
    })

    const fieldUsage = new Map<string, { field: string; label: string; services: { serviceId: string; serviceName: string; materialName: string }[] }>()

    for (const m of parsedMaterials) {
      const ocrFields = (m.ocr_fields as Array<Record<string, string>>) || []
      for (const f of ocrFields) {
        const key = f.field as string
        if (!fieldUsage.has(key)) {
          fieldUsage.set(key, { field: key, label: f.label || key, services: [] })
        }
        fieldUsage.get(key)!.services.push({
          serviceId: m.service_id as string,
          serviceName: m.service_name as string,
          materialName: m.name as string,
        })
      }
    }

    const duplicateFields = Array.from(fieldUsage.values())
      .filter((f) => f.services.length > 1)
      .sort((a, b) => b.services.length - a.services.length)

    const totalFields = Array.from(fieldUsage.values()).reduce((sum, f) => sum + f.services.length, 0)
    const reducibleFields = duplicateFields.reduce((sum, f) => sum + f.services.length - 1, 0)
    const reductionRate = totalFields > 0 ? Math.round((reducibleFields / totalFields) * 100) : 0

    res.json({
      success: true,
      data: {
        totalFields,
        duplicateFieldCount: duplicateFields.length,
        reducibleFields,
        reductionRate,
        duplicateFields,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

router.get('/overview', (_req: Request, res: Response): void => {
  try {
    const servicesByStatus = db.prepare(`SELECT status, COUNT(*) as count FROM services GROUP BY status`).all() as Array<{ status: string; count: number }>
    const casesByStatus = db.prepare(`SELECT status, COUNT(*) as count FROM cases GROUP BY status`).all() as Array<{ status: string; count: number }>

    const healthMetrics = db.prepare(`SELECT * FROM health_metrics`).all() as Array<Record<string, unknown>>
    const scoreMap: Record<string, number> = { healthy: 100, warning: 60, critical: 20 }
    const avgHealthScore = healthMetrics.length > 0
      ? Math.round(healthMetrics.reduce((sum, m) => sum + (scoreMap[m.status as string] || 0), 0) / healthMetrics.length)
      : 0

    const totalCases = db.prepare(`SELECT COUNT(*) as count FROM cases`).get() as { count: number }
    const todayCases = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE date(created_at) = date('now')`).get() as { count: number }
    const completedCases = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status = 'completed'`).get() as { count: number }
    const processingCases = db.prepare(`SELECT COUNT(*) as count FROM cases WHERE status IN ('submitted', 'processing', 'approved')`).get() as { count: number }

    res.json({
      success: true,
      data: {
        servicesByStatus: Object.fromEntries(servicesByStatus.map((s) => [s.status, s.count])),
        casesByStatus: Object.fromEntries(casesByStatus.map((c) => [c.status, c.count])),
        avgHealthScore,
        totalCases: totalCases.count,
        todayCases: todayCases.count,
        completedCases: completedCases.count,
        processingCases: processingCases.count,
      },
    })
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message })
  }
})

export default router
