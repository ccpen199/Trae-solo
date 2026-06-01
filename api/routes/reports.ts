import { Router, type Request, type Response } from 'express'
import { getDb } from '../db.js'

const router = Router()

router.get('/stats/fleet', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const data = db.prepare(`
      SELECT v.owner_name,
        COUNT(DISTINCT v.id) AS vessel_count,
        COUNT(DISTINCT d.id) AS declaration_count,
        COUNT(DISTINCT e.id) AS event_count
      FROM vessels v
      LEFT JOIN declarations d ON d.vessel_id = v.id
      LEFT JOIN events e ON e.vessel_id = v.id
      GROUP BY v.owner_name
      ORDER BY vessel_count DESC
    `).all()
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/stats/sea-areas', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const data = db.prepare(`
      SELECT sea_area,
        COUNT(*) AS declaration_count,
        COUNT(CASE WHEN status='已通过' THEN 1 END) AS approved_count,
        COUNT(CASE WHEN status='已返港' THEN 1 END) AS returned_count
      FROM declarations
      GROUP BY sea_area
      ORDER BY declaration_count DESC
    `).all()
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/stats/voyages', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const total = db.prepare('SELECT COUNT(*) AS total FROM declarations').get() as { total: number }
    const byStatus = db.prepare(`
      SELECT status, COUNT(*) AS count FROM declarations GROUP BY status
    `).all()
    const byMonth = db.prepare(`
      SELECT strftime('%Y-%m', departure_time) AS month, COUNT(*) AS count
      FROM declarations GROUP BY month ORDER BY month
    `).all()
    res.json({ success: true, data: { total: total.total, byStatus, byMonth } })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/stats/violations', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const data = db.prepare(`
      SELECT event_type, COUNT(*) AS count FROM events GROUP BY event_type ORDER BY count DESC
    `).all()
    res.json({ success: true, data })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/stats/safety-risks', (req: Request, res: Response): void => {
  try {
    const db = getDb()
    const data = db.prepare(`
      SELECT v.id AS vessel_id, v.name AS vessel_name, v.code AS vessel_code, v.status,
        v.owner_name, v.fishing_type,
        COUNT(DISTINCT e.id) AS event_count,
        COUNT(DISTINCT a.id) AS alert_count,
        (COUNT(DISTINCT e.id) * 3 + COUNT(DISTINCT a.id) * 2) AS risk_score,
        COUNT(DISTINCT d.id) AS declaration_count,
        COUNT(DISTINCT CASE WHEN d.status='已通过' THEN d.id END) AS active_voyage_count,
        COUNT(DISTINCT CASE WHEN e.status='已处置' THEN e.id END) AS resolved_event_count,
        COUNT(DISTINCT CASE WHEN e.status IN ('待处置','处置中') THEN e.id END) AS pending_event_count
      FROM vessels v
      LEFT JOIN events e ON e.vessel_id = v.id
      LEFT JOIN alerts a ON a.vessel_id = v.id
      LEFT JOIN declarations d ON d.vessel_id = v.id
      GROUP BY v.id
      ORDER BY risk_score DESC
    `).all()

    const detailedData = (data as any[]).map(v => {
      const seaAreas = db.prepare(`
        SELECT DISTINCT d.sea_area FROM declarations d WHERE d.vessel_id = ?
      `).all(v.vessel_id) as { sea_area: string }[]
      const violationTypes = db.prepare(`
        SELECT DISTINCT e.event_type FROM events e WHERE e.vessel_id = ?
      `).all(v.vessel_id) as { event_type: string }[]
      return {
        ...v,
        sea_areas: seaAreas.map(s => s.sea_area).filter(Boolean),
        violation_types: violationTypes.map(t => t.event_type).filter(Boolean),
      }
    })

    res.json({ success: true, data: detailedData })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

router.get('/dashboard', (req: Request, res: Response): void => {
  try {
    const db = getDb()

    const vesselCount = (db.prepare('SELECT COUNT(*) AS c FROM vessels').get() as { c: number }).c
    const atSeaCount = (db.prepare("SELECT COUNT(*) AS c FROM vessels WHERE status='在航'").get() as { c: number }).c
    const inPortCount = (db.prepare("SELECT COUNT(*) AS c FROM vessels WHERE status='在港'").get() as { c: number }).c
    const maintenanceCount = (db.prepare("SELECT COUNT(*) AS c FROM vessels WHERE status='维修'").get() as { c: number }).c
    const pendingDeclarations = (db.prepare("SELECT COUNT(*) AS c FROM declarations WHERE status='待核验'").get() as { c: number }).c
    const activeDeclarations = (db.prepare("SELECT COUNT(*) AS c FROM declarations WHERE status='已通过'").get() as { c: number }).c
    const pendingAlerts = (db.prepare("SELECT COUNT(*) AS c FROM alerts WHERE status='未处理'").get() as { c: number }).c
    const pendingEvents = (db.prepare("SELECT COUNT(*) AS c FROM events WHERE status IN ('待处置','处置中')").get() as { c: number }).c

    const recentDeclarations = db.prepare(`
      SELECT d.id, d.sea_area, d.departure_time, d.expected_return, d.status,
        d.work_permit_status, d.insurance_status, d.verified_by, d.verified_at, d.approved_by, d.approved_at, d.reject_reason,
        v.name AS vessel_name, v.code AS vessel_code, v.owner_name,
        (SELECT COUNT(*) FROM declaration_crews dc WHERE dc.declaration_id = d.id) AS crew_count
      FROM declarations d JOIN vessels v ON v.id = d.vessel_id
      ORDER BY d.created_at DESC LIMIT 8
    `).all()

    const recentEvents = db.prepare(`
      SELECT e.id, e.event_type, e.title, e.description, e.status, e.resolution, e.occurred_at, e.resolved_at, e.created_by,
        v.name AS vessel_name, v.code AS vessel_code,
        (SELECT COUNT(*) FROM event_notifications en WHERE en.event_id = e.id) AS notification_count,
        (SELECT COUNT(*) FROM event_receipts er WHERE er.event_id = e.id) AS receipt_count
      FROM events e JOIN vessels v ON v.id = e.vessel_id
      ORDER BY e.occurred_at DESC LIMIT 8
    `).all()

    const pendingAlertsList = db.prepare(`
      SELECT a.id, a.alert_type, a.severity, a.message, a.status, a.triggered_at,
        v.name AS vessel_name, v.code AS vessel_code, f.name AS fence_name
      FROM alerts a JOIN vessels v ON v.id = a.vessel_id LEFT JOIN fences f ON f.id = a.fence_id
      WHERE a.status = '未处理' ORDER BY a.triggered_at DESC
    `).all()

    const certExpiring = db.prepare(`
      SELECT c.id, c.cert_type, c.cert_number, c.expiry_date, c.status,
        v.id AS vessel_id, v.name AS vessel_name, v.code AS vessel_code
      FROM certificates c JOIN vessels v ON v.id = c.vessel_id
      WHERE c.status IN ('即将过期','已过期') OR date(c.expiry_date) <= date('now','+30 days','localtime')
      ORDER BY c.expiry_date ASC
    `).all()

    res.json({
      success: true,
      data: {
        summary: {
          vesselCount,
          atSeaCount,
          inPortCount,
          maintenanceCount,
          pendingDeclarations,
          activeDeclarations,
          pendingAlerts,
          pendingEvents,
        },
        recentDeclarations,
        recentEvents,
        pendingAlerts: pendingAlertsList,
        certExpiring,
      },
    })
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message })
  }
})

export default router
