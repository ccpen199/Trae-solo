import { Router, type Response } from 'express'
import db from '../db.js'

const router = Router()

router.get('/', (_req, _res: Response): void => {
  const totalBatteries = (db.prepare('SELECT COUNT(*) as count FROM batteries').get() as { count: number }).count

  const byStatus = db.prepare(`
    SELECT status, COUNT(*) as count
    FROM batteries
    GROUP BY status
  `).all()

  const highRiskCount = (db.prepare(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM batteries b
    JOIN safety_alerts sa ON b.id = sa.battery_id
    WHERE sa.status IN ('open', 'reviewing') AND sa.severity IN ('high', 'critical')
  `).get() as { count: number }).count

  const openAlerts = (db.prepare("SELECT COUNT(*) as count FROM safety_alerts WHERE status IN ('open', 'reviewing')").get() as { count: number }).count
  const openHighCriticalAlerts = (db.prepare("SELECT COUNT(*) as count FROM safety_alerts WHERE status IN ('open', 'reviewing') AND severity IN ('high', 'critical')").get() as { count: number }).count

  const pendingReviewCount = (db.prepare(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM batteries b
    JOIN safety_alerts sa ON b.id = sa.battery_id
    WHERE sa.status = 'reviewing'
  `).get() as { count: number }).count

  const recallCount = (db.prepare(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM batteries b
    JOIN safety_alerts sa ON b.id = sa.battery_id
    WHERE sa.alert_type = 'recall' AND sa.status IN ('open', 'reviewing')
  `).get() as { count: number }).count

  const pendingRetireCount = (db.prepare(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM batteries b
    JOIN maintenance_plans mp ON b.id = mp.battery_id
    WHERE mp.task_type = 'retire' AND mp.status IN ('pending', 'executing')
  `).get() as { count: number }).count

  const pendingCascadeCount = (db.prepare(`
    SELECT COUNT(DISTINCT b.id) as count
    FROM batteries b
    JOIN maintenance_plans mp ON b.id = mp.battery_id
    WHERE mp.task_type = 'cascade' AND mp.status IN ('pending', 'executing')
  `).get() as { count: number }).count

  const pendingMaintenance = (db.prepare("SELECT COUNT(*) as count FROM maintenance_plans WHERE status = 'pending'").get() as { count: number }).count

  const extendedStatus = db.prepare(`
    SELECT 'high_risk' as key, ? as count
    UNION ALL
    SELECT 'pending_review' as key, ? as count
    UNION ALL
    SELECT 'recall' as key, ? as count
    UNION ALL
    SELECT 'pending_retire' as key, ? as count
    UNION ALL
    SELECT 'pending_cascade' as key, ? as count
  `).all(highRiskCount, pendingReviewCount, recallCount, pendingRetireCount, pendingCascadeCount)

  const recentAlerts = db.prepare(`
    SELECT sa.id, sa.alert_type, sa.severity, sa.status, sa.description, sa.alert_at,
           sa.disposition, sa.reviewer, sa.reviewed_at, sa.resolution,
           b.id as battery_id, b.code as battery_code, b.model as battery_model, b.status as battery_status,
           mp.id as plan_id, mp.status as plan_status, mp.priority as plan_priority
    FROM safety_alerts sa
    JOIN batteries b ON sa.battery_id = b.id
    LEFT JOIN maintenance_plans mp ON b.id = mp.battery_id AND mp.status IN ('pending', 'executing')
    ORDER BY sa.alert_at DESC
    LIMIT 10
  `).all()

  const recentMaintenance = db.prepare(`
    SELECT DISTINCT
           mp.id, mp.trigger_type, mp.trigger_condition, mp.task_type, mp.status, mp.priority, mp.description, mp.scheduled_at,
           b.id as battery_id, b.code as battery_code, b.model as battery_model, b.status as battery_status,
           (SELECT sa.id FROM safety_alerts sa WHERE sa.battery_id = b.id AND sa.status IN ('open', 'reviewing') AND sa.severity IN ('high', 'critical') ORDER BY CASE sa.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, sa.alert_at DESC LIMIT 1) as alert_id,
           (SELECT sa.alert_type FROM safety_alerts sa WHERE sa.battery_id = b.id AND sa.status IN ('open', 'reviewing') AND sa.severity IN ('high', 'critical') ORDER BY CASE sa.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, sa.alert_at DESC LIMIT 1) as alert_type,
           (SELECT sa.severity FROM safety_alerts sa WHERE sa.battery_id = b.id AND sa.status IN ('open', 'reviewing') AND sa.severity IN ('high', 'critical') ORDER BY CASE sa.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 ELSE 3 END, sa.alert_at DESC LIMIT 1) as severity
    FROM maintenance_plans mp
    JOIN batteries b ON mp.battery_id = b.id
    WHERE mp.status = 'pending'
    ORDER BY mp.scheduled_at ASC
    LIMIT 5
  `).all()

  _res.json({
    success: true,
    data: {
      totalBatteries,
      byStatus,
      openAlerts,
      openHighCriticalAlerts,
      highRiskCount,
      pendingReviewCount,
      recallCount,
      pendingRetireCount,
      pendingCascadeCount,
      pendingMaintenance,
      extendedStatus,
      recentAlerts,
      recentMaintenance,
    },
  })
})

export default router
